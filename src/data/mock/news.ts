import type { SearchEntity } from './searchCatalog';
import { clubs, nationalTeamEntities } from './searchCatalog';

/**
 * Demo news feed. Headlines are illustrative placeholders (not real reporting) and are labeled
 * as demo content in the UI.
 */

export type NewsCategory = 'clubs' | 'national' | 'transfers' | 'analysis';

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  body: string;
  category: NewsCategory;
  /** Names of the teams the story is about (used by the team strip filter). */
  tags: string[];
  minutesAgo: number;
  /** Absolute publish time (derived from `minutesAgo` when the module loads). */
  publishedAt: number;
  /** Cover art: gradient colors + featured entity badges. */
  cover: { colors: [string, string]; entities: string[] };
  featured?: boolean;
}

export const newsCategories: Record<NewsCategory, string> = {
  clubs: 'الأندية',
  national: 'المنتخبات',
  transfers: 'الانتقالات',
  analysis: 'تحليلات',
};

const p = (...lines: string[]) => lines.join('\n\n');

const rawNews: Omit<NewsItem, 'publishedAt'>[] = [
  {
    id: 1,
    title: 'برشلونة يكثّف تحضيراته قبل الكلاسيكو وسط عودة المصابين',
    summary: 'الجهاز الفني يحصل على دفعة قوية بعودة ثلاثة لاعبين إلى التدريبات الجماعية.',
    body: p(
      'واصل فريق برشلونة استعداداته للمواجهة المرتقبة، حيث شهدت الحصة التدريبية الأخيرة مشاركة عدد من اللاعبين العائدين من الإصابة.',
      'ويأمل الجهاز الفني في الاعتماد على التشكيلة الأساسية كاملة، في ظل أهمية المباراة في سباق الصدارة.',
    ),
    category: 'clubs',
    tags: ['برشلونة', 'ريال مدريد'],
    minutesAgo: 25,
    cover: { colors: ['#A50044', '#004D98'], entities: ['برشلونة', 'ريال مدريد'] },
    featured: true,
  },
  {
    id: 2,
    title: 'منتخب مصر يعلن قائمته لمعسكر نوفمبر بوجوه جديدة',
    summary: 'المدير الفني يستدعي أربعة لاعبين لأول مرة استعداداً للاستحقاقات المقبلة.',
    body: p(
      'أعلن الجهاز الفني لمنتخب مصر قائمة اللاعبين المستدعين للمعسكر المقبل، والتي ضمت عدداً من الوجوه الشابة.',
      'ويخوض المنتخب مباراتين وديتين خلال فترة التوقف الدولي.',
    ),
    category: 'national',
    tags: ['مصر'],
    minutesAgo: 70,
    cover: { colors: ['#C8102E', '#111827'], entities: ['مصر'] },
    featured: true,
  },
  {
    id: 3,
    title: 'الأهلي يحسم صدارة مجموعته بفوز ثمين خارج أرضه',
    summary: 'هدف في الشوط الثاني يكفي الفريق الأحمر لضمان التأهل متصدراً.',
    body: p(
      'حقق الأهلي فوزاً مهماً خارج ملعبه ليضمن صدارة مجموعته قبل جولة من النهاية.',
      'وأشاد المدرب بروح لاعبيه وانضباطهم التكتيكي.',
    ),
    category: 'clubs',
    tags: ['الأهلي'],
    minutesAgo: 140,
    cover: { colors: ['#B91C1C', '#450A0A'], entities: ['الأهلي'] },
  },
  {
    id: 4,
    title: 'البرتغال والدنمارك: مواجهة نارية على صدارة المجموعة الليلة',
    summary: 'كل ما تحتاج معرفته عن قمة دوري الأمم الأوروبية: التشكيلات والإحصائيات والتوقعات.',
    body: p(
      'تتجه الأنظار إلى قمة المجموعة بين البرتغال والدنمارك، في مباراة قد تحسم بطاقة التأهل.',
      'ويدخل الفريقان اللقاء بفارق نقطة واحدة فقط.',
    ),
    category: 'national',
    tags: ['البرتغال', 'الدنمارك'],
    minutesAgo: 190,
    cover: { colors: ['#006600', '#C8102E'], entities: ['البرتغال', 'الدنمارك'] },
  },
  {
    id: 5,
    title: 'ريال مدريد يراقب موهبة شابة في الدوري الهولندي',
    summary: 'تقارير تشير إلى اهتمام النادي الملكي بضم لاعب وسط واعد في الميركاتو الشتوي.',
    body: p(
      'يتابع كشافو ريال مدريد عن قرب أداء لاعب وسط شاب في الدوري الهولندي.',
      'ولم يصدر أي تأكيد رسمي من الناديين حتى الآن.',
    ),
    category: 'transfers',
    tags: ['ريال مدريد'],
    minutesAgo: 260,
    cover: { colors: ['#6D28D9', '#0F172A'], entities: ['ريال مدريد'] },
  },
  {
    id: 6,
    title: 'تحليل: كيف غيّر الضغط العالي شكل المنافسة هذا الموسم؟',
    summary: 'قراءة في الأرقام والأساليب التكتيكية التي صنعت الفارق في الدوريات الكبرى.',
    body: p(
      'أصبح الضغط العالي سمة أساسية لدى أغلب الفرق المنافسة على الألقاب.',
      'وتُظهر الإحصائيات ارتفاع عدد الكرات المستخلصة في الثلث الأخير مقارنة بالمواسم الماضية.',
    ),
    category: 'analysis',
    tags: ['أرسنال', 'مانشستر سيتي'],
    minutesAgo: 380,
    cover: { colors: ['#0E7490', '#0F172A'], entities: ['أرسنال', 'مانشستر سيتي'] },
  },
];

const loadedAt = Date.now();
export const mockNews: NewsItem[] = rawNews.map((n) => ({ ...n, publishedAt: loadedAt - n.minutesAgo * 60_000 }));

/** Teams shown in the horizontal strip under the news. */
const ahly: SearchEntity = {
  kind: 'club',
  id: 1029,
  name: 'الأهلي',
  subtitle: 'الدوري المصري',
  initials: 'AHL',
  color: '#B91C1C',
};
const egypt: SearchEntity = {
  kind: 'nationalTeam',
  id: 32,
  name: 'مصر',
  subtitle: 'منتخب وطني',
  initials: 'EGY',
  color: '#C8102E',
  logo: 'https://flagcdn.com/w160/eg.png',
};
const byName = (list: SearchEntity[], name: string) => list.find((e) => e.name === name)!;

export const newsTeams: SearchEntity[] = [
  byName(clubs, 'برشلونة'),
  byName(clubs, 'ريال مدريد'),
  ahly,
  egypt,
  byName(nationalTeamEntities, 'البرتغال'),
  byName(clubs, 'أرسنال'),
  byName(clubs, 'مانشستر سيتي'),
  byName(nationalTeamEntities, 'الدنمارك'),
];

export function newsEntity(name: string): SearchEntity | undefined {
  return newsTeams.find((t) => t.name === name);
}
