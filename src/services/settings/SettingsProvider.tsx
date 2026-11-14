import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type TimeFormat = '12h' | '24h';
export type MatchSort = 'league' | 'time' | 'live-first';
export type NotificationKey = 'kickoff' | 'goals' | 'final' | 'news';

export interface Settings {
  timeFormat: TimeFormat;
  sortBy: MatchSort;
  darkMode: boolean;
  showComments: boolean;
  notifications: Record<NotificationKey, boolean>;
  /** Favorite team IDs. */
  favorites: number[];
  /** Favorite league IDs (shown first, yellow star). */
  favoriteLeagues: number[];
  /** League IDs whose matches are hidden from the matches tab. */
  hiddenLeagues: number[];
  /** Custom league order (IDs); leagues not listed keep their default position. */
  leagueOrder: number[];
  /** Match IDs with alerts enabled (bell in match details). */
  matchAlerts: number[];
}

const defaults: Settings = {
  timeFormat: '12h',
  sortBy: 'league',
  darkMode: true,
  showComments: true,
  notifications: { kickoff: true, goals: true, final: false, news: false },
  favorites: [],
  favoriteLeagues: [5, 2],
  hiddenLeagues: [],
  leagueOrder: [],
  matchAlerts: [],
};

type IdListKey = 'favorites' | 'favoriteLeagues' | 'hiddenLeagues' | 'matchAlerts';
const toggleId = (list: number[], id: number) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

interface SettingsContextValue extends Settings {
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setNotification: (key: NotificationKey, value: boolean) => void;
  toggleFavorite: (teamId: number) => void;
  toggleIn: (key: IdListKey, id: number) => void;
  /** Moves a league one step up (-1) or down (+1) within `allIds`. */
  moveLeague: (allIds: number[], id: number, delta: -1 | 1) => void;
}

/** Applies a custom order to IDs; unknown IDs keep their relative position at the end. */
export function sortByOrder(ids: number[], order: number[]): number[] {
  const pos = (id: number) => {
    const i = order.indexOf(id);
    return i === -1 ? order.length + ids.indexOf(id) : i;
  };
  return [...ids].sort((a, b) => pos(a) - pos(b));
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** App-wide preferences (kept in memory for this session). */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaults);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  const setNotification = useCallback((key: NotificationKey, value: boolean) => {
    setSettings((s) => ({ ...s, notifications: { ...s.notifications, [key]: value } }));
  }, []);

  const toggleIn = useCallback((key: IdListKey, id: number) => {
    setSettings((s) => ({ ...s, [key]: toggleId(s[key], id) }));
  }, []);

  const toggleFavorite = useCallback((teamId: number) => toggleIn('favorites', teamId), [toggleIn]);

  const moveLeague = useCallback((allIds: number[], id: number, delta: -1 | 1) => {
    setSettings((s) => {
      const order = sortByOrder(allIds, s.leagueOrder);
      const i = order.indexOf(id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= order.length) return s;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...s, leagueOrder: order };
    });
  }, []);

  const value = useMemo(
    () => ({ ...settings, update, setNotification, toggleFavorite, toggleIn, moveLeague }),
    [settings, update, setNotification, toggleFavorite, toggleIn, moveLeague],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
