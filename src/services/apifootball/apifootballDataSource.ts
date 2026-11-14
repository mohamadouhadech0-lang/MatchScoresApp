import AsyncStorage from '@react-native-async-storage/async-storage';

import type { League, Match } from '@/types/football';
import { isNationalTeamLeague } from '../api-football/mappers';
import { DataSourceError, nextUtcMidnight, toDataSourceError } from '../errors';
import type { FootballDataSource } from '../types';
import { providerLeagueId } from './leagueIds';
import {
  isFinishedEvent,
  mapEvent,
  mapEventDetails,
  mapFormEntry,
  mapLeague,
  mapStandings,
  mapTopScorer,
} from './mappers';
import type { AfError, AfEvent, AfH2H, AfLeague, AfStanding, AfTopScorer } from './types';

/**
 * apifootball.com v3 (https://apifootball.com/documentation/).
 * Every call is `GET https://apiv3.apifootball.com/?action=<name>&APIkey=<key>&…`:
 *   get_events   from/to (day), match_id (one match), team_id (form)
 *   get_leagues  leagues with logo and season
 *   get_standings league_id
 *   get_H2H      firstTeamId / secondTeamId
 *   get_topscorers league_id
 */
const BASE_URL = 'https://apiv3.apifootball.com/';
const REQUEST_TIMEOUT_MS = 15_000;

const CACHE_TTL_MS: Record<string, number> = {
  get_events: 60_000,
  get_leagues: 6 * 60 * 60_000,
  get_standings: 30 * 60_000,
  get_H2H: 6 * 60 * 60_000,
  get_topscorers: 60 * 60_000,
};

/** Local calendar day: YYYY-MM-DD (device time zone). */
export function toDay(date: Date): string {
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

const isApiError = (json: unknown): json is AfError =>
  !!json && typeof json === 'object' && !Array.isArray(json) && 'error' in json && 'message' in json;

/** apifootball answers "No event found" / "No standings found" instead of an empty list. */
const isEmptyResult = (message: string) => /^no .* found/i.test(message.trim());

function fromApiError(action: string, e: AfError): DataSourceError {
  const message = `apifootball ${action}: ${e.message}`;
  const apiErrors = { [String(e.error)]: e.message };
  const text = e.message.toLowerCase();
  if (text.includes('authentif') || text.includes('api key') || text.includes('apikey'))
    return new DataSourceError('auth', message, undefined, undefined, apiErrors);
  if (text.includes('suspend') || text.includes('expired') || text.includes('disabled'))
    return new DataSourceError('suspended', message, undefined, undefined, apiErrors);
  if (text.includes('limit') || text.includes('quota'))
    return new DataSourceError('quota', message, nextUtcMidnight(), undefined, apiErrors);
  if (text.includes('plan') || text.includes('not allowed') || text.includes('subscription'))
    return new DataSourceError('plan', message, undefined, undefined, apiErrors);
  return new DataSourceError('unknown', message, undefined, undefined, apiErrors);
}

/** Persisted copy of each day's events: survives reloads and saves quota. */
const DAY_CACHE_PREFIX = 'apifootball.com:events:v1:';
type DayCacheEntry = { at: number; events: AfEvent[] };

function dayTtl(date: Date): number {
  const today = toDay(new Date());
  const day = toDay(date);
  if (day < today) return 12 * 60 * 60_000;
  if (day > today) return 15 * 60_000;
  return 60_000;
}

export function createApifootballDataSource(apiKey: string, featuredLeagueIds?: number[]): FootballDataSource {
  const cache = new Map<string, { at: number; data: unknown }>();
  /** Auth / account errors won't fix themselves within a session: remembered per action. */
  let blockedError: { until: number; error: DataSourceError } | null = null;

  async function call<T>(
    action: string,
    params: Record<string, string | number | undefined>,
    ttlMs = CACHE_TTL_MS[action] ?? 60_000,
  ): Promise<T> {
    const all: Record<string, string | number | undefined> = {
      action,
      ...params,
    };
    const query = new URLSearchParams(
      Object.entries(all)
        .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    const hit = cache.get(query);
    if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
    if (blockedError && Date.now() < blockedError.until) throw blockedError.error;

    // The key is appended last and never logged.
    const url = `${BASE_URL}?${query}&APIkey=${encodeURIComponent(apiKey)}`;
    if (__DEV__) console.log(`[apifootball] GET ?${query}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let json: unknown;
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (res.status === 429)
        throw new DataSourceError('rateLimit', `apifootball ${action}: HTTP 429`, Date.now() + 60_000);
      if (res.status >= 500) throw new DataSourceError('server', `apifootball ${action}: HTTP ${res.status}`);
      if (!res.ok) throw new DataSourceError('unknown', `apifootball ${action}: HTTP ${res.status}`);
      json = await res.json();
    } catch (e) {
      throw toDataSourceError(e);
    } finally {
      clearTimeout(timer);
    }

    if (isApiError(json)) {
      if (isEmptyResult(json.message)) {
        const empty = (
          action === 'get_H2H'
            ? {
                firstTeam_VS_secondTeam: [],
                firstTeam_lastResults: [],
                secondTeam_lastResults: [],
              }
            : []
        ) as T;
        cache.set(query, { at: Date.now(), data: empty });
        return empty;
      }
      const error = fromApiError(action, json);
      if (__DEV__) console.warn(`[apifootball] ${action} error:`, json.error, json.message);
      if (error.kind === 'auth' || error.kind === 'suspended')
        blockedError = { until: Date.now() + 30 * 60_000, error };
      throw error;
    }
    blockedError = null;
    cache.set(query, { at: Date.now(), data: json });
    return json as T;
  }

  const tz = deviceTimeZone();

  async function getDayEvents(date: Date): Promise<AfEvent[]> {
    const day = toDay(date);
    const key = DAY_CACHE_PREFIX + day;
    let stored: DayCacheEntry | null = null;
    try {
      const raw = await AsyncStorage.getItem(key);
      stored = raw ? (JSON.parse(raw) as DayCacheEntry) : null;
    } catch {
      stored = null;
    }
    if (stored && Date.now() - stored.at < dayTtl(date)) return stored.events;
    try {
      const events = await call<AfEvent[]>('get_events', { from: day, to: day, timezone: tz }, dayTtl(date));
      AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), events } satisfies DayCacheEntry)).catch(
        () => undefined,
      );
      return events;
    } catch (e) {
      const error = toDataSourceError(e);
      if (stored) throw error.withStale(stored.events);
      throw error;
    }
  }

  // Featured leagues first (in configured order), then every other league the plan returns.
  const rank = (id: number) => {
    const i = featuredLeagueIds?.indexOf(id) ?? -1;
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const toMatches = (events: AfEvent[]): Match[] =>
    events
      .map(mapEvent)
      .sort(
        (a, b) =>
          rank(a.league.id) - rank(b.league.id) ||
          a.league.country.localeCompare(b.league.country) ||
          a.league.id - b.league.id ||
          a.kickoff.localeCompare(b.kickoff),
      );

  async function allLeagues(): Promise<League[]> {
    return (await call<AfLeague[]>('get_leagues', {})).map(mapLeague);
  }

  /** apifootball id for an app league id; loads the league list once to learn the mapping. */
  async function resolveLeague(appId: number): Promise<string | undefined> {
    const known = providerLeagueId(appId);
    if (known) return known;
    await allLeagues();
    return providerLeagueId(appId);
  }

  return {
    async getMatchesByDate(date) {
      try {
        return toMatches(await getDayEvents(date));
      } catch (e) {
        const error = toDataSourceError(e);
        throw error.staleData ? error.withStale(toMatches(error.staleData as AfEvent[])) : error;
      }
    },

    async getMatchDetails(matchId) {
      const [event] = await call<AfEvent[]>('get_events', {
        match_id: matchId,
        timezone: tz,
      });
      return event ? mapEventDetails(event) : null;
    },

    async getStandings(league) {
      const id = await resolveLeague(league.id);
      if (!id) return { league, rows: [] };
      const rows = await call<AfStanding[]>('get_standings', { league_id: id });
      return mapStandings(rows, league);
    },

    async getLeagues(ids) {
      const leagues = await allLeagues();
      if (!ids) return leagues;
      const byId = new Map(leagues.map((l) => [l.id, l]));
      return ids.map((id) => byId.get(id)).filter((l): l is League => !!l);
    },

    async getTeamForm(teamId) {
      const to = new Date();
      const from = new Date(to.getTime() - 120 * 24 * 60 * 60_000);
      const events = await call<AfEvent[]>(
        'get_events',
        { from: toDay(from), to: toDay(to), team_id: teamId, timezone: tz },
        30 * 60_000,
      );
      return events
        .filter(isFinishedEvent)
        .sort((a, b) => `${b.match_date} ${b.match_time}`.localeCompare(`${a.match_date} ${a.match_time}`))
        .slice(0, 5)
        .map((e) => mapFormEntry(e, teamId));
    },

    async getHeadToHead(teamA, teamB) {
      const h2h = await call<AfH2H>('get_H2H', {
        firstTeamId: teamA,
        secondTeamId: teamB,
        timezone: tz,
      });
      return (h2h.firstTeam_VS_secondTeam ?? [])
        .filter(isFinishedEvent)
        .map(mapEvent)
        .sort((a, b) => b.kickoff.localeCompare(a.kickoff));
    },

    async getTopScorers(league) {
      const id = await resolveLeague(league.id);
      if (!id) return { season: league.season, scorers: [] };
      const scorers = await call<AfTopScorer[]>('get_topscorers', {
        league_id: id,
      });
      const national = isNationalTeamLeague(league.id);
      return {
        season: league.season,
        scorers: scorers.map((s, i) => mapTopScorer(s, i, national)),
      };
    },
  };
}
