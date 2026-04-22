import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderStatus {
  status: 'ok' | 'degraded' | 'down';
  latencyMs: number;
}

interface HealthCheckResult {
  gemini: ProviderStatus;
  openai: ProviderStatus;
  checkedAt: string;
}

const STATUS_CONFIG = {
  ok: { emoji: '🟢', label: 'Operacional', badgeClass: 'bg-emerald-100 text-emerald-700' },
  degraded: { emoji: '🟡', label: 'Degradado', badgeClass: 'bg-yellow-100 text-yellow-700' },
  down: { emoji: '🔴', label: 'Fora do ar', badgeClass: 'bg-red-100 text-red-700' },
};

export function AIStatusMonitor() {
  const [data, setData] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('health-check', { method: 'GET' });
      if (err) throw err;
      setData(result);
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao verificar');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [check]);

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return '—'; }
  };

  const renderProvider = (name: string, provider: ProviderStatus | undefined) => {
    const cfg = STATUS_CONFIG[provider?.status || 'down'];
    return (
      <div className="border border-border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">{name}</span>
          <Badge className={cfg.badgeClass}>{cfg.emoji} {cfg.label}</Badge>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground font-mono">
          <span>Latência: <span className="text-foreground font-medium">{provider?.latencyMs ?? '—'}ms</span></span>
          {data?.checkedAt && <span>Verificado: <span className="text-foreground font-medium">{formatTime(data.checkedAt)}</span></span>}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Status das IAs
        </CardTitle>
        <Button variant="outline" size="sm" onClick={check} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
          Verificar agora
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">Erro: {error}</p>}
        {renderProvider('Gemini 2.5 Flash', data?.gemini)}
        {renderProvider('OpenAI Whisper', data?.openai)}
        {!data && !loading && !error && <p className="text-sm text-muted-foreground text-center py-4">Verificação automática a cada 5 minutos</p>}
      </CardContent>
    </Card>
  );
}

export function AIStatusBanner({ data }: { data: HealthCheckResult | null }) {
  if (!data) return null;

  const issues: string[] = [];
  if (data.gemini?.status === 'down') issues.push('Gemini API fora do ar — fallback OpenAI ativo');
  else if (data.gemini?.status === 'degraded') issues.push('Gemini API com instabilidade detectada — fallback OpenAI pode ativar');
  if (data.openai?.status === 'down') issues.push('OpenAI API fora do ar — sem fallback disponível');
  else if (data.openai?.status === 'degraded') issues.push('OpenAI API com instabilidade');

  if (issues.length === 0) return null;

  const hasDown = data.gemini?.status === 'down' || data.openai?.status === 'down';
  const bgClass = hasDown ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800';

  return (
    <div className={`rounded-lg border p-3 text-sm ${bgClass}`}>
      {issues.map((msg, i) => (
        <p key={i}>⚠️ {msg}</p>
      ))}
    </div>
  );
}
