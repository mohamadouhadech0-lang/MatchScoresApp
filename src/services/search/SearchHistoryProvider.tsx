import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { SearchKind } from '@/data/mock/searchCatalog';

/** A recent search: either free text or a tapped entity. */
export type RecentSearch =
  | { key: string; type: 'text'; label: string }
  | { key: string; type: 'entity'; kind: SearchKind; id: number; label: string };

type NewRecent = { type: 'text'; label: string } | { type: 'entity'; kind: SearchKind; id: number; label: string };

const MAX_ITEMS = 12;

interface SearchHistoryValue {
  recent: RecentSearch[];
  add: (item: NewRecent) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const SearchHistoryContext = createContext<SearchHistoryValue | null>(null);

const keyOf = (item: NewRecent) =>
  item.type === 'text' ? `text:${item.label.trim().toLowerCase()}` : `${item.kind}:${item.id}`;

/** Recent searches for this session, newest first and de-duplicated. */
export function SearchHistoryProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  const add = useCallback((item: NewRecent) => {
    if (item.type === 'text' && !item.label.trim()) return;
    const key = keyOf(item);
    const entry = { ...item, key, label: item.label.trim() } as RecentSearch;
    setRecent((r) => [entry, ...r.filter((x) => x.key !== key)].slice(0, MAX_ITEMS));
  }, []);

  const remove = useCallback((key: string) => setRecent((r) => r.filter((x) => x.key !== key)), []);
  const clear = useCallback(() => setRecent([]), []);

  const value = useMemo(() => ({ recent, add, remove, clear }), [recent, add, remove, clear]);
  return <SearchHistoryContext.Provider value={value}>{children}</SearchHistoryContext.Provider>;
}

export function useSearchHistory(): SearchHistoryValue {
  const ctx = useContext(SearchHistoryContext);
  if (!ctx) throw new Error('useSearchHistory must be used inside <SearchHistoryProvider>');
  return ctx;
}
