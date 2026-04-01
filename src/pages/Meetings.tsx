import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, FolderOpen, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Meeting {
  id: string;
  title: string;
  fileName: string;
  status: string;
  createdAt: string;
  summary: string | null;
  participants: string[];
  meetingDate: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  completed: { label: 'Concluída', variant: 'default', icon: CheckCircle },
  processing: { label: 'Processando', variant: 'secondary', icon: Clock },
  pending: { label: 'Pendente', variant: 'outline', icon: Clock },
  failed: { label: 'Falhou', variant: 'destructive', icon: AlertCircle },
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeetings() {
      const { data, error } = await supabase
        .from('Meeting')
        .select('id, title, fileName, status, createdAt, summary, participants, meetingDate')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching meetings:', error);
      } else {
        setMeetings((data as Meeting[]) || []);
      }
      setLoading(false);
    }
    fetchMeetings();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reuniões</h1>
            <p className="text-muted-foreground">Gerencie suas transcrições</p>
          </div>
          <Link to="/upload">
            <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground">
              Nova Transcrição
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : meetings.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-foreground mb-1">Nenhuma reunião encontrada</h3>
                <p className="text-sm text-muted-foreground mb-4">Suas transcrições aparecerão aqui após o primeiro upload</p>
                <Link to="/upload">
                  <Button variant="outline">Fazer Upload</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const cfg = statusConfig[meeting.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              const date = meeting.meetingDate
                ? new Date(meeting.meetingDate).toLocaleDateString('pt-BR')
                : new Date(meeting.createdAt).toLocaleDateString('pt-BR');

              return (
                <Link key={meeting.id} to={`/meetings/${meeting.id}`} className="block">
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">{date} · {meeting.fileName}</p>
                      </div>
                      <Badge variant={cfg.variant} className="shrink-0 flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
