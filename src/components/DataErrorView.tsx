import { StyleSheet, Text, View } from 'react-native';

import { ar } from '@/i18n/ar';
import type { DataErrorKind, DataSourceError } from '@/services/errors';
import type { TimeFormat } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';
import { formatKickoff } from '@/utils/format';
import { EmptyState } from './ui/EmptyState';
import { HapticPressable } from './ui/HapticPressable';
import { Icon, type IconName } from './ui/Icon';

const t = ar.dataErrors;

const ICON: Record<DataErrorKind, IconName> = {
  quota: 'quota',
  rateLimit: 'quota',
  network: 'offline',
  server: 'server',
  auth: 'key',
  suspended: 'key',
  plan: 'hide',
  unknown: 'alert',
};

/** Full-screen explanation + retry, shown when there is nothing to display. */
export function DataErrorView({
  error,
  onRetry,
  timeFormat,
}: {
  error: DataSourceError;
  onRetry: () => void;
  timeFormat: TimeFormat;
}) {
  const copy = t[error.kind];
  return (
    <View style={styles.wrap}>
      <EmptyState icon={ICON[error.kind]} title={copy.title} subtitle={copy.body}>
        {error.kind === 'quota' && error.retryAt ? (
          <View style={styles.resetChip}>
            <Icon name="time" size={14} color={colors.yellowCard} />
            <Text style={styles.resetText}>
              {t.quota.reset(formatKickoff(new Date(error.retryAt).toISOString(), timeFormat))}
            </Text>
          </View>
        ) : null}
        <HapticPressable feedback="impact" onPress={onRetry} style={styles.retry} accessibilityRole="button">
          <Icon name="refresh" size={16} color={colors.background} />
          <Text style={styles.retryText}>{t.retry}</Text>
        </HapticPressable>
      </EmptyState>
    </View>
  );
}

/** Slim banner above a list that is showing saved / previous data. */
export function StaleDataBanner({ error, onRetry }: { error: DataSourceError; onRetry: () => void }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Icon name={ICON[error.kind]} size={16} color={colors.yellowCard} />
      <View style={styles.bannerTexts}>
        <Text style={styles.bannerTitle} numberOfLines={1}>
          {t[error.kind].short}
        </Text>
        <Text style={styles.bannerBody} numberOfLines={1}>
          {t.staleBanner}
        </Text>
      </View>
      <HapticPressable onPress={onRetry} hitSlop={8} style={styles.bannerButton} accessibilityRole="button">
        <Text style={styles.bannerButtonText}>{t.retry}</Text>
      </HapticPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  resetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  resetText: {
    color: colors.yellowCard,
    fontSize: 12,
    fontWeight: '700',
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.25)',
  },
  bannerTexts: {
    flex: 1,
    alignItems: 'flex-start',
  },
  bannerTitle: {
    color: colors.yellowCard,
    fontSize: 12,
    fontWeight: '800',
  },
  bannerBody: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  bannerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
  },
  bannerButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
});
