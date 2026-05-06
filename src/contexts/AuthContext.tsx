import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/react';
import { pushEvent, gtag, GA_MEASUREMENT_ID } from '@/lib/gtag';
import { queryClient } from '@/App';
import { getDeviceId } from '@/lib/deviceId';

const SSO_PROVIDERS = ['google', 'azure'];

function isSSOUser(user: Session['user']): boolean {
  const provider = user.app_metadata?.provider;
  if (provider && SSO_PROVIDERS.includes(provider)) return true;
  return (user.identities ?? []).some((i) => SSO_PROVIDERS.includes(i.provider));
}

async function initializeOAuthUser(session: Session) {
  const { user } = session;
  if (!isSSOUser(user)) return;
  if (!user.email) return;

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email.split('@')[0] ||
    'Usuário';

  // RLS bloqueia INSERT em "User" pelo cliente. Edge function com service_role
  // cria a row se nao existir (idempotente).
  const { data, error } = await supabase.functions.invoke('initialize-user', {
    body: { id: user.id, email: user.email, name },
  });

  if (error) {
    console.error('[initializeOAuthUser] invoke initialize-user failed', error);
    return;
  }

  // Welcome email apenas em criacao net-new
  if ((data as { created?: boolean } | null)?.created) {
    try {
      await supabase.functions.invoke('send-email', {
        body: { type: 'welcome', to: user.email, data: { name } },
      });
    } catch {}
  }
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

          // Roda em SIGNED_IN (novo signin) e INITIAL_SESSION (auto-conserta
          // usuários SSO legados com trialEndsAt=null na próxima visita)
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            initializeOAuthUser(session);
          }

          if (event === 'SIGNED_IN') {
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
