import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { seedComments, type MatchComment } from '@/data/mock/matchExtras';

export type Vote = 'like' | 'dislike' | null;

interface CommentsValue {
  /** Comments for a match, most-liked first. */
  getComments: (matchId: number) => MatchComment[];
  votes: Record<string, Vote>;
  addComment: (matchId: number, user: string, text: string) => void;
  addReply: (matchId: number, commentId: string, user: string, text: string) => void;
  vote: (matchId: number, commentId: string, vote: 'like' | 'dislike') => void;
}

const CommentsContext = createContext<CommentsValue | null>(null);

/** In-memory community comments per match (seeded with demo comments). */
export function CommentsProvider({ children }: { children: ReactNode }) {
  const [byMatch, setByMatch] = useState<Record<number, MatchComment[]>>({});
  const [votes, setVotes] = useState<Record<string, Vote>>({});

  const listFor = useCallback((all: Record<number, MatchComment[]>, id: number) => all[id] ?? seedComments(id), []);

  const getComments = useCallback(
    (matchId: number) => [...listFor(byMatch, matchId)].sort((a, b) => b.likes - b.dislikes - (a.likes - a.dislikes)),
    [byMatch, listFor],
  );

  const update = useCallback(
    (matchId: number, fn: (list: MatchComment[]) => MatchComment[]) =>
      setByMatch((all) => ({ ...all, [matchId]: fn(listFor(all, matchId)) })),
    [listFor],
  );

  const addComment = useCallback(
    (matchId: number, user: string, text: string) =>
      update(matchId, (list) => [
        { id: `${matchId}-u${Date.now()}`, user, text, likes: 0, dislikes: 0, createdAt: Date.now(), replies: [] },
        ...list,
      ]),
    [update],
  );

  const addReply = useCallback(
    (matchId: number, commentId: string, user: string, text: string) =>
      update(matchId, (list) =>
        list.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: [...c.replies, { id: `${commentId}-r${Date.now()}`, user, text, createdAt: Date.now() }],
              }
            : c,
        ),
      ),
    [update],
  );

  const vote = useCallback(
    (matchId: number, commentId: string, next: 'like' | 'dislike') => {
      const prev = votes[commentId] ?? null;
      const final: Vote = prev === next ? null : next;
      setVotes((v) => ({ ...v, [commentId]: final }));
      update(matchId, (list) =>
        list.map((c) => {
          if (c.id !== commentId) return c;
          let { likes, dislikes } = c;
          if (prev === 'like') likes--;
          if (prev === 'dislike') dislikes--;
          if (final === 'like') likes++;
          if (final === 'dislike') dislikes++;
          return { ...c, likes, dislikes };
        }),
      );
    },
    [votes, update],
  );

  const value = useMemo(
    () => ({ getComments, votes, addComment, addReply, vote }),
    [getComments, votes, addComment, addReply, vote],
  );
  return <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>;
}

export function useComments(): CommentsValue {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error('useComments must be used inside <CommentsProvider>');
  return ctx;
}
