import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { FileAudio, Upload, TrendingUp, Clock, Zap, FolderOpen } from 'lucide-react';
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
          <h1 className="text-3xl font-bold text-gray-900">Bem-vindo, {userName}!</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas transcrições de reuniões com inteligência artificial</p>
        </div>

        <UsageBanner isNearLimit={usage.isNearLimit} isAtLimit={usage.isAtLimit} planId={usage.limits.planId} />

        {showOnboarding && !onboardingDismissed && (
          <OnboardingWelcome onDismiss={() => setOnboardingDismissed(true)} />
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`border-l-4 ${stat.border} shadow-lg hover:shadow-xl transition-shadow`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                  {stat.value === null ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      {stat.showProgress && <Progress value={stat.progressValue} className={`h-1.5 mt-2 ${(stat.progressValue ?? 0) >= 100 ? '[&>div]:bg-red-500' : (stat.progressValue ?? 0) >= 80 ? '[&>div]:bg-amber-500' : ''}`} />}
                      {stat.subtext === 'plans' ? (
                        <Link to="/plans" className="text-xs text-primary hover:underline mt-1 inline-block">Ver outros planos</Link>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {!localStorage.getItem('agata_extension_banner_dismissed') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-5 text-white shadow-lg"
          >
            <button
              onClick={() => { localStorage.setItem('agata_extension_banner_dismissed', '1'); window.location.reload(); }}
              className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-base">🧩 Extensão Chrome disponível!</p>
                <p className="text-sm text-white/80">Grave reuniões diretamente do Meet, Zoom e Teams. Um clique para transcrever.</p>
              </div>
              <a href="https://chrome.google.com/webstore/detail/agata-transcription" target="_blank" rel="noopener noreferrer">
                <Button className="bg-white text-emerald-700 hover:bg-white/90 font-semibold whitespace-nowrap shadow-md">
                  Instalar extensão →
                </Button>
              </a>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100"><Upload className="h-5 w-5 text-purple-600" /></div>
                <CardTitle className="text-lg">Nova Transcrição</CardTitle>
              </div>
              <CardDescription>Envie um arquivo de áudio ou vídeo</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/upload" className="block">
                <Button className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground" disabled={usage.isAtLimit}>
                  {usage.isAtLimit ? 'Limite atingido' : 'Fazer Upload →'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100"><FileAudio className="h-5 w-5 text-blue-600" /></div>
                <CardTitle className="text-lg">Minhas Reuniões</CardTitle>
              </div>
              <CardDescription>Veja transcrições e ATAs geradas</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/meetings" className="block">
                <Button variant="outline" className="w-full">Ver Reuniões →</Button>
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
