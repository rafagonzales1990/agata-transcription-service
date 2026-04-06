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
import { toast } from 'sonner';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [transcriptionsUsed, setTranscriptionsUsed] = useState(0);
  const [maxTranscriptions, setMaxTranscriptions] = useState(5);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [planName, setPlanName] = useState('Gratuito');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentMonth = new Date().toISOString().slice(0, 7);

      const [meetingsRes, usageRes, userRes] = await Promise.all([
        supabase.from('Meeting')
          .select('*', { count: 'exact', head: true })
          .eq('userId', user.id),
        supabase.from('Usage')
          .select('transcriptionsUsed, totalMinutesTranscribed, currentMonth')
          .eq('userId', user.id)
          .single(),
        supabase.from('User')
          .select('planId')
          .eq('id', user.id)
          .single(),
      ]);

      const meetingCount = meetingsRes.count || 0;
      setTotalMeetings(meetingCount);
      if (meetingCount === 0) setShowOnboarding(true);
      if (meetingCount === 1 && !sessionStorage.getItem('first_transcription_toast')) {
        sessionStorage.setItem('first_transcription_toast', '1');
        toast.success('🎉 Primeira reunião transcrita! Explore o resumo e a ATA.');
      }
      setTotalMinutes(usageRes.data?.totalMinutesTranscribed || 0);
      setTranscriptionsUsed(
        usageRes.data?.currentMonth === currentMonth
          ? usageRes.data.transcriptionsUsed
          : 0
      );

      const planId = userRes.data?.planId || 'basic';
      const { data: plan } = await supabase
        .from('Plan')
        .select('name, maxTranscriptions')
        .eq('id', planId)
        .single();

      if (plan) {
        setPlanName(plan.name);
        setMaxTranscriptions(plan.maxTranscriptions);
      }
      setLoading(false);
    }
    fetchDashboard();
  }, [profile]);

  const usagePercent = maxTranscriptions > 0 ? Math.min(100, (transcriptionsUsed / maxTranscriptions) * 100) : 0;
  const userName = profile?.name || 'Usuário';

  const stats = [
    {
      label: 'Total de Reuniões', value: loading ? null : String(totalMeetings),
      icon: FileAudio, iconColor: 'text-purple-500', border: 'border-l-purple-500',
      subtext: 'Transcrições realizadas',
    },
    {
      label: 'Minutos Transcritos', value: loading ? null : String(totalMinutes),
      icon: Clock, iconColor: 'text-blue-500', border: 'border-l-blue-500',
      subtext: 'Total de minutos processados',
    },
    {
      label: 'Uso Mensal', value: loading ? null : `${transcriptionsUsed}/${maxTranscriptions}`,
      icon: TrendingUp, iconColor: 'text-green-500', border: 'border-l-green-500',
      subtext: `${Math.round(usagePercent)}% utilizado`, showProgress: true,
    },
    {
      label: 'Plano Atual', value: loading ? null : planName,
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
                      {stat.showProgress && <Progress value={usagePercent} className="h-1.5 mt-2" />}
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
                <Button className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground">Fazer Upload →</Button>
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
