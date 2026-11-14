/**
 * Typed data errors so the UI can explain *why* data is missing instead of a generic failure.
 *
 * API-Football answers HTTP 200 even for failures and puts the reason in `errors`:
 *   { requests:  "You have reached the request limit for the day…" }   → 'quota'
 *   { rateLimit: "Too many requests. Your rate limit is 10 requests per minute." } → 'rateLimit'
 *   { plan:      "Free plans do not have access to …" }                → 'plan'
 *   { token:     "Error/Missing application key…" }                    → 'auth'
 *   { access:    "Your account is suspended…" }                         → 'suspended'
 */
export type DataErrorKind =
  'quota' | 'rateLimit' | 'plan' | 'auth' | 'suspended' | 'network' | 'server' | 'unknown';

export class DataSourceError<T = unknown> extends Error {
  constructor(
    readonly kind: DataErrorKind,
    message: string,
    /** When the limit lifts (quota: next 00:00 UTC). */
    readonly retryAt?: number,
    /** Last good data for the same request, if any (shown with a "not up to date" banner). */
    readonly staleData?: T,
    /** Raw API `errors` object. */
    readonly apiErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'DataSourceError';
  }

  withStale<S>(data: S): DataSourceError<S> {
    return new DataSourceError(this.kind, this.message, this.retryAt, data, this.apiErrors);
  }
}

/** API-Football resets the daily counter at 00:00 UTC. */
export function nextUtcMidnight(now = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

/** Maps an API-Football `errors` object to a typed error. */
export function fromApiErrors(path: string, errors: Record<string, string>): DataSourceError {
  const text = Object.values(errors).join(' | ');
  const message = `API-Football ${path}: ${text}`;
  if (errors.requests) return new DataSourceError('quota', message, nextUtcMidnight(), undefined, errors);
  if (errors.rateLimit) return new DataSourceError('rateLimit', message, Date.now() + 60_000, undefined, errors);
  if (errors.token) return new DataSourceError('auth', message, undefined, undefined, errors);
  if (errors.access) return new DataSourceError('suspended', message, undefined, undefined, errors);
  if (errors.plan) return new DataSourceError('plan', message, undefined, undefined, errors);
  return new DataSourceError('unknown', message, undefined, undefined, errors);
}

/** Normalizes anything thrown by fetch / JSON parsing / the API into a DataSourceError. */
export function toDataSourceError(e: unknown): DataSourceError {
  if (e instanceof DataSourceError) return e;
  const message = e instanceof Error ? e.message : String(e);
  // fetch() rejects with TypeError("Network request failed") when offline / DNS / TLS fails.
  if (e instanceof TypeError || /network request failed|failed to fetch|timeout|abort/i.test(message)) {
    return new DataSourceError('network', message);
  }
  return new DataSourceError('unknown', message);
}
