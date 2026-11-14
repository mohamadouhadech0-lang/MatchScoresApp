import type { League, MatchDetails, MatchEvent, MatchStatistic, Team } from '@/types/football';
import { leagues, teams } from './teams';

/**
 * Builds today's fixtures relative to the current time so the demo always looks "live".
 * `liveSince` records when the mock was created so live minutes advance between refreshes.
 */

export const liveSince = Date.now();

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

function hoursFromNow(h: number): string {
  const d = new Date(Date.now() + h * 3_600_000);
  d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0);
  return d.toISOString();
}

let eventSeq = 0;
const ev = (
  minute: number,
  type: MatchEvent['type'],
  team: Team,
  player: string,
  relatedPlayer?: string,
  extraMinute?: number,
): MatchEvent => ({ id: `e${++eventSeq}`, minute, type, teamId: team.id, player, relatedPlayer, extraMinute });

type StatTuple = [home: number, away: number];
function stats(s: {
  possession: StatTuple;
  shots: StatTuple;
  onTarget: StatTuple;
  corners: StatTuple;
  fouls: StatTuple;
  offsides: StatTuple;
  yellow: StatTuple;
  red: StatTuple;
  passes: StatTuple;
  accuracy: StatTuple;
}): MatchStatistic[] {
  return [
    { key: 'possession', home: s.possession[0], away: s.possession[1], isPercentage: true },
    { key: 'shots_total', home: s.shots[0], away: s.shots[1] },
    { key: 'shots_on_target', home: s.onTarget[0], away: s.onTarget[1] },
    { key: 'corners', home: s.corners[0], away: s.corners[1] },
    { key: 'fouls', home: s.fouls[0], away: s.fouls[1] },
    { key: 'offsides', home: s.offsides[0], away: s.offsides[1] },
    { key: 'yellow_cards', home: s.yellow[0], away: s.yellow[1] },
    { key: 'red_cards', home: s.red[0], away: s.red[1] },
    { key: 'passes', home: s.passes[0], away: s.passes[1] },
    { key: 'pass_accuracy', home: s.accuracy[0], away: s.accuracy[1], isPercentage: true },
  ];
}

function match(
  id: number,
  league: League,
  homeTeam: Team,
  awayTeam: Team,
  rest: Omit<MatchDetails, 'id' | 'league' | 'homeTeam' | 'awayTeam' | 'events' | 'statistics'> &
    Partial<Pick<MatchDetails, 'events' | 'statistics'>>,
): MatchDetails {
  return { id, league, homeTeam, awayTeam, events: [], statistics: [], ...rest };
}

const { saudi, premier, laliga } = leagues;
const T = teams;

export const mockMatches: MatchDetails[] = [
  // ───────────── دوري روشن ─────────────
  match(1001, saudi, T.hilal, T.nassr, {
    kickoff: minutesAgo(82),
    status: 'live',
    phase: 'second_half',
    minute: 67,
    score: { home: 2, away: 1 },
    venue: 'المملكة أرينا، الرياض',
    referee: 'مايكل أوليفر',
    round: 'الجولة 11',
    events: [
      ev(12, 'goal', T.hilal, 'سالم الدوسري', 'روبن نيفيز'),
      ev(28, 'yellow_card', T.nassr, 'مارسيلو بروزوفيتش'),
      ev(39, 'penalty_goal', T.nassr, 'كريستيانو رونالدو'),
      ev(45, 'yellow_card', T.hilal, 'كاليدو كوليبالي', undefined, 2),
      ev(58, 'goal', T.hilal, 'ألكسندر ميتروفيتش', 'مالكوم'),
      ev(63, 'substitution', T.nassr, 'عبدالله الخيبري', 'أوتافيو'),
    ],
    statistics: stats({
      possession: [54, 46],
      shots: [11, 8],
      onTarget: [5, 3],
      corners: [6, 3],
      fouls: [9, 12],
      offsides: [2, 1],
      yellow: [1, 1],
      red: [0, 0],
      passes: [412, 351],
      accuracy: [87, 83],
    }),
  }),
  match(1002, saudi, T.ittihad, T.ahli, {
    kickoff: hoursFromNow(3),
    status: 'scheduled',
    phase: 'not_started',
    score: { home: null, away: null },
    venue: 'ملعب الإنماء، جدة',
    round: 'الجولة 11',
  }),
  match(1003, saudi, T.shabab, T.qadsiah, {
    kickoff: minutesAgo(190),
    status: 'finished',
    phase: 'finished',
    score: { home: 0, away: 0 },
    venue: 'ملعب الشباب، الرياض',
    referee: 'خالد الطريس',
    round: 'الجولة 11',
    events: [
      ev(34, 'yellow_card', T.qadsiah, 'ناتشو فرنانديز'),
      ev(61, 'substitution', T.shabab, 'محمد الشويرخ', 'كاراسكو'),
      ev(77, 'missed_penalty', T.shabab, 'عبدالرزاق حمدالله'),
      ev(88, 'red_card', T.qadsiah, 'جهاد ذكري'),
    ],
    statistics: stats({
      possession: [48, 52],
      shots: [13, 9],
      onTarget: [3, 2],
      corners: [7, 4],
      fouls: [14, 16],
      offsides: [3, 2],
      yellow: [2, 3],
      red: [0, 1],
      passes: [380, 405],
      accuracy: [81, 84],
    }),
  }),

  // ───────────── الدوري الإنجليزي ─────────────
  match(2001, premier, T.liverpool, T.arsenal, {
    kickoff: minutesAgo(50),
    status: 'live',
    phase: 'half_time',
    minute: 45,
    score: { home: 1, away: 1 },
    venue: 'أنفيلد، ليفربول',
    referee: 'أنتوني تايلور',
    round: 'الجولة 12',
    events: [
      ev(9, 'goal', T.arsenal, 'بوكايو ساكا', 'مارتن أوديغارد'),
      ev(22, 'yellow_card', T.arsenal, 'ديكلان رايس'),
      ev(41, 'goal', T.liverpool, 'محمد صلاح', 'ترينت ألكسندر أرنولد'),
    ],
    statistics: stats({
      possession: [51, 49],
      shots: [7, 6],
      onTarget: [3, 2],
      corners: [4, 2],
      fouls: [5, 7],
      offsides: [1, 2],
      yellow: [0, 1],
      red: [0, 0],
      passes: [264, 251],
      accuracy: [86, 85],
    }),
  }),
  match(2002, premier, T.mancity, T.chelsea, {
    kickoff: minutesAgo(240),
    status: 'finished',
    phase: 'finished',
    score: { home: 3, away: 1 },
    venue: 'ملعب الاتحاد، مانشستر',
    referee: 'سيمون هوبر',
    round: 'الجولة 12',
    events: [
      ev(18, 'goal', T.mancity, 'إرلينغ هالاند', 'كيفن دي بروين'),
      ev(33, 'yellow_card', T.chelsea, 'مويسيس كايسيدو'),
      ev(52, 'goal', T.chelsea, 'كول بالمر'),
      ev(64, 'goal', T.mancity, 'فيل فودين', 'رودري'),
      ev(70, 'substitution', T.chelsea, 'نيكولاس جاكسون', 'كريستوفر نكونكو'),
      ev(90, 'goal', T.mancity, 'إرلينغ هالاند', undefined, 3),
    ],
    statistics: stats({
      possession: [63, 37],
      shots: [18, 7],
      onTarget: [8, 3],
      corners: [9, 2],
      fouls: [8, 13],
      offsides: [1, 3],
      yellow: [0, 1],
      red: [0, 0],
      passes: [642, 371],
      accuracy: [92, 82],
    }),
  }),
  match(2003, premier, T.newcastle, T.tottenham, {
    kickoff: hoursFromNow(2),
    status: 'scheduled',
    phase: 'not_started',
    score: { home: null, away: null },
    venue: 'سانت جيمس بارك، نيوكاسل',
    round: 'الجولة 12',
  }),
  match(2004, premier, T.villa, T.manutd, {
    kickoff: hoursFromNow(4.5),
    status: 'scheduled',
    phase: 'not_started',
    score: { home: null, away: null },
    venue: 'فيلا بارك، برمنغهام',
    round: 'الجولة 12',
  }),

  // ───────────── الدوري الإسباني ─────────────
  match(3001, laliga, T.atletico, T.sevilla, {
    kickoff: minutesAgo(25),
    status: 'live',
    phase: 'first_half',
    minute: 23,
    score: { home: 0, away: 0 },
    venue: 'ميتروبوليتانو، مدريد',
    referee: 'خيسوس خيل مانزانو',
    round: 'الجولة 13',
    events: [ev(17, 'yellow_card', T.sevilla, 'نيمانيا غوديلي')],
    statistics: stats({
      possession: [58, 42],
      shots: [4, 1],
      onTarget: [1, 0],
      corners: [2, 0],
      fouls: [3, 5],
      offsides: [1, 0],
      yellow: [0, 1],
      red: [0, 0],
      passes: [141, 98],
      accuracy: [85, 79],
    }),
  }),
  match(3002, laliga, T.realmadrid, T.barcelona, {
    kickoff: hoursFromNow(5),
    status: 'scheduled',
    phase: 'not_started',
    score: { home: null, away: null },
    venue: 'سانتياغو برنابيو، مدريد',
    round: 'الجولة 13',
  }),
  match(3003, laliga, T.bilbao, T.sociedad, {
    kickoff: minutesAgo(300),
    status: 'finished',
    phase: 'finished',
    score: { home: 2, away: 2 },
    venue: 'سان ماميس، بلباو',
    referee: 'ماتيو لاهوز',
    round: 'الجولة 13',
    events: [
      ev(7, 'goal', T.sociedad, 'ميكيل أويارزابال'),
      ev(26, 'goal', T.bilbao, 'نيكو ويليامز', 'إينياكي ويليامز'),
      ev(49, 'own_goal', T.bilbao, 'يويري بيريناغيتسيا'),
      ev(55, 'yellow_card', T.bilbao, 'دانيال فيفيان'),
      ev(81, 'goal', T.sociedad, 'تاكيفوسا كوبو', 'برايس منديز'),
    ],
    statistics: stats({
      possession: [47, 53],
      shots: [12, 14],
      onTarget: [5, 6],
      corners: [5, 6],
      fouls: [11, 10],
      offsides: [2, 2],
      yellow: [1, 0],
      red: [0, 0],
      passes: [398, 446],
      accuracy: [83, 86],
    }),
  }),
];
