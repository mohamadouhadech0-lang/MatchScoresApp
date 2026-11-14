import { StyleSheet, Text, View } from 'react-native';

import { TeamLogo } from '@/components/TeamLogo';
import type { Scorer } from '@/data/mock/matchExtras';
import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';

const t = ar.matchDetails2;

export function SectionTitle({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {trailing ? <Text style={styles.sectionTrailing}>{trailing}</Text> : null}
    </View>
  );
}

// ───────────── Scorers ─────────────

export function ScorersList({ scorers }: { scorers: Scorer[] }) {
  return (
    <View style={styles.section}>
      <SectionTitle title={t.scorers} />
      <View style={styles.card}>
        {scorers.map((s) => (
          <View key={s.rank} style={styles.scorerRow}>
            <Text style={[styles.scorerRank, s.rank <= 3 && { color: colors.primary }]}>{s.rank}</Text>
            <TeamLogo team={s.team} size="md" />
            <View style={styles.scorerTexts}>
              <Text style={styles.scorerName}>{s.name}</Text>
              <Text style={styles.scorerTeam}>{s.team.name}</Text>
            </View>
            <View style={styles.scorerStat}>
              <Text style={styles.scorerGoals}>{s.goals}</Text>
              <Text style={styles.scorerUnit}>{t.goals}</Text>
            </View>
            <View style={styles.scorerStat}>
              <Text style={styles.scorerAssists}>{s.assists}</Text>
              <Text style={styles.scorerUnit}>{t.assists}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionTrailing: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  scorerRank: {
    width: 20,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  scorerTexts: {
    flex: 1,
    alignItems: 'flex-start',
  },
  scorerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  scorerTeam: {
    color: colors.textMuted,
    fontSize: 12,
  },
  scorerStat: {
    width: 44,
    alignItems: 'center',
  },
  scorerGoals: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  scorerAssists: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  scorerUnit: {
    color: colors.textMuted,
    fontSize: 10,
  },
});
