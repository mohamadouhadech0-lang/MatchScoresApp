import type { FormEntry, League, LeagueStandings, Match, MatchDetails, TopScorers } from '@/types/football';

/**
 * Contract every data provider must fulfil.
 * Screens and hooks only depend on this interface — never on a concrete provider.
 */
export interface FootballDataSource {
  /** All fixtures on the given local date. */
  getMatchesByDate(date: Date): Promise<Match[]>;
  /** Fixture with events and statistics, or `null` if not found. */
  getMatchDetails(matchId: number): Promise<MatchDetails | null>;
  /**
   * League table for a league/season. The returned `league.season` is the season actually
   * served (it can be older than requested when the API plan limits seasons).
   */
  getStandings(league: League): Promise<LeagueStandings>;
  /** Leagues with their current season, restricted to `ids` when given. */
  getLeagues(ids?: number[]): Promise<League[]>;
  /** Last finished matches of a team, newest first (max 5). */
  getTeamForm(teamId: number): Promise<FormEntry[]>;
  /** Previous finished meetings between two teams, newest first. */
  getHeadToHead(teamA: number, teamB: number): Promise<Match[]>;
  /** Competition top scorers (season may fall back on limited plans). */
  getTopScorers(league: League): Promise<TopScorers>;
}
