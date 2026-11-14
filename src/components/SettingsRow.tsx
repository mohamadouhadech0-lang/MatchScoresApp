import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { haptics } from '@/utils/haptics';
import { HapticPressable } from './ui/HapticPressable';
import { Icon, type IconName } from './ui/Icon';

type Props = {
  icon: IconName;
  label: string;
} & (
  | { kind: 'link'; value?: string; onPress: () => void }
  | { kind: 'switch'; value: boolean; onValueChange: (v: boolean) => void }
);

/** Settings card: icon (right) · label · chevron or switch (left). Expects an RTL parent. */
export function SettingsRow(props: Props) {
  const { icon, label } = props;

  if (props.kind === 'switch') {
    const { value, onValueChange } = props;
    const toggle = (v: boolean) => {
      haptics.impact();
      onValueChange(v);
    };
    return (
      <HapticPressable
        feedback="none"
        pressedOpacity={0.8}
        style={styles.card}
        onPress={() => toggle(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
      >
        <View style={[styles.iconBox, value && styles.iconBoxActive]}>
          <Icon name={icon} active={value} size="sm" />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
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

  return (
    <HapticPressable
      pressedOpacity={0.8}
      style={styles.card}
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={props.value ? `${label}، ${props.value}` : label}
    >
      <View style={styles.iconBox}>
        <Icon name={icon} size="sm" />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.trailing}>
        {props.value ? <Text style={styles.value}>{props.value}</Text> : null}
        <Icon name="chevronLeft" size="sm" color={colors.textMuted} />
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});
