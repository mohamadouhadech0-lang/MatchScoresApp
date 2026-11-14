import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';
import { Icon, type IconName } from './ui/Icon';

interface Props {
  title: string;
  subtitle: string;
  icon: IconName;
}

/** Simple screen for tabs that are not built yet. */
export function PlaceholderScreen({ title, subtitle, icon }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Icon name={icon} active size={36} />
        </View>
        <Text style={styles.soon}>{ar.comingSoon}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    direction: 'rtl',
    backgroundColor: colors.background,
  },
  title: {
    alignSelf: 'flex-start',
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  soon: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
