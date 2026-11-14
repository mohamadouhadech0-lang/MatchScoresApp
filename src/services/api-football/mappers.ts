import type {
  FormEntry,
  League,
  LeagueStandings,
  KitColors,
  Lineup,
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
import type {
  ApiEvent,
  ApiFixture,
  ApiLeagueEntry,
  ApiLineup,
  ApiStandingRow,
  ApiStandingsEntry,
  ApiTeam,
  ApiTeamStatistics,
  ApiTopScorer,
} from './types';
import { leagueNameAr, roundAr, splitReferee } from '@/i18n/football';

/** API-Football short status → [status, phase]. */
const STATUS_MAP: Record<string, [MatchStatus, MatchPhase]> = {
  TBD: ['scheduled', 'not_started'],
  NS: ['scheduled', 'not_started'],
  '1H': ['live', 'first_half'],
  HT: ['live', 'half_time'],
  '2H': ['live', 'second_half'],
  ET: ['live', 'extra_time'],
  BT: ['live', 'extra_time'],
  P: ['live', 'penalties'],
  SUSP: ['live', 'second_half'],
  INT: ['live', 'second_half'],
  LIVE: ['live', 'second_half'],
  FT: ['finished', 'finished'],
  AET: ['finished', 'finished_aet'],
  PEN: ['finished', 'finished_pen'],
  PST: ['scheduled', 'postponed'],
  CANC: ['finished', 'cancelled'],
  ABD: ['finished', 'cancelled'],
  AWD: ['finished', 'finished'],
  WO: ['finished', 'finished'],
};

const STAT_MAP: Record<string, StatKey> = {
  'Ball Possession': 'possession',
  'Total Shots': 'shots_total',
  'Shots on Goal': 'shots_on_target',
  'Corner Kicks': 'corners',
  Fouls: 'fouls',
  Offsides: 'offsides',
  'Yellow Cards': 'yellow_cards',
  'Red Cards': 'red_cards',
  'Total passes': 'passes',
  'Passes %': 'pass_accuracy',
};

/**
 * Competitions played by national teams (their API "logos" are flags). Used to decide how a
 * team's image is drawn: flags edge-to-edge, club crests contained.
 */
const NATIONAL_TEAM_LEAGUES = new Set([1, 4, 5, 6, 7, 9, 10, 22, 29, 30, 31, 32, 33, 34, 35, 36, 37, 960]);
export const isNationalTeamLeague = (leagueId: number) => NATIONAL_TEAM_LEAGUES.has(leagueId);

export function mapTeam(t: ApiTeam, national = false): Team {
  return { id: t.id, name: t.name, shortName: t.name.slice(0, 3).toUpperCase(), logo: t.logo, national };
}

export function mapFixture(f: ApiFixture): Match {
  const [status, phase] = STATUS_MAP[f.fixture.status.short] ?? ['scheduled', 'not_started'];
  const league: League = {
    id: f.league.id,
    name: leagueNameAr(f.league.id, f.league.name),
    country: f.league.country,
    logo: f.league.logo,
    season: f.league.season,
  };
  const referee = splitReferee(f.fixture.referee);
  const national = isNationalTeamLeague(f.league.id);
  return {
    id: f.fixture.id,
    league,
    homeTeam: mapTeam(f.teams.home, national),
    awayTeam: mapTeam(f.teams.away, national),
    kickoff: f.fixture.date,
    status,
    phase,
    minute: f.fixture.status.elapsed ?? undefined,
    score: { home: f.goals.home, away: f.goals.away },
    venue: f.fixture.venue.name ?? undefined,
    venueCity: f.fixture.venue.city ?? undefined,
    referee: referee.name,
    refereeCountry: referee.country,
    round: roundAr(f.league.round),
  };
}

function mapEvent(e: ApiEvent, index: number, f: ApiFixture): MatchEvent | null {
  const base = {
    id: `${f.fixture.id}-${index}`,
    minute: e.time.elapsed,
    extraMinute: e.time.extra ?? undefined,
    teamId: e.team.id,
    player: e.player.name ?? '',
    relatedPlayer: e.assist.name ?? undefined,
  };
  if (e.type === 'Goal') {
    if (e.detail === 'Missed Penalty') return { ...base, type: 'missed_penalty' };
    // API-Football already lists an own goal under the team that BENEFITS (verified against live
    // data: Colombia 1-0 Chile, "G. Maripan" own goal is returned with team = Colombia).
    if (e.detail === 'Own Goal') return { ...base, type: 'own_goal' };
    return { ...base, type: e.detail === 'Penalty' ? 'penalty_goal' : 'goal' };
  }
  if (e.type === 'Card') {
    // API details: "Yellow Card", "Second Yellow card", "Red Card".
    const detail = e.detail.toLowerCase();
    if (detail.startsWith('second yellow')) return { ...base, type: 'second_yellow' };
    return { ...base, type: detail.startsWith('yellow') ? 'yellow_card' : 'red_card' };
  }
  if (e.type === 'subst') {
    // In API-Football substitutions, `player` is the one going OFF and `assist` the one coming ON.
    return { ...base, type: 'substitution', player: e.assist.name ?? '', relatedPlayer: e.player.name ?? undefined };
  }
  return null; // VAR decisions are ignored for now
}

function toNumber(v: number | string | null): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number.parseFloat(v.replace('%', '')) || 0;
}

function mapStatistics(stats: ApiTeamStatistics[] | undefined): MatchStatistic[] {
  if (!stats || stats.length < 2) return [];
  const [home, away] = stats;
  return home.statistics.flatMap((s): MatchStatistic[] => {
    const key = STAT_MAP[s.type];
    if (!key) return [];
    const awayValue = away.statistics.find((a) => a.type === s.type)?.value ?? null;
    return [
      {
        key,
        home: toNumber(s.value),
        away: toNumber(awayValue),
        isPercentage: typeof s.value === 'string' && s.value.endsWith('%'),
      },
    ];
  });
}

const POSITION_LINE: Record<string, number> = { G: 0, D: 1, M: 2, F: 3 };

/**
 * `/fixtures` line-ups don't include photos, but API-Football serves every player portrait at
 * a stable CDN path keyed by player id (404 when missing → the UI falls back to the number).
 */
export const playerPhotoUrl = (id: number) => `https://media.api-sports.io/football/players/${id}.png`;

function hex(value: string | null | undefined, fallback: string): string {
  return value && /^[0-9a-f]{6}$/i.test(value) ? `#${value}` : fallback;
}

function mapKit(
  k: { primary: string | null; number: string | null; border: string | null } | undefined,
  isKeeper: boolean,
): KitColors {
  return {
    background: hex(k?.primary, isKeeper ? '#FACC15' : '#FFFFFF'),
    number: hex(k?.number, '#0D1117'),
    border: hex(k?.border, '#00D084'),
  };
}

/** `grid` is "row:col" with row 1 = goalkeeper; falls back to the position letter. */
function mapLineup(l: ApiLineup, national: boolean): Lineup {
  const colors = l.team.colors ?? undefined;
  return {
    team: mapTeam(l.team, national),
    formation: l.formation ?? '',
    kit: colors ? { player: mapKit(colors.player, false), goalkeeper: mapKit(colors.goalkeeper, true) } : undefined,
    players: l.startXI.map(({ player }) => {
      const [row, col] = player.grid ? player.grid.split(':').map(Number) : [];
      return {
        id: player.id ?? undefined,
        number: player.number ?? 0,
        name: player.name,
        photo: player.photo ?? (player.id ? playerPhotoUrl(player.id) : undefined),
        line: row ? row - 1 : (POSITION_LINE[player.pos ?? ''] ?? 2),
        col: col || undefined,
      };
    }),
  };
}

export function mapFixtureDetails(f: ApiFixture): MatchDetails {
  const lineups =
    f.lineups?.length === 2 ? f.lineups.map((l) => mapLineup(l, isNationalTeamLeague(f.league.id))) : undefined;
  return {
    ...mapFixture(f),
    events: (f.events ?? []).map((e, i) => mapEvent(e, i, f)).filter((e): e is MatchEvent => e !== null),
    statistics: mapStatistics(f.statistics),
    // Only usable when BOTH starting XIs are present (the API returns [] before announcement).
    lineups: lineups && lineups.every((l) => l.players.length > 0) ? [lineups[0], lineups[1]] : undefined,
  };
}

export function mapLeague(e: ApiLeagueEntry): League {
  const current = e.seasons.find((s) => s.current) ?? e.seasons[e.seasons.length - 1];
  return {
    id: e.league.id,
    name: leagueNameAr(e.league.id, e.league.name),
    country: e.country.name,
    logo: e.league.logo,
    season: current?.year ?? new Date().getFullYear(),
  };
}

function zoneFromDescription(description: string | null): StandingRow['zone'] {
  if (!description) return undefined;
  const d = description.toLowerCase();
  if (d.includes('relegation')) return 'relegation';
  if (d.includes('champions')) return 'champions';
  if (d.includes('europa') || d.includes('conference')) return 'europa';
  return undefined;
}

function mapStandingRow(r: ApiStandingRow, national: boolean): StandingRow {
  return {
    rank: r.rank,
    team: mapTeam(r.team, national),
    played: r.all.played,
    won: r.all.win,
    drawn: r.all.draw,
    lost: r.all.lose,
    goalsFor: r.all.goals.for,
    goalsAgainst: r.all.goals.against,
    points: r.points,
    // API-Football's form string is most recent first; our model is most recent last.
    form: (r.form ?? '')
      .split('')
      .reverse()
      .filter((c): c is 'W' | 'D' | 'L' => c === 'W' || c === 'D' || c === 'L'),
    zone: zoneFromDescription(r.description),
  };
}

export function mapStandings(entry: ApiStandingsEntry | undefined, fallback: League): LeagueStandings {
  if (!entry) return { league: fallback, rows: [] };
  const { league } = entry;
  return {
    league: {
      id: league.id,
      name: leagueNameAr(league.id, league.name),
      country: league.country,
      logo: league.logo,
      season: league.season,
    },
    // Leagues with groups return several tables; v1 shows the first one.
    rows: (league.standings[0] ?? []).map((r) => mapStandingRow(r, isNationalTeamLeague(league.id))),
  };
}

const FINISHED = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);
export const isFinishedFixture = (f: ApiFixture) => FINISHED.has(f.fixture.status.short);

/** A finished fixture from `teamId`'s point of view. */
export function mapFormEntry(f: ApiFixture, teamId: number): FormEntry {
  const isHome = f.teams.home.id === teamId;
  const goalsFor = (isHome ? f.goals.home : f.goals.away) ?? 0;
  const goalsAgainst = (isHome ? f.goals.away : f.goals.home) ?? 0;
  // Penalty shoot-outs count as draws in the 90/120-minute result; use the API winner flag instead.
  const winner = (isHome ? f.teams.home : f.teams.away) as ApiTeam & { winner?: boolean | null };
  const result: FormEntry['result'] =
    winner.winner === true
      ? 'W'
      : winner.winner === false
        ? 'L'
        : goalsFor > goalsAgainst
          ? 'W'
          : goalsFor < goalsAgainst
            ? 'L'
            : 'D';
  return {
    matchId: f.fixture.id,
    result,
    opponent: mapTeam(isHome ? f.teams.away : f.teams.home, isNationalTeamLeague(f.league.id)),
    goalsFor,
    goalsAgainst,
    isHome,
    date: f.fixture.date,
  };
}

export function mapTopScorer(s: ApiTopScorer, index: number, national = false): TopScorer {
  const stat = s.statistics[0];
  return {
    rank: index + 1,
    name: s.player.name,
    photo: s.player.photo ?? undefined,
    team: mapTeam(stat.team, national),
    goals: stat.goals.total ?? 0,
    assists: stat.goals.assists ?? 0,
  };
}
