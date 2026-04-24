import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/react';
import { pushEvent, gtag, GA_MEASUREMENT_ID } from '@/lib/gtag';
import { queryClient } from '@/App';
import { getDeviceId } from '@/lib/deviceId';

const SSO_PROVIDERS = ['google', 'azure'];

async function initializeOAuthUser(session: Session) {
  const { user } = session;
  const provider = user.app_metadata?.provider;
  if (!SSO_PROVIDERS.includes(provider)) return;

  const { data: existing } = await supabase
    .from('User' as any)
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return;

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Usuário';

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('User' as any).upsert(
    { id: user.id, email: user.email, name, hasCompletedOnboarding: true, trialEndsAt, planId: 'basic' },
    { onConflict: 'id' }
  );

  try {
    await supabase.functions.invoke('send-email', {
      body: { type: 'welcome', to: user.email, data: { name } },
    });
  } catch {}
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  cpf: string | null;
  image: string | null;
  plan_id: string | null;
  billing_cycle: string | null;
  trial_ends_at: string | null;
  has_completed_onboarding: boolean;
  old_user_id: string | null;
  gift_plan_id: string | null;
  gift_ends_at: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);

        if (event === 'SIGNED_OUT') {
          queryClient.clear();
        }

        if (session?.user) {
          Sentry.setUser({ id: session.user.id, email: session.user.email });
          setTimeout(() => fetchProfile(session.user.id), 0);

          if (event === 'SIGNED_IN') {
            initializeOAuthUser(session);
            supabase.functions.invoke('enforce-single-session', {
              body: { userId: session.user.id, deviceId: getDeviceId() },
            });
            const firstLoginKey = `agata_first_login_${session.user.id}`;
            if (!localStorage.getItem(firstLoginKey)) {
              localStorage.setItem(firstLoginKey, '1');
              pushEvent('first_login', { userId: session.user.id });
            }
            gtag('config', GA_MEASUREMENT_ID, { user_id: session.user.id });
          }
        } else {
          Sentry.setUser(null);
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
