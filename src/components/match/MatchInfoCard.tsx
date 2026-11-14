import { router } from 'expo-router';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';

import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ar } from '@/i18n/ar';
import type { TimeFormat } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';
import type { MatchDetails } from '@/types/football';
import { formatDayTitleUtc, formatKickoff, formatKickoffUtc } from '@/utils/format';
import { SectionTitle } from './MatchSections';

const t = ar.matchDetails2.info;

interface InfoRow {
  key: string;
  icon: IconName;
  label: string;
  value?: string;
  /** Second line under the value (city, referee nationality…). */
  detail?: string;
  /** Small crest/logo shown before the value. */
  image?: string;
  onPress?: () => void;
  a11yHint?: string;
}

function Row({ row, last }: { row: InfoRow; last: boolean }) {
  const content = (
    <>
      {/* Right side (RTL): icon + field name — never shrinks, so labels don't wrap. */}
      <View style={styles.labelSide}>
        <View style={styles.iconBox}>
          <Icon name={row.icon} size={16} color={colors.primary} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {row.label}
        </Text>
      </View>

      {/* Left side: value (+ optional detail) — shrinks and wraps to 2 lines instead of overlapping. */}
      <View style={styles.valueSide}>
        <View style={styles.valueLine}>
          {row.image ? <Image source={{ uri: row.image }} style={styles.valueImage} resizeMode="contain" /> : null}
          <Text style={styles.value} numberOfLines={2}>
            {row.value}
          </Text>
        </View>
        {row.detail ? (
          <Text style={styles.detail} numberOfLines={2}>
            {row.detail}
          </Text>
        ) : null}
      </View>

      {row.onPress ? (
        <View style={styles.chevron}>
          <Icon name="chevronLeft" size={16} color={colors.textMuted} />
        </View>
      ) : null}
    </>
  );

  const style = [styles.row, !last && styles.rowDivider];
  return row.onPress ? (
    <HapticPressable
      onPress={row.onPress}
      pressedOpacity={1}
      style={({ pressed }) => [style, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${row.label}: ${row.value}`}
      accessibilityHint={row.a11yHint}
    >
      {content}
    </HapticPressable>
  ) : (
    <View style={style} accessible accessibilityLabel={`${row.label}: ${row.value}`}>
      {content}
    </View>
  );
}

/**
 * "معلومات اللقاء": one card of label/value rows, filled from `MatchDetails` whatever the source
 * (mock or API). Optional rows without data are omitted — APIs often have no venue/referee and
 * never a channel or commentator — except the first leg, which shows "—" when there is none.
 */
export function MatchInfoCard({ match, timeFormat }: { match: MatchDetails; timeFormat: TimeFormat }) {
  const venueQuery = [match.venue, match.venueCity].filter(Boolean).join(', ');

  const allRows: InfoRow[] = [
    {
      key: 'league',
      icon: 'trophy',
      label: t.league,
      value: match.league.name,
      image: match.league.logo,
      onPress: () => router.push({ pathname: '/league/[id]', params: { id: String(match.league.id) } }),
      a11yHint: t.openLeague,
    },
    { key: 'round', icon: 'round', label: t.round, value: match.round },
    { key: 'firstLeg', icon: 'matches', label: t.firstLeg, value: match.firstLeg ?? t.none },
    {
      key: 'venue',
      icon: 'venue',
      label: t.venue,
      value: match.venue,
      detail: match.venueCity,
      onPress: venueQuery
        ? () =>
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQuery)}`).catch(
              () => undefined,
            )
        : undefined,
      a11yHint: t.openMap,
    },
    { key: 'channel', icon: 'tv', label: t.channel, value: match.channel },
    { key: 'commentator', icon: 'community', label: t.commentator, value: match.commentator },
    { key: 'referee', icon: 'referee', label: t.referee, value: match.referee, detail: match.refereeCountry },
    {
      key: 'timeGmt',
      icon: 'time',
      label: t.timeGmt,
      // LTR isolate keeps "GMT +0" after the time in the RTL layout.
      value: `${formatKickoffUtc(match.kickoff, timeFormat)} \u2066${t.gmt}\u2069`,
      detail: `${formatDayTitleUtc(match.kickoff)} · ${t.localTime(formatKickoff(match.kickoff, timeFormat))}`,
    },
  ];
  const rows = allRows.filter((r) => !!r.value);

  return (
    <View style={styles.section}>
      <SectionTitle title={t.title} />
      <View style={styles.card}>
        {rows.map((row, i) => (
          <Row key={row.key} row={row} last={i === rows.length - 1} />
        ))}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceElevated,
  },
  labelSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  valueSide: {
    flex: 1,
    // In RTL, flex-end is the left edge: values hug the left side of the card.
    alignItems: 'flex-end',
    gap: 2,
  },
  valueLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  valueImage: {
    width: 18,
    height: 18,
  },
  value: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  detail: {
    color: colors.textMuted,
    fontSize: 12,
  },
  chevron: {
    width: 16,
    alignItems: 'center',
  },
});
