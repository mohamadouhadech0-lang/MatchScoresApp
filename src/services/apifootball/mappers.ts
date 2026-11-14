import { leagueNameAr, roundAr, splitReferee } from '@/i18n/football';
import type {
  FormEntry,
  League,
  LeagueStandings,
  Lineup,
  LineupPlayer,
  Match,
  MatchDetails,
  MatchEvent,
  MatchPhase,
  MatchStatistic,
  MatchStatus,
  StandingRow,
  StatKey,
  Team,
  TopScorer,
} from '@/types/football';
import { isNationalTeamLeague } from '../api-football/mappers';
import { appLeagueId } from './leagueIds';
import type { AfEvent, AfLeague, AfLineupPlayer, AfStanding, AfTeamLineup, AfTopScorer } from './types';

const int = (v: string | undefined | null): number | null => {
  if (v == null || v.trim() === '') return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

/** "2025/2026" → 2025, "2026" → 2026. */
export function seasonYear(raw: string | undefined): number {
  const m = raw?.match(/\d{4}/);
  return m ? Number(m[0]) : new Date().getFullYear();
}

/**
 * match_status: "" (not started), "13" / "45+2" (minute), "Half Time", "Finished", "After ET",
 * "After Pen.", "Postponed", "Cancelled", "Awarded", plus a few others seen live.
 */
function mapStatus(e: AfEvent): {
  status: MatchStatus;
  phase: MatchPhase;
  minute?: number;
} {
  const s = e.match_status.trim().toLowerCase();
  const minuteMatch = s.match(/^(\d+)(?:\+(\d+))?'?$/);
  if (minuteMatch) {
    const minute = Number(minuteMatch[1]);
    const phase: MatchPhase = minute <= 45 ? 'first_half' : minute <= 90 ? 'second_half' : 'extra_time';
    return { status: 'live', phase, minute };
  }
  if (s === 'half time' || s === 'ht') return { status: 'live', phase: 'half_time', minute: 45 };
  if (s.includes('extra time') || s === 'break time') return { status: 'live', phase: 'extra_time' };
  if (s.startsWith('pen') && e.match_live === '1') return { status: 'live', phase: 'penalties' };
  if (s === 'finished' || s === 'ft' || s === 'awarded') return { status: 'finished', phase: 'finished' };
  if (s.startsWith('after et') || s === 'aet') return { status: 'finished', phase: 'finished_aet' };
  if (s.startsWith('after pen')) return { status: 'finished', phase: 'finished_pen' };
  if (s.startsWith('postp')) return { status: 'scheduled', phase: 'postponed' };
  if (s.startsWith('cancel') || s.startsWith('abandon')) return { status: 'finished', phase: 'cancelled' };
  if (e.match_live === '1') return { status: 'live', phase: 'second_half' };
  return { status: 'scheduled', phase: 'not_started' };
}

/**
 * `match_date` + `match_time` are wall-clock values in the `timezone` we requested, which is the
 * device zone, so a local Date built from them is the right instant.
 */
function kickoffIso(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0).toISOString();
}

function team(id: string, name: string, badge: string | undefined, national: boolean): Team {
  return {
    id: Number(id),
    name,
    shortName: name.slice(0, 3).toUpperCase(),
    logo: badge || undefined,
    national,
  };
}

export function mapLeagueOf(
  e: Pick<AfEvent, 'league_id' | 'country_name' | 'league_name' | 'league_logo' | 'league_year'>,
): League {
  const id = appLeagueId(e.league_id, e.country_name, e.league_name);
  return {
    id,
    name: leagueNameAr(id, e.league_name),
    country: e.country_name,
    logo: e.league_logo || undefined,
    season: seasonYear(e.league_year),
  };
}

export function mapEvent(e: AfEvent): Match {
  const league = mapLeagueOf(e);
  const national = isNationalTeamLeague(league.id);
  const { status, phase, minute } = mapStatus(e);
  const referee = splitReferee(e.match_referee);
  const [venue, ...cityParts] = (e.match_stadium ?? '').split('(');
  const round = e.match_round?.trim();
  return {
    id: Number(e.match_id),
    league,
    homeTeam: team(e.match_hometeam_id, e.match_hometeam_name, e.team_home_badge, national),
    awayTeam: team(e.match_awayteam_id, e.match_awayteam_name, e.team_away_badge, national),
    kickoff: kickoffIso(e.match_date, e.match_time),
    status,
    phase,
    minute,
    score:
      status === 'scheduled'
        ? { home: null, away: null }
        : {
            home: int(e.match_hometeam_score),
            away: int(e.match_awayteam_score),
          },
    venue: venue.trim() || undefined,
    venueCity:
      cityParts
        .join('(')
        .replace(/\)\s*$/, '')
        .trim() || undefined,
    referee: referee.name,
    refereeCountry: referee.country,
    // Bare matchday numbers ("12") read like the API-Football "Regular Season - 12" label.
    round: round ? roundAr(/^\d+$/.test(round) ? `Regular Season - ${round}` : round) : undefined,
  };
}

/** "45+2" → [45, 2]. */
function parseMinute(time: string): [number, number | undefined] {
  const [base, extra] = time.split('+').map((p) => Number.parseInt(p, 10));
  return [Number.isFinite(base) ? base : 0, Number.isFinite(extra) ? extra : undefined];
}

function mapTimeline(e: AfEvent, homeId: number, awayId: number): MatchEvent[] {
  const events: MatchEvent[] = [];
  const push = (ev: Omit<MatchEvent, 'id' | 'minute' | 'extraMinute'>, time: string) => {
    const [minute, extraMinute] = parseMinute(time);
    events.push({
      ...ev,
      id: `${e.match_id}-${events.length}`,
      minute,
      extraMinute,
    });
  };

  for (const g of e.goalscorer ?? []) {
    const isHome = !!g.home_scorer;
    const info = g.info.toLowerCase();
    const type: MatchEvent['type'] = info.includes('own')
      ? 'own_goal'
      : info.includes('penalty')
        ? 'penalty_goal'
        : 'goal';
    push(
      {
        type,
        // The goal is listed on the side whose score went up, i.e. the team that benefits.
        teamId: isHome ? homeId : awayId,
        player: (isHome ? g.home_scorer : g.away_scorer).replace(/\s*\(o\.g\.\)\s*/i, ''),
        relatedPlayer: (isHome ? g.home_assist : g.away_assist) || undefined,
      },
      g.time,
    );
  }

  for (const c of e.cards ?? []) {
    const isHome = !!c.home_fault;
    const card = c.card.toLowerCase();
    const type: MatchEvent['type'] =
      card.includes('yellow') && card.includes('red')
        ? 'second_yellow'
        : card.includes('red')
          ? 'red_card'
          : 'yellow_card';
    push(
      {
        type,
        teamId: isHome ? homeId : awayId,
        player: isHome ? c.home_fault : c.away_fault,
      },
      c.time,
    );
  }

  for (const [side, teamId] of [
    ['home', homeId],
    ['away', awayId],
  ] as const) {
    for (const s of e.substitutions?.[side] ?? []) {
      const [off, on] = s.substitution.split('|').map((p) => p.trim());
      push(
        {
          type: 'substitution',
          teamId,
          player: on || off || '',
          relatedPlayer: on ? off : undefined,
        },
        s.time,
      );
    }
  }

  return events.sort((a, b) => a.minute - b.minute || (a.extraMinute ?? 0) - (b.extraMinute ?? 0));
}

const STAT_ALIASES: [StatKey, RegExp][] = [
  ['possession', /possession/],
  ['shots_on_target', /shots on (goal|target)/],
  ['shots_total', /^(shots total|total shots|shots)$/],
  ['corners', /corner/],
  ['fouls', /^fouls/],
  ['offsides', /offside/],
  ['yellow_cards', /yellow/],
  ['red_cards', /red card/],
  ['passes', /^(passes total|total passes|passes)$/],
  ['pass_accuracy', /passes (%|accuracy)|pass accuracy/],
];

const num = (v: string) => Number.parseFloat(v.replace('%', '')) || 0;

function mapStatistics(stats: AfEvent['statistics']): MatchStatistic[] {
  const out: MatchStatistic[] = [];
  for (const s of stats ?? []) {
    const type = s.type.toLowerCase().trim();
    const key = STAT_ALIASES.find(([, re]) => re.test(type))?.[0];
    if (!key || out.some((o) => o.key === key)) continue;
    out.push({
      key,
      home: num(s.home),
      away: num(s.away),
      isPercentage: s.home.includes('%') || key === 'possession',
    });
  }
  return out;
}

/**
 * `lineup_position` numbers players 1 (goalkeeper) … 11 following the team system, e.g. "4-3-3":
 * 2-5 defence, 6-8 midfield, 9-11 attack. Without a system we assume 4-4-2.
 */
function mapLineup(l: AfTeamLineup, system: string | undefined, t: Team): Lineup {
  const rows = (system ?? '')
    .split('-')
    .map(Number)
    .filter((n) => n > 0);
  const lines = rows.length > 0 && rows.reduce((a, b) => a + b, 0) === 10 ? rows : [4, 4, 2];
  const placed = [...l.starting_lineups].sort(
    (a, b) => (int(a.lineup_position) ?? 99) - (int(b.lineup_position) ?? 99),
  );
  const players: LineupPlayer[] = placed.map((p: AfLineupPlayer, i) => {
    if (i === 0)
      return {
        id: int(p.player_key ?? '') ?? undefined,
        number: int(p.lineup_number) ?? 0,
        name: p.lineup_player,
        line: 0,
        col: 1,
      };
    let rest = i - 1;
    let line = 0;
    while (line < lines.length - 1 && rest >= lines[line]) rest -= lines[line++];
    return {
      id: int(p.player_key ?? '') ?? undefined,
      number: int(p.lineup_number) ?? 0,
      name: p.lineup_player,
      line: line + 1,
      col: rest + 1,
    };
  });
  const substitutes = (l.substitutes ?? []).map((p) => ({
    id: int(p.player_key ?? '') ?? undefined,
    number: int(p.lineup_number) ?? 0,
    name: p.lineup_player,
    goalkeeper: int(p.lineup_position) === 1,
  }));
  return { team: t, formation: system ?? '', players, substitutes, coach: l.coach?.[0]?.lineup_player || undefined };
}

export function mapEventDetails(e: AfEvent): MatchDetails {
  const match = mapEvent(e);
  const home = e.lineup?.home;
  const away = e.lineup?.away;
  const lineups: [Lineup, Lineup] | undefined =
    home?.starting_lineups?.length && away?.starting_lineups?.length
      ? [
          mapLineup(home, e.match_hometeam_system, match.homeTeam),
          mapLineup(away, e.match_awayteam_system, match.awayTeam),
        ]
      : undefined;
  return {
    ...match,
    events: mapTimeline(e, match.homeTeam.id, match.awayTeam.id),
    statistics: mapStatistics(e.statistics),
    lineups,
  };
}

export function mapLeague(l: AfLeague): League {
  return mapLeagueOf({ ...l, league_year: l.league_season });
}

function zone(promotion: string): StandingRow['zone'] {
  const p = promotion.toLowerCase();
  if (!p) return undefined;
  if (p.includes('relegation')) return 'relegation';
  if (p.includes('champions')) return 'champions';
  if (p.includes('europa') || p.includes('conference')) return 'europa';
  return undefined;
}

export function mapStandings(rows: AfStanding[], league: League): LeagueStandings {
  const national = isNationalTeamLeague(league.id);
  // Group competitions return every group in one list: keep the first stage/group, like before.
  const firstStage = rows[0]?.stage_name;
  return {
    league: { ...league, logo: league.logo },
    rows: rows
      .filter((r) => r.stage_name === firstStage)
      .map((r) => ({
        rank: int(r.overall_league_position) ?? 0,
        team: team(r.team_id, r.team_name, r.team_badge, national),
        played: int(r.overall_league_payed) ?? 0,
        won: int(r.overall_league_W) ?? 0,
        drawn: int(r.overall_league_D) ?? 0,
        lost: int(r.overall_league_L) ?? 0,
        goalsFor: int(r.overall_league_GF) ?? 0,
        goalsAgainst: int(r.overall_league_GA) ?? 0,
        points: int(r.overall_league_PTS) ?? 0,
        form: [],
        zone: zone(r.overall_promotion ?? ''),
      }))
      .sort((a, b) => a.rank - b.rank),
  };
}

export const isFinishedEvent = (e: AfEvent) => mapEvent(e).status === 'finished' && mapEvent(e).phase !== 'cancelled';

export function mapFormEntry(e: AfEvent, teamId: number): FormEntry {
  const m = mapEvent(e);
  const isHome = m.homeTeam.id === teamId;
  const goalsFor = (isHome ? m.score.home : m.score.away) ?? 0;
  const goalsAgainst = (isHome ? m.score.away : m.score.home) ?? 0;
  let result: FormEntry['result'] = goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';
  if (result === 'D' && m.phase === 'finished_pen') {
    const pf = int(isHome ? e.match_hometeam_penalty_score : e.match_awayteam_penalty_score);
    const pa = int(isHome ? e.match_awayteam_penalty_score : e.match_hometeam_penalty_score);
    if (pf != null && pa != null && pf !== pa) result = pf > pa ? 'W' : 'L';
  }
  return {
    matchId: m.id,
    result,
    opponent: isHome ? m.awayTeam : m.homeTeam,
    goalsFor,
    goalsAgainst,
    isHome,
    date: m.kickoff,
  };
}

export function mapTopScorer(s: AfTopScorer, index: number, national: boolean): TopScorer {
  return {
    rank: int(s.player_place) ?? index + 1,
    name: s.player_name,
    team: team(s.team_key, s.team_name, undefined, national),
    goals: int(s.goals) ?? 0,
    assists: int(s.assists) ?? 0,
  };
}
