import { Calendar, Clock, RefreshCw, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { supabase } from '@/integrations/supabase/client';

export function GoogleCalendarMeetingsCard() {
  const navigate = useNavigate();
  const { events, hasToken, needsReconnect, loading, disconnect } = useGoogleCalendar();

  if (!hasToken && !loading) return null;

  const connectGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.readonly',
        redirectTo: `${window.location.origin}/settings?tab=integrations`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) toast.error('Erro ao conectar Google Calendar');
  };

  const handleRecord = (title: string) => {
    navigate(`/upload?title=${encodeURIComponent(title)}`);
  };

  return (
    <Card className="border-l-4 border-l-primary shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" /> 📅 Próximas reuniões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : needsReconnect ? (
          <div className="rounded-lg border border-border bg-muted p-4 text-sm">
            <p className="mb-3 text-muted-foreground">Sua conexão expirou.</p>
            <Button onClick={connectGoogle} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <RefreshCw className="h-4 w-4" /> Reconectar Google Calendar
            </Button>
          </div>
        ) : events.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
            Nenhuma reunião nas próximas 24 horas
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const title = event.summary || 'Reunião sem título';
              const start = event.start?.dateTime || event.start?.date;
              const time = start ? new Date(start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

              return (
                <div key={event.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {time}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleRecord(title)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Video className="h-4 w-4" /> Gravar
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>Powered by Google Calendar</span>
          <button onClick={disconnect} className="font-medium text-destructive hover:underline">
            Desconectar
          </button>
        </div>
      </CardContent>
    </Card>
  );
}