import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ar } from '@/i18n/ar';
import { colors } from '@/theme';
import type { Match } from '@/types/football';

const RING = 72;
const STROKE = 5;

/** Regulation time the ring represents (minutes). */
const FULL_TIME = 90;

/** Start / length (minutes) of the period a live match is in. */
function period(match: Match): { start: number; length: number } | null {
  switch (match.phase) {
    case 'first_half':
      return { start: 0, length: 45 };
    case 'second_half':
      return { start: 45, length: 45 };
    case 'extra_time':
      return { start: 90, length: 30 };
    default:
      return null; // half time, penalties: clock stopped
  }
}

/**
 * One running match clock for both the "26:03" label and the ring.
 *
 * Providers only send the current minute ("27'" = the 27th minute in progress = 26:xx), and only
 * every poll (30 s mock, 5 min real API). From the last minute received the clock keeps running
 * second by second, so it never freezes between polls; a new minute from the API re-anchors it.
 * It stops at the end of the period (45:00 / 90:00 / 120:00) while stoppage time is played.
 *
 * Ring = share of the full 90 minutes: 0' → 0%, 45' (half time) → 50%, 90' → 100%. Extra time keeps it full.
 */
function useMatchClock(match: Match): { label: string; progress: number } {
  const minute = match.minute ?? 0;
  const p = period(match);
  const running = p !== null;
  // Seconds since this minute was received; restarts whenever a new minute arrives.
  const [tick, setTick] = useState({ minute, seconds: 0 });

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () =>
        setTick((prev) => (prev.minute === minute ? { minute, seconds: prev.seconds + 1 } : { minute, seconds: 0 })),
      1000,
    );
    return () => clearInterval(timer);
  }, [running, minute]);

  if (!p) {
    // Half time shows 45:00 with a full ring; penalties keep the last minute.
    const stopped = match.phase === 'half_time' ? 45 : minute;
    return { label: `${String(stopped).padStart(2, '0')}:00`, progress: Math.min(1, stopped / FULL_TIME) };
  }

  const since = tick.minute === minute ? tick.seconds : 0;
  const end = (p.start + p.length) * 60;
  const elapsed = Math.min(end, Math.max(p.start * 60, Math.max(0, minute - 1) * 60 + since));
  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;
  return {
    label: `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
    progress: Math.min(1, elapsed / (FULL_TIME * 60)),
  };
}

/**
 * Running "26:03" clock inside a ring filled to the share of the 90 minutes played.
 * Shared by the match header (large) and the match cards in the list (small), so both always agree.
 */
export function ClockRing({
  match,
  size,
  stroke,
  fontSize,
  showDot = false,
}: {
  match: Match;
  size: number;
  stroke: number;
  fontSize: number;
  showDot?: boolean;
}) {
  const { label, progress } = useMatchClock(match);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const c = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={match.phase === 'half_time' ? colors.yellowCard : colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - progress)}
          // Start at 12 o'clock and run clockwise.
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.clock, { fontSize }, match.phase === 'half_time' && styles.clockBreak]}>{label}</Text>
        {showDot ? <View style={styles.liveDot} /> : null}
      </View>
    </View>
  );
}

/** Live header centre: home score · ring timer · away score, with the period name below. */
export function LiveScoreboard({ match }: { match: Match }) {
  const { label: clock } = useMatchClock(match);
  const periodName = ar.phase[match.phase];

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`${match.score.home ?? 0} - ${match.score.away ?? 0}، ${periodName} ${clock}`}
    >
      <View style={styles.row}>
        <Text style={styles.score}>{match.score.home ?? 0}</Text>

        <ClockRing match={match} size={RING} stroke={STROKE} fontSize={16} showDot />

        <Text style={styles.score}>{match.score.away ?? 0}</Text>
      </View>
      <Text style={[styles.period, match.phase === 'half_time' && styles.periodBreak]}>{periodName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
  },
  row: {
    // Separate nodes so the home score stays on the right (RTL) like the rest of the app.
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  score: {
    minWidth: 26,
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    gap: 3,
  },
  clock: {
    // Digits read left → right like any clock.
    writingDirection: 'ltr',
    color: colors.primary,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  clockBreak: {
    color: colors.yellowCard,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.live,
  },
  period: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  periodBreak: {
    color: colors.yellowCard,
  },
});
