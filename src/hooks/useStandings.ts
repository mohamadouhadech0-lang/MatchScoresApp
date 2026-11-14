import { useEffect, useState } from 'react';

import { footballApi } from '@/services';
import type { League, LeagueStandings } from '@/types/football';

type State = { key: string; status: 'ok'; data: LeagueStandings } | { key: string; status: 'error'; message: string };

/**
 * Loads a league table from the active data source. `requestedSeason` vs `data.league.season`
 * tells the UI when the API served an older season (free plan limits).
 */
export function useStandings(league: League | null) {
  const [state, setState] = useState<State | null>(null);
  const key = league ? `${league.id}:${league.season}` : '';

  useEffect(() => {
    if (!league) return;
    let cancelled = false;
    const k = `${league.id}:${league.season}`;
    footballApi
      .getStandings(league)
      .then((data) => !cancelled && setState({ key: k, status: 'ok', data }))
      .catch(
        (e: unknown) =>
          !cancelled && setState({ key: k, status: 'error', message: e instanceof Error ? e.message : String(e) }),
      );
    return () => {
      cancelled = true;
    };
    // `league` identity can change on every render; the key captures what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state?.key === key ? state : null;
  return {
    loading: !!league && !current,
    rows: current?.status === 'ok' ? current.data.rows : [],
    servedSeason: current?.status === 'ok' ? current.data.league.season : undefined,
    requestedSeason: league?.season,
    error: current?.status === 'error' ? current.message : undefined,
  };
}

/** Loads league metadata (name, logo, current season) for the given IDs. */
export function useLeagues(ids: number[]) {
  const [leagues, setLeagues] = useState<{ key: string; list: League[] } | null>(null);
  const key = ids.join(',');

  useEffect(() => {
    let cancelled = false;
    footballApi
      .getLeagues(key ? key.split(',').map(Number) : [])
      .then((list) => !cancelled && setLeagues({ key, list }))
      .catch(() => !cancelled && setLeagues({ key, list: [] }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  return leagues?.key === key ? leagues.list : null;
}
