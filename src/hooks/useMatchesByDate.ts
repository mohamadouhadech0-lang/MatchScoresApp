import { useEffect, useMemo, useState } from 'react';

import { config } from '@/config';
import { footballApi } from '@/services';
import { DataSourceError, toDataSourceError } from '@/services/errors';
import type { LeagueMatches, Match } from '@/types/football';

function groupByLeague(matches: Match[]): LeagueMatches[] {
  const groups = new Map<number, LeagueMatches>();
  for (const m of matches) {
    const g = groups.get(m.league.id);
    if (g) g.matches.push(m);
    else groups.set(m.league.id, { league: m.league, matches: [m] });
  }
  for (const g of groups.values()) {
    g.matches.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  }
  return [...groups.values()];
}

const NO_MATCHES: Match[] = [];

/** Loads fixtures for `date`, ignores stale responses, and polls while matches are live. */
export function useMatchesByDate(date: Date) {
  // Results are tagged with the date they belong to, so switching days shows the loader
  // until that day's data arrives (no stale cards from the previous day).
  const [data, setData] = useState<{ time: number; matches: Match[]; error: DataSourceError | null } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Bumping this re-runs the fetch effect (pull-to-refresh, retry, live polling).
  const [reloadToken, setReloadToken] = useState(0);
  const time = date.getTime();

  useEffect(() => {
    let cancelled = false;
    footballApi
      .getMatchesByDate(new Date(time))
      .then(
        (matches) => !cancelled && setData({ time, matches, error: null }),
        (e: unknown) => {
          if (cancelled) return;
          const error = toDataSourceError(e);
          setData((prev) => {
            // 1) Last saved copy from the data source (e.g. daily quota reached).
            if (Array.isArray(error.staleData)) return { time, matches: error.staleData as Match[], error };
            // 2) A refresh / live poll failed: keep what's on screen, just flag the problem.
            if (prev && prev.time === time && prev.matches.length > 0) return { ...prev, error };
            // 3) Nothing to show.
            return { time, matches: [], error };
          });
        },
      )
      .finally(() => !cancelled && setRefreshing(false));
    return () => {
      cancelled = true;
    };
  }, [time, reloadToken]);

  const loading = data?.time !== time;
  const matches = loading ? NO_MATCHES : data.matches;
  const error = loading ? null : data.error;

  // Keep polling live matches, but stop hammering the API while it is refusing requests.
  const hasLive = matches.some((m) => m.status === 'live');
  const blocked = error?.kind === 'quota' || error?.kind === 'auth' || error?.kind === 'suspended';
  useEffect(() => {
    if (!hasLive || blocked) return;
    const timer = setInterval(() => setReloadToken((t) => t + 1), config.livePollIntervalMs);
    return () => clearInterval(timer);
  }, [hasLive, blocked]);

  const groups = useMemo(() => groupByLeague(matches), [matches]);

  return {
    matches,
    groups,
    loading,
    refreshing,
    /** Set when the last request failed. `matches` may still hold saved/previous data. */
    error,
    /** True when matches are shown but couldn't be refreshed. */
    stale: !!error && matches.length > 0,
    refresh: () => {
      setRefreshing(true);
      setReloadToken((t) => t + 1);
    },
    retry: () => {
      setData(null);
      setReloadToken((t) => t + 1);
    },
  };
}
