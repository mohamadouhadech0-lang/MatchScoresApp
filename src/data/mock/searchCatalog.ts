import type { Team } from '@/types/football';
import { nationalTeams } from './nationsLeague';
import { teams } from './teams';

/**
 * Everything the search screen can find. IDs mirror API-Football so the same entities can later
 * come from the real API (which also provides official logos/photos via `logo`).
 */

export type SearchKind = 'club' | 'nationalTeam' | 'league' | 'player';

export interface SearchEntity {
  kind: SearchKind;
  id: number;
  name: string;
  /** Secondary line: country, league or club. */
  subtitle: string;
  /** Badge text when no image is available. */
  initials: string;
  color: string;
  logo?: string;
  /** Extra spellings (English, short names) used for matching. */
  aliases?: string[];
}

const club = (team: Team, subtitle: string, aliases: string[] = []): SearchEntity => ({
  kind: 'club',
  id: team.id,
  name: team.name,
  subtitle,
  initials: team.shortName,
  color: team.color ?? '#334155',
  logo: team.logo,
  aliases,
});

const T = teams;
const psg: Team = { id: 85, name: 'باريس سان جيرمان', shortName: 'PSG', color: '#004170' };
const bayern: Team = { id: 157, name: 'بايرن ميونخ', shortName: 'FCB', color: '#DC052D' };
const inter: Team = { id: 505, name: 'إنتر ميلان', shortName: 'INT', color: '#0068A8' };
const juventus: Team = { id: 496, name: 'يوفنتوس', shortName: 'JUV', color: '#1F2937' };

export const clubs: SearchEntity[] = [
  club(T.realmadrid, 'الدوري الإسباني', ['real madrid', 'madrid', 'الريال']),
  club(T.barcelona, 'الدوري الإسباني', ['barcelona', 'barca', 'برسا', 'البارسا']),
  club(psg, 'الدوري الفرنسي', ['psg', 'paris', 'باريس']),
  club(T.arsenal, 'الدوري الإنجليزي', ['arsenal']),
  club(T.mancity, 'الدوري الإنجليزي', ['manchester city', 'man city', 'city', 'السيتي']),
  club(T.liverpool, 'الدوري الإنجليزي', ['liverpool']),
  club(bayern, 'الدوري الألماني', ['bayern', 'munich', 'البايرن']),
  club(T.hilal, 'دوري روشن السعودي', ['al hilal', 'hilal']),
  club(T.nassr, 'دوري روشن السعودي', ['al nassr', 'nassr']),
  club(T.ittihad, 'دوري روشن السعودي', ['al ittihad', 'ittihad']),
  club(T.ahli, 'دوري روشن السعودي', ['al ahli', 'ahli']),
  club(T.chelsea, 'الدوري الإنجليزي', ['chelsea']),
  club(T.manutd, 'الدوري الإنجليزي', ['manchester united', 'man utd', 'united', 'اليونايتد']),
  club(T.tottenham, 'الدوري الإنجليزي', ['tottenham', 'spurs']),
  club(T.atletico, 'الدوري الإسباني', ['atletico', 'atleti']),
  club(T.sevilla, 'الدوري الإسباني', ['sevilla']),
  club(inter, 'الدوري الإيطالي', ['inter', 'internazionale', 'الانتر']),
  club(juventus, 'الدوري الإيطالي', ['juventus', 'juve', 'اليوفي']),
];

export const nationalTeamEntities: SearchEntity[] = Object.values(nationalTeams).map((t) => ({
  kind: 'nationalTeam',
  id: t.id,
  name: t.name,
  subtitle: 'منتخب وطني',
  initials: t.shortName,
  color: t.color ?? '#334155',
  logo: t.logo,
  aliases: [t.shortName],
}));

const league = (
  id: number,
  name: string,
  subtitle: string,
  initials: string,
  color: string,
  aliases: string[],
): SearchEntity => ({
  kind: 'league',
  id,
  name,
  subtitle,
  initials,
  color,
  aliases,
});

export const leagueEntities: SearchEntity[] = [
  league(2, 'دوري أبطال أوروبا', 'أوروبا', 'UCL', '#0B1F5C', ['champions league', 'ucl', 'الأبطال', 'الشامبيونزليج']),
  league(39, 'الدوري الإنجليزي', 'إنجلترا', 'EPL', '#3D195B', ['premier league', 'epl', 'البريميرليج']),
  league(140, 'الدوري الإسباني', 'إسبانيا', 'LIGA', '#E2231A', ['la liga', 'laliga', 'الليغا', 'الليجا']),
  league(135, 'الدوري الإيطالي', 'إيطاليا', 'SA', '#008FD7', ['serie a', 'الكالتشيو']),
  league(78, 'الدوري الألماني', 'ألمانيا', 'BL', '#D20515', ['bundesliga', 'البوندسليغا']),
  league(307, 'دوري روشن السعودي', 'السعودية', 'SPL', '#00A859', ['saudi pro league', 'roshn', 'روشن']),
  league(5, 'دوري الأمم الأوروبية', 'أوروبا', 'UNL', '#0E7490', ['nations league']),
];

const player = (
  id: number,
  name: string,
  team: string,
  initials: string,
  color: string,
  aliases: string[],
): SearchEntity => ({
  kind: 'player',
  id,
  name,
  subtitle: team,
  initials,
  color,
  aliases,
});

export const players: SearchEntity[] = [
  player(154, 'ليونيل ميسي', 'إنتر ميامي', 'LM', '#F7B5CD', ['messi', 'lionel messi', 'ميسي']),
  player(874, 'كريستيانو رونالدو', 'النصر', 'CR', '#EAB308', ['ronaldo', 'cristiano', 'cr7', 'رونالدو']),
  player(278, 'كيليان مبابي', 'ريال مدريد', 'KM', '#A78BFA', ['mbappe', 'kylian', 'مبابي']),
  player(386828, 'لامين يامال', 'برشلونة', 'LY', '#A50044', ['yamal', 'lamine', 'يامال']),
  player(1100, 'إرلينغ هالاند', 'مانشستر سيتي', 'EH', '#6CABDD', ['haaland', 'erling', 'هالاند']),
  player(306, 'محمد صلاح', 'ليفربول', 'MS', '#C8102E', ['salah', 'mo salah', 'صلاح']),
  player(129718, 'جود بيلينغهام', 'ريال مدريد', 'JB', '#A78BFA', ['bellingham', 'jude', 'بيلينغهام']),
  player(762, 'فينيسيوس جونيور', 'ريال مدريد', 'VJ', '#A78BFA', ['vinicius', 'vini', 'فينيسيوس']),
];

/** Curated "most searched" rows shown before typing. */
export const trending = {
  clubs: clubs.slice(0, 8),
  leagues: leagueEntities.slice(0, 4),
  players: players.slice(0, 4),
};

/** Normalizes Arabic/Latin text so "أرسنال" ≈ "ارسنال" and "Messi" ≈ "messi". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '') // harakat + tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

const all: SearchEntity[] = [...clubs, ...nationalTeamEntities, ...leagueEntities, ...players];
const index = all.map((e) => ({ e, haystack: [e.name, ...(e.aliases ?? [])].map(normalize) }));

export interface SearchResults {
  clubs: SearchEntity[];
  nationalTeams: SearchEntity[];
  leagues: SearchEntity[];
  players: SearchEntity[];
  total: number;
}

/** Ranks prefix matches before substring matches. */
export function searchCatalog(query: string): SearchResults {
  const q = normalize(query);
  const ranked = q
    ? index
        .map(({ e, haystack }) => {
          const prefix = haystack.some((h) => h.startsWith(q) || h.split(' ').some((w) => w.startsWith(q)));
          const contains = prefix || haystack.some((h) => h.includes(q));
          return { e, score: prefix ? 0 : contains ? 1 : -1 };
        })
        .filter((r) => r.score >= 0)
        .sort((a, b) => a.score - b.score)
        .map((r) => r.e)
    : [];
  const by = (kind: SearchKind) => ranked.filter((e) => e.kind === kind);
  return {
    clubs: by('club'),
    nationalTeams: by('nationalTeam'),
    leagues: by('league'),
    players: by('player'),
    total: ranked.length,
  };
}

export function findEntity(kind: SearchKind, id: number): SearchEntity | undefined {
  return all.find((e) => e.kind === kind && e.id === id);
}
