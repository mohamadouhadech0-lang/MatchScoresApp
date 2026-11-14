import type { League, Match, MatchPhase, MatchStatus, Team } from '@/types/football';

/**
 * Mock UEFA Nations League fixtures, generated for any calendar day.
 *
 * - Today's (14/11/2026) card list is fixed, matching the design.
 * - Other days get a deterministic selection of fixtures (same date → same matches).
 * - Status/score are derived from the current time, so a match turns "live" at kick-off
 *   and its score evolves as minutes pass.
 */

export const nationsLeague: League = {
  id: 5,
  name: 'دوري الأمم الأوروبية',
  country: 'أوروبا',
  season: 2026,
};

const flag = (code: string) => `https://flagcdn.com/w160/${code}.png`;
const nt = (id: number, name: string, shortName: string, code: string, color: string): Team => ({
  id,
  name,
  shortName,
  logo: flag(code),
  color,
  national: true,
});

// IDs mirror API-Football national team IDs where known.
export const nationalTeams = {
  georgia: nt(1104, 'جورجيا', 'GEO', 'ge', '#DC2626'),
  hungary: nt(769, 'المجر', 'HUN', 'hu', '#16A34A'),
  norway: nt(1090, 'النرويج', 'NOR', 'no', '#B91C1C'),
  wales: nt(767, 'ويلز', 'WAL', 'gb-wls', '#C8102E'),
  ukraine: nt(772, 'أوكرانيا', 'UKR', 'ua', '#2563EB'),
  northernIreland: nt(771, 'أيرلندا الشمالية', 'NIR', 'gb-nir', '#15803D'),
  austria: nt(775, 'النمسا', 'AUT', 'at', '#DC2626'),
  ireland: nt(776, 'أيرلندا', 'IRL', 'ie', '#16A34A'),
  romania: nt(774, 'رومانيا', 'ROU', 'ro', '#EAB308'),
  poland: nt(24, 'بولندا', 'POL', 'pl', '#DC2626'),
  sweden: nt(5, 'السويد', 'SWE', 'se', '#2563EB'),
  bosnia: nt(1113, 'البوسنة', 'BIH', 'ba', '#1D4ED8'),
  portugal: nt(27, 'البرتغال', 'POR', 'pt', '#B91C1C'),
  denmark: nt(21, 'الدنمارك', 'DEN', 'dk', '#C8102E'),
  spain: nt(9, 'إسبانيا', 'ESP', 'es', '#C60B1E'),
  france: nt(2, 'فرنسا', 'FRA', 'fr', '#1D4ED8'),
  germany: nt(25, 'ألمانيا', 'GER', 'de', '#111827'),
  england: nt(10, 'إنجلترا', 'ENG', 'gb-eng', '#E5E7EB'),
  italy: nt(768, 'إيطاليا', 'ITA', 'it', '#1D4ED8'),
  netherlands: nt(1118, 'هولندا', 'NED', 'nl', '#F97316'),
  belgium: nt(1, 'بلجيكا', 'BEL', 'be', '#DC2626'),
  croatia: nt(3, 'كرواتيا', 'CRO', 'hr', '#DC2626'),
  switzerland: nt(15, 'سويسرا', 'SUI', 'ch', '#DC2626'),
  scotland: nt(1108, 'اسكتلندا', 'SCO', 'gb-sct', '#1D4ED8'),
  turkey: nt(777, 'تركيا', 'TUR', 'tr', '#DC2626'),
  czechia: nt(770, 'التشيك', 'CZE', 'cz', '#1D4ED8'),
  serbia: nt(14, 'صربيا', 'SRB', 'rs', '#B91C1C'),
  greece: nt(1117, 'اليونان', 'GRE', 'gr', '#2563EB'),
} satisfies Record<string, Team>;

const N = nationalTeams;

/**
 * Illustrative FIFA ranking positions for the demo (not live official rankings).
 * Keyed by team short code.
 */
const FIFA_RANK: Record<string, number> = {
  ESP: 1,
  FRA: 2,
  ENG: 4,
  POR: 6,
  NED: 7,
  BEL: 8,
  ITA: 9,
  GER: 10,
  CRO: 11,
  SUI: 17,
  DEN: 21,
  AUT: 22,
  UKR: 27,
  TUR: 29,
  POL: 35,
  SRB: 36,
  SWE: 42,
  HUN: 37,
  CZE: 41,
  WAL: 33,
  SCO: 44,
  NOR: 40,
  GRE: 45,
  ROU: 47,
  IRL: 60,
  BIH: 74,
  GEO: 77,
  NIR: 76,
};
for (const team of Object.values(N)) {
  (team as Team).fifaRank = FIFA_RANK[team.shortName];
}

type Fixture = [home: Team, away: Team, hour: number, minute: number];

/** The fixed card list shown on 14/11/2026 (Saturday). */
const FEATURED_DAY = '2026-11-14';
const featuredFixtures: Fixture[] = [
  [N.georgia, N.hungary, 17, 0],
  [N.ukraine, N.northernIreland, 17, 0],
  [N.norway, N.wales, 19, 45],
  [N.austria, N.ireland, 19, 45],
  [N.romania, N.poland, 19, 45],
  [N.sweden, N.bosnia, 19, 45],
  [N.portugal, N.denmark, 19, 45],
];

const MATCH_LENGTH_MIN = 115; // 90 + half-time + stoppage

export { rng, hashString };

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Fixtures for any non-featured day: 0–6 matches picked from the national team pool. */
function generatedFixtures(key: string): Fixture[] {
  const rand = rng(hashString(key));
  // Roughly one day in four has no Nations League games.
  if (rand() < 0.25) return [];
  const pool = Object.values(N);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = 3 + Math.floor(rand() * 4);
  const slots: [number, number][] = [
    [17, 0],
    [19, 45],
    [21, 45],
  ];
  const fixtures: Fixture[] = [];
  for (let i = 0; i < count; i++) {
    const [h, m] = slots[Math.floor(rand() * slots.length)];
    fixtures.push([pool[i * 2], pool[i * 2 + 1], h, m]);
  }
  return fixtures.sort((a, b) => a[2] * 60 + a[3] - (b[2] * 60 + b[3]));
}

/** Goal minutes for each side, deterministic per match. */
export function goalTimeline(matchId: number): {
  home: number[];
  away: number[];
} {
  const rand = rng(matchId);
  const goals = (max: number) =>
    Array.from({ length: Math.floor(rand() * (max + 1)) }, () => 1 + Math.floor(rand() * 90)).sort((a, b) => a - b);
  return { home: goals(3), away: goals(2) };
}

/** Converts elapsed real minutes since kick-off into a match clock + phase. */
function clock(elapsed: number): { minute: number; phase: MatchPhase } {
  if (elapsed < 45) return { minute: Math.max(1, elapsed + 1), phase: 'first_half' };
  if (elapsed < 48) return { minute: 45, phase: 'first_half' }; // stoppage time
  if (elapsed < 63) return { minute: 45, phase: 'half_time' };
  return { minute: Math.min(90, elapsed - 63 + 46), phase: 'second_half' };
}

/**
 * Status / clock / score of a generated match at `now`, from its kick-off and deterministic goal
 * minutes. Shared by every mock competition so live matches tick the same way.
 */
export function matchState(
  id: number,
  kickoff: Date,
  now: Date,
): {
  status: MatchStatus;
  phase: MatchPhase;
  minute?: number;
  score: Match['score'];
} {
  const elapsed = Math.floor((now.getTime() - kickoff.getTime()) / 60_000);
  const goals = goalTimeline(id);
  if (elapsed >= MATCH_LENGTH_MIN) {
    return {
      status: 'finished',
      phase: 'finished',
      score: { home: goals.home.length, away: goals.away.length },
    };
  }
  if (elapsed >= 0) {
    const c = clock(elapsed);
    return {
      status: 'live',
      phase: c.phase,
      minute: c.minute,
      score: {
        home: goals.home.filter((m) => m <= c.minute).length,
        away: goals.away.filter((m) => m <= c.minute).length,
      },
    };
  }
  return {
    status: 'scheduled',
    phase: 'not_started',
    score: { home: null, away: null },
  };
}

export function getNationsLeagueMatches(date: Date, now: Date = new Date()): Match[] {
  const key = dayKey(date);
  const fixtures = key === FEATURED_DAY ? featuredFixtures : generatedFixtures(key);
  const dateNum = Number(key.replace(/-/g, ''));

  return fixtures.map(([homeTeam, awayTeam, hour, minute], index) => {
    const id = dateNum * 100 + index;
    const kickoff = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
    const { status, phase, minute: matchMinute, score } = matchState(id, kickoff, now);

    return {
      id,
      league: nationsLeague,
      homeTeam,
      awayTeam,
      kickoff: kickoff.toISOString(),
      status,
      phase,
      minute: matchMinute,
      score,
      round: 'الجولة 6',
    };
  });
}

/** Finds a generated fixture from its id (`YYYYMMDD * 100 + index`). */
export function getNationsLeagueMatchById(id: number, now: Date = new Date()): Match | null {
  const dateNum = Math.floor(id / 100);
  const y = Math.floor(dateNum / 10000);
  const m = Math.floor((dateNum % 10000) / 100) - 1;
  const d = dateNum % 100;
  if (!y || m < 0 || m > 11 || d < 1 || d > 31) return null;
  return getNationsLeagueMatches(new Date(y, m, d), now).find((match) => match.id === id) ?? null;
}
