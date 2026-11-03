import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Profile } from '../lib/database';
import { CONFIG_ERROR, loadErrorMessage, loginErrorMessage } from '../lib/messages';
import { getSupabase, hasSupabaseEnv } from '../lib/supabase';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configError: string | null;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_COLUMNS = 'id, email, full_name, role' as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const configError = hasSupabaseEnv() ? null : CONFIG_ERROR;

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setAuthReady(true);
      return;
    }

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
      if (!nextSession) {
        setProfile(null);
        setProfileError(null);
        setProfileUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!hasSupabaseEnv() || !userId) return;

    let cancelled = false;

    void getSupabase()
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setProfile(null);
          setProfileError(error.code === '42501' ? loadErrorMessage(error) : 'Не удалось загрузить профиль');
        } else if (!data) {
          setProfile(null);
          setProfileError('Профиль не найден. Его нужно создать в базе.');
        } else {
          setProfile(data);
          setProfileError(null);
        }
        setProfileUserId(userId);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!hasSupabaseEnv()) return CONFIG_ERROR;
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return loginErrorMessage(error);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    if (!hasSupabaseEnv()) return CONFIG_ERROR;
    const { error } = await getSupabase().auth.signOut({ scope: 'local' });
    if (error) return 'Не удалось выйти. Попробуйте ещё раз.';
    return null;
  }, []);

  const loading = !authReady || (session !== null && profileUserId !== session.user.id);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      configError,
      profileError,
      signIn,
      signOut,
    }),
    [session, profile, loading, configError, profileError, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
