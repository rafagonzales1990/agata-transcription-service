import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlanLimits {
  maxTranscriptions: number;
  maxDurationMinutes: number;
  /** User-facing duration label like "Até 60min" or "Ilimitado" */
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
  limits: { maxTranscriptions: 5, maxDurationMinutes: 15, durationLabel: 'Até 15min', planName: 'Gratuito', planId: 'basic' },
  transcriptionPercent: 0,
  minutesPercent: 0,
  maxPercent: 0,
  isNearLimit: false,
  isAtLimit: false,
  isTrial: false,
  loading: true,
};

/** Display-friendly duration mapping: DB value → user-facing minutes */
const DISPLAY_DURATION: Record<string, number> = {
  basic: 15,
  inteligente: 60,
  automacao: 90,
};

function getDurationLabel(planId: string, dbMinutes: number | null): string {
  if (planId === 'enterprise' || dbMinutes == null) return 'Ilimitado';
  const display = DISPLAY_DURATION[planId] ?? dbMinutes;
  return `Até ${display}min`;
}

function getDisplayMinutes(planId: string, dbMinutes: number | null): number {
  if (planId === 'enterprise' || dbMinutes == null) return 999999;
  return DISPLAY_DURATION[planId] ?? dbMinutes;
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
      .select('planId, giftPlanId, giftEndsAt')
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

  const { data: plan } = await supabase
    .from('Plan')
    .select('name, maxTranscriptions, maxDurationMinutes')
    .eq('id', planId)
    .maybeSingle();

  const transcriptionsUsed = usageRes.data?.transcriptionsUsed ?? 0;
  const totalMinutesTranscribed = usageRes.data?.totalMinutesTranscribed ?? 0;

  const maxT = plan?.maxTranscriptions ?? 5;
  const dbMaxM = plan?.maxDurationMinutes ?? null;
  const displayMaxM = getDisplayMinutes(planId, dbMaxM);
  const planName = plan?.name || 'Gratuito';
  const durationLabel = getDurationLabel(planId, dbMaxM);

  const transcriptionPercent = maxT > 0 ? Math.min(100, (transcriptionsUsed / maxT) * 100) : 0;
  const minutesPercent = displayMaxM > 0 && displayMaxM < 999999
    ? Math.min(100, (totalMinutesTranscribed / displayMaxM) * 100)
    : 0;
  const maxPercent = Math.max(transcriptionPercent, minutesPercent);

  return {
    transcriptionsUsed,
    totalMinutesTranscribed,
    limits: { maxTranscriptions: maxT, maxDurationMinutes: displayMaxM, durationLabel, planName, planId },
    transcriptionPercent,
    minutesPercent,
    maxPercent,
    isNearLimit: planId !== 'enterprise' && maxPercent >= 80 && maxPercent < 100,
    isAtLimit: planId !== 'enterprise' && (transcriptionsUsed >= maxT || totalMinutesTranscribed >= displayMaxM),
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
