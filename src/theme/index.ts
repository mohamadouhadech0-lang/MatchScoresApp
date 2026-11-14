import { DarkTheme, type Theme } from 'expo-router';

export const colors = {
  background: '#0D1117',
  surface: '#1B222C',
  surfaceElevated: '#222A35',
  capsule: '#11161D',
  border: '#262F3B',
  text: '#FFFFFF',
  textSecondary: '#A3ADBB',
  textMuted: '#6B7686',
  primary: '#00D084',
  primarySoft: 'rgba(0, 208, 132, 0.14)',
  purple: '#7C4DFF',
  live: '#EF4444',
  liveSoft: 'rgba(239, 68, 68, 0.14)',
  yellowCard: '#FACC15',
  redCard: '#EF4444',
  home: '#3B82F6',
  away: '#F97316',
  champions: '#3B82F6',
  europa: '#F97316',
  relegation: '#EF4444',
  win: '#00D084',
  draw: '#A3ADBB',
  loss: '#EF4444',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Standard diameters for team flags / crests / avatars, so every screen matches. */
export const logoSize = {
  xs: 20,
  sm: 24, // tables, form rows, tab segments
  md: 32, // match cards, list rows
  lg: 40, // head-to-head, league rows
  xl: 56, // grids & strips
  hero: 64, // match header
  display: 88, // profile sheets
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '800' as const },
  heading: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  score: { fontSize: 22, fontWeight: '800' as const, fontVariant: ['tabular-nums' as const] },
};

/** React Navigation theme so headers, tab bar and screen backgrounds match. */
export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.live,
  },
};
