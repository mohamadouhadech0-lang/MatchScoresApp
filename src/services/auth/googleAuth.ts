import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Thin wrapper around `@react-native-google-signin/google-signin`.
 *
 * The library ships native code, so it is NOT available in Expo Go. We load it lazily and only
 * outside Expo Go; importing it at the top level would crash Expo Go on startup.
 */

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
}

export type GoogleAuthUnavailableReason = 'expo-go' | 'web' | 'not-configured' | 'native-module-missing';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

let mod: GoogleSigninModule | null = null;
let unavailable: GoogleAuthUnavailableReason | null = null;

function load(): GoogleSigninModule | null {
  if (mod || unavailable) return mod;

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    unavailable = 'expo-go';
  } else if (Platform.OS === 'web') {
    unavailable = 'web';
  } else if (!webClientId || (Platform.OS === 'ios' && !iosClientId)) {
    unavailable = 'not-configured';
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
      mod.GoogleSignin.configure({ webClientId, iosClientId: iosClientId || undefined });
    } catch {
      // Dev build created before the package was installed.
      unavailable = 'native-module-missing';
    }
  }
  return mod;
}

/** `null` when sign-in can run, otherwise why it can't. */
export function googleAuthUnavailableReason(): GoogleAuthUnavailableReason | null {
  load();
  return unavailable;
}

function toAuthUser(u: { id: string; name: string | null; email: string; photo: string | null }): AuthUser {
  return { id: u.id, name: u.name ?? u.email.split('@')[0], email: u.email, photo: u.photo };
}

/** Restores a previous session without UI. */
export async function restoreGoogleSession(): Promise<AuthUser | null> {
  const m = load();
  if (!m || !m.GoogleSignin.hasPreviousSignIn()) return null;
  const res = await m.GoogleSignin.signInSilently();
  return res.type === 'success' ? toAuthUser(res.data.user) : null;
}

/** Opens the Google account picker. Resolves `null` if the user cancels. */
export async function signInWithGoogle(): Promise<AuthUser | null> {
  const m = load();
  if (!m) throw new Error(unavailable ?? 'unavailable');
  if (Platform.OS === 'android') {
    await m.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }
  const res = await m.GoogleSignin.signIn();
  return res.type === 'success' ? toAuthUser(res.data.user) : null;
}

export async function signOutFromGoogle(): Promise<void> {
  await load()?.GoogleSignin.signOut();
}

/** Arabic message for a sign-in error, or `null` if it should be ignored. */
export function describeGoogleError(error: unknown): string | null {
  const m = load();
  if (m && m.isErrorWithCode(error)) {
    switch (error.code) {
      case m.statusCodes.IN_PROGRESS:
        return null;
      case m.statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'خدمات Google Play غير متوفرة أو تحتاج إلى تحديث.';
    }
  }
  return 'تعذّر تسجيل الدخول. حاول مرة أخرى.';
}
