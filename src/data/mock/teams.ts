import type { Team } from '@/types/football';

export { leagues } from '@/constants/leagues';

// Team IDs mirror API-Football's IDs.

const t = (id: number, name: string, shortName: string, color: string): Team => ({ id, name, shortName, color });

export const teams = {
  // Saudi Pro League
  hilal: t(2932, 'الهلال', 'هلا', '#1D4ED8'),
  nassr: t(2939, 'النصر', 'نصر', '#EAB308'),
  ittihad: t(2938, 'الاتحاد', 'اتح', '#CA8A04'),
  ahli: t(2929, 'الأهلي', 'أهل', '#15803D'),
  shabab: t(2934, 'الشباب', 'شبا', '#64748B'),
  qadsiah: t(2944, 'القادسية', 'قاد', '#B91C1C'),
  ettifaq: t(2933, 'الاتفاق', 'اتف', '#047857'),
  taawoun: t(2936, 'التعاون', 'تعا', '#A16207'),

  // Premier League
  liverpool: t(40, 'ليفربول', 'LIV', '#C8102E'),
  arsenal: t(42, 'أرسنال', 'ARS', '#DB0007'),
  mancity: t(50, 'مانشستر سيتي', 'MCI', '#6CABDD'),
  chelsea: t(49, 'تشيلسي', 'CHE', '#034694'),
  newcastle: t(34, 'نيوكاسل', 'NEW', '#334155'),
  tottenham: t(47, 'توتنهام', 'TOT', '#132257'),
  villa: t(66, 'أستون فيلا', 'AVL', '#670E36'),
  manutd: t(33, 'مانشستر يونايتد', 'MUN', '#DA291C'),

  // La Liga
  realmadrid: t(541, 'ريال مدريد', 'RMA', '#A78BFA'),
  barcelona: t(529, 'برشلونة', 'BAR', '#A50044'),
  atletico: t(530, 'أتلتيكو مدريد', 'ATM', '#CB3524'),
  bilbao: t(531, 'أتلتيك بلباو', 'ATH', '#EE2523'),
  villarreal: t(533, 'فياريال', 'VIL', '#CA8A04'),
  betis: t(543, 'ريال بيتيس', 'BET', '#0BB363'),
  sevilla: t(536, 'إشبيلية', 'SEV', '#D4021D'),
  sociedad: t(548, 'ريال سوسيداد', 'RSO', '#0067B1'),
} satisfies Record<string, Team>;
