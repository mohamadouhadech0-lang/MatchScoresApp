import { StyleSheet, Text, View } from 'react-native';

import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';
import { addDays, formatDayTitle, isSameDay } from '@/utils/format';
import { BottomSheet } from '../ui/BottomSheet';
import { HapticPressable } from '../ui/HapticPressable';
import { OptionList } from '../ui/OptionList';

const s = ar.sheets;

// ───────────── Filter ─────────────

export type MatchFilter = 'all' | 'live' | 'scheduled' | 'finished' | 'favorites';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  value: MatchFilter;
  onChange: (value: MatchFilter) => void;
  onToday: () => void;
}

export function FilterSheet({ visible, onClose, value, onChange, onToday }: FilterSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={s.filter.title}>
      <OptionList<MatchFilter | 'today'>
        options={[
          { value: 'all', label: s.filter.all, icon: 'matches' },
          { value: 'today', label: s.filter.today, description: s.filter.todayDesc, icon: 'calendar' },
          { value: 'live', label: s.filter.live, icon: 'time' },
          { value: 'scheduled', label: s.filter.scheduled, icon: 'calendar' },
          { value: 'finished', label: s.filter.finished, icon: 'check' },
          { value: 'favorites', label: s.filter.favorites, icon: 'star' },
        ]}
        selected={value}
        onSelect={(v) => {
          if (v === 'today') {
            onToday();
            onChange('all');
          } else {
            onChange(v);
          }
          onClose();
        }}
      />
    </BottomSheet>
  );
}

// ───────────── Date picker ─────────────

interface DateSheetProps {
  visible: boolean;
  onClose: () => void;
  value: Date;
  onChange: (date: Date) => void;
}

const SHORT_WEEKDAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export function DateSheet({ visible, onClose, value, onChange }: DateSheetProps) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Array.from({ length: 15 }, (_, i) => addDays(today, i - 7));

  const relative = (d: Date) => {
    if (isSameDay(d, today)) return s.date.today;
    if (isSameDay(d, addDays(today, -1))) return s.date.yesterday;
    if (isSameDay(d, addDays(today, 1))) return s.date.tomorrow;
    return SHORT_WEEKDAYS[d.getDay()];
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={s.date.title} subtitle={formatDayTitle(value)}>
      <View style={styles.dayGrid}>
        {days.map((d) => {
          const active = isSameDay(d, value);
          const isToday = isSameDay(d, today);
          return (
            <HapticPressable
              key={d.getTime()}
              onPress={() => {
                onChange(d);
                onClose();
              }}
              style={[styles.day, isToday && styles.dayToday, active && styles.dayActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={formatDayTitle(d)}
            >
              <Text style={[styles.dayLabel, active && styles.dayTextActive]}>{relative(d)}</Text>
              <Text style={[styles.dayNumber, active && styles.dayTextActive]}>
                {`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`}
              </Text>
            </HapticPressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  day: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayToday: {
    borderColor: colors.primarySoft,
  },
  dayActive: {
    backgroundColor: colors.primary,
  },
  dayLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  dayNumber: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  dayTextActive: {
    color: colors.background,
  },
});
