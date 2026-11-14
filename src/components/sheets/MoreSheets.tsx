import { StyleSheet, Text, View } from 'react-native';

import { nationalTeams } from '@/data/mock/nationsLeague';
import { mockTransfers } from '@/data/mock/transfers';
import { ar } from '@/i18n/ar';
import {
  useSettings,
  type MatchSort,
  type NotificationKey,
  type TimeFormat,
} from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';
import { TeamLogo } from '../TeamLogo';
import { BottomSheet } from '../ui/BottomSheet';
import { HapticPressable } from '../ui/HapticPressable';
import { Icon } from '../ui/Icon';
import { OptionList, ToggleRow } from '../ui/OptionList';

const s = ar.sheets;

export type MoreSheet = 'favorites' | 'transfers' | 'language' | 'notifications' | 'timing' | 'sort' | 'widgets';

interface Props {
  open: MoreSheet | null;
  onClose: () => void;
}

/** Every bottom sheet reachable from the "المزيد" tab. */
export function MoreSheets({ open, onClose }: Props) {
  const settings = useSettings();

  return (
    <>
      <BottomSheet
        visible={open === 'favorites'}
        onClose={onClose}
        title={ar.more.favorites}
        subtitle={`${s.favorites.subtitle} · ${s.favorites.count(settings.favorites.length)}`}
      >
        {Object.values(nationalTeams).map((team) => {
          const fav = settings.favorites.includes(team.id);
          return (
            <HapticPressable
              key={team.id}
              feedback="impact"
              onPress={() => settings.toggleFavorite(team.id)}
              style={[styles.row, fav && styles.rowActive]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: fav }}
            >
              <TeamLogo team={team} size="md" />
              <Text style={styles.rowLabel}>{team.name}</Text>
              <Icon name="star" active={fav} color={fav ? colors.primary : colors.textMuted} />
            </HapticPressable>
          );
        })}
      </BottomSheet>

      <BottomSheet
        visible={open === 'transfers'}
        onClose={onClose}
        title={ar.more.transfers}
        subtitle={`${s.transfers.subtitle} · ${s.demoData}`}
      >
        {mockTransfers.map((t) => (
          <View key={t.id} style={styles.transfer}>
            <View style={styles.transferTop}>
              <Text style={styles.player}>{t.player}</Text>
              <Text style={styles.muted}>{t.date}</Text>
            </View>
            <Text style={styles.muted}>{t.position}</Text>
            <View style={styles.transferRoute}>
              <Text style={styles.club}>{t.from}</Text>
              <Icon name="chevronLeft" size="sm" color={colors.primary} />
              <Text style={styles.club}>{t.to}</Text>
              <View style={styles.fee}>
                <Text style={styles.feeText}>
                  {t.fee === 'loan' ? s.transfers.loan : t.fee === 'free' ? s.transfers.free : t.fee}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </BottomSheet>

      <BottomSheet visible={open === 'language'} onClose={onClose} title={ar.more.language}>
        <OptionList
          options={[
            { value: 'ar', label: s.language.arabic, icon: 'language' },
            {
              value: 'en',
              label: s.language.english,
              description: s.language.englishDesc,
              icon: 'language',
              disabled: true,
            },
          ]}
          selected="ar"
          onSelect={onClose}
        />
      </BottomSheet>

      <BottomSheet
        visible={open === 'notifications'}
        onClose={onClose}
        title={ar.more.notifications}
        subtitle={s.notifications.subtitle}
      >
        {(['kickoff', 'goals', 'final', 'news'] as NotificationKey[]).map((key) => (
          <ToggleRow
            key={key}
            icon="notifications"
            label={s.notifications[key]}
            value={settings.notifications[key]}
            onValueChange={(v) => settings.setNotification(key, v)}
          />
        ))}
        <Text style={styles.note}>{s.notifications.note}</Text>
      </BottomSheet>

      <BottomSheet visible={open === 'timing'} onClose={onClose} title={ar.more.matchTiming}>
        <OptionList<TimeFormat>
          options={[
            { value: '12h', label: s.timing.h12, description: s.timing.h12Desc, icon: 'time' },
            { value: '24h', label: s.timing.h24, description: s.timing.h24Desc, icon: 'time' },
          ]}
          selected={settings.timeFormat}
          onSelect={(v) => {
            settings.update('timeFormat', v);
            onClose();
          }}
        />
      </BottomSheet>

      <BottomSheet visible={open === 'sort'} onClose={onClose} title={ar.more.sortMatches}>
        <OptionList<MatchSort>
          options={[
            { value: 'league', label: s.sort.league, description: s.sort.leagueDesc, icon: 'trophy' },
            { value: 'time', label: s.sort.time, description: s.sort.timeDesc, icon: 'time' },
            { value: 'live-first', label: s.sort.liveFirst, description: s.sort.liveFirstDesc, icon: 'matches' },
          ]}
          selected={settings.sortBy}
          onSelect={(v) => {
            settings.update('sortBy', v);
            onClose();
          }}
        />
      </BottomSheet>

      <BottomSheet visible={open === 'widgets'} onClose={onClose} title={ar.more.widgets}>
        <View style={styles.widgetPreview}>
          <Icon name="widgets" active size={40} />
          <Text style={styles.widgetText}>{s.widgets.body}</Text>
          <View style={styles.soon}>
            <Text style={styles.soonText}>{s.soon}</Text>
          </View>
        </View>
        <Text style={styles.note}>{s.widgets.note}</Text>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  rowLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  transfer: {
    gap: 4,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'flex-start',
  },
  transferTop: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  player: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  muted: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  transferRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  club: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  fee: {
    marginStart: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  feeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  note: {
    alignSelf: 'flex-start',
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  widgetPreview: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  widgetText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  soon: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  soonText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
});
