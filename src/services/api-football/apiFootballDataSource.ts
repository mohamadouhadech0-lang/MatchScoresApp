import AsyncStorage from '@react-native-async-storage/async-storage';

import type { League, Match } from '@/types/football';
import { DataSourceError, fromApiErrors, toDataSourceError } from '../errors';
import type { FootballDataSource } from '../types';
import {
  isFinishedFixture,
  isNationalTeamLeague,
  mapFixture,
  mapFixtureDetails,
  mapFormEntry,
  mapLeague,
  mapStandings,
  mapTopScorer,
} from './mappers';
import type { ApiFixture, ApiLeagueEntry, ApiResponse, ApiStandingsEntry, ApiTopScorer } from './types';

/**
 * API-Football v3 (https://www.api-football.com/documentation-v3).
 * Endpoints used:
 *   GET /fixtures?date=YYYY-MM-DD&timezone=…   matches of a day
 *   GET /fixtures?id=…                         one match with events, line-ups, statistics
 *   GET /standings?league=…&season=…           league table
 *   GET /leagues?current=true                  leagues + current season
 *   GET /fixtures?team=…&last=5                team form (paid plans only: Free blocks `last`)
 *   GET /fixtures/headtohead?h2h=A-B           previous meetings
 *   GET /players/topscorers?league=…&season=…  top scorers
 * Auth: `x-apisports-key` header.
 */
const BASE_URL = 'https://v3.football.api-sports.io';

/** Short-lived in-memory cache so tab switches / back navigation don't burn the daily quota. */
const CACHE_TTL_MS = {
  '/fixtures': 60_000,
  '/fixtures/headtohead': 6 * 60 * 60_000,
  '/standings': 30 * 60_000,
  '/players/topscorers': 60 * 60_000,
  '/leagues': 6 * 60 * 60_000,
} as const;


/** Local calendar day as API-Football expects it: YYYY-MM-DD (device time zone). */
export function toApiDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** "Free plans do not have access to this season, try from 2022 to 2024." → 2024 */
function latestAllowedSeason(errors: Record<string, string> | undefined): number | null {
  const match = errors?.plan?.match(/to (\d{4})/);
  return match ? Number(match[1]) : null;
}

const REQUEST_TIMEOUT_MS = 15_000;
/** Free plan: 10 requests / minute. One automatic retry after this pause. */
const RATE_LIMIT_RETRY_MS = 6_500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Persisted copy of each day's (filtered) fixtures: survives app reloads, saves quota. */
const DAY_CACHE_PREFIX = 'apifootball:fixtures:v1:';
type DayCacheEntry = { at: number; fixtures: ApiFixture[] };

function dayTtl(date: Date): number {
  const today = toApiDate(new Date());
  const day = toApiDate(date);
  if (day < today) return 12 * 60 * 60_000; // finished days barely change
  if (day > today) return 15 * 60_000;
  return 60_000; // today: live scores
}

export function createApiFootballDataSource(apiKey: string, featuredLeagueIds?: number[]): FootballDataSource {
  const cache = new Map<string, { at: number; data: unknown }>();
  /** Errors that won't change soon (plan/auth): remembered per URL. */
  const errorCache = new Map<string, { until: number; error: DataSourceError }>();
  /**
   * Once the daily quota is gone every call fails until 00:00 UTC. Short-circuit for 5 minutes at a
   * time (not until midnight) so a manual retry still re-checks, e.g. after upgrading the plan.
   */
  let quotaError: DataSourceError | null = null;
  let quotaCheckedAt = 0;

  async function request<T>(url: string, path: string): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, { headers: { 'x-apisports-key': apiKey }, signal: controller.signal });
      if (res.status === 429)
        throw new DataSourceError('rateLimit', `API-Football ${path}: HTTP 429`, Date.now() + 60_000);
      if (res.status >= 500) throw new DataSourceError('server', `API-Football ${path}: HTTP ${res.status}`);
      if (!res.ok) throw new DataSourceError('unknown', `API-Football ${path}: HTTP ${res.status}`);
      return (await res.json()) as ApiResponse<T>;
    } catch (e) {
      throw toDataSourceError(e);
    } finally {
      clearTimeout(timer);
    }
  }

  async function get<T>(
    path: keyof typeof CACHE_TTL_MS,
    params: Record<string, string | number | undefined>,
    ttlMs: number = CACHE_TTL_MS[path],
  ): Promise<T[]> {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    const url = `${BASE_URL}${path}${query ? `?${query}` : ''}`;

    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < ttlMs) return hit.data as T[];
    if (quotaError && Date.now() - quotaCheckedAt < 5 * 60_000 && Date.now() < (quotaError.retryAt ?? 0)) {
      throw quotaError;
    }
    const failed = errorCache.get(url);
    if (failed && Date.now() < failed.until) throw failed.error;

    if (__DEV__) console.log(`[API-Football] GET ${path}?${query}`);

    for (let attempt = 0; ; attempt++) {
      const json = await request<T>(url, path);
      // `errors` is [] on success, otherwise { requests | rateLimit | plan | token: "…" }.
      const errors = Array.isArray(json.errors) ? undefined : (json.errors as Record<string, string>);
      if (!errors || Object.keys(errors).length === 0) {
        quotaError = null;
        cache.set(url, { at: Date.now(), data: json.response });
        return json.response;
      }
      const error = fromApiErrors(path, errors);
      if (__DEV__) console.warn(`[API-Football] ${path} errors:`, JSON.stringify(errors));
      if (error.kind === 'rateLimit' && attempt === 0) {
        await sleep(RATE_LIMIT_RETRY_MS);
        continue;
      }
      if (error.kind === 'quota') {
        quotaError = error;
        quotaCheckedAt = Date.now();
      }
      // A suspended account may be reactivated from the dashboard: re-check every 30 minutes.
      if (error.kind === 'plan' || error.kind === 'suspended') errorCache.set(url, { until: Date.now() + 30 * 60_000, error });
      if (error.kind === 'auth') errorCache.set(url, { until: Number.MAX_SAFE_INTEGER, error });
      throw error;
    }
  }

  /** Day fixtures with a persisted fallback: fresh disk copy → network → stale copy on failure. */
  async function getDayFixtures(date: Date): Promise<ApiFixture[]> {
    const day = toApiDate(date);
    const key = DAY_CACHE_PREFIX + day;
    let stored: DayCacheEntry | null = null;
    try {
      const raw = await AsyncStorage.getItem(key);
      stored = raw ? (JSON.parse(raw) as DayCacheEntry) : null;
    } catch {
      stored = null; // storage unavailable/corrupt: just use the network
    }
    if (stored && Date.now() - stored.at < dayTtl(date)) return stored.fixtures;

    try {
      const all = await get<ApiFixture>('/fixtures', { date: day, timezone: deviceTimeZone() }, dayTtl(date));
      const fixtures = featuredLeagueIds ? all.filter((f) => featuredLeagueIds.includes(f.league.id)) : all;
      AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), fixtures } satisfies DayCacheEntry)).catch(
        () => undefined,
      );
      return fixtures;
    } catch (e) {
      const error = toDataSourceError(e);
      // Serve the last good copy (if any) together with the reason it couldn't be refreshed.
      if (stored) throw error.withStale(stored.fixtures);
      throw error;
    }
  }

  const featuredRank = (id: number) => {
    const i = featuredLeagueIds?.indexOf(id) ?? -1;
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };

  return {
    async getMatchesByDate(date) {
      const toMatches = (fixtures: ApiFixture[]): Match[] =>
        [...fixtures]
          // Keep leagues in the configured order, matches by kick-off.
          .sort(
            (a, b) =>
              featuredRank(a.league.id) - featuredRank(b.league.id) || a.fixture.date.localeCompare(b.fixture.date),
          )
          .map(mapFixture);
      try {
        return toMatches(await getDayFixtures(date));
      } catch (e) {
        const error = toDataSourceError(e);
        throw error.staleData ? error.withStale(toMatches(error.staleData as ApiFixture[])) : error;
      }
    },

    async getMatchDetails(matchId) {
      // `/fixtures?id=` returns events, line-ups and statistics in a single call.
      const [fixture] = await get<ApiFixture>('/fixtures', { id: matchId, timezone: deviceTimeZone() });
      return fixture ? mapFixtureDetails(fixture) : null;
    },

    async getStandings(league: League) {
      try {
        const [entry] = await get<ApiStandingsEntry>('/standings', { league: league.id, season: league.season });
        return mapStandings(entry, league);
      } catch (e) {
        // Free plans only cover older seasons: fall back to the most recent allowed one.
        const fallback = e instanceof DataSourceError ? latestAllowedSeason(e.apiErrors) : null;
        if (fallback === null || fallback === league.season) throw e;
        const [entry] = await get<ApiStandingsEntry>('/standings', { league: league.id, season: fallback });
        return mapStandings(entry, { ...league, season: fallback });
      }
    },

    async getLeagues(ids) {
      const entries = await get<ApiLeagueEntry>('/leagues', { current: 'true' });
      const leagues = entries.map(mapLeague);
      if (!ids) return leagues;
      const byId = new Map(leagues.map((l) => [l.id, l]));
      return ids.map((id) => byId.get(id)).filter((l): l is League => !!l);
    },

    async getTeamForm(teamId) {
      const fixtures = await get<ApiFixture>('/fixtures', { team: teamId, last: 5, timezone: deviceTimeZone() });
      return fixtures
        .filter(isFinishedFixture)
        .sort((a, b) => b.fixture.date.localeCompare(a.fixture.date))
        .slice(0, 5)
        .map((f) => mapFormEntry(f, teamId));
    },

    async getHeadToHead(teamA, teamB) {
      const fixtures = await get<ApiFixture>('/fixtures/headtohead', {
        h2h: `${teamA}-${teamB}`,
        timezone: deviceTimeZone(),
      });
      return fixtures
        .filter(isFinishedFixture)
        .sort((a, b) => b.fixture.date.localeCompare(a.fixture.date))
        .map(mapFixture);
    },

    async getTopScorers(league) {
      const load = async (season: number) => ({
        season,
        scorers: (await get<ApiTopScorer>('/players/topscorers', { league: league.id, season })).map((sc, i) =>
          mapTopScorer(sc, i, isNationalTeamLeague(league.id)),
        ),
      });
      try {
        return await load(league.season);
      } catch (e) {
        const fallback = e instanceof DataSourceError ? latestAllowedSeason(e.apiErrors) : null;
        if (fallback === null || fallback === league.season) throw e;
        return load(fallback);
      }
    },
  };
}
