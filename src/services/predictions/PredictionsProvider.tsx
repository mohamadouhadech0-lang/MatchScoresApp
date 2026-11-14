import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { hashString, rng } from '@/data/mock/nationsLeague';

export type PredictionPick = 'home' | 'draw' | 'away';

export interface PredictionTally {
  home: number;
  draw: number;
  away: number;
  total: number;
}

interface PredictionsValue {
  /** Vote counts for a match, including the current user's pick. */
  getTally: (matchId: number) => PredictionTally;
  /** Current user's pick per match. */
  picks: Record<number, PredictionPick>;
  /** Casts or changes the current user's pick. */
  predict: (matchId: number, pick: PredictionPick) => void;
}

const PredictionsContext = createContext<PredictionsValue | null>(null);

/** Community votes before the user's own vote: deterministic per match, home side slightly favoured. */
function seedTally(matchId: number): Omit<PredictionTally, 'total'> {
  const rand = rng(hashString(`predict:${matchId}`));
  return {
    home: 300 + Math.floor(rand() * 900),
    draw: 150 + Math.floor(rand() * 400),
    away: 200 + Math.floor(rand() * 800),
  };
}

/** In-memory "توقع الفائز" votes (replace with a backend when one exists). */
export function PredictionsProvider({ children }: { children: ReactNode }) {
  const [picks, setPicks] = useState<Record<number, PredictionPick>>({});

  const getTally = useCallback(
    (matchId: number): PredictionTally => {
      const base = seedTally(matchId);
      const mine = picks[matchId];
      if (mine) base[mine] += 1;
      return { ...base, total: base.home + base.draw + base.away };
    },
    [picks],
  );

  const predict = useCallback(
    (matchId: number, pick: PredictionPick) => setPicks((p) => ({ ...p, [matchId]: pick })),
    [],
  );

  const value = useMemo(() => ({ getTally, picks, predict }), [getTally, picks, predict]);
  return <PredictionsContext.Provider value={value}>{children}</PredictionsContext.Provider>;
}

export function usePredictions(): PredictionsValue {
  const ctx = useContext(PredictionsContext);
  if (!ctx) throw new Error('usePredictions must be used inside <PredictionsProvider>');
  return ctx;
}
