import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileCard } from '@/components/ProfileCard';
import { SettingsRow } from '@/components/SettingsRow';
import { MoreSheets, type MoreSheet } from '@/components/sheets/MoreSheets';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ar } from '@/i18n/ar';
import { useSettings } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';

const t = ar.more;
const s = ar.sheets;

interface ActionButtonProps {
  label: string;
  icon: IconName;
  background: string;
  foreground: string;
  onPress: () => void;
}

function ActionButton({ label, icon, background, foreground, onPress }: ActionButtonProps) {
  return (
    <HapticPressable
      feedback="impact"
      pressedOpacity={0.85}
      onPress={onPress}
      style={[styles.action, { backgroundColor: background }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} active color={foreground} />
      <Text style={[styles.actionLabel, { color: foreground }]}>{label}</Text>
    </HapticPressable>
  );
}

const sortLabel = { league: s.sort.league, time: s.sort.time, 'live-first': s.sort.liveFirst } as const;

export default function MoreScreen() {
  const settings = useSettings();
  const [sheet, setSheet] = useState<MoreSheet | null>(null);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileCard />

        <View style={styles.actions}>
          <ActionButton
            label={t.favorites}
            icon="star"
            background={colors.purple}
            foreground={colors.text}
            onPress={() => setSheet('favorites')}
          />
          <ActionButton
            label={t.transfers}
            icon="transfers"
            background={colors.primary}
            foreground={colors.background}
            onPress={() => setSheet('transfers')}
          />
        </View>

        <Text style={styles.sectionTitle}>{t.settingsTitle}</Text>

        <View style={styles.list}>
          <SettingsRow
            kind="link"
            icon="language"
            label={t.language}
            value={s.language.arabic}
            onPress={() => setSheet('language')}
          />
          <SettingsRow
            kind="switch"
            icon="darkMode"
            label={t.darkMode}
            value={settings.darkMode}
            onValueChange={(v) => settings.update('darkMode', v)}
          />
          <SettingsRow
            kind="switch"
            icon="comments"
            label={t.showComments}
            value={settings.showComments}
            onValueChange={(v) => settings.update('showComments', v)}
          />
          <SettingsRow
            kind="link"
            icon="notifications"
            label={t.notifications}
            onPress={() => setSheet('notifications')}
          />
          <SettingsRow
            kind="link"
            icon="time"
            label={t.matchTiming}
            value={settings.timeFormat === '12h' ? s.timing.h12 : s.timing.h24}
            onPress={() => setSheet('timing')}
          />
          <SettingsRow
            kind="link"
            icon="sort"
            label={t.sortMatches}
            value={sortLabel[settings.sortBy]}
            onPress={() => setSheet('sort')}
          />
          <SettingsRow kind="link" icon="widgets" label={t.widgets} onPress={() => setSheet('widgets')} />
        </View>
      </ScrollView>

      <MoreSheets open={sheet} onClose={() => setSheet(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    direction: 'rtl',
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: -spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
});
