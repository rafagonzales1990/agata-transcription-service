import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { FileAudio, Upload, TrendingUp, Clock, Zap, FolderOpen, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingWelcome } from '@/components/OnboardingWelcome';
import { UsageBanner } from '@/components/UsageBanner';
import { useUsage } from '@/hooks/useUsage';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const usage = useUsage();

  useEffect(() => {
    async function fetchMeetings() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { count } = await supabase.from('Meeting')
        .select('*', { count: 'exact', head: true })
        .eq('userId', user.id);

      const meetingCount = count || 0;
      setTotalMeetings(meetingCount);
      if (meetingCount === 0) setShowOnboarding(true);
      if (meetingCount === 1 && !sessionStorage.getItem('first_transcription_toast')) {
        sessionStorage.setItem('first_transcription_toast', '1');
        toast.success('🎉 Primeira reunião transcrita! Explore o resumo e a ATA.');
      }
      setMeetingsLoading(false);
    }
    fetchMeetings();
  }, [profile]);

  const loading = meetingsLoading || usage.loading;
  const userName = profile?.name || 'Usuário';
  const isEnterprise = usage.limits.planId === 'enterprise';

  const stats = [
    {
      label: 'Reuniões este mês', value: loading ? null : `${usage.transcriptionsUsed}/${isEnterprise ? '∞' : usage.limits.maxTranscriptions}`,
      icon: FileAudio, iconColor: 'text-purple-500', border: 'border-l-purple-500',
      subtext: `${Math.round(usage.transcriptionPercent)}% utilizado`, showProgress: true, progressValue: usage.transcriptionPercent,
    },
    {
      label: 'Minutos este mês', value: loading ? null : `${usage.totalMinutesTranscribed}/${isEnterprise ? '∞' : usage.limits.maxDurationMinutes}`,
      icon: Clock, iconColor: 'text-blue-500', border: 'border-l-blue-500',
      subtext: `${Math.round(usage.minutesPercent)}% utilizado`, showProgress: true, progressValue: usage.minutesPercent,
    },
    {
      label: 'Total de Reuniões', value: loading ? null : String(totalMeetings),
      icon: TrendingUp, iconColor: 'text-green-500', border: 'border-l-green-500',
      subtext: 'Transcrições realizadas',
    },
    {
      label: 'Plano Atual', value: loading ? null : usage.limits.planName,
      icon: Zap, iconColor: 'text-orange-500', border: 'border-l-orange-500',
      subtext: 'plans',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Bem-vindo, {userName}!</h1>
...
              <Link to="/meetings" className="block">
                <Button className="w-full text-primary-foreground bg-primary border border-input">Ver Reuniões →</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100"><FolderOpen className="h-5 w-5 text-green-600" /></div>
                <CardTitle className="text-lg">Documentos</CardTitle>
              </div>
              <CardDescription>Repositório de documentos gerados</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/documents" className="block">
                <Button variant="outline" className="w-full">Ver Documentos →</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
