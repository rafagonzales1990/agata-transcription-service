import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderStatus {
  status: 'ok' | 'error' | 'degraded' | 'down';
  latencyMs: number;
  detail?: string;
}

interface HealthCheckResult {
  assemblyai?: ProviderStatus;
  gemini_2_5: ProviderStatus;
  gemini_2_0?: ProviderStatus;
  gemini_2_5_flash_lite?: ProviderStatus;
  openai: ProviderStatus;
  checkedAt?: string;
}

const STATUS_CONFIG = {
  ok: { emoji: '🟢', label: 'Operacional', badgeClass: 'bg-emerald-100 text-emerald-700' },
  error: { emoji: '🔴', label: 'Fora do ar', badgeClass: 'bg-red-100 text-red-700' },
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
      const { data: result, error: err } = await supabase.functions.invoke('health-check');
      if (err) throw err;
      setData({ ...result, checkedAt: new Date().toISOString() });
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao verificar status das IAs');
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

  const renderProvider = (name: string, provider: ProviderStatus | undefined, color: 'green' | 'blue' = 'green') => {
    const cfg = STATUS_CONFIG[provider?.status || 'down'];
    const isError = provider?.status === 'error' || provider?.status === 'down';
    const colorStyles = color === 'green'
      ? { borderLeft: '4px solid #00C781', backgroundColor: '#F0FFF8' }
      : { borderLeft: '4px solid #4EA7FC', backgroundColor: '#F0F7FF' };
    const dotColor = color === 'green' ? '#00C781' : '#4EA7FC';
    return (
      <div className="border border-border rounded-lg p-4 space-y-2" style={colorStyles}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
            {name}
          </span>
          <Badge className={cfg.badgeClass}>{cfg.emoji} {cfg.label}</Badge>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground font-mono">
          <span>Latência: <span className="text-foreground font-medium">{provider?.latencyMs ?? '—'}ms</span></span>
          {data?.checkedAt && <span>Verificado: <span className="text-foreground font-medium">{formatTime(data.checkedAt)}</span></span>}
        </div>
        {isError && provider?.detail && (
          <p className="text-xs text-destructive break-words">{provider.detail}</p>
        )}
      </div>
    );
  };

  const geminiLite = data?.gemini_2_5_flash_lite || data?.gemini_2_0;

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
        {(() => {
          const assemblyai = data?.assemblyai;
          const isOk = assemblyai?.status === 'ok';
          return (
            <div className="border border-border rounded-lg p-4 space-y-2" style={{ borderLeft: '4px solid #9B59B6', backgroundColor: '#F9F0FF' }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-500" />
                  AssemblyAI
                </span>
                <Badge className={isOk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                  {isOk ? '🟢 Operacional' : '🔴 Indisponível'}
                </Badge>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                <span>Latência: <span className="text-foreground font-medium">{assemblyai?.latencyMs ?? '—'}ms</span></span>
                {data?.checkedAt && <span>Verificado: <span className="text-foreground font-medium">{formatTime(data.checkedAt)}</span></span>}
              </div>
              {!isOk && assemblyai?.detail && (
                <p className="text-xs text-destructive break-words">{assemblyai.detail}</p>
              )}
            </div>
          );
        })()}
        {renderProvider('Gemini 2.5 Flash', data?.gemini_2_5)}
        {renderProvider('Gemini 2.5 Lite', geminiLite)}
        {renderProvider('OpenAI Whisper', data?.openai)}
        {!data && !loading && !error && <p className="text-sm text-muted-foreground text-center py-4">Verificação automática a cada 5 minutos</p>}
      </CardContent>
    </Card>
  );
}

export function AIStatusBanner({ data }: { data: HealthCheckResult | null }) {
  if (!data) return null;

  const issues: string[] = [];
  const geminiLite = data.gemini_2_5_flash_lite || data.gemini_2_0;
  if (data.gemini_2_5?.status === 'error' || data.gemini_2_5?.status === 'down') issues.push('Gemini 2.5 Flash fora do ar — fallback Gemini Lite ativo');
  else if (data.gemini_2_5?.status === 'degraded') issues.push('Gemini 2.5 Flash com instabilidade detectada — fallback pode ativar');
  if (geminiLite?.status === 'error' || geminiLite?.status === 'down') issues.push('Gemini 2.5 Lite fora do ar — fallback OpenAI ativo');
  else if (geminiLite?.status === 'degraded') issues.push('Gemini 2.5 Lite com instabilidade');
  if (data.openai?.status === 'error' || data.openai?.status === 'down') issues.push('OpenAI API fora do ar — sem fallback disponível');
  else if (data.openai?.status === 'degraded') issues.push('OpenAI API com instabilidade');

  if (issues.length === 0) return null;

  const hasDown = data.gemini_2_5?.status === 'error' || data.gemini_2_5?.status === 'down' || geminiLite?.status === 'error' || geminiLite?.status === 'down' || data.openai?.status === 'error' || data.openai?.status === 'down';
  const bgClass = hasDown ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800';

  return (
    <div className={`rounded-lg border p-3 text-sm ${bgClass}`}>
      {issues.map((msg, i) => (
        <p key={i}>⚠️ {msg}</p>
      ))}
    </div>
  );
}
