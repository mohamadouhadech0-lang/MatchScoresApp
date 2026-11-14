import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { haptics } from '@/utils/haptics';
import { HapticPressable } from './HapticPressable';
import { Icon, type IconName } from './Icon';

export interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
}

interface OptionListProps<T extends string> {
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

/** Single-choice list (radio style) for bottom sheets. */
export function OptionList<T extends string>({ options, selected, onSelect }: OptionListProps<T>) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <HapticPressable
            key={o.value}
            disabled={o.disabled}
            onPress={() => onSelect(o.value)}
            style={[styles.row, active && styles.rowActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active, disabled: o.disabled }}
          >
            {o.icon ? (
              <Icon name={o.icon} active={active} color={active ? colors.primary : colors.textSecondary} />
            ) : null}
            <View style={styles.texts}>
              <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
              {o.description ? <Text style={styles.description}>{o.description}</Text> : null}
            </View>
            <Icon name="radio" active={active} color={active ? colors.primary : colors.textMuted} />
          </HapticPressable>
        );
      })}
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  icon?: IconName;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

/** Row with a switch; tapping anywhere toggles it. */
export function ToggleRow({ label, description, icon, value, onValueChange }: ToggleRowProps) {
  const toggle = (v: boolean) => {
    haptics.impact();
    onValueChange(v);
  };
  return (
    <HapticPressable
      feedback="none"
      onPress={() => toggle(!value)}
      style={styles.row}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      {icon ? <Icon name={icon} active={value} color={value ? colors.primary : colors.textSecondary} /> : null}
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={toggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.text}
        ios_backgroundColor={colors.border}
      />
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  texts: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
