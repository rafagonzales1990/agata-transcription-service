import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface OnboardingChecklistProps {
  userId: string | undefined;
  accountCreatedAt: string | undefined;
}

const SUCCESS_HIDE_KEY_PREFIX = 'agata_onboarding_checklist_success_';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function OnboardingChecklist({ userId, accountCreatedAt }: OnboardingChecklistProps) {
  const [completedMeetings, setCompletedMeetings] = useState(0);
  const [hasAtaTemplateMeeting, setHasAtaTemplateMeeting] = useState(false);
  const [loading, setLoading] = useState(true);

  const isNewAccount = useMemo(() => {
    if (!accountCreatedAt) return false;
    const createdTime = new Date(accountCreatedAt).getTime();
    if (Number.isNaN(createdTime)) return false;
    return Date.now() - createdTime < 7 * DAY_IN_MS;
  }, [accountCreatedAt]);

  useEffect(() => {
    async function fetchChecklistState() {
      if (!userId) {
        setLoading(false);
        return;
      }

      const [{ count }, { data: ataMeeting }] = await Promise.all([
        supabase
          .from('Meeting')
          .select('id', { count: 'exact', head: true })
          .eq('userId', userId)
          .eq('status', 'completed'),
        supabase
          .from('Meeting')
          .select('id')
          .eq('userId', userId)
          .eq('status', 'completed')
          .not('ataTemplate', 'is', null)
          .limit(1)
          .maybeSingle(),
      ]);

      setCompletedMeetings(count || 0);
      setHasAtaTemplateMeeting(!!ataMeeting);
      setLoading(false);
    }

    fetchChecklistState();
  }, [userId]);

  const items = [
    { label: 'Conta criada', done: true },
    { label: 'Fazer primeira transcrição', done: completedMeetings > 0, cta: 'Transcrever agora →' },
    { label: 'Ver resumo gerado', done: completedMeetings > 0 },
    { label: 'Baixar primeira ATA', done: hasAtaTemplateMeeting },
  ];

  const completedSteps = items.filter((item) => item.done).length;
  const allComplete = completedSteps === items.length;

  useEffect(() => {
    if (!userId || !allComplete) return;
    const key = `${SUCCESS_HIDE_KEY_PREFIX}${userId}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, String(Date.now() + DAY_IN_MS));
    }
  }, [allComplete, userId]);

  if (!isNewAccount || loading || !userId) return null;

  const hideUntil = Number(localStorage.getItem(`${SUCCESS_HIDE_KEY_PREFIX}${userId}`) || 0);
  if (allComplete && hideUntil > 0 && Date.now() > hideUntil) return null;

  return (
    <Card className="border-l-4 border-emerald-500 shadow-lg">
      <CardContent className="p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">🚀 Primeiros passos</h2>
            <p className="text-sm text-muted-foreground">Complete os passos abaixo para aproveitar tudo que o Ágata oferece</p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{completedSteps}/4 passos completos</span>
        </div>

        <Progress value={(completedSteps / 4) * 100} className="mb-4 h-2" />

        {allComplete ? (
          <p className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-foreground">
            🎉 Você está pronto! Aproveite o Ágata ao máximo.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span>{item.label}</span>
                </div>
                {!item.done && item.cta && (
                  <Button asChild size="sm" className="w-full sm:w-auto">
                    <Link to="/upload">{item.cta}</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}