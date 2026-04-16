import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { FileAudio, Upload, TrendingUp, Clock, Zap, FolderOpen, X, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingWelcome } from '@/components/OnboardingWelcome';
import { UsageBanner } from '@/components/UsageBanner';
import { useUsage } from '@/hooks/useUsage';
import { toast } from 'sonner';

const isMobile = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

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
      if (meetingCount === 0) {
        if (isMobile) {
          if (!sessionStorage.getItem('mobile_welcome_shown')) {
            sessionStorage.setItem('mobile_welcome_shown', '1');
            toast.info('Bem-vindo! Toque em Nova Transcrição para começar.');
          }
        } else {
          setShowOnboarding(true);
        }
      }
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

  if (isMobile) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-white">Olá, {userName} 👋</p>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <UsageBanner isNearLimit={usage.isNearLimit} isAtLimit={usage.isAtLimit} planId={usage.limits.planId} />

          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, i) => (
              <Card key={i} className={`border-l-4 ${stat.border} rounded-xl`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.iconColor} shrink-0`} />
                  </div>
                  {stat.value === null ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      {stat.showProgress && (stat.progressValue ?? 0) >= 80 && (
                        <Progress value={stat.progressValue} className={`h-1.5 mt-1.5 ${(stat.progressValue ?? 0) >= 100 ? '[&>div]:bg-red-500' : '[&>div]:bg-amber-500'}`} />
                      )}
                      {stat.subtext === 'plans' && (
                        <Link to="/plans" className="text-xs text-primary hover:underline mt-1 inline-block">Ver planos</Link>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Link to="/upload" className="block">
            <button
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={usage.isAtLimit}
            >
              {usage.isAtLimit ? (
                'Limite atingido'
              ) : (
                <>
                  <Mic className="h-6 w-6" />
                  Nova Transcrição
                  <span className="text-sm font-normal opacity-80">Gravar ou fazer upload</span>
                </>
              )}
            </button>
          </Link>

          <div className="flex gap-2">
            <Link to="/meetings" className="flex-1">
              <Button variant="outline" className="w-full text-xs py-3 rounded-xl h-auto">
                <FileAudio className="h-4 w-4 mr-1" /> Reuniões
              </Button>
            </Link>
            <Link to="/documents" className="flex-1">
              <Button variant="outline" className="w-full text-xs py-3 rounded-xl h-auto">
                <FolderOpen className="h-4 w-4 mr-1" /> Documentos
              </Button>
            </Link>
            <Link to="/plans" className="flex-1">
              <Button variant="outline" className="w-full text-xs py-3 rounded-xl h-auto">
                <Zap className="h-4 w-4 mr-1" /> Planos
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Bem-vindo, {userName}!</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas transcrições de reuniões com inteligência artificial</p>
        </div>

        <UsageBanner isNearLimit={usage.isNearLimit} isAtLimit={usage.isAtLimit} planId={usage.limits.planId} />

        {showOnboarding && !onboardingDismissed && (
          <OnboardingWelcome onDismiss={() => setOnboardingDismissed(true)} />
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`border-l-4 ${stat.border} shadow-lg hover:shadow-xl transition-shadow h-full`}>
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

        <div className="grid md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-secondary"><Monitor className="h-5 w-5 text-primary" /></div>
              <h3 className="font-semibold text-foreground">App Desktop</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Grave reuniões do Teams, Zoom e Meet diretamente no seu PC</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary"><Mic className="h-3 w-3" /> Mic + Sistema</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary"><CloudUpload className="h-3 w-3" /> Backup automático</span>
            </div>
            <a href="https://github.com/rafagonzales1990/agata-desktop/releases/latest/download/Agata-Transcription-1.0.4-Windows.exe">
              <Button className="w-full bg-primary text-primary-foreground">⬇ Baixar para Windows</Button>
            </a>
            <p className="text-xs text-muted-foreground mt-2 text-center">v1.0.4 · Sem instalação · Windows 10/11</p>
            <div className="text-center mt-2">
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">🍎 Mac — em breve</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-secondary"><Chrome className="h-5 w-5 text-primary" /></div>
              <h3 className="font-semibold text-foreground">Extensão Chrome</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Grave reuniões diretamente do Meet, Zoom e Teams. Um clique para transcrever.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">Google Meet</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">Zoom</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">Teams</span>
            </div>
            <a href="https://chromewebstore.google.com/detail/hhefgnokghkmeekjjpaipjmfhnhbnpjb" target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-primary text-primary-foreground">Adicionar ao Chrome →</Button>
            </a>
            <p className="text-xs text-muted-foreground mt-2 text-center">Grátis · Funciona em qualquer site</p>
          </motion.div>
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
                <Button className="w-full text-primary-foreground bg-primary" disabled={usage.isAtLimit}>
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
                <Button className="w-full text-primary-foreground bg-primary border border-input">Ver Documentos →</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
