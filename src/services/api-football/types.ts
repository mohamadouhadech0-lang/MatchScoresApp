/**
 * Minimal subset of API-Football v3 response shapes we consume.
 * Docs: https://www.api-football.com/documentation-v3
 */

export interface ApiResponse<T> {
  errors: unknown[] | Record<string, string>;
  results: number;
  response: T[];
}

export interface ApiTeam {
  id: number;
  name: string;
  logo: string;
}

export interface ApiFixture {
  fixture: {
    id: number;
    referee: string | null;
    date: string;
    venue: { name: string | null; city: string | null };
    status: { short: string; elapsed: number | null; extra?: number | null };
  };
  league: { id: number; name: string; country: string; logo: string; season: number; round: string };
  teams: { home: ApiTeam; away: ApiTeam };
  goals: { home: number | null; away: number | null };
  events?: ApiEvent[];
  statistics?: ApiTeamStatistics[];
  lineups?: ApiLineup[];
}

interface ApiKit {
  primary: string | null;
  number: string | null;
  border: string | null;
}

export interface ApiLineup {
  team: ApiTeam & { colors?: { player?: ApiKit; goalkeeper?: ApiKit } | null };
  formation: string | null;
  startXI: {
    player: {
      id: number | null;
      name: string;
      number: number | null;
      pos: string | null;
      grid: string | null;
      /** Not returned by /fixtures today; used if the API ever adds it. */
      photo?: string | null;
    };
  }[];
}

/** One entry of `/leagues`. */
export interface ApiLeagueEntry {
  league: { id: number; name: string; type: string; logo: string };
  country: { name: string; code: string | null; flag: string | null };
  seasons: { year: number; current: boolean }[];
}

export interface ApiEvent {
  time: { elapsed: number; extra: number | null };
  team: ApiTeam;
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string;
}

export interface ApiTeamStatistics {
  team: ApiTeam;
  statistics: { type: string; value: number | string | null }[];
}

export interface ApiStandingsEntry {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    standings: ApiStandingRow[][];
  };
}

export interface ApiStandingRow {
  rank: number;
  team: ApiTeam;
  points: number;
  goalsDiff: number;
  form: string | null;
  description: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

/** One entry of `/players/topscorers`. */
export interface ApiTopScorer {
  player: { id: number; name: string; photo: string | null };
  statistics: {
    team: ApiTeam;
    goals: { total: number | null; assists: number | null };
  }[];
}
