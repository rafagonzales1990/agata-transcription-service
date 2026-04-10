import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlanLimits {
  maxTranscriptions: number;
  maxDurationMinutes: number;
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
  loading: boolean;
}

const PLAN_LIMITS: Record<string, { maxTranscriptions: number; maxDurationMinutes: number }> = {
  basic: { maxTranscriptions: 3, maxDurationMinutes: 60 },
  inteligente: { maxTranscriptions: 20, maxDurationMinutes: 600 },
  automacao: { maxTranscriptions: 60, maxDurationMinutes: 1800 },
  enterprise: { maxTranscriptions: 999999, maxDurationMinutes: 999999 },
};

export function useUsage(): UsageData {
  const [data, setData] = useState<UsageData>({
    transcriptionsUsed: 0,
    totalMinutesTranscribed: 0,
    limits: { maxTranscriptions: 3, maxDurationMinutes: 60, planName: 'Gratuito', planId: 'basic' },
    transcriptionPercent: 0,
    minutesPercent: 0,
    maxPercent: 0,
    isNearLimit: false,
    isAtLimit: false,
    loading: true,
  });

  useEffect(() => {
    async function fetch() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const currentMonth = new Date().toISOString().slice(0, 7);

      const [usageRes, userRes] = await Promise.all([
        supabase.from('Usage').select('transcriptionsUsed, totalMinutesTranscribed, currentMonth').eq('userId', user.id).maybeSingle(),
        supabase.from('User').select('planId, giftPlanId, giftEndsAt').eq('id', user.id).maybeSingle(),
      ]);

      const nowDate = new Date();
      const hasActiveGift = userRes.data?.giftPlanId &&
        userRes.data?.giftEndsAt &&
        new Date(userRes.data.giftEndsAt) > nowDate;
      const planId = hasActiveGift
        ? userRes.data!.giftPlanId!
        : (userRes.data?.planId || 'basic');
      const { data: plan } = await supabase.from('Plan').select('name, maxTranscriptions, maxDurationMinutes').eq('id', planId).maybeSingle();

      const isCurrentMonth = usageRes.data?.currentMonth === currentMonth;
      const transcriptionsUsed = isCurrentMonth ? (usageRes.data?.transcriptionsUsed || 0) : 0;
      const totalMinutesTranscribed = isCurrentMonth ? (usageRes.data?.totalMinutesTranscribed || 0) : 0;

      // Plan.maxDurationMinutes = null means unlimited (Enterprise).
      // PLAN_LIMITS fallback is only used when the Plan row is missing from DB.
      const maxT = plan?.maxTranscriptions ?? PLAN_LIMITS[planId]?.maxTranscriptions ?? 3;
      const maxM = plan?.maxDurationMinutes ?? PLAN_LIMITS[planId]?.maxDurationMinutes ?? 60;
      const planName = plan?.name || 'Gratuito';

      const transcriptionPercent = maxT > 0 ? Math.min(100, (transcriptionsUsed / maxT) * 100) : 0;
      const minutesPercent = maxM > 0 ? Math.min(100, (totalMinutesTranscribed / maxM) * 100) : 0;
      const maxPercent = Math.max(transcriptionPercent, minutesPercent);

      setData({
        transcriptionsUsed,
        totalMinutesTranscribed,
        limits: { maxTranscriptions: maxT, maxDurationMinutes: maxM, planName, planId },
        transcriptionPercent,
        minutesPercent,
        maxPercent,
        isNearLimit: planId !== 'enterprise' && maxPercent >= 80 && maxPercent < 100,
        isAtLimit: planId !== 'enterprise' && (transcriptionsUsed >= maxT || totalMinutesTranscribed >= maxM),
        loading: false,
      });
    }
    fetch();
  }, []);

  return data;
}
