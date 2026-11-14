import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { TeamLogo } from '@/components/TeamLogo';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';
import type { MatchDetails, StatKey, Team } from '@/types/football';
import { SectionTitle } from './MatchSections';

const t = ar.statsSummary;
const RING = 64;
const STROKE = 4;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

/** The three headline numbers shown between the crests. */
const KEYS: StatKey[] = ['shots_total', 'offsides', 'fouls'];

/** Crest inside a ring filled to the team's possession share. */
function PossessionRing({ team, percent, color }: { team: Team; percent: number; color: string }) {
  return (
    <View style={styles.side}>
      <View style={styles.ring}>
        <Svg width={RING} height={RING}>
          <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={colors.border} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={CIRC * (1 - percent / 100)}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        </Svg>
        <View style={styles.logo}>
          <TeamLogo team={team} size="lg" />
        </View>
      </View>
      <Text style={[styles.percent, { color }]}>{`${percent}%`}</Text>
      <Text style={styles.possessionLabel}>{ar.stats.possession}</Text>
    </View>
  );
}

/**
 * Compact statistics card for the "التفاصيل" tab (live or finished matches): possession rings
 * around both crests, three key numbers in the middle and a "أظهر المزيد" button that opens
 * the full statistics tab. Renders nothing when the provider has no statistics yet.
 */
export function StatsSummaryCard({ match, onShowMore }: { match: MatchDetails; onShowMore: () => void }) {
  if (match.statistics.length === 0) return null;
  const stat = (key: StatKey) => match.statistics.find((s) => s.key === key);
  const possession = stat('possession');
  const home = possession ? Math.round(possession.home) : 50;
  const away = possession ? 100 - home : 50;
  const rows = KEYS.map(stat).filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <View style={styles.section}>
      <SectionTitle title={t.title} />
      <View style={styles.card}>
        <View style={styles.body}>
          {/* RTL: home on the right, away on the left. */}
          <PossessionRing team={match.homeTeam} percent={home} color={colors.primary} />

          <View style={styles.middle}>
            {rows.map((s) => (
              <View
                key={s.key}
                style={styles.statRow}
                accessible
                accessibilityLabel={`${ar.stats[s.key]}: ${match.homeTeam.name} ${s.home}، ${match.awayTeam.name} ${s.away}`}
              >
                <Text style={[styles.value, s.home > s.away && styles.valueHome]}>{s.home}</Text>
                <Text style={styles.label} numberOfLines={1}>
                  {ar.stats[s.key]}
                </Text>
                <Text style={[styles.value, s.away > s.home && styles.valueAway]}>{s.away}</Text>
              </View>
            ))}
          </View>

          <PossessionRing team={match.awayTeam} percent={away} color={colors.away} />
        </View>

        <HapticPressable
          onPress={onShowMore}
          style={styles.more}
          accessibilityRole="button"
          accessibilityLabel={t.showMore}
        >
          <Text style={styles.moreText}>{t.showMore}</Text>
          <Icon name="chevronLeft" size={16} color={colors.primary} />
        </HapticPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  side: {
    width: 76,
    alignItems: 'center',
    gap: 2,
  },
  ring: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    position: 'absolute',
  },
  percent: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  possessionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  middle: {
    flex: 1,
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.capsule,
  },
  value: {
    minWidth: 24,
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  valueHome: {
    color: colors.primary,
  },
  valueAway: {
    color: colors.away,
  },
  label: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 46,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  moreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
