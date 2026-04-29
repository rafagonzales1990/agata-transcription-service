import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlanLimits {
  maxTranscriptions: number;
  maxDurationMinutes: number;    // per-meeting duration limit (for labels)
  maxTotalMinutesMonth: number;  // monthly total minutes limit (for usage bar)
  /** User-facing duration label like "Até 70min" or "Ilimitado" */
  durationLabel: string;
  planName: string;
  planId: string;
}

export interface UsageData {
  transcriptionsUsed: number;
  totalMinutesTranscribed: number;
  limits: PlanLimits;
  transcriptionPercent: number;
  minutesPercent: number;
  maxPercent: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  isTrial: boolean;
  loading: boolean;
}

const DEFAULTS: UsageData = {
  transcriptionsUsed: 0,
  totalMinutesTranscribed: 0,
  limits: { maxTranscriptions: 5, maxDurationMinutes: 15, maxTotalMinutesMonth: 75, durationLabel: 'Até 15min', planName: 'Gratuito', planId: 'basic' },
  transcriptionPercent: 0,
  minutesPercent: 0,
  maxPercent: 0,
  isNearLimit: false,
  isAtLimit: false,
  isTrial: false,
  loading: true,
};

function getDurationLabel(planId: string, maxDurationMinutes: number | null): string {
  if (planId === 'enterprise' || maxDurationMinutes == null) return 'Ilimitado';
  return `Até ${maxDurationMinutes}min`;
}

async function fetchUsage(): Promise<UsageData> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { ...DEFAULTS, loading: false };

  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const [usageRes, userRes] = await Promise.all([
    supabase
      .from('Usage')
      .select('transcriptionsUsed, totalMinutesTranscribed, currentMonth')
      .eq('userId', user.id)
      .eq('currentMonth', currentMonth)
      .maybeSingle(),
    supabase
      .from('User')
      .select('planId, giftPlanId, giftEndsAt, trialEndsAt, adminGroupId')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  const nowDate = new Date();
  const hasActiveGift = userRes.data?.giftPlanId &&
    userRes.data?.giftEndsAt &&
    new Date(userRes.data.giftEndsAt) > nowDate;
  const planId = hasActiveGift
    ? userRes.data!.giftPlanId!
    : (userRes.data?.planId || 'basic');

  const trialEndsAt = userRes.data?.trialEndsAt ? new Date(userRes.data.trialEndsAt) : null;
  const isTrial = !!trialEndsAt && trialEndsAt > nowDate;

  const { data: plan } = await supabase
    .from('Plan')
    .select('name, maxTranscriptions, maxDurationMinutes, maxTotalMinutesMonth')
    .eq('id', planId)
    .maybeSingle();

  let maxT = plan?.maxTranscriptions ?? 5;
  let maxDurationMins: number | null = plan?.maxDurationMinutes ?? null;
  let maxTotalMins: number | null = (plan as any)?.maxTotalMinutesMonth ?? null;
  const planName = plan?.name || 'Gratuito';

  // For Enterprise users, get group limits instead of plan limits
  if (planId === 'enterprise' && userRes.data?.adminGroupId) {
    const { data: group } = await supabase
      .from('AdminGroup')
      .select('maxTranscriptions, maxDurationMinutes, maxTotalMinutesMonth')
      .eq('id', userRes.data.adminGroupId)
      .maybeSingle();

    if (group) {
      maxT = (group as any).maxTranscriptions || 200;
      maxDurationMins = (group as any).maxDurationMinutes || 130;
      maxTotalMins = (group as any).maxTotalMinutesMonth || 10000;
    }
  }

  const transcriptionsUsed = usageRes.data?.transcriptionsUsed ?? 0;
  const totalMinutesTranscribed = usageRes.data?.totalMinutesTranscribed ?? 0;

  const durationLabel = getDurationLabel(planId, maxDurationMins);

  // Monthly total minutes cap — used for usage bar and isAtLimit
  const monthlyMinutesCap = planId === 'enterprise'
    ? 999999
    : (maxTotalMins ?? 75);

  const transcriptionPercent = maxT > 0 ? Math.min(100, (transcriptionsUsed / maxT) * 100) : 0;
  const minutesPercent = monthlyMinutesCap > 0 && monthlyMinutesCap < 999999
    ? Math.min(100, (totalMinutesTranscribed / monthlyMinutesCap) * 100)
    : 0;
  const maxPercent = Math.max(transcriptionPercent, minutesPercent);

  return {
    transcriptionsUsed,
    totalMinutesTranscribed,
    limits: {
      maxTranscriptions: maxT,
      maxDurationMinutes: maxDurationMins ?? 999999,
      maxTotalMinutesMonth: monthlyMinutesCap,
      durationLabel,
      planName,
      planId,
    },
    transcriptionPercent,
    minutesPercent,
    maxPercent,
    isNearLimit: planId !== 'enterprise' && maxPercent >= 80 && maxPercent < 100,
    isAtLimit: planId !== 'enterprise' && (transcriptionsUsed >= maxT || totalMinutesTranscribed >= monthlyMinutesCap),
    isTrial,
    loading: false,
  };
}

export function useUsage(): UsageData {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['usage'],
    queryFn: fetchUsage,
  });

  // Auto-refresh when a Meeting status changes to 'completed' via Realtime
  useEffect(() => {
    const channel = supabase
      .channel('usage-refresh')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Meeting', filter: 'status=eq.completed' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['usage'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return data ?? DEFAULTS;
}
