import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet, Text, View } from 'react-native';

import { ar } from '@/i18n/ar';
import { colors, spacing } from '@/theme';
import { HapticPressable } from './ui/HapticPressable';
import { Icon, type IconName } from './ui/Icon';

const TABS: Record<string, { label: string; icon: IconName; highlight?: boolean }> = {
  index: { label: ar.tabs.matches, icon: 'matches' },
  news: { label: ar.tabs.news, icon: 'news' },
  contest: { label: ar.tabs.contest, icon: 'contest', highlight: true },
  standings: { label: ar.tabs.standings, icon: 'standings' },
  more: { label: ar.tabs.more, icon: 'more' },
};

/** Custom RTL tab bar: first route is rendered on the right. Outline icons, filled when active. */
export function AppTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = index === state.index;
        const tint = focused ? colors.primary : colors.textSecondary;

        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        return (
          <HapticPressable
            key={route.key}
            onPress={onPress}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            style={styles.item}
          >
            <View style={[styles.indicator, focused && styles.indicatorActive]} />
            <View style={[styles.iconWrap, tab.highlight && styles.highlightWrap, focused && styles.glow]}>
              <Icon
                name={tab.icon}
                active={focused || tab.highlight}
                size={tab.highlight ? 'md' : 'lg'}
                color={tab.highlight ? colors.primary : tint}
              />
            </View>
            <Text style={[styles.label, { color: tint }, focused && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </HapticPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    direction: 'rtl',
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
    gap: 3,
  },
  indicator: {
    width: 28,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: 'transparent',
    marginBottom: 5,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
  iconWrap: {
    height: 30,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Soft mint glow behind the active icon.
  glow: {
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  highlightWrap: {
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    fontWeight: '800',
  },
});
