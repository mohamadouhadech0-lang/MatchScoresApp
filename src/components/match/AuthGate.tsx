import { router } from 'expo-router';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { ar } from '@/i18n/ar';
import { useAuth } from '@/services/auth/AuthProvider';
import { colors, radius, spacing } from '@/theme';

const t = ar.authGate;

/**
 * Runs `action` when the user is signed in; otherwise opens the sign-in sheet and returns false.
 * Call it with no action to just check (e.g. when a guest taps the comment field).
 */
type RequireAuth = (action?: () => void) => boolean;

const AuthGateContext = createContext<RequireAuth | null>(null);

/** Wraps fan-zone interactions (comment, reply, like) behind sign-in. Predictions stay open to guests. */
export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const requireAuth = useCallback<RequireAuth>(
    (action) => {
      if (user) {
        action?.();
        return true;
      }
      setOpen(true);
      return false;
    },
    [user],
  );

  const goToSignIn = () => {
    setOpen(false);
    // Sign-in / account creation lives in the profile card of the "المزيد" tab.
    router.push('/more');
  };

  return (
    <AuthGateContext.Provider value={requireAuth}>
      {children}
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={t.title}>
        <View style={styles.body}>
          <View style={styles.lockCircle}>
            <Icon name="lock" active size={28} color={colors.purple} />
          </View>
          <Text style={styles.message}>{t.message}</Text>
          <HapticPressable
            feedback="impact"
            onPress={goToSignIn}
            style={styles.primary}
            accessibilityRole="button"
            accessibilityLabel={t.signIn}
          >
            <Icon name="person" active size={18} color={colors.background} />
            <Text style={styles.primaryText}>{t.signIn}</Text>
          </HapticPressable>
          <HapticPressable onPress={() => setOpen(false)} style={styles.secondary} accessibilityRole="button">
            <Text style={styles.secondaryText}>{t.later}</Text>
          </HapticPressable>
        </View>
      </BottomSheet>
    </AuthGateContext.Provider>
  );
}

export function useRequireAuth(): RequireAuth {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useRequireAuth must be used inside <AuthGateProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 77, 255, 0.16)',
  },
  message: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  primary: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  secondary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
