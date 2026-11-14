import { StyleSheet, Text, View } from 'react-native';

import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';
import { HapticPressable } from './ui/HapticPressable';
import { Icon, type IconName } from './ui/Icon';

interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
}

function IconButton({ icon, label, onPress, active = false }: IconButtonProps) {
  return (
    <HapticPressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[styles.iconButton, active && styles.iconButtonActive]}
    >
      <Icon name={icon} active={active} />
    </HapticPressable>
  );
}

interface Props {
  filterActive: boolean;
  searchActive: boolean;
  onFilterPress: () => void;
  onSearchPress: () => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onCalendarPress: () => void;
}

/** Header laid out for RTL: logo (right) · filter + search (middle) · date navigator (left). */
export function AppHeader(props: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.logo} accessibilityRole="header">
        <Text style={styles.logoText}>{ar.logo}</Text>
        <Icon name="matches" active size={20} />
      </View>

      <View style={styles.actions}>
        <IconButton icon="filter" label={ar.a11y.filter} onPress={props.onFilterPress} active={props.filterActive} />
        <IconButton icon="search" label={ar.a11y.search} onPress={props.onSearchPress} active={props.searchActive} />
      </View>

      <View style={styles.dateNav}>
        {/* In RTL the right-pointing arrow goes back in time. */}
        <IconButton icon="chevronRight" label={ar.a11y.previousDay} onPress={props.onPreviousDay} />
        <IconButton icon="calendar" label={ar.a11y.pickDate} onPress={props.onCalendarPress} />
        <IconButton icon="chevronLeft" label={ar.a11y.nextDay} onPress={props.onNextDay} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  logo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dateNav: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: colors.primarySoft,
  },
});
