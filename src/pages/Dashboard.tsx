import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileAudio, Upload, TrendingUp, Clock, Zap, FolderOpen, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  completed: { label: 'Concluída', variant: 'default', icon: CheckCircle },
  processing: { label: 'Processando', variant: 'secondary', icon: Clock },
  pending: { label: 'Pendente', variant: 'outline', icon: Clock },
  failed: { label: 'Falhou', variant: 'destructive', icon: AlertCircle },
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meetingCount, setMeetingCount] = useState(0);
  const [transcriptionsUsed, setTranscriptionsUsed] = useState(0);
  const [maxTranscriptions, setMaxTranscriptions] = useState(5);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [planName, setPlanName] = useState('Teste Grátis');
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Parallel fetches
      const [meetingsRes, usageRes, planRes, recentRes] = await Promise.all([
        supabase.from('Meeting')
          .select('id', { count: 'exact', head: true })
          .eq('userId', user.id)
          .gte('createdAt', startOfMonth),
        supabase.from('Usage')
          .select('transcriptionsUsed, totalMinutesTranscribed')
          .eq('userId', user.id)
          .eq('currentMonth', currentMonth)
          .maybeSingle(),
        supabase.from('Plan')
          .select('name, maxTranscriptions')
          .eq('id', profile?.plan_id || 'basic')
          .single(),
        supabase.from('Meeting')
          .select('id, title, status, createdAt, meetingDate')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
          .limit(5),
      ]);

      setMeetingCount(meetingsRes.count || 0);
      setTranscriptionsUsed(usageRes.data?.transcriptionsUsed || 0);
      setTotalMinutes(usageRes.data?.totalMinutesTranscribed || 0);
      if (planRes.data) {
        setPlanName(planRes.data.name);
        setMaxTranscriptions(planRes.data.maxTranscriptions);
      }
      setRecentMeetings(recentRes.data || []);
      setLoading(false);
    }
    fetchDashboard();
  }, [profile]);

  const stats = [
    { label: 'Reuniões (mês)', value: loading ? null : String(meetingCount), icon: FileAudio },
    { label: 'Minutos Transcritos', value: loading ? null : String(totalMinutes), icon: Clock },
    { label: 'Transcrições Usadas', value: loading ? null : `${transcriptionsUsed}/${maxTranscriptions}`, icon: TrendingUp },
    { label: 'Plano Atual', value: loading ? null : planName, icon: Zap },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao Ágata Transcription</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  {stat.value === null ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Começar Nova Transcrição</CardTitle>
              <CardDescription>Envie um áudio ou grave diretamente</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/upload">
                <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground">
                  <Upload className="h-4 w-4 mr-2" /> Nova Transcrição
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reuniões Recentes</CardTitle>
              <CardDescription>Suas últimas transcrições</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : recentMeetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma reunião ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentMeetings.map((m) => {
                    const cfg = statusConfig[m.status] || statusConfig.pending;
                    const StatusIcon = cfg.icon;
                    const date = m.meetingDate
                      ? new Date(m.meetingDate).toLocaleDateString('pt-BR')
                      : new Date(m.createdAt).toLocaleDateString('pt-BR');
                    return (
                      <Link key={m.id} to={`/meetings/${m.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                          <p className="text-xs text-muted-foreground">{date}</p>
                        </div>
                        <Badge variant={cfg.variant} className="text-[10px] shrink-0">
                          <StatusIcon className="h-2.5 w-2.5 mr-1" />
                          {cfg.label}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
