import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useStandings } from '@/hooks/useStandings';
import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';
import type { League } from '@/types/football';
import { StandingsTable } from './StandingsTable';
import { Icon } from './ui/Icon';

/** League table from the active data source, with loading / error / older-season notices. */
export function RealStandings({ league, highlightIds }: { league: League; highlightIds?: number[] }) {
  const { loading, rows, error, servedSeason, requestedSeason } = useStandings(league);

  if (loading) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || rows.length === 0) {
    return (
      <View style={styles.box}>
        <Icon name="standings" size={36} color={colors.textMuted} />
        <Text style={styles.text}>{ar.realData.standingsUnavailable}</Text>
        {error ? <Text style={styles.detail}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {servedSeason !== undefined && servedSeason !== requestedSeason && (
        <View style={styles.notice}>
          <Icon name="time" size={16} color={colors.yellowCard} />
          <Text style={styles.noticeText}>
            {ar.realData.olderSeason(servedSeason, requestedSeason ?? servedSeason)}
          </Text>
        </View>
      )}
      <StandingsTable rows={rows} highlightIds={highlightIds} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  box: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  detail: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  noticeText: {
    flex: 1,
    color: colors.yellowCard,
    fontSize: 12,
    fontWeight: '600',
  },
});
