import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail, Database, Send, RotateCw, Users as UsersIcon, Trash, Gift, FileEdit, RefreshCcw, Search } from 'lucide-react';

type PreviewCounts = {
  resetTrials: number; assignGroups: number; cleanLogs: number;
  trialBonus: number; completeSignup: number; reactivation: number;
};
type LastRuns = Record<string, { executedAt: string; affectedCount: number }>;

type AffectedUser = {
  id: string; email: string; name: string; planId: string;
  status: 'Trial ativo' | 'Trial expirado' | 'Cadastro incompleto' | 'Gratuito';
  trialEndsAt: string | null;
};

type ActionDef = {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  previewKey: keyof PreviewCounts;
  borderColor: string;
  hasFilters: boolean; // blasts only
};

const DATA_ACTIONS: ActionDef[] = [
  { key: 'reset_trials', icon: <RotateCw className="h-5 w-5" />, title: 'Resetar Trials', description: 'Redefine trialEndsAt = hoje + 14 dias para todos os usuários do plano Gratuito.', previewKey: 'resetTrials', borderColor: '#3B82F6', hasFilters: false },
  { key: 'assign_groups', icon: <UsersIcon className="h-5 w-5" />, title: 'Atribuir Grupos', description: 'Atribui usuários aos grupos corretos conforme seu plano atual (Gratuito, Essencial, Pro).', previewKey: 'assignGroups', borderColor: '#3B82F6', hasFilters: false },
  { key: 'clean_logs', icon: <Trash className="h-5 w-5" />, title: 'Limpar Logs Antigos', description: 'Remove registros de NurturingLog com mais de 90 dias.', previewKey: 'cleanLogs', borderColor: '#3B82F6', hasFilters: false },
];

const BLAST_ACTIONS: ActionDef[] = [
  { key: 'blast_trial_bonus', icon: <Gift className="h-5 w-5" />, title: 'Trial Bonus', description: 'Envia e-mail de boas-vindas com 5 transcrições de 60 min para usuários com trial ativo que ainda não receberam.', previewKey: 'trialBonus', borderColor: '#00C781', hasFilters: true },
  { key: 'blast_complete_signup', icon: <FileEdit className="h-5 w-5" />, title: 'Finalizar Cadastro', description: 'Envia push para completar cadastro a usuários com campos faltando e trial ativo.', previewKey: 'completeSignup', borderColor: '#00C781', hasFilters: true },
  { key: 'blast_reactivation', icon: <RefreshCcw className="h-5 w-5" />, title: 'Reativar Plataforma', description: 'Envia e-mail de reativação para todos os usuários do plano Gratuito.', previewKey: 'reactivation', borderColor: '#00C781', hasFilters: true },
];

const TEMPLATE_OPTIONS = [
  'trial_bonus', 'trial_reminder', 'complete_signup', 'trial_reactivation',
  'welcome', 'trial_expiring', 'trial_expired', 'transcription_done', 'upgrade_suggestion',
];
const AUDIENCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos os usuários' },
  { value: 'trial_active', label: 'Apenas trial ativo' },
  { value: 'paid', label: 'Apenas pagantes' },
  { value: 'incomplete', label: 'Cadastro incompleto' },
];

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos afetados' },
  { value: 'with_name', label: 'Apenas com nome' },
  { value: 'without_name', label: 'Apenas sem nome' },
  { value: 'trial_active', label: 'Trial ativo' },
  { value: 'trial_expired', label: 'Trial expirado' },
];

async function invokeAdminAction(body: { action: string; params?: any }) {
  const { data: { session } } = await supabase.auth.getSession();
  return supabase.functions.invoke('admin-actions', {
    body,
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
}

function formatDate(iso?: string) {
  if (!iso) return 'Nunca executada';
  const d = new Date(iso);
  return `Última execução: ${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function statusBadge(status: AffectedUser['status']) {
  const cls: Record<string, string> = {
    'Trial ativo': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    'Trial expirado': 'bg-red-100 text-red-700 hover:bg-red-100',
    'Cadastro incompleto': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
    'Gratuito': 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  };
  return <Badge variant="secondary" className={cls[status]}>{status}</Badge>;
}

function ActionCard({
  def, count, lastRun, onRun, running,
}: { def: ActionDef; count: number; lastRun?: { executedAt: string; affectedCount: number }; onRun: () => void; running: boolean }) {
  return (
    <Card className="border bg-card" style={{ borderLeft: `4px solid ${def.borderColor}` }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="text-muted-foreground mt-0.5">{def.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground">{def.title}</div>
            <p className="text-sm text-muted-foreground mt-1">{def.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            {count} usuários
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(lastRun?.executedAt)}</span>
        </div>
        <Button size="sm" className="w-full" onClick={onRun} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Executar'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function AdminActionsTab() {
  const [counts, setCounts] = useState<PreviewCounts>({ resetTrials: 0, assignGroups: 0, cleanLogs: 0, trialBonus: 0, completeSignup: 0, reactivation: 0 });
  const [lastRuns, setLastRuns] = useState<LastRuns>({});
  const [previewAction, setPreviewAction] = useState<ActionDef | null>(null);
  const [marketingOpen, setMarketingOpen] = useState(false);

  const load = useCallback(async () => {
    const [{ data: p }, { data: l }] = await Promise.all([
      invokeAdminAction({ action: 'preview' }),
      invokeAdminAction({ action: 'last_runs' }),
    ]);
    if (p?.success) setCounts(p.data);
    if (l?.success) setLastRuns(l.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const previewCount = (k: keyof PreviewCounts) => counts[k] || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* SECTION 1 — Gestão de Dados */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Database className="h-5 w-5" /> Gestão de Dados</h3>
        <div className="space-y-3">
          {DATA_ACTIONS.map(a => (
            <ActionCard key={a.key} def={a} count={previewCount(a.previewKey)} lastRun={lastRuns[a.key]} running={false}
              onRun={() => setPreviewAction(a)} />
          ))}
        </div>
      </div>

      {/* SECTION 2 — Comunicação */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Mail className="h-5 w-5" /> Comunicação</h3>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Blasts automáticos</h4>
          <div className="space-y-3">
            {BLAST_ACTIONS.map(a => (
              <ActionCard key={a.key} def={a} count={previewCount(a.previewKey)} lastRun={lastRuns[a.key]} running={false}
                onRun={() => setPreviewAction(a)} />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">📣 E-mail Marketing</h4>
          <Card className="border bg-card" style={{ borderLeft: '4px solid #9B59B6' }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Send className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">Enviar E-mail Marketing</div>
                  <p className="text-sm text-muted-foreground mt-1">Crie e dispare uma campanha customizada — assunto, template e público-alvo.</p>
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={() => setMarketingOpen(true)}>Configurar campanha</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PreviewActionDialog
        action={previewAction}
        onOpenChange={(o) => !o && setPreviewAction(null)}
        onComplete={load}
      />

      <MarketingDialog open={marketingOpen} onOpenChange={setMarketingOpen} onComplete={load} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview + Confirm dialog (used for ALL data + blast actions)
// ─────────────────────────────────────────────────────────────────────────────
function PreviewActionDialog({
  action, onOpenChange, onComplete,
}: { action: ActionDef | null; onOpenChange: (o: boolean) => void; onComplete: () => void }) {
  const open = !!action;
  const [users, setUsers] = useState<AffectedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !action) {
      setUsers([]); setFilter('all'); setSearch(''); setResult(null); setRunning(false);
      setSelectedIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await invokeAdminAction({
        action: 'list_affected_users',
        params: { actionType: action.key },
      });
      if (!cancelled && data?.success) setUsers(data.data.users || []);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, action]);

  const filtered = useMemo(() => {
    let list = users;
    if (filter === 'with_name') list = list.filter(u => u.name && u.name !== '—');
    else if (filter === 'without_name') list = list.filter(u => !u.name || u.name === '—');
    else if (filter === 'trial_active') list = list.filter(u => u.status === 'Trial ativo');
    else if (filter === 'trial_expired') list = list.filter(u => u.status === 'Trial expirado');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, filter, search]);

  const visible = filtered.slice(0, 50);

  const run = async () => {
    if (!action) return;
    setRunning(true); setResult(null);
    try {
      const { data, error } = await invokeAdminAction({ action: action.key });
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'Erro');
      const affected = data.data?.affected ?? data.data?.sent ?? data.data?.deleted ?? 0;
      const skipped = data.data?.skipped ?? 0;
      const errs = data.data?.errors?.length || 0;
      const msg = `✅ Concluído: ${affected} afetados, ${skipped} pulados, ${errs} erros`;
      setResult(msg);
      toast.success(msg);
      onComplete();
      setTimeout(() => onOpenChange(false), 2000);
    } catch (e: any) {
      const msg = `❌ Erro: ${e.message}`;
      setResult(msg);
      toast.error(msg);
      setRunning(false);
    }
  };

  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{action.title} — Pré-visualização</DialogTitle>
          <DialogDescription>{action.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
          {action.hasFilters && (
            <div>
              <Label>Destinatários</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="border rounded-md overflow-auto flex-1 min-h-[200px] max-h-[400px]">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário corresponde aos filtros.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trial expira</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{statusBadge(u.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString('pt-BR') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {filtered.length} usuários serão afetados
            {filtered.length > 50 && <span className="ml-2 text-xs">(exibindo primeiros 50)</span>}
          </div>

          {result && (
            <div className={`text-sm p-3 rounded ${result.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {result}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={running}>Cancelar</Button>
          <Button onClick={run} disabled={running || filtered.length === 0}>
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar e Executar para {filtered.length} usuários →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Marketing dialog (unchanged 3-step flow)
// ─────────────────────────────────────────────────────────────────────────────
function MarketingDialog({ open, onOpenChange, onComplete }: { open: boolean; onOpenChange: (o: boolean) => void; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('welcome');
  const [audience, setAudience] = useState('trial_active');
  const [audienceCount, setAudienceCount] = useState(0);
  const [testSent, setTestSent] = useState(false);
  const [testApproved, setTestApproved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1); setSubject(''); setType('welcome'); setAudience('trial_active');
      setTestSent(false); setTestApproved(false); setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    invokeAdminAction({ action: 'preview_audience', params: { audience } })
      .then(({ data }) => { if (data?.success) setAudienceCount(data.data.count); });
  }, [audience, open]);

  const sendTest = async () => {
    setBusy(true);
    try {
      const { data, error } = await invokeAdminAction({ action: 'send_test_email', params: { type, subject } });
      if (error || !data?.success) throw new Error(data?.error || error?.message);
      setTestSent(true);
      toast.success('✅ Teste enviado! Verifique seu e-mail antes de continuar.');
    } catch (e: any) {
      toast.error(`❌ Erro: ${e.message}`);
    } finally { setBusy(false); }
  };

  const fire = async () => {
    setBusy(true);
    try {
      const { data, error } = await invokeAdminAction({ action: 'blast_marketing', params: { type, subject, audience } });
      if (error || !data?.success) throw new Error(data?.error || error?.message);
      const r = data.data;
      toast.success(`✅ Enviado para ${r.sent} usuários | ${r.skipped || 0} pulados | ${r.errors?.length || 0} erros`);
      onOpenChange(false);
      onComplete();
    } catch (e: any) {
      toast.error(`❌ Erro: ${e.message}`);
    } finally { setBusy(false); }
  };

  const audienceLabel = AUDIENCE_OPTIONS.find(a => a.value === audience)?.label || audience;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>E-mail Marketing — Passo {step} de 3</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Configure o assunto, template e público-alvo.'}
            {step === 2 && 'Envie um e-mail de teste antes do disparo.'}
            {step === 3 && 'Revise e dispare a campanha.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Assunto *</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto do e-mail" />
            </div>
            <div>
              <Label>Template</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TEMPLATE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destinatários</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AUDIENCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{audienceCount} usuários receberão este e-mail</Badge>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Button onClick={sendTest} disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar teste para adm@agatatranscription.com'}
            </Button>
            {testSent && (
              <div className="text-sm text-emerald-600">✅ Teste enviado! Verifique seu e-mail antes de continuar.</div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox id="approve" checked={testApproved} onCheckedChange={(c) => setTestApproved(!!c)} disabled={!testSent} />
              <Label htmlFor="approve" className="cursor-pointer">Confirmei o e-mail de teste e aprovo o disparo</Label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card className="border bg-muted/30">
              <CardContent className="p-4 space-y-2 text-sm">
                <div><span className="text-muted-foreground">Template:</span> <span className="font-medium">{type}</span></div>
                <div><span className="text-muted-foreground">Assunto:</span> <span className="font-medium">{subject}</span></div>
                <div><span className="text-muted-foreground">Destinatários:</span> <span className="font-medium">{audienceLabel}</span></div>
                <div><span className="text-muted-foreground">Total:</span> <span className="font-medium">{audienceCount} usuários</span></div>
              </CardContent>
            </Card>
            <div className="border border-amber-300 bg-amber-50 text-amber-800 p-3 rounded text-sm">
              ⚠️ Esta ação enviará e-mails reais para {audienceCount} usuários. Esta operação não pode ser desfeita.
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)} disabled={busy}>Voltar</Button>}
          {step < 3 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !subject) || (step === 2 && !testApproved)}
            >Próximo</Button>
          )}
          {step === 3 && (
            <Button onClick={fire} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : '🚀 Disparar agora'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
