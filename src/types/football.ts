/**
 * Domain models used by the whole app.
 *
 * These are intentionally independent from any provider (API-Football, mock, …).
 * Each data source is responsible for mapping its raw payloads into these types,
 * so UI code never depends on a specific API shape.
 */

export type MatchStatus = 'live' | 'scheduled' | 'finished';

/** Finer-grained phase, useful for labels such as "استراحة" or "ركلات ترجيح". */
export type MatchPhase =
  | 'not_started'
  | 'first_half'
  | 'half_time'
  | 'second_half'
  | 'extra_time'
  | 'penalties'
  | 'finished'
  | 'finished_aet'
  | 'finished_pen'
  | 'postponed'
  | 'cancelled';

export interface Team {
  id: number;
  name: string;
  shortName: string;
  /** Remote logo URL (from a real API). When missing, a colored badge is drawn. */
  logo?: string;
  /** Brand color used for the fallback badge. */
  color?: string;
  /** FIFA world ranking (national teams only). */
  fifaRank?: number;
  /** National team: its logo is a flag (drawn edge-to-edge) rather than a crest. */
  national?: boolean;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo?: string;
  /** Season year as used by API-Football (e.g. 2026). */
  season: number;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export type MatchEventType =
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'missed_penalty'
  | 'yellow_card'
  | 'second_yellow'
  | 'red_card'
  | 'substitution';

export interface MatchEvent {
  id: string;
  minute: number;
  extraMinute?: number;
  type: MatchEventType;
  /** Team the event counts for (for own goals: the team that benefits). */
  teamId: number;
  player: string;
  /** Assist for goals, player coming off for substitutions. */
  relatedPlayer?: string;
}

export type StatKey =
  | 'possession'
  | 'shots_total'
  | 'shots_on_target'
  | 'corners'
  | 'fouls'
  | 'offsides'
  | 'yellow_cards'
  | 'red_cards'
  | 'passes'
  | 'pass_accuracy';

export interface MatchStatistic {
  key: StatKey;
  home: number;
  away: number;
  /** Rendered as a percentage (e.g. possession). */
  isPercentage?: boolean;
}

export interface Match {
  id: number;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  /** ISO date string. */
  kickoff: string;
  status: MatchStatus;
  phase: MatchPhase;
  /** Current minute for live matches. */
  minute?: number;
  score: Score;
  /** Stadium name. */
  venue?: string;
  venueCity?: string;
  round?: string;
  referee?: string;
  refereeCountry?: string;
  /** TV commentator (not provided by API-Football). */
  commentator?: string;
  /** TV channel broadcasting the match. */
  channel?: string;
  /** First-leg result for two-legged ties, e.g. "2 - 1". */
  firstLeg?: string;
}

export interface LineupPlayer {
  /** Provider player id (API-Football), when known. */
  id?: number;
  number: number;
  name: string;
  /** Portrait URL; the shirt number is shown when missing or failing to load. */
  photo?: string;
  /** Row on the pitch: 0 = goalkeeper, then defence → attack. */
  line: number;
  /** Position inside the row (left → right), when the provider gives one. */
  col?: number;
}

/** Kit colors (hex) used for the shirt-number fallback. */
export interface KitColors {
  background: string;
  number: string;
  border: string;
}

/** Bench player (no pitch position). */
export interface BenchPlayer {
  id?: number;
  number: number;
  name: string;
  photo?: string;
  /** Goalkeeper on the bench (drawn in the keeper kit). */
  goalkeeper?: boolean;
}

export interface Lineup {
  team: Team;
  formation: string;
  players: LineupPlayer[];
  kit?: { player: KitColors; goalkeeper: KitColors };
  /** Substitutes, when the provider lists them. */
  substitutes?: BenchPlayer[];
  /** Head coach name, when known. */
  coach?: string;
}

export interface MatchDetails extends Match {
  events: MatchEvent[];
  statistics: MatchStatistic[];
  /** Expected (or confirmed) line-ups, when available. */
  lineups?: [home: Lineup, away: Lineup];
}

export interface StandingRow {
  rank: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  /** Last results, most recent last. */
  form: ('W' | 'D' | 'L')[];
  /** Qualification zone description, if any. */
  zone?: 'champions' | 'europa' | 'relegation';
}

export interface LeagueStandings {
  league: League;
  rows: StandingRow[];
}

export interface LeagueMatches {
  league: League;
  matches: Match[];
}

/** One recent result from a team's point of view. */
export interface FormEntry {
  matchId: number;
  result: 'W' | 'D' | 'L';
  opponent: Team;
  /** Goals for / against this team. */
  goalsFor: number;
  goalsAgainst: number;
  isHome: boolean;
  /** ISO date. */
  date: string;
}

export interface TopScorer {
  rank: number;
  name: string;
  photo?: string;
  team: Team;
  goals: number;
  assists: number;
}

export interface TopScorers {
  /** Season actually served (may be older than requested on limited API plans). */
  season: number;
  scorers: TopScorer[];
}
