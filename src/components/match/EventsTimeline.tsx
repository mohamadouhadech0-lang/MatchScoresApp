import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { memo, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';
import type { MatchDetails, MatchEvent } from '@/types/football';

const t = ar.timeline;
const GOAL_TYPES = new Set<MatchEvent['type']>(['goal', 'penalty_goal', 'own_goal']);
const CARD_TYPES = new Set<MatchEvent['type']>(['yellow_card', 'second_yellow', 'red_card']);

type Filter = 'all' | 'goals' | 'cards' | 'subs';

const matchesFilter = (e: MatchEvent, f: Filter) =>
  f === 'all' ||
  (f === 'goals' && (GOAL_TYPES.has(e.type) || e.type === 'missed_penalty')) ||
  (f === 'cards' && CARD_TYPES.has(e.type)) ||
  (f === 'subs' && e.type === 'substitution');

/** Absolute order of an event: 45+2' sorts after 45' and before 46'. */
const sortKey = (e: MatchEvent) => e.minute * 100 + (e.extraMinute ?? 0);
const minuteLabel = (e: MatchEvent) => (e.extraMinute ? `${e.minute}+${e.extraMinute}'` : `${e.minute}'`);

// ───────────── Glyphs ─────────────

/**
 * Event pictograms. MaterialCommunityIcons (bundled with @expo/vector-icons, works in Expo Go) has
 * the classic football and bold arrows that Ionicons lacks, so the timeline uses it directly.
 */
const Ball = ({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) => (
  <MaterialCommunityIcons name="soccer" size={size} color={color} />
);

const SubArrow = ({ dir, size = 14 }: { dir: 'in' | 'out'; size?: number }) => (
  <MaterialCommunityIcons
    name={dir === 'in' ? 'arrow-up-bold' : 'arrow-down-bold'}
    size={size}
    color={dir === 'in' ? colors.primary : colors.live}
  />
);

/** Small corner badge on a glyph ("P" for penalties, ✕ for a miss). */
function Badge({ children, tone }: { children: ReactNode; tone: 'primary' | 'live' }) {
  return <View style={[styles.badge, tone === 'live' && styles.badgeLive]}>{children}</View>;
}

function Card({ color, offset = 0, rotate = 8 }: { color: string; offset?: number; rotate?: number }) {
  return (
    <View
      style={[styles.card, { backgroundColor: color, transform: [{ translateX: offset }, { rotate: `${rotate}deg` }] }]}
    />
  );
}

/** Pictogram per event type: ⚽ ball, 🟨 / 🟥 cards, green ↑ + red ↓ for substitutions. */
function EventGlyph({ type }: { type: MatchEvent['type'] }) {
  switch (type) {
    case 'goal':
      return (
        <View style={[styles.glyph, styles.glyphGoal]}>
          <Ball />
        </View>
      );
    case 'penalty_goal':
      return (
        <View style={[styles.glyph, styles.glyphGoal]}>
          <Ball />
          <Badge tone="primary">
            <Text style={styles.badgeText}>P</Text>
          </Badge>
        </View>
      );
    case 'own_goal':
      return (
        <View style={[styles.glyph, styles.glyphOwnGoal]}>
          <Ball color={colors.live} />
        </View>
      );
    case 'missed_penalty':
      return (
        <View style={[styles.glyph, styles.glyphMissed]}>
          <Ball color={colors.textMuted} />
          <Badge tone="live">
            <MaterialCommunityIcons name="close-thick" size={9} color="#FFFFFF" />
          </Badge>
        </View>
      );
    case 'yellow_card':
      return (
        <View style={styles.glyph}>
          <Card color={colors.yellowCard} />
        </View>
      );
    case 'second_yellow':
      return (
        <View style={styles.glyph}>
          <Card color={colors.yellowCard} offset={-4} rotate={-6} />
          <View style={styles.cardStack}>
            <Card color={colors.redCard} offset={4} rotate={10} />
          </View>
        </View>
      );
    case 'red_card':
      return (
        <View style={styles.glyph}>
          <Card color={colors.redCard} />
        </View>
      );
    case 'substitution':
      return (
        <View style={[styles.glyph, styles.glyphSub]}>
          <SubArrow dir="in" />
          <SubArrow dir="out" />
        </View>
      );
  }
}

/** Chip icon per filter, same pictograms as the timeline. Tinted with the chip's text color. */
function FilterIcon({ filter, active }: { filter: Filter; active: boolean }) {
  const tint = active ? colors.background : colors.textSecondary;
  switch (filter) {
    case 'all':
      return <MaterialCommunityIcons name="format-list-bulleted" size={15} color={tint} />;
    case 'goals':
      return <Ball size={15} color={active ? colors.background : colors.text} />;
    case 'cards':
      // Stays yellow on the green active chip; the dark outline keeps it crisp there.
      return <View style={[styles.chipCard, active && styles.chipCardActive]} />;
    case 'subs':
      return <MaterialCommunityIcons name="swap-vertical-bold" size={15} color={tint} />;
  }
}

// ───────────── Rows ─────────────

interface Row {
  event: MatchEvent;
  /** Score right after this goal (goals only). */
  score?: [number, number];
}

const EventBody = memo(function EventBody({ event, isHome }: { event: MatchEvent; isHome: boolean }) {
  const align = isHome ? styles.alignStart : styles.alignEnd;

  if (event.type === 'substitution') {
    // `player` = coming on, `relatedPlayer` = going off.
    return (
      <View style={[styles.texts, align]}>
        <View style={styles.subLine}>
          <SubArrow dir="in" size={13} />
          <Text style={[styles.player, styles.subIn]} numberOfLines={1}>
            {event.player}
          </Text>
        </View>
        {event.relatedPlayer ? (
          <View style={styles.subLine}>
            <SubArrow dir="out" size={13} />
            <Text style={[styles.secondary, styles.subOut]} numberOfLines={1}>
              {event.relatedPlayer}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  const note =
    event.type === 'penalty_goal'
      ? t.penalty
      : event.type === 'own_goal'
        ? t.ownGoal
        : event.type === 'missed_penalty'
          ? t.missedPenalty
          : event.type === 'second_yellow'
            ? ar.events.second_yellow
            : event.relatedPlayer && GOAL_TYPES.has(event.type)
              ? `${t.assist}: ${event.relatedPlayer}`
              : undefined;

  return (
    <View style={[styles.texts, align]}>
      <Text style={[styles.player, GOAL_TYPES.has(event.type) && styles.playerGoal]} numberOfLines={1}>
        {event.player}
      </Text>
      {note ? (
        <Text style={styles.secondary} numberOfLines={1}>
          {note}
        </Text>
      ) : null}
    </View>
  );
});

function TimelineRow({ row, homeId }: { row: Row; homeId: number }) {
  const { event, score } = row;
  const isHome = event.teamId === homeId;
  const side = (
    <View style={[styles.side, isHome ? styles.sideHome : styles.sideAway]}>
      <EventGlyph type={event.type} />
      <EventBody event={event} isHome={isHome} />
      {score && (
        <View style={styles.scorePill}>
          {/* Home score on the right (RTL), each number in its own node. */}
          <Text style={[styles.scoreText, isHome && styles.scoreHighlight]}>{score[0]}</Text>
          <Text style={styles.scoreDash}>-</Text>
          <Text style={[styles.scoreText, !isHome && styles.scoreHighlight]}>{score[1]}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.row}>
      <View style={styles.half}>{isHome ? side : null}</View>
      <View style={styles.center}>
        <View style={styles.axis} />
        <View style={[styles.minute, GOAL_TYPES.has(event.type) && styles.minuteGoal]}>
          <Text style={[styles.minuteText, GOAL_TYPES.has(event.type) && styles.minuteTextGoal]}>
            {minuteLabel(event)}
          </Text>
        </View>
      </View>
      <View style={styles.half}>{isHome ? null : side}</View>
    </View>
  );
}

function Marker({ label, score, live }: { label: string; score?: [number, number]; live?: boolean }) {
  return (
    <View style={styles.markerRow}>
      <View style={styles.markerLine} />
      <View style={[styles.marker, live && styles.markerLive]}>
        {live && <View style={styles.liveDot} />}
        <Text style={[styles.markerText, live && styles.markerTextLive]}>{label}</Text>
        {score && (
          // Separate nodes so the home score stays on the right, like the rest of the app.
          <View style={styles.markerScoreRow}>
            <Text style={[styles.markerScore, live && styles.markerTextLive]}>{score[0]}</Text>
            <Text style={styles.markerScore}>-</Text>
            <Text style={[styles.markerScore, live && styles.markerTextLive]}>{score[1]}</Text>
          </View>
        )}
      </View>
      <View style={styles.markerLine} />
    </View>
  );
}

// ───────────── Timeline ─────────────

/**
 * SofaScore-style two-sided timeline, newest first:
 * home team on the right, away on the left (RTL), minute bubble on the central axis,
 * running score after every goal, half-time / full-time markers and type filters.
 */
export function EventsTimeline({ match }: { match: MatchDetails }) {
  const [filter, setFilter] = useState<Filter>('all');

  const { rows, halfTimeScore } = useMemo(() => {
    const chronological = [...match.events].sort((a, b) => sortKey(a) - sortKey(b));
    let home = 0;
    let away = 0;
    let ht: [number, number] = [0, 0];
    const out: Row[] = [];
    for (const e of chronological) {
      if (GOAL_TYPES.has(e.type)) {
        if (e.teamId === match.homeTeam.id) home++;
        else away++;
        out.push({ event: e, score: [home, away] });
      } else {
        out.push({ event: e });
      }
      if (e.minute <= 45) ht = [home, away];
    }
    return { rows: out, halfTimeScore: ht };
  }, [match.events, match.homeTeam.id]);

  const visible = rows.filter((r) => matchesFilter(r.event, filter));
  const firstHalf = visible.filter((r) => r.event.minute <= 45).reverse();
  const secondHalf = visible.filter((r) => r.event.minute > 45).reverse();
  const reachedSecondHalf =
    match.status === 'finished' ||
    match.phase === 'second_half' ||
    match.phase === 'extra_time' ||
    match.phase === 'penalties' ||
    secondHalf.length > 0;
  const finalScore: [number, number] = [match.score.home ?? 0, match.score.away ?? 0];

  if (match.status === 'scheduled') {
    return (
      <View style={styles.empty}>
        <Icon name="time" size="lg" color={colors.textMuted} />
        <Text style={styles.emptyText}>{t.notStarted}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.filters}>
        {(Object.keys(t.filters) as Filter[]).map((f) => {
          const active = f === filter;
          const count = f === 'all' ? rows.length : rows.filter((r) => matchesFilter(r.event, f)).length;
          return (
            <HapticPressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filter, active && styles.filterActive]}
              accessibilityRole="tab"
              accessibilityLabel={`${t.filters[f]} ${count}`}
              accessibilityState={{ selected: active }}
            >
              <FilterIcon filter={f} active={active} />
              {/* Type chips are icon + count ("⚽ 2"); only "الكل" keeps its word. Too narrow for both. */}
              {f === 'all' ? (
                <Text style={[styles.filterText, active && styles.filterTextActive]} numberOfLines={1}>
                  {t.filters[f]}
                </Text>
              ) : null}
              <View style={[styles.filterCountPill, active && styles.filterCountPillActive]}>
                <Text style={[styles.filterCount, active && styles.filterTextActive]}>{count}</Text>
              </View>
            </HapticPressable>
          );
        })}
      </View>

      <View style={styles.board}>
        {match.status === 'finished' ? (
          <Marker label={t.fullTime} score={finalScore} />
        ) : (
          <Marker label={`${t.live} ${match.minute ?? ''}'`} score={finalScore} live />
        )}

        {secondHalf.map((r) => (
          <TimelineRow key={r.event.id} row={r} homeId={match.homeTeam.id} />
        ))}

        {reachedSecondHalf && <Marker label={t.halfTime} score={halfTimeScore} />}

        {firstHalf.map((r) => (
          <TimelineRow key={r.event.id} row={r} homeId={match.homeTeam.id} />
        ))}

        <Marker label={t.kickoff} />

        {visible.length === 0 && <Text style={styles.noneText}>{t.noneForFilter}</Text>}
      </View>
    </View>
  );
}

const AXIS = 'rgba(255,255,255,0.08)';

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  filterActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  filterCountPill: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  filterCountPillActive: {
    backgroundColor: 'rgba(13, 17, 23, 0.18)',
  },
  filterCount: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  chipCard: {
    width: 10,
    height: 13,
    borderRadius: 2,
    backgroundColor: colors.yellowCard,
    transform: [{ rotate: '8deg' }],
  },
  chipCardActive: {
    borderWidth: 1,
    borderColor: 'rgba(13, 17, 23, 0.35)',
  },
  filterTextActive: {
    color: colors.background,
  },
  board: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 56,
  },
  half: {
    flex: 1,
    justifyContent: 'center',
  },
  center: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  axis: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: AXIS,
  },
  minute: {
    minWidth: 28,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.capsule,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteGoal: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  minuteText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  minuteTextGoal: {
    color: colors.primary,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  // In RTL the home half is on the right: glyph sits at the outer edge, text towards the axis.
  sideHome: {},
  sideAway: {
    flexDirection: 'row-reverse',
  },
  glyph: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphGoal: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.45)',
  },
  glyphOwnGoal: {
    backgroundColor: colors.liveSoft,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  glyphMissed: {
    backgroundColor: colors.surfaceElevated,
  },
  glyphSub: {
    // Arrows read "in ↑ then out ↓" left to right regardless of the RTL layout.
    direction: 'ltr',
    flexDirection: 'row',
    gap: 0,
    backgroundColor: colors.surfaceElevated,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeLive: {
    backgroundColor: colors.live,
  },
  badgeText: {
    color: colors.background,
    fontSize: 8,
    fontWeight: '900',
  },
  card: {
    width: 14,
    height: 19,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardStack: {
    position: 'absolute',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  player: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  playerGoal: {
    fontWeight: '900',
  },
  secondary: {
    color: colors.textMuted,
    fontSize: 11,
  },
  subLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  subIn: {
    color: colors.primary,
  },
  subOut: {
    color: colors.live,
  },
  scorePill: {
    direction: 'rtl',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.capsule,
  },
  scoreText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  scoreHighlight: {
    color: colors.primary,
  },
  scoreDash: {
    color: colors.textMuted,
    fontSize: 11,
  },
  markerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  markerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  marker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
  },
  markerLive: {
    backgroundColor: colors.primarySoft,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  markerText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  markerTextLive: {
    color: colors.primary,
  },
  markerScoreRow: {
    direction: 'rtl',
    flexDirection: 'row',
    gap: 3,
  },
  markerScore: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  noneText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
