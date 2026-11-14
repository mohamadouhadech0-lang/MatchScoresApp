import { useEffect, useState } from 'react';

import { toDataSourceError } from '@/services/errors';

export type AsyncState<T> =
  { status: 'loading' } | { status: 'ok'; data: T } | { status: 'error'; message: string; planLimited: boolean };

/**
 * Runs `load` whenever `key` changes and ignores stale responses.
 * `planLimited` flags API-Football plan restrictions so the UI can say so explicitly.
 */
export function useAsyncData<T>(key: string | null, load: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<{ key: string; value: AsyncState<T> } | null>(null);

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ key, value: { status: 'ok', data } }))
      .catch((e: unknown) => {
        if (cancelled) return;
        const error = toDataSourceError(e);
        const message = error.message;
        const planLimited = error.kind === 'plan';
        setState({ key, value: { status: 'error', message, planLimited } });
      });
    return () => {
      cancelled = true;
    };
    // `load` is recreated every render; `key` identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state && state.key === key ? state.value : { status: 'loading' };
}
