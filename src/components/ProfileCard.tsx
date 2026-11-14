import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';

import { ar } from '@/i18n/ar';
import { useAuth } from '@/services/auth/AuthProvider';
import type { GoogleAuthUnavailableReason } from '@/services/auth/googleAuth';
import { colors, radius, spacing } from '@/theme';
import { HapticPressable } from './ui/HapticPressable';
import { Icon } from './ui/Icon';

const t = ar.auth;

const unavailableMessage: Record<GoogleAuthUnavailableReason, string> = {
  'expo-go': t.unavailable.expoGo,
  web: t.unavailable.web,
  'not-configured': t.unavailable.notConfigured,
  'native-module-missing': t.unavailable.nativeModuleMissing,
};

function Avatar({ uri }: { uri: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={styles.avatar} accessibilityRole="image" accessibilityLabel={ar.more.avatar}>
      {uri && !failed ? (
        <Image source={{ uri }} style={styles.avatarImage} onError={() => setFailed(true)} />
      ) : (
        <Icon name="person" active size={32} />
      )}
    </View>
  );
}

/** Google Sign-In button. Colors follow Google's light button style (white, dark text). */
function GoogleButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <HapticPressable
      feedback="impact"
      onPress={onPress}
      disabled={loading}
      pressedOpacity={0.85}
      style={styles.googleButton}
      accessibilityRole="button"
      accessibilityLabel={t.signInWithGoogle}
      accessibilityState={{ busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color="#1F1F1F" />
      ) : (
        <>
          <Icon name="google" size={20} color="#4285F4" />
          <Text style={styles.googleText}>{t.signInWithGoogle}</Text>
        </>
      )}
    </HapticPressable>
  );
}

export function ProfileCard() {
  const { user, initializing, busy, error, unavailableReason, signIn, signOut } = useAuth();

  if (initializing) {
    return (
      <View style={[styles.card, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (user) {
    const confirmSignOut = () =>
      Alert.alert(t.signOutTitle, t.signOutMessage, [
        { text: t.cancel, style: 'cancel' },
        { text: t.signOut, style: 'destructive', onPress: signOut },
      ]);

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
          <Avatar uri={user.photo} />
        </View>
        <HapticPressable
          onPress={confirmSignOut}
          disabled={busy}
          hitSlop={8}
          style={styles.signOut}
          accessibilityRole="button"
        >
          <Icon name="signOut" size={16} color={colors.textSecondary} />
          <Text style={styles.signOutText}>{t.signOut}</Text>
        </HapticPressable>
      </View>
    );
  }

  const onSignIn = () => {
    if (unavailableReason) {
      Alert.alert(t.unavailableTitle, unavailableMessage[unavailableReason]);
      return;
    }
    signIn();
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{t.welcome}</Text>
          <Text style={styles.email}>{t.prompt}</Text>
        </View>
        <Avatar uri={null} />
      </View>
      <GoogleButton onPress={onSignIn} loading={busy} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  centered: {
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  email: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.capsule,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
  },
  googleText: {
    color: '#1F1F1F',
    fontSize: 15,
    fontWeight: '700',
  },
  signOut: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  signOutText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: colors.live,
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
});
