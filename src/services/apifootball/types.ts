/**
 * Subset of apifootball.com v3 response shapes we consume.
 * Docs: https://apifootball.com/documentation/
 *
 * Every value is a string (scores are "" before kick-off). Failures come back as HTTP 200 with
 * `{ "error": 404, "message": "Authentification failed!" }`.
 */

export interface AfError {
  error: number;
  message: string;
}

export interface AfGoal {
  time: string;
  home_scorer: string;
  home_scorer_id?: string;
  home_assist: string;
  away_scorer: string;
  away_scorer_id?: string;
  away_assist: string;
  score: string;
  info: string;
}

export interface AfCard {
  time: string;
  home_fault: string;
  card: string;
  away_fault: string;
  info: string;
}

export interface AfSubstitution {
  time: string;
  /** "Player Out | Player In" */
  substitution: string;
  substitution_player_id?: string;
}

export interface AfLineupPlayer {
  lineup_player: string;
  lineup_number: string;
  /** 1 = goalkeeper, then defence → attack following the team's system. */
  lineup_position: string;
  player_key?: string;
}

export interface AfTeamLineup {
  starting_lineups: AfLineupPlayer[];
  substitutes: AfLineupPlayer[];
  coach?: { lineup_player: string }[];
}

export interface AfStatistic {
  type: string;
  home: string;
  away: string;
}

export interface AfEvent {
  match_id: string;
  country_id: string;
  country_name: string;
  league_id: string;
  league_name: string;
  league_year?: string;
  match_date: string;
  match_time: string;
  match_status: string;
  match_live: string;
  match_round?: string;
  match_stadium?: string;
  match_referee?: string;
  stage_name?: string;
  match_hometeam_id: string;
  match_hometeam_name: string;
  match_hometeam_score: string;
  match_awayteam_id: string;
  match_awayteam_name: string;
  match_awayteam_score: string;
  match_hometeam_penalty_score?: string;
  match_awayteam_penalty_score?: string;
  match_hometeam_system?: string;
  match_awayteam_system?: string;
  team_home_badge?: string;
  team_away_badge?: string;
  league_logo?: string;
  goalscorer?: AfGoal[];
  cards?: AfCard[];
  substitutions?: { home: AfSubstitution[]; away: AfSubstitution[] };
  lineup?: { home: AfTeamLineup; away: AfTeamLineup };
  statistics?: AfStatistic[];
}

export interface AfLeague {
  country_id: string;
  country_name: string;
  league_id: string;
  league_name: string;
  league_season: string;
  league_logo: string;
}

export interface AfStanding {
  country_name: string;
  league_id: string;
  league_name: string;
  team_id: string;
  team_name: string;
  team_badge?: string;
  overall_promotion: string;
  overall_league_position: string;
  overall_league_payed: string;
  overall_league_W: string;
  overall_league_D: string;
  overall_league_L: string;
  overall_league_GF: string;
  overall_league_GA: string;
  overall_league_PTS: string;
  stage_name?: string;
}

export interface AfH2H {
  firstTeam_VS_secondTeam: AfEvent[];
  firstTeam_lastResults: AfEvent[];
  secondTeam_lastResults: AfEvent[];
}

export interface AfTopScorer {
  player_place: string;
  player_name: string;
  player_key: string;
  team_name: string;
  team_key: string;
  goals: string;
  assists: string;
}
