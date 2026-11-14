import type {
  FormEntry,
  Lineup,
  LineupPlayer,
  Match,
  MatchDetails,
  MatchEvent,
  MatchStatistic,
  StandingRow,
  Team,
} from '@/types/football';
import { clubLeagueOf, getClubMatchById, stadiumOf } from './clubLeagues';
import { getNationsLeagueMatchById, goalTimeline, hashString, nationalTeams, rng } from './nationsLeague';
import { mockStandings } from './standings';

/**
 * Deterministic demo details for generated fixtures: venue, channel, referee, events, line-ups,
 * group table, top scorers. Player and referee names are FICTIONAL placeholders.
 */

const CITY: Record<string, string> = {
  GEO: 'تبليسي',
  HUN: 'بودابست',
  NOR: 'أوسلو',
  WAL: 'كارديف',
  UKR: 'كييف',
  NIR: 'بلفاست',
  AUT: 'فيينا',
  IRL: 'دبلن',
  ROU: 'بوخارست',
  POL: 'وارسو',
  SWE: 'ستوكهولم',
  BIH: 'زينيتسا',
  POR: 'لشبونة',
  DEN: 'كوبنهاغن',
  ESP: 'مدريد',
  FRA: 'باريس',
  GER: 'برلين',
  ENG: 'لندن',
  ITA: 'روما',
  NED: 'أمستردام',
  BEL: 'بروكسل',
  CRO: 'زغرب',
  SUI: 'برن',
  SCO: 'غلاسكو',
  TUR: 'إسطنبول',
  CZE: 'براغ',
  SRB: 'بلغراد',
  GRE: 'أثينا',
};

/**
 * Broadcast + officiating per competition. Channels are the real rights holders in the region;
 * commentator and referee names are FICTIONAL (no API provides commentators).
 */
interface Broadcast {
  channels: string[];
  commentators: string[];
  referees: [name: string, country: string][];
}

const DEFAULT_BROADCAST: Broadcast = {
  channels: ['beIN Sports 1 HD', 'beIN Sports 2 HD', 'beIN Sports 3 HD', 'beIN Sports MAX 1'],
  commentators: ['سامر العلي', 'يوسف الهاشمي', 'نبيل الشامي', 'طارق السيد'],
  referees: [
    ['أندريه ماركوفيتش', 'صربيا'],
    ['توماس بيرغر', 'ألمانيا'],
    ['لوكا فيراري', 'إيطاليا'],
    ['دانيال كوفاتش', 'كرواتيا'],
    ['ماتياس هولم', 'السويد'],
    ['رافائيل مونتيرو', 'البرتغال'],
  ],
};

const BROADCAST: Record<number, Broadcast> = {
  // Saudi Pro League
  307: {
    channels: ['SSC 1 HD', 'SSC 2 HD', 'SSC 3 HD', 'SSC 5 HD'],
    commentators: ['فهد المطيري', 'عبدالله الحربي', 'ماجد القحطاني', 'سلطان الشهري'],
    referees: [
      ['خالد الزهراني', 'السعودية'],
      ['ماجد العتيبي', 'السعودية'],
      ['تركي الغامدي', 'السعودية'],
      ['ستيفان ويلسون', 'إنجلترا'],
    ],
  },
  // Premier League
  39: {
    channels: ['beIN Sports 1 HD', 'beIN Sports 2 HD', 'beIN Sports Premium 1'],
    commentators: ['سامر العلي', 'حسن الدوري', 'رامي السيد'],
    referees: [
      ['جيمس هارفي', 'إنجلترا'],
      ['مارك ويليامسون', 'إنجلترا'],
      ['بول كارتر', 'إنجلترا'],
      ['ديفيد تيرنر', 'إنجلترا'],
    ],
  },
  // La Liga
  140: {
    channels: ['beIN Sports 3 HD', 'beIN Sports 4 HD', 'beIN Sports Premium 2'],
    commentators: ['يوسف الهاشمي', 'نبيل الشامي', 'علي التونسي'],
    referees: [
      ['خافيير مارتين', 'إسبانيا'],
      ['كارلوس رويث', 'إسبانيا'],
      ['ألبرتو غوميث', 'إسبانيا'],
      ['سيرخيو مورينو', 'إسبانيا'],
    ],
  },
};

const INITIALS = ['أ', 'م', 'ك', 'ل', 'ج', 'د', 'ر', 'س', 'ت', 'ف', 'ن', 'ي'];
const SURNAMES = [
  'هانسن',
  'كوفاتش',
  'نيلسن',
  'بيتروف',
  'شميدت',
  'دوبوا',
  'سيلفا',
  'نوفاك',
  'ليندبرغ',
  'مارتينيز',
  'كيلر',
  'بيرسون',
  'ياكوبوفسكي',
  'هورفات',
  'أندرسون',
  'فيشر',
  'مولر',
  'رادو',
  'كوستا',
  'ويليامز',
  'بالدور',
  'غرين',
  'سوريا',
  'فان دايك',
  'ستويكوف',
  'إيفانوف',
  'بايك',
  'مورا',
  'لارسن',
  'دياز',
];

/** 18-man fictional squad, stable per team. */
function squad(team: Team): string[] {
  const rand = rng(hashString(`squad:${team.id}`));
  const pool = [...SURNAMES];
  const names: string[] = [];
  while (names.length < 18) {
    const s = pool.splice(Math.floor(rand() * pool.length), 1)[0] ?? SURNAMES[names.length];
    names.push(`${INITIALS[Math.floor(rand() * INITIALS.length)]}. ${s}`);
  }
  return names;
}

const FORMATIONS: Record<string, number[]> = {
  '4-3-3': [4, 3, 3],
  '4-2-3-1': [4, 2, 3, 1],
  '3-5-2': [3, 5, 2],
  '4-4-2': [4, 4, 2],
};

function lineup(team: Team): Lineup {
  const names = squad(team);
  const keys = Object.keys(FORMATIONS);
  const formation = keys[hashString(`f:${team.id}`) % keys.length];
  const players: LineupPlayer[] = [{ number: 1, name: names[0], line: 0 }];
  const numbers = [2, 3, 4, 5, 6, 8, 7, 10, 9, 11, 14, 16, 18, 19, 21, 23];
  let i = 1;
  FORMATIONS[formation].forEach((count, row) => {
    for (let k = 0; k < count; k++, i++) players.push({ number: numbers[i - 1], name: names[i], line: row + 1 });
  });
  // Squad 11–17 = bench (11 is the reserve keeper).
  const benchNumbers = [12, 14, 16, 18, 19, 21, 23];
  const substitutes = names.slice(11, 18).map((name, k) => ({ number: benchNumbers[k], name, goalkeeper: k === 0 }));
  return { team, formation, players, substitutes, coach: coachOf(team) };
}

// Fictional head coaches, stable per team.
const COACHES = [
  'كارلوس مينديز',
  'ماركو روسي',
  'يوهان ليندكفيست',
  'بيتر هوفمان',
  'أنطوان لوران',
  'ميغيل سانتوس',
  'ستيفان نوفاك',
  'رونالد فيرمير',
  'سعد الشهري',
  'جورج أندرسون',
  'إنريكي بالما',
  'توماس كلاين',
];
const coachOf = (team: Team) => COACHES[hashString(`coach:${team.id}`) % COACHES.length];

/** Goals, cards and substitutions consistent with the match score/minute. */
function events(match: Match): MatchEvent[] {
  if (match.status === 'scheduled') return [];
  const nowMinute = match.status === 'finished' ? 90 : (match.minute ?? 0);
  const goals = goalTimeline(match.id);
  const rand = rng(hashString(`ev:${match.id}`));
  const home = squad(match.homeTeam);
  const away = squad(match.awayTeam);
  // Forwards / attacking midfielders of the starting XI (squad indices 8–10).
  const scorer = (names: string[]) => names[8 + Math.floor(rand() * 3)];
  const list: MatchEvent[] = [];
  let seq = 0;
  const push = (e: Omit<MatchEvent, 'id'>) => e.minute <= nowMinute && list.push({ ...e, id: `${match.id}-${++seq}` });

  goals.home.forEach((m) =>
    push({
      minute: m,
      type: 'goal',
      teamId: match.homeTeam.id,
      player: scorer(home),
      relatedPlayer: home[5],
    }),
  );
  goals.away.forEach((m) =>
    push({
      minute: m,
      type: 'goal',
      teamId: match.awayTeam.id,
      player: scorer(away),
      relatedPlayer: away[6],
    }),
  );
  for (let k = 0; k < 3; k++) {
    const isHome = rand() < 0.5;
    const names = isHome ? home : away;
    push({
      minute: 10 + Math.floor(rand() * 75),
      type: 'yellow_card',
      teamId: (isHome ? match.homeTeam : match.awayTeam).id,
      player: names[1 + Math.floor(rand() * 9)],
    });
  }
  push({
    minute: 62,
    type: 'substitution',
    teamId: match.homeTeam.id,
    player: home[12],
    relatedPlayer: home[9],
  });
  push({
    minute: 70,
    type: 'substitution',
    teamId: match.awayTeam.id,
    player: away[13],
    relatedPlayer: away[10],
  });
  return list.sort((a, b) => a.minute - b.minute);
}

export function getMatchDetails(id: number, now: Date = new Date()): MatchDetails | null {
  const match = getNationsLeagueMatchById(id, now) ?? getClubMatchById(id, now);
  if (!match) return null;
  const rand = rng(hashString(`info:${id}`));
  const stadium = stadiumOf(match.homeTeam);
  const broadcast = BROADCAST[match.league.id] ?? DEFAULT_BROADCAST;
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  const [referee, refereeCountry] = pick(broadcast.referees);
  return {
    ...match,
    venue: stadium?.venue ?? 'الملعب الوطني',
    venueCity: stadium?.city ?? CITY[match.homeTeam.shortName] ?? match.homeTeam.name,
    channel: pick(broadcast.channels),
    commentator: pick(broadcast.commentators),
    referee,
    refereeCountry,
    // League / group-stage games have no first leg: the card shows "—".
    firstLeg: undefined,
    events: events(match),
    statistics: statistics(match),
    // Like the real API: no line-ups until ~60 minutes before kick-off.
    lineups:
      match.status !== 'scheduled' || new Date(match.kickoff).getTime() - now.getTime() <= 60 * 60_000
        ? [lineup(match.homeTeam), lineup(match.awayTeam)]
        : undefined,
  };
}

/** Group table for the match's group: both teams plus two deterministic group rivals. */
export function getGroupTable(match: Match): StandingRow[] {
  // Club fixtures: the league's own mock table.
  const leagueTable = mockStandings.find((s) => s.league.id === match.league.id);
  if (leagueTable) return leagueTable.rows;
  const pool = Object.values(nationalTeams).filter((t) => t.id !== match.homeTeam.id && t.id !== match.awayTeam.id);
  const rand = rng(hashString(`group:${Math.min(match.homeTeam.id, match.awayTeam.id)}`));
  const others = [pool[Math.floor(rand() * pool.length)]];
  while (others.length < 2) {
    const t = pool[Math.floor(rand() * pool.length)];
    if (!others.includes(t)) others.push(t);
  }
  const rows = [match.homeTeam, match.awayTeam, ...others].map((team) => {
    const won = Math.floor(rand() * 4);
    const drawn = Math.floor(rand() * (5 - won));
    const lost = 5 - won - drawn;
    const goalsFor = won * 2 + drawn + Math.floor(rand() * 3);
    const goalsAgainst = lost * 2 + drawn + Math.floor(rand() * 2);
    const form = Array.from({ length: 5 }, () => (['W', 'D', 'L'] as const)[Math.floor(rand() * 3)]);
    return {
      team,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      played: 5,
      points: won * 3 + drawn,
      form,
      rank: 0,
    };
  });
  return rows
    .sort((a, b) => b.points - a.points || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst))
    .map((r, i) => ({
      ...r,
      rank: i + 1,
      zone: i === 0 ? 'champions' : i === 3 ? 'relegation' : undefined,
    }));
}

export interface Scorer {
  rank: number;
  name: string;
  team: Team;
  goals: number;
  assists: number;
}

/** Competition top scorers (fictional names). Club leagues use their own teams. */
export function getTopScorers(leagueId?: number): Scorer[] {
  const club = mockStandings.find((s) => s.league.id === leagueId);
  if (club) {
    const rand = rng(hashString(`scorers:${leagueId}`));
    // Two forwards per club, ranked by goals; better-placed clubs score a little more.
    return club.rows
      .flatMap((row) =>
        [9, 10].map((k) => ({
          team: row.team,
          name: squad(row.team)[k],
          strength: 9 - row.rank,
        })),
      )
      .map((p) => ({
        ...p,
        goals: Math.max(1, Math.round(p.strength * 0.8 + rand() * 6)),
        assists: Math.floor(rand() * 6),
      }))
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, 10)
      .map(({ team, name, goals, assists }, i) => ({
        rank: i + 1,
        name,
        team,
        goals,
        assists,
      }));
  }
  // One scorer per team (shuffled), so names never repeat.
  const teams = [...Object.values(nationalTeams)];
  const rand = rng(hashString('scorers'));
  for (let i = teams.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [teams[i], teams[j]] = [teams[j], teams[i]];
  }
  return teams.slice(0, 10).map((team, i) => ({
    rank: i + 1,
    name: squad(team)[9 + (i % 3)],
    team,
    goals: 7 - Math.floor(i * 0.6),
    assists: Math.floor(rand() * 4),
  }));
}

// ───────────── Community comments ─────────────

export interface CommentReply {
  id: string;
  user: string;
  text: string;
  createdAt: number;
}

export interface MatchComment {
  id: string;
  user: string;
  text: string;
  likes: number;
  dislikes: number;
  createdAt: number;
  replies: CommentReply[];
}

const USERS = ['أبو فهد', 'سارة_10', 'كابتن ماجد', 'نجم الشمال', 'محمد ع.', 'ليلى', 'عاشق الكرة', 'يوسف 7'];
const TEXTS = [
  'مباراة مهمة جداً للمجموعة، أتوقع فوز أصحاب الأرض بهدف نظيف.',
  'خط الوسط هو مفتاح المباراة اليوم، من يسيطر عليه يفوز.',
  'التشكيلة المتوقعة ممتازة لكن أتمنى إشراك المهاجم الشاب.',
  'الحكم يجب أن يكون حازماً من البداية، المباراة ستكون عصبية.',
  'أتوقع تعادل إيجابي 2-2 ومباراة مفتوحة.',
  'الدفاع ارتكب أخطاء كثيرة في المباراة الماضية، أتمنى أن يتحسن.',
  'جمهور الملعب سيصنع الفارق الليلة 🔥',
  'من أقوى مباريات الجولة بلا شك.',
];

export function seedComments(matchId: number): MatchComment[] {
  const rand = rng(hashString(`comments:${matchId}`));
  const now = Date.now();
  return Array.from({ length: 6 }, (_, i) => {
    const replies: CommentReply[] =
      rand() < 0.4
        ? [
            {
              id: `${matchId}-r${i}`,
              user: USERS[(i + 3) % USERS.length],
              text: 'أتفق معك تماماً 👍',
              createdAt: now - (i + 1) * 300_000,
            },
          ]
        : [];
    return {
      id: `${matchId}-c${i}`,
      user: USERS[Math.floor(rand() * USERS.length)],
      text: TEXTS[(i + Math.floor(rand() * TEXTS.length)) % TEXTS.length],
      likes: Math.floor(rand() * 120),
      dislikes: Math.floor(rand() * 15),
      createdAt: now - (i + 1) * 17 * 60_000,
      replies,
    };
  });
}

// ───────────── Statistics / form / head-to-head ─────────────

/** Match statistics scaled to how far the match has progressed. */
function statistics(match: Match): MatchStatistic[] {
  if (match.status === 'scheduled') return [];
  const rand = rng(hashString(`stats:${match.id}`));
  const progress = match.status === 'finished' ? 1 : Math.max(0.1, (match.minute ?? 45) / 90);
  const n = (max: number) => Math.round((max * 0.4 + rand() * max * 0.6) * progress);
  const possession = 38 + Math.floor(rand() * 25);
  const shotsH = n(16);
  const shotsA = n(14);
  const passesH = n(560);
  const passesA = n(520);
  return [
    {
      key: 'possession',
      home: possession,
      away: 100 - possession,
      isPercentage: true,
    },
    { key: 'shots_total', home: shotsH, away: shotsA },
    {
      key: 'shots_on_target',
      home: Math.min(shotsH, n(7)),
      away: Math.min(shotsA, n(6)),
    },
    { key: 'corners', home: n(8), away: n(7) },
    { key: 'fouls', home: n(15), away: n(15) },
    { key: 'offsides', home: n(4), away: n(4) },
    { key: 'yellow_cards', home: n(3), away: n(3) },
    { key: 'passes', home: passesH, away: passesA },
    {
      key: 'pass_accuracy',
      home: 74 + Math.floor(rand() * 18),
      away: 72 + Math.floor(rand() * 18),
      isPercentage: true,
    },
  ];
}

const DAY = 86_400_000;

/** Last 5 results of a team against random pool opponents. */
export function getMockForm(teamId: number): FormEntry[] {
  const pool = (clubLeagueOf(teamId)?.teams ?? Object.values(nationalTeams)).filter((t) => t.id !== teamId);
  const rand = rng(hashString(`form:${teamId}`));
  const base = new Date(2026, 10, 10).getTime();
  return Array.from({ length: 5 }, (_, i) => {
    const goalsFor = Math.floor(rand() * 4);
    const goalsAgainst = Math.floor(rand() * 3);
    return {
      matchId: teamId * 10 + i,
      result: goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D',
      opponent: pool[Math.floor(rand() * pool.length)],
      goalsFor,
      goalsAgainst,
      isHome: rand() < 0.5,
      date: new Date(base - i * 31 * DAY).toISOString(),
    };
  });
}

/** Previous meetings (finished), newest first. */
export function getMockHeadToHead(home: Team, away: Team): Match[] {
  const rand = rng(hashString(`h2h:${Math.min(home.id, away.id)}-${Math.max(home.id, away.id)}`));
  const count = 4 + Math.floor(rand() * 5);
  const base = new Date(2026, 5, 1).getTime();
  const club = clubLeagueOf(home.id)?.league;
  return Array.from({ length: count }, (_, i) => {
    const swap = rand() < 0.5;
    return {
      id: -(home.id * 1000 + away.id + i),
      league: club
        ? { ...club, season: 2026 - i }
        : {
            id: 5,
            name: i % 3 === 0 ? 'مباراة ودية' : 'دوري الأمم الأوروبية',
            country: 'أوروبا',
            season: 2026 - i,
          },
      homeTeam: swap ? away : home,
      awayTeam: swap ? home : away,
      kickoff: new Date(base - i * 230 * DAY).toISOString(),
      status: 'finished' as const,
      phase: 'finished' as const,
      score: { home: Math.floor(rand() * 4), away: Math.floor(rand() * 3) },
    };
  });
}
