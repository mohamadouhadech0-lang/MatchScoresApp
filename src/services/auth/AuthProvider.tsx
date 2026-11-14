import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  describeGoogleError,
  googleAuthUnavailableReason,
  restoreGoogleSession,
  signInWithGoogle,
  signOutFromGoogle,
  type AuthUser,
  type GoogleAuthUnavailableReason,
} from './googleAuth';

interface AuthContextValue {
  user: AuthUser | null;
  /** True while restoring the session at startup. */
  initializing: boolean;
  /** True while a sign-in/sign-out call is running. */
  busy: boolean;
  error: string | null;
  unavailableReason: GoogleAuthUnavailableReason | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unavailableReason] = useState(googleAuthUnavailableReason);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(unavailableReason === null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (unavailableReason) return;
    let cancelled = false;
    restoreGoogleSession()
      .then((u) => !cancelled && setUser(u))
      .catch(() => undefined) // no saved session — stay signed out
      .finally(() => !cancelled && setInitializing(false));
    return () => {
      cancelled = true;
    };
  }, [unavailableReason]);

  const signIn = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const u = await signInWithGoogle();
      if (u) setUser(u);
    } catch (e) {
      setError(describeGoogleError(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await signOutFromGoogle();
    } finally {
      setUser(null);
      setBusy(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user, initializing, busy, error, unavailableReason, signIn, signOut }),
    [user, initializing, busy, error, unavailableReason, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
