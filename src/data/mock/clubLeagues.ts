import type { League, Match, Team } from '@/types/football';
import { dayKey, hashString, matchState, rng } from './nationsLeague';
import { mockStandings } from './standings';

/**
 * Mock club fixtures for the leagues that have a mock table (Saudi, Premier League, La Liga),
 * generated for any calendar day. Same date → same fixtures; status and score follow the clock
 * exactly like the Nations League mock (live at kick-off, goals appear as minutes pass).
 *
 * Ids: `YYYYMMDD * 100 + 20 + leagueIndex * 10 + n`, so they never collide with Nations League
 * fixtures (`YYYYMMDD * 100 + 0..9`).
 */

/** Local kick-off slots per league (the device time zone). */
const SLOTS: Record<number, [number, number][]> = {
  307: [
    [16, 50],
    [19, 0],
    [21, 0],
  ],
  39: [
    [12, 30],
    [15, 0],
    [17, 30],
  ],
  140: [
    [14, 0],
    [16, 15],
    [21, 0],
  ],
};

const STADIUMS: Record<number, [stadium: string, city: string]> = {
  2932: ['المملكة أرينا', 'الرياض'],
  2939: ['الأول بارك', 'الرياض'],
  2938: ['الجوهرة المشعة', 'جدة'],
  2929: ['الإنماء', 'جدة'],
  2934: ['الشباب', 'الرياض'],
  2944: ['الأمير سعود بن جلوي', 'الخبر'],
  2933: ['إيجو', 'الدمام'],
  2936: ['التعاون', 'بريدة'],
  40: ['أنفيلد', 'ليفربول'],
  42: ['الإمارات', 'لندن'],
  50: ['الاتحاد', 'مانشستر'],
  49: ['ستامفورد بريدج', 'لندن'],
  34: ['سانت جيمس بارك', 'نيوكاسل'],
  47: ['توتنهام هوتسبير', 'لندن'],
  66: ['فيلا بارك', 'برمنغهام'],
  33: ['أولد ترافورد', 'مانشستر'],
  541: ['سانتياغو برنابيو', 'مدريد'],
  529: ['كامب نو', 'برشلونة'],
  530: ['ميتروبوليتانو', 'مدريد'],
  531: ['سان ماميس', 'بلباو'],
  533: ['لا سيراميكا', 'فياريال'],
  543: ['بينيتو فيامارين', 'إشبيلية'],
  536: ['رامون سانشيز بيزخوان', 'إشبيلية'],
  548: ['أنويتا', 'سان سيباستيان'],
};

export const clubLeagues: { league: League; teams: Team[] }[] = mockStandings.map((s) => ({
  league: s.league,
  teams: s.rows.map((r) => r.team),
}));

/** League a club team plays in, if it is one of the mock clubs. */
export function clubLeagueOf(teamId: number): { league: League; teams: Team[] } | undefined {
  return clubLeagues.find((l) => l.teams.some((t) => t.id === teamId));
}

export function stadiumOf(team: Team): { venue: string; city: string } | undefined {
  const s = STADIUMS[team.id];
  return s ? { venue: s[0], city: s[1] } : undefined;
}

/** Matchday number that advances one round per week, so it looks like a running season. */
function matchday(date: Date): number {
  const seasonStart = new Date(2026, 7, 15).getTime();
  return Math.max(1, Math.min(38, 1 + Math.floor((date.getTime() - seasonStart) / (7 * 86_400_000))));
}

export function getClubMatches(date: Date, now: Date = new Date()): Match[] {
  const key = dayKey(date);
  const dateNum = Number(key.replace(/-/g, ''));
  const matches: Match[] = [];

  clubLeagues.forEach(({ league, teams }, leagueIndex) => {
    const rand = rng(hashString(`club:${key}:${league.id}`));
    // Weekends are busy; on weekdays a league plays only now and then.
    const weekday = date.getDay();
    const weekend = weekday === 0 || weekday === 5 || weekday === 6;
    if (!weekend && rand() < 0.65) return;

    const pool = [...teams];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const count = weekend ? 2 + Math.floor(rand() * 3) : 1 + Math.floor(rand() * 2);
    const slots = SLOTS[league.id] ?? [[19, 0]];

    for (let n = 0; n < count && n * 2 + 1 < pool.length; n++) {
      const [hour, minute] = slots[Math.min(slots.length - 1, Math.floor((n * slots.length) / count))];
      const id = dateNum * 100 + 20 + leagueIndex * 10 + n;
      const kickoff = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
      const homeTeam = pool[n * 2];
      const state = matchState(id, kickoff, now);
      const stadium = stadiumOf(homeTeam);
      matches.push({
        id,
        league,
        homeTeam,
        awayTeam: pool[n * 2 + 1],
        kickoff: kickoff.toISOString(),
        ...state,
        venue: stadium?.venue,
        venueCity: stadium?.city,
        round: `الجولة ${matchday(date)}`,
      });
    }
  });

  return matches.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

/** Finds a generated club fixture from its id. */
export function getClubMatchById(id: number, now: Date = new Date()): Match | null {
  const slot = id % 100;
  if (slot < 20) return null;
  const dateNum = Math.floor(id / 100);
  const y = Math.floor(dateNum / 10000);
  const m = Math.floor((dateNum % 10000) / 100) - 1;
  const d = dateNum % 100;
  if (!y || m < 0 || m > 11 || d < 1 || d > 31) return null;
  return getClubMatches(new Date(y, m, d), now).find((match) => match.id === id) ?? null;
}
