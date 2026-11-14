import { Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { EmptyState } from '@/components/ui/EmptyState';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { ar } from '@/i18n/ar';
import { AuthProvider } from '@/services/auth/AuthProvider';
import { CommentsProvider } from '@/services/comments/CommentsProvider';
import { PredictionsProvider } from '@/services/predictions/PredictionsProvider';
import { SearchHistoryProvider } from '@/services/search/SearchHistoryProvider';
import { SettingsProvider } from '@/services/settings/SettingsProvider';
import { colors, navigationTheme, radius, spacing } from '@/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SearchHistoryProvider>
          <CommentsProvider>
            <PredictionsProvider>
              <ThemeProvider value={navigationTheme}>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                  <Stack.Screen name="(tabs)" />
                  {/* Full-screen search, opened from the magnifier in the matches header. */}
                  <Stack.Screen name="search" options={{ animation: 'fade' }} />
                  <Stack.Screen name="match/[id]" options={{ animation: 'slide_from_left' }} />
                  <Stack.Screen name="league/[id]" options={{ animation: 'slide_from_left' }} />
                </Stack>
              </ThemeProvider>
            </PredictionsProvider>
          </CommentsProvider>
        </SearchHistoryProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

/**
 * Expo Router error boundary: any render crash below this layout shows this recovery screen
 * (dark, Arabic, with a retry) instead of a blank/black screen.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaView style={styles.errorRoot}>
      <EmptyState icon="alert" title={ar.dataErrors.crash.title} subtitle={ar.dataErrors.crash.body}>
        <HapticPressable feedback="impact" onPress={retry} style={styles.errorButton} accessibilityRole="button">
          <Icon name="refresh" size={16} color={colors.background} />
          <Text style={styles.errorButtonText}>{ar.dataErrors.retry}</Text>
        </HapticPressable>
        {__DEV__ ? (
          <Text style={styles.errorDetail} numberOfLines={4}>
            {error.message}
          </Text>
        ) : null}
      </EmptyState>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorRoot: {
    flex: 1,
    direction: 'rtl',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  errorButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  errorDetail: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
