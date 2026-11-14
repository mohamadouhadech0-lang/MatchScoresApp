import { getClubMatches } from '@/data/mock/clubLeagues';
import { liveSince, mockMatches } from '@/data/mock/matches';
import {
  getMatchDetails as getNationsLeagueDetails,
  getMockForm,
  getMockHeadToHead,
  getTopScorers as getMockTopScorers,
} from '@/data/mock/matchExtras';
import { getNationsLeagueMatches, nationalTeams } from '@/data/mock/nationsLeague';
import { leagueEntities } from '@/data/mock/searchCatalog';
import { mockStandings } from '@/data/mock/standings';
import type { League, LeagueStandings, MatchDetails } from '@/types/football';
import type { FootballDataSource } from './types';

const LATENCY_MS = 350;
const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

/** Advances live minutes based on elapsed time so polling/refresh visibly updates the clock. */
function withLiveClock(match: MatchDetails): MatchDetails {
  if (match.status !== 'live' || match.phase === 'half_time' || match.minute == null) return match;
  const elapsed = Math.floor((Date.now() - liveSince) / 60_000);
  const cap = match.phase === 'first_half' ? 45 : 90;
  return { ...match, minute: Math.min(match.minute + elapsed, cap) };
}

export const mockDataSource: FootballDataSource = {
  async getMatchesByDate(date) {
    const now = new Date();
    return delay([...getNationsLeagueMatches(date, now), ...getClubMatches(date, now)]);
  },

  async getMatchDetails(matchId) {
    const generated = getNationsLeagueDetails(matchId);
    if (generated) return delay(generated);
    const found = mockMatches.find((m) => m.id === matchId);
    return delay(found ? withLiveClock(found) : null);
  },

  async getStandings(league: League): Promise<LeagueStandings> {
    const found = mockStandings.find((s) => s.league.id === league.id);
    return delay(found ?? { league, rows: [] });
  },

  async getLeagues(ids) {
    const all: League[] = leagueEntities.map((l) => ({
      id: l.id,
      name: l.name,
      country: l.subtitle,
      season: 2026,
    }));
    return delay(ids ? all.filter((l) => ids.includes(l.id)) : all);
  },

  async getTeamForm(teamId) {
    return delay(getMockForm(teamId));
  },

  async getHeadToHead(teamA, teamB) {
    const all = Object.values(nationalTeams);
    const a = all.find((t) => t.id === teamA);
    const b = all.find((t) => t.id === teamB);
    return delay(a && b ? getMockHeadToHead(a, b) : []);
  },

  async getTopScorers(league) {
    return delay({
      season: league.season,
      scorers: getMockTopScorers(league.id),
    });
  },
};
