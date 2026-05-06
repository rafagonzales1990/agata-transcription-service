import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EffectivePlan {
  effectivePlanId: string;
  hasActiveGift: boolean;
  isTrialActive: boolean;
  isPaidOrGift: boolean;
  loading: boolean;
}

const DEFAULT_DATA: Omit<EffectivePlan, 'loading'> = {
  effectivePlanId: 'basic',
  hasActiveGift: false,
  isTrialActive: false,
  isPaidOrGift: false,
};

async function fetchEffectivePlan(): Promise<Omit<EffectivePlan, 'loading'>> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return DEFAULT_DATA;

  const { data } = await supabase
    .from('User')
    .select('planId, giftPlanId, giftEndsAt, trialEndsAt, stripeSubscriptionId')
    .eq('id', user.id)
    .maybeSingle();

  const now = new Date();
  const planId = data?.planId ?? 'basic';
  const giftPlanId = data?.giftPlanId ?? null;
  const giftEndsAt = data?.giftEndsAt ?? null;
  const trialEndsAt = data?.trialEndsAt ?? null;
  const stripeSubscriptionId = data?.stripeSubscriptionId ?? null;

  const hasActiveGift = !!giftPlanId && !!giftEndsAt && new Date(giftEndsAt) > now;
  const isTrialActive = !!trialEndsAt && new Date(trialEndsAt) > now;
  const effectivePlanId = hasActiveGift ? giftPlanId! : planId;
  const isPaidOrGift = hasActiveGift || !!stripeSubscriptionId || isTrialActive;

  return { effectivePlanId, hasActiveGift, isTrialActive, isPaidOrGift };
}

export function useEffectivePlan(): EffectivePlan {
  const { data, isLoading } = useQuery({
    queryKey: ['effective-plan'],
    queryFn: fetchEffectivePlan,
    staleTime: 1000 * 60,
  });

  return data
    ? { ...data, loading: isLoading }
    : { ...DEFAULT_DATA, loading: isLoading };
}
