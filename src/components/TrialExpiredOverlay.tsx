import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface TrialExpiredOverlayProps {
  userId: string;
  open: boolean;
  onDismiss: () => void;
}

export function TrialExpiredOverlay({ userId, open, onDismiss }: TrialExpiredOverlayProps) {
  const navigate = useNavigate();
  const [meetingCount, setMeetingCount] = useState(0);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!open || !userId) return;

    async function fetchTrialStats() {
      const [{ count }, { data: usage }] = await Promise.all([
        supabase
          .from('Meeting')
          .select('id', { count: 'exact', head: true })
          .eq('userId', userId)
          .eq('status', 'completed'),
        supabase
          .from('Usage')
          .select('totalMinutesTranscribed')
          .eq('userId', userId)
          .maybeSingle(),
      ]);

      setMeetingCount(count || 0);
      setMinutes(usage?.totalMinutesTranscribed || 0);
    }

    fetchTrialStats();
  }, [open, userId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <Card className="w-full max-w-[480px] border-0 bg-card text-card-foreground shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
              ⏰
            </div>
              <h2 className="text-2xl font-bold tracking-normal text-card-foreground">Seu período gratuito acabou</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {meetingCount > 0
                ? `Você criou ${meetingCount} reuni${meetingCount === 1 ? 'ão' : 'ões'} durante seu trial. Não perca o acesso ao seu histórico.`
                : 'Comece agora sem perder nada.'}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted p-4 text-center">
              <FileText className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-lg font-bold text-foreground">{meetingCount}</p>
              <p className="text-xs text-muted-foreground">reuniões transcritas</p>
            </div>
            <div className="rounded-lg border border-border bg-muted p-4 text-center">
              <Clock className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-lg font-bold text-foreground">{minutes}</p>
              <p className="text-xs text-muted-foreground">minutos de áudio</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-primary/20 bg-primary/10 p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">Plano Essencial</p>
                <p className="text-2xl font-bold text-primary">R$ 53/mês</p>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate('/plans')}
            >
              Assinar agora →
            </Button>
          </div>

          <button
            onClick={onDismiss}
            className="mt-5 w-full text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Ver minhas reuniões (somente leitura)
          </button>
        </CardContent>
      </Card>
    </div>
  );
}