import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/components/AppTabBar';
import { ar } from '@/i18n/ar';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      {/* Declaration order = right-to-left order in the tab bar. */}
      <Tabs.Screen name="index" options={{ title: ar.tabs.matches }} />
      <Tabs.Screen name="news" options={{ title: ar.tabs.news }} />
      <Tabs.Screen name="contest" options={{ title: ar.tabs.contest }} />
      <Tabs.Screen name="standings" options={{ title: ar.tabs.standings }} />
      <Tabs.Screen name="more" options={{ title: ar.tabs.more }} />
    </Tabs>
  );
}
