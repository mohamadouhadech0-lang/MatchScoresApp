import type { Match, MatchDetails } from '@/types/football';

/**
 * True once the referee has blown the first whistle.
 *
 * API-Football statuses map to our model as:
 *   1H, HT, 2H, ET, BT, P, SUSP, INT, LIVE  → status 'live'
 *   FT, AET, PEN, AWD, WO                   → status 'finished'
 *   NS, TBD, PST                            → status 'scheduled'   (not started / postponed)
 *   CANC, ABD                               → status 'finished', phase 'cancelled'
 * Cancelled matches never produced events, so they count as "not started" here.
 */
export function hasStarted(match: Pick<Match, 'status' | 'phase'>): boolean {
  if (match.status === 'live') return true;
  return match.status === 'finished' && match.phase !== 'cancelled';
}

/** Line-ups are usable only when both sides have a starting XI. */
export function hasLineups(match: MatchDetails): boolean {
  return !!match.lineups && match.lineups.every((l) => l.players.length > 0);
}
