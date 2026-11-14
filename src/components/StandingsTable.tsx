import { StyleSheet, Text, View } from 'react-native';

import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';
import type { StandingRow } from '@/types/football';
import { TeamLogo } from './TeamLogo';

const zoneColor: Record<NonNullable<StandingRow['zone']>, string> = {
  champions: colors.primary,
  europa: colors.europa,
  relegation: colors.relegation,
};

/** Compact league table: rank · team · played · goal diff · points. Highlights `highlightIds`. */
export function StandingsTable({ rows, highlightIds = [] }: { rows: StandingRow[]; highlightIds?: number[] }) {
  return (
    <View style={styles.card}>
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.rank, styles.head]}>{ar.table.rank}</Text>
        <Text style={[styles.teamHead, styles.head]}>{ar.table.team}</Text>
        <Text style={[styles.num, styles.head]}>{ar.table.played}</Text>
        <Text style={[styles.num, styles.head]}>{ar.table.gd}</Text>
        <Text style={[styles.num, styles.head]}>{ar.table.points}</Text>
      </View>
      {rows.map((r) => {
        const gd = r.goalsFor - r.goalsAgainst;
        const highlighted = highlightIds.includes(r.team.id);
        return (
          <View key={r.team.id} style={[styles.row, highlighted && styles.highlight]}>
            <View style={[styles.zone, r.zone && { backgroundColor: zoneColor[r.zone] }]} />
            <Text style={styles.rank}>{r.rank}</Text>
            <View style={styles.team}>
              <TeamLogo team={r.team} size="sm" />
              <Text style={styles.teamName} numberOfLines={1}>
                {r.team.name}
              </Text>
            </View>
            <Text style={styles.num}>{r.played}</Text>
            {/* LTR isolate keeps the sign next to the number in RTL. */}
            <Text style={styles.num}>{`⁦${gd > 0 ? `+${gd}` : gd}⁩`}</Text>
            <Text style={[styles.num, styles.points]}>{r.points}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  headerRow: {
    minHeight: 36,
    borderTopWidth: 0,
    backgroundColor: colors.surfaceElevated,
  },
  highlight: {
    backgroundColor: colors.primarySoft,
  },
  zone: {
    position: 'absolute',
    start: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  head: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  rank: {
    width: 22,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  teamHead: {
    flex: 1,
    marginStart: spacing.sm,
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginStart: spacing.sm,
  },
  teamName: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  num: {
    width: 36,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  points: {
    color: colors.text,
    fontWeight: '800',
  },
});
