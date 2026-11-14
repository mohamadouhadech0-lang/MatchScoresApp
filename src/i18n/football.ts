/**
 * Arabic names for API-Football data (the API only returns English).
 * Unknown values fall back to the original text, so nothing is ever hidden.
 */

const LEAGUE_NAMES_AR: Record<number, string> = {
  1: 'كأس العالم',
  4: 'كأس أمم أوروبا',
  5: 'دوري الأمم الأوروبية',
  6: 'كأس أمم إفريقيا',
  7: 'كأس آسيا',
  9: 'كوبا أمريكا',
  10: 'مباريات دولية ودية',
  22: 'الكأس الذهبية',
  29: 'تصفيات كأس العالم - إفريقيا',
  30: 'تصفيات كأس العالم - آسيا',
  31: 'تصفيات كأس العالم - الكونكاكاف',
  32: 'تصفيات كأس العالم - أوروبا',
  34: 'تصفيات كأس العالم - أمريكا الجنوبية',
  36: 'تصفيات كأس أمم إفريقيا',
  960: 'تصفيات كأس أمم أوروبا',
  2: 'دوري أبطال أوروبا',
  3: 'الدوري الأوروبي',
  848: 'دوري المؤتمر الأوروبي',
  12: 'دوري أبطال إفريقيا',
  17: 'دوري أبطال آسيا',
  39: 'الدوري الإنجليزي الممتاز',
  140: 'الدوري الإسباني',
  135: 'الدوري الإيطالي',
  78: 'الدوري الألماني',
  61: 'الدوري الفرنسي',
  307: 'دوري روشن السعودي',
  233: 'الدوري المصري الممتاز',
  200: 'البطولة المغربية الاحترافية',
  186: 'الرابطة الجزائرية المحترفة الأولى',
  202: 'الرابطة التونسية المحترفة الأولى',
  301: 'دوري أدنوك للمحترفين',
  305: 'دوري نجوم قطر',
  45: 'كأس الاتحاد الإنجليزي',
  143: 'كأس ملك إسبانيا',
  66: 'كأس فرنسا',
  667: 'مباريات ودية للأندية',
};

export function leagueNameAr(id: number, fallback: string): string {
  return LEAGUE_NAMES_AR[id] ?? fallback;
}

const LETTERS: Record<string, string> = {
  A: 'أ',
  B: 'ب',
  C: 'ج',
  D: 'د',
  E: 'هـ',
  F: 'و',
  G: 'ز',
  H: 'ح',
  I: 'ط',
  J: 'ي',
  K: 'ك',
  L: 'ل',
};
const letter = (l: string) => LETTERS[l.toUpperCase()] ?? l;

const EXACT_ROUNDS: Record<string, string> = {
  'group stage': 'دور المجموعات',
  'league stage': 'مرحلة الدوري',
  'round of 128': 'دور الـ128',
  'round of 64': 'دور الـ64',
  'round of 32': 'دور الـ32',
  'round of 16': 'دور الـ16',
  '8th finals': 'دور الـ16',
  'quarter-finals': 'ربع النهائي',
  'semi-finals': 'نصف النهائي',
  final: 'النهائي',
  '3rd place final': 'مباراة المركز الثالث',
  'play-offs': 'الملحق',
  'knockout round play-offs': 'ملحق الأدوار الإقصائية',
  'friendly international': 'مباراة ودية دولية',
  'club friendlies': 'مباراة ودية',
  'preliminary round': 'الدور التمهيدي',
  preliminary: 'الدور التمهيدي',
};

const ORDINALS: Record<string, string> = {
  '1st': 'الأول',
  '2nd': 'الثاني',
  '3rd': 'الثالث',
  '4th': 'الرابع',
  '5th': 'الخامس',
};

/**
 * "Regular Season - 15" → "الجولة 15", "Group B - 3" → "المجموعة ب - الجولة 3",
 * "Round of 16" → "دور الـ16", "1/128-finals" → "دور الـ256", "League A - 6" → "المستوى أ - الجولة 6" …
 */
export function roundAr(round: string | undefined): string | undefined {
  if (!round) return round;
  const r = round.trim();
  const exact = EXACT_ROUNDS[r.toLowerCase()];
  if (exact) return exact;

  let m = r.match(/^Regular Season - (\d+)$/i);
  if (m) return `الجولة ${m[1]}`;
  m = r.match(/^Group Stage - (\d+)$/i);
  if (m) return `دور المجموعات - الجولة ${m[1]}`;
  m = r.match(/^League Stage - (\d+)$/i);
  if (m) return `مرحلة الدوري - الجولة ${m[1]}`;
  m = r.match(/^Group ([A-L]) - (\d+)$/i);
  if (m) return `المجموعة ${letter(m[1])} - الجولة ${m[2]}`;
  m = r.match(/^Group ([A-L])$/i);
  if (m) return `المجموعة ${letter(m[1])}`;
  m = r.match(/^League ([A-D]) - (\d+)$/i); // Nations League tiers
  if (m) return `المستوى ${letter(m[1])} - الجولة ${m[2]}`;
  m = r.match(/^1\/(\d+)-finals$/i); // 1/128-finals = 256 teams left
  if (m) return `دور الـ${Number(m[1]) * 2}`;
  m = r.match(/^Group ([0-9]+|[IVX]+) - (\d+)$/i); // numbered / roman groups
  if (m) return `المجموعة ${m[1]} - الجولة ${m[2]}`;
  m = r.match(/^(Apertura|Clausura) - (\d+)$/i); // Latin-American split seasons
  if (m) return `${m[1].toLowerCase() === 'apertura' ? 'مرحلة الافتتاح' : 'مرحلة الختام'} - الجولة ${m[2]}`;
  m = r.match(/^Championship Group - (\d+)$/i);
  if (m) return `مجموعة البطولة - الجولة ${m[1]}`;
  m = r.match(/^Relegation Group - (\d+)$/i);
  if (m) return `مجموعة الهبوط - الجولة ${m[1]}`;
  m = r.match(/^(\d+(?:st|nd|rd|th)) (Round|Qualifying Round)$/i);
  if (m)
    return `${m[2].toLowerCase().startsWith('qual') ? 'الدور التأهيلي' : 'الدور'} ${ORDINALS[m[1].toLowerCase()] ?? m[1]}`;
  // Any other "<stage> - N": keep the stage name, translate the matchday.
  m = r.match(/^(.+) - (\d+)$/);
  if (m) return `${m[1]} - الجولة ${m[2]}`;
  return r;
}

/** "Javier Alonso Villa Zapata, Colombia" → { name, country }. */
export function splitReferee(raw: string | null | undefined): { name?: string; country?: string } {
  if (!raw) return {};
  const [name, ...rest] = raw.split(',').map((s) => s.trim());
  return { name: name || undefined, country: rest.join(', ') || undefined };
}
