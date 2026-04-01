import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, CheckCircle, AlertCircle, Clock, Users, FileText, ListChecks, AlignLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MeetingRow {
  id: string;
  title: string;
  fileName: string;
  status: string;
  createdAt: string;
  summary: string | null;
  transcription: string | null;
  participants: string[];
  meetingDate: string | null;
  meetingTime: string | null;
  actionItems: string[];
  responsible: string | null;
  location: string | null;
  description: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  completed: { label: 'Concluída', variant: 'default', icon: CheckCircle },
  processing: { label: 'Processando', variant: 'secondary', icon: Clock },
  pending: { label: 'Pendente', variant: 'outline', icon: Clock },
  failed: { label: 'Falhou', variant: 'destructive', icon: AlertCircle },
};

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<MeetingRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeeting() {
      if (!id) return;
      const { data, error } = await supabase
        .from('Meeting')
        .select('id, title, fileName, status, createdAt, summary, transcription, participants, meetingDate, meetingTime, actionItems, responsible, location, description')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching meeting:', error);
      } else {
        setMeeting(data as MeetingRow);
      }
      setLoading(false);
    }
    fetchMeeting();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!meeting) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-foreground mb-2">Reunião não encontrada</h2>
          <Link to="/meetings">
            <Button variant="outline">Voltar para Reuniões</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const cfg = statusConfig[meeting.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  const date = meeting.meetingDate
    ? new Date(meeting.meetingDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date(meeting.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Back + Header */}
        <div>
          <Link to="/meetings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4" />
            Voltar para Reuniões
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{meeting.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {date}
                {meeting.meetingTime && ` · ${meeting.meetingTime}`}
                {meeting.location && ` · ${meeting.location}`}
              </p>
            </div>
            <Badge variant={cfg.variant} className="shrink-0 flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </Badge>
          </div>
          {meeting.description && (
            <p className="text-sm text-muted-foreground mt-2">{meeting.description}</p>
          )}
        </div>

        {/* Participants */}
        {meeting.participants.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Participantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {meeting.participants.map((p, i) => (
                  <Badge key={i} variant="secondary">{p}</Badge>
                ))}
              </div>
              {meeting.responsible && (
                <p className="text-sm text-muted-foreground mt-2">Responsável: {meeting.responsible}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {meeting.summary && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-primary" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {meeting.summary}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Items */}
        {meeting.actionItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                Itens de Ação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {meeting.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Transcription */}
        {meeting.transcription && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Transcrição Completa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-sm leading-relaxed max-h-[600px] overflow-y-auto">
                {meeting.transcription}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
