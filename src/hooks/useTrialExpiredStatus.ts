import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrialStatus {
  trialEndsAt: string | null;
  stripeSubscriptionId: string | null;
  planId: string | null;
  isTrialExpired: boolean;
  loading: boolean;
}

async function fetchTrialStatus(): Promise<Omit<TrialStatus, 'loading'>> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return { trialEndsAt: null, stripeSubscriptionId: null, planId: null, isTrialExpired: false };
  }

  const { data } = await supabase
    .from('User')
    .select('trialEndsAt, stripeSubscriptionId, planId')
    .eq('id', user.id)
    .maybeSingle();

  const trialEndsAt = data?.trialEndsAt ?? null;
  const stripeSubscriptionId = data?.stripeSubscriptionId ?? null;
  const planId = data?.planId ?? null;
  const isTrialExpired = !!trialEndsAt && new Date(trialEndsAt) < new Date() && !stripeSubscriptionId && planId === 'basic';

  return { trialEndsAt, stripeSubscriptionId, planId, isTrialExpired };
}

export function useTrialExpiredStatus(): TrialStatus {
  const { data, isLoading } = useQuery({
    queryKey: ['trial-expired-status'],
    queryFn: fetchTrialStatus,
    staleTime: 1000 * 60,
  });

  return data ? { ...data, loading: isLoading } : {
    trialEndsAt: null,
    stripeSubscriptionId: null,
    planId: null,
    isTrialExpired: false,
    loading: isLoading,
  };
}