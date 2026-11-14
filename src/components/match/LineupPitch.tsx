import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { TeamLogo } from '@/components/TeamLogo';
import { Icon } from '@/components/ui/Icon';
import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';
import type { BenchPlayer, KitColors, Lineup, LineupPlayer, MatchEvent } from '@/types/football';
import { SectionTitle } from './MatchSections';

const t = ar.matchDetails2;
const TOKEN = 38;

const DEFAULT_KIT: { player: KitColors; goalkeeper: KitColors } = {
  player: { background: colors.text, number: colors.background, border: colors.primary },
  goalkeeper: { background: colors.yellowCard, number: colors.background, border: colors.yellowCard },
};

// ───────────── Event marks per player ─────────────

interface Marks {
  goals: number;
  ownGoals: number;
  yellow: boolean;
  red: boolean;
  /** Minute label when the player came on / went off. */
  subIn?: string;
  subOut?: string;
  /** Player replaced (for substitutes who came on). */
  replaced?: string;
}

const nameKey = (name: string) => name.trim().toLowerCase();
const minuteOf = (e: MatchEvent) => (e.extraMinute ? `${e.minute}+${e.extraMinute}'` : `${e.minute}'`);

/**
 * Goals, cards and substitutions per player of `teamId`, matched by name (events carry names,
 * not ids, for every provider). Own goals are listed under the benefiting team, so they are
 * matched against the other side.
 */
function useMarks(events: MatchEvent[], teamId: number): Map<string, Marks> {
  return useMemo(() => {
    const map = new Map<string, Marks>();
    const get = (name: string | undefined) => {
      if (!name) return null;
      const key = nameKey(name);
      let m = map.get(key);
      if (!m) map.set(key, (m = { goals: 0, ownGoals: 0, yellow: false, red: false }));
      return m;
    };
    for (const e of events) {
      const ours = e.teamId === teamId;
      switch (e.type) {
        case 'goal':
        case 'penalty_goal':
          if (ours) get(e.player)!.goals++;
          break;
        case 'own_goal':
          if (!ours) get(e.player)!.ownGoals++;
          break;
        case 'yellow_card':
          if (ours) get(e.player)!.yellow = true;
          break;
        case 'second_yellow':
          if (ours) Object.assign(get(e.player)!, { yellow: true, red: true });
          break;
        case 'red_card':
          if (ours) get(e.player)!.red = true;
          break;
        case 'substitution':
          if (!ours) break;
          Object.assign(get(e.player)!, { subIn: minuteOf(e), replaced: e.relatedPlayer });
          if (e.relatedPlayer) get(e.relatedPlayer)!.subOut = minuteOf(e);
          break;
      }
    }
    return map;
  }, [events, teamId]);
}

function describeMarks(m: Marks | undefined): string {
  if (!m) return '';
  const parts: string[] = [];
  if (m.goals === 1) parts.push(t.marks.goal);
  if (m.goals > 1) parts.push(t.marks.goals(m.goals));
  if (m.ownGoals) parts.push(t.marks.ownGoal);
  if (m.red) parts.push(t.marks.red);
  else if (m.yellow) parts.push(t.marks.yellow);
  if (m.subIn) parts.push(t.marks.subIn(m.subIn));
  if (m.subOut) parts.push(t.marks.subOut(m.subOut));
  return parts.join('، ');
}

// ───────────── Small pictograms (same family as the events timeline) ─────────────

function MiniCard({ color, style }: { color: string; style?: object }) {
  return <View style={[styles.miniCard, { backgroundColor: color }, style]} />;
}

function CardMark({ yellow, red }: { yellow: boolean; red: boolean }) {
  if (yellow && red) {
    return (
      <View style={styles.cardPair}>
        <MiniCard color={colors.yellowCard} style={styles.cardBack} />
        <MiniCard color={colors.redCard} style={styles.cardFront} />
      </View>
    );
  }
  return <MiniCard color={red ? colors.redCard : colors.yellowCard} />;
}

function GoalMark({ goals, ownGoals }: { goals: number; ownGoals: number }) {
  const total = goals + ownGoals;
  return (
    <View style={styles.goalMark}>
      <MaterialCommunityIcons name="soccer" size={12} color={ownGoals && !goals ? colors.live : '#FFFFFF'} />
      {total > 1 ? <Text style={styles.goalCount}>{total}</Text> : null}
    </View>
  );
}

function SubMark({ dir }: { dir: 'in' | 'out' }) {
  return (
    <View style={styles.subMark}>
      <MaterialCommunityIcons
        name={dir === 'in' ? 'arrow-up-bold' : 'arrow-down-bold'}
        size={11}
        color={dir === 'in' ? colors.primary : colors.live}
      />
    </View>
  );
}

// ───────────── Pitch ─────────────

/**
 * Circular player portrait. Falls back to the shirt number in the team's kit colors when the
 * photo is missing or fails to load. Goal / card / substitution marks sit around the circle.
 */
const PlayerToken = memo(function PlayerToken({
  player,
  kit,
  marks,
}: {
  player: LineupPlayer;
  kit: KitColors;
  marks?: Marks;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!player.photo && !failed;
  const extra = describeMarks(marks);

  return (
    <View
      style={styles.player}
      accessible
      accessibilityLabel={`${player.number} ${player.name}${extra ? `، ${extra}` : ''}`}
    >
      {/* Fixed-size anchor: badge and marks are placed relative to the circle, not the column. */}
      <View style={styles.tokenWrap}>
        <View
          style={[
            styles.token,
            { borderColor: kit.border, backgroundColor: showPhoto ? colors.surfaceElevated : kit.background },
          ]}
        >
          {showPhoto ? (
            <Image
              source={{ uri: player.photo }}
              style={styles.photo}
              resizeMode="cover"
              onError={() => setFailed(true)}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Text style={[styles.bigNumber, { color: kit.number }]}>{player.number}</Text>
          )}
        </View>
        {/* Shirt-number badge in kit colors, shown on top of the photo. */}
        {showPhoto && (
          <View style={[styles.badge, { backgroundColor: kit.background, borderColor: kit.border }]}>
            <Text style={[styles.badgeText, { color: kit.number }]}>{player.number}</Text>
          </View>
        )}

        {/* Marks: ⚽ top-left, card top-right, substitution bottom-left of the circle. */}
        {marks && (marks.goals > 0 || marks.ownGoals > 0) ? (
          <View style={styles.markGoal}>
            <GoalMark goals={marks.goals} ownGoals={marks.ownGoals} />
          </View>
        ) : null}
        {marks && (marks.yellow || marks.red) ? (
          <View style={styles.markCard}>
            <CardMark yellow={marks.yellow} red={marks.red} />
          </View>
        ) : null}
        {marks?.subOut || marks?.subIn ? (
          <View style={styles.markSub}>
            <SubMark dir={marks.subOut ? 'out' : 'in'} />
          </View>
        ) : null}
      </View>

      {/* Exact name as returned by the API (e.g. "Y. Bounou", "Brahim Díaz"). */}
      <Text style={styles.name} numberOfLines={2}>
        {player.name}
      </Text>
    </View>
  );
});

/** Half-pitch markings: halfway line + centre circle at the top, penalty area and goal at the bottom. */
function PitchMarkings() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Mowing stripes */}
      <View style={styles.stripes}>
        {Array.from({ length: STRIPES }, (_, i) => (
          <View key={i} style={[styles.stripe, i % 2 === 1 && styles.stripeAlt]} />
        ))}
      </View>
      {/* Soft floodlight: bright centre, gently shaded top / bottom and touch-line edges. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.16)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.2)']}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.14)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.14)']}
        locations={[0, 0.18, 0.82, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Touch lines; the top edge is the halfway line. */}
      <View style={styles.lines}>
        <View style={styles.centerCircle} />
        <View style={styles.centerSpot} />

        <View style={styles.penaltyArcClip}>
          <View style={styles.penaltyArc} />
        </View>
        <View style={styles.penaltyBox} />
        <View style={styles.goalArea} />
        <View style={styles.penaltySpot} />

        <View style={[styles.corner, styles.cornerLeft]} />
        <View style={[styles.corner, styles.cornerRight]} />
      </View>
      <View style={styles.goal} />
    </View>
  );
}

/** Pitch view for one team (no title bar): attack at the top, goalkeeper at the bottom, with event marks. */
export function LineupPitch({ lineup, events = [] }: { lineup: Lineup; events?: MatchEvent[] }) {
  const kit = lineup.kit ?? DEFAULT_KIT;
  const marks = useMarks(events, lineup.team.id);
  const maxLine = Math.max(...lineup.players.map((p) => p.line));
  const rows = Array.from({ length: maxLine + 1 }, (_, i) =>
    lineup.players.filter((p) => p.line === maxLine - i).sort((a, b) => (a.col ?? 0) - (b.col ?? 0)),
  ).filter((row) => row.length > 0);

  return (
    <View style={styles.section}>
      <View style={styles.pitch}>
        <PitchMarkings />
        {rows.map((row) => (
          <View key={`${row[0].line}`} style={styles.row}>
            {row.map((p) => (
              <PlayerToken
                key={p.id ?? `${p.line}-${p.number}`}
                player={p}
                kit={p.line === 0 ? kit.goalkeeper : kit.player}
                marks={marks.get(nameKey(p.name))}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ───────────── Bench ─────────────

function BenchRow({ player, kit, marks, last }: { player: BenchPlayer; kit: KitColors; marks?: Marks; last: boolean }) {
  const played = !!marks?.subIn;
  return (
    <View
      style={[styles.benchRow, !last && styles.benchDivider]}
      accessible
      accessibilityLabel={`${player.number} ${player.name}، ${played ? describeMarks(marks) : t.unusedSub}`}
    >
      <View style={[styles.benchNumber, { backgroundColor: kit.background, borderColor: kit.border }]}>
        <Text style={[styles.benchNumberText, { color: kit.number }]}>{player.number}</Text>
      </View>
      <View style={styles.benchTexts}>
        <Text style={[styles.benchName, !played && styles.benchNameIdle]} numberOfLines={1}>
          {player.name}
        </Text>
        {played ? (
          <Text style={styles.benchDetail} numberOfLines={1}>
            {t.subbedIn(marks!.subIn!, marks!.replaced)}
          </Text>
        ) : null}
      </View>
      <View style={styles.benchMarks}>
        {marks && (marks.goals > 0 || marks.ownGoals > 0) ? (
          <GoalMark goals={marks.goals} ownGoals={marks.ownGoals} />
        ) : null}
        {marks && (marks.yellow || marks.red) ? <CardMark yellow={marks.yellow} red={marks.red} /> : null}
        {played ? (
          <View style={styles.benchSubChip}>
            <MaterialCommunityIcons name="arrow-up-bold" size={12} color={colors.primary} />
            <Text style={styles.benchSubMinute}>{marks!.subIn}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** "البدلاء": players who came on first (by minute), then the unused ones. */
export function LineupBench({ lineup, events = [] }: { lineup: Lineup; events?: MatchEvent[] }) {
  const kit = lineup.kit ?? DEFAULT_KIT;
  const marks = useMarks(events, lineup.team.id);
  const bench = lineup.substitutes ?? [];
  if (bench.length === 0) return null;

  const minute = (p: BenchPlayer) => {
    const m = marks.get(nameKey(p.name))?.subIn;
    return m ? Number.parseInt(m, 10) : Number.POSITIVE_INFINITY;
  };
  const ordered = [...bench].sort((a, b) => minute(a) - minute(b));

  return (
    <View style={styles.section}>
      <SectionTitle title={t.substitutes} trailing={String(bench.length)} />
      <View style={styles.listCard}>
        {ordered.map((p, i) => (
          <BenchRow
            key={p.id ?? p.number}
            player={p}
            kit={p.goalkeeper ? kit.goalkeeper : kit.player}
            marks={marks.get(nameKey(p.name))}
            last={i === ordered.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

// ───────────── Coaches ─────────────

/** Head coach of the selected team, as one row (same card style as the bench list). */
export function CoachCard({ lineup }: { lineup: Lineup }) {
  if (!lineup.coach) return null;
  return (
    <View style={styles.section}>
      <SectionTitle title={t.coach} />
      <View
        style={[styles.listCard, styles.coach]}
        accessible
        accessibilityLabel={`${t.coach} ${lineup.team.name}: ${lineup.coach}`}
      >
        <View style={styles.coachAvatar}>
          <Icon name="person" active size={18} color={colors.primary} />
        </View>
        <View style={styles.benchTexts}>
          <Text style={styles.coachName} numberOfLines={1}>
            {lineup.coach}
          </Text>
          <Text style={styles.coachTeam} numberOfLines={1}>
            {lineup.team.name}
          </Text>
        </View>
        <TeamLogo team={lineup.team} size="sm" />
      </View>
    </View>
  );
}

// ───────────── Styles ─────────────

// Bright, vibrant turf with clearly visible mowing stripes.
const GRASS = '#2E9A4C';
const GRASS_ALT = '#38AC57';
const STRIPES = 12;
const LINE = 'rgba(255,255,255,0.88)';
const LINE_W = 2;
const INSET = 10;
/** Width / height: noticeably taller than wide so the lines breathe. */
const PITCH_RATIO = 0.72;

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  pitch: {
    aspectRatio: PITCH_RATIO,
    // Rows spread over the full height: generous gaps between attack, midfield and defence.
    justifyContent: 'space-evenly',
    borderRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.xs,
    backgroundColor: GRASS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  stripes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stripe: {
    flex: 1,
    backgroundColor: GRASS,
  },
  stripeAlt: {
    backgroundColor: GRASS_ALT,
  },
  lines: {
    position: 'absolute',
    top: 0,
    left: INSET,
    right: INSET,
    bottom: INSET,
    borderWidth: LINE_W,
    borderColor: LINE,
    overflow: 'hidden',
  },
  centerCircle: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: LINE_W,
    borderColor: LINE,
  },
  centerSpot: {
    position: 'absolute',
    top: -3,
    alignSelf: 'center',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LINE,
  },
  penaltyBox: {
    position: 'absolute',
    bottom: -LINE_W,
    alignSelf: 'center',
    width: '60%',
    height: 84,
    borderWidth: LINE_W,
    borderColor: LINE,
  },
  goalArea: {
    position: 'absolute',
    bottom: -LINE_W,
    alignSelf: 'center',
    width: '28%',
    height: 32,
    borderWidth: LINE_W,
    borderColor: LINE,
  },
  penaltySpot: {
    position: 'absolute',
    bottom: 58,
    alignSelf: 'center',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: LINE,
  },
  // The "D": top slice of a circle centred on the penalty spot, just above the box.
  penaltyArcClip: {
    position: 'absolute',
    bottom: 84 - LINE_W,
    alignSelf: 'center',
    width: 84,
    height: 14,
    overflow: 'hidden',
  },
  penaltyArc: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: LINE_W,
    borderColor: LINE,
  },
  corner: {
    position: 'absolute',
    bottom: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: LINE_W,
    borderColor: LINE,
  },
  cornerLeft: {
    left: -10,
  },
  cornerRight: {
    right: -10,
  },
  goal: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    width: '16%',
    height: INSET - 2,
    borderWidth: LINE_W,
    borderTopWidth: 0,
    borderColor: LINE,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  row: {
    // Grid columns run left → right regardless of the RTL screen layout.
    direction: 'ltr',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    // Keep the outer players inside the touch lines.
    paddingHorizontal: INSET + 2,
  },
  // Columns share the row: 5 across fit a 320px pitch, and never grow wider than 72px.
  player: {
    flex: 1,
    maxWidth: 72,
    minWidth: 0,
    alignItems: 'center',
    gap: 3,
  },
  tokenWrap: {
    width: TOKEN,
    height: TOKEN,
  },
  token: {
    width: TOKEN,
    height: TOKEN,
    borderRadius: TOKEN / 2,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  bigNumber: {
    fontSize: 14,
    fontWeight: '900',
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -9,
    minWidth: 18,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  // Mark anchors around the circle (relative to `tokenWrap`).
  markGoal: {
    position: 'absolute',
    top: -6,
    left: -9,
  },
  markCard: {
    position: 'absolute',
    top: -4,
    right: -7,
  },
  markSub: {
    position: 'absolute',
    bottom: -4,
    left: -9,
  },
  goalMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    height: 18,
    minWidth: 18,
    paddingHorizontal: 3,
    borderRadius: 9,
    justifyContent: 'center',
    backgroundColor: 'rgba(13,17,23,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  goalCount: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  miniCard: {
    width: 10,
    height: 13,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(13,17,23,0.5)',
    transform: [{ rotate: '10deg' }],
  },
  cardPair: {
    width: 16,
    height: 15,
  },
  cardBack: {
    position: 'absolute',
    left: 0,
    transform: [{ rotate: '-8deg' }],
  },
  cardFront: {
    position: 'absolute',
    left: 5,
    top: 1,
  },
  subMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,17,23,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  name: {
    alignSelf: 'stretch',
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  listCard: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  benchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  benchDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  benchNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benchNumberText: {
    fontSize: 12,
    fontWeight: '900',
  },
  benchTexts: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  benchName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  benchNameIdle: {
    color: colors.textSecondary,
  },
  benchDetail: {
    color: colors.textMuted,
    fontSize: 11,
  },
  benchMarks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benchSubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  benchSubMinute: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  coach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  coachAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  coachName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  coachTeam: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
