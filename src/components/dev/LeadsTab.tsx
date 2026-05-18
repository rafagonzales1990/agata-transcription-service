import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Pencil, Download, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string | null;
  email: string;
  source: string | null;
  status: string | null;
  tags: string[] | null;
  active: boolean | null;
  created_at: string | null;
}

const sourceColors: Record<string, string> = {
  lp: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  blog: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  google_ads: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  youtube: 'bg-red-500/20 text-red-300 border-red-500/40',
  referral: 'bg-green-500/20 text-green-300 border-green-500/40',
  organico: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
};

const statusColors: Record<string, string> = {
  novo: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  qualificado: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  convertido: 'bg-green-500/20 text-green-300 border-green-500/40',
  inativo: 'bg-red-500/20 text-red-300 border-red-500/40',
};

export function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<Lead | null>(null);
  const [tagInput, setTagInput] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Erro ao buscar leads');
    else setLeads((data as Lead[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const filtered = useMemo(() => leads.filter(l => {
    if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    return true;
  }), [leads, sourceFilter, statusFilter]);

  const kpis = useMemo(() => {
    const total = leads.length;
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0);
    const newWeek = leads.filter(l => l.created_at && new Date(l.created_at) >= weekStart).length;
    const converted = leads.filter(l => l.status === 'convertido').length;
    const rate = total ? ((converted / total) * 100).toFixed(1) : '0';
    return { total, newWeek, converted, rate };
  }, [leads]);

  const handleSave = async () => {
    if (!editing) return;
    const { error } = await supabase.from('leads').update({
      source: editing.source,
      status: editing.status,
      tags: editing.tags,
      active: editing.active,
    }).eq('id', editing.id);
    if (error) toast.error('Erro ao salvar');
    else { toast.success('Lead atualizado'); setEditing(null); fetchLeads(); }
  };

  const addTag = () => {
    if (!tagInput.trim() || !editing) return;
    setEditing({ ...editing, tags: [...(editing.tags || []), tagInput.trim()] });
    setTagInput('');
  };

  const removeTag = (i: number) => {
    if (!editing) return;
    setEditing({ ...editing, tags: (editing.tags || []).filter((_, idx) => idx !== i) });
  };

  const exportCsv = () => {
    const headers = ['nome', 'email', 'source', 'status', 'tags', 'cadastro'];
    const rows = filtered.map(l => [
      l.name || '',
      l.email,
      l.source || '',
      l.status || '',
      (l.tags || []).join('|'),
      l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL DE LEADS', value: kpis.total },
          { label: 'NOVOS ESTA SEMANA', value: kpis.newWeek },
          { label: 'CONVERTIDOS', value: kpis.converted },
          { label: 'TAXA DE CONVERSÃO', value: `${kpis.rate}%` },
        ].map(k => (
          <Card key={k.label} className="p-4">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-2xl font-bold mt-1">{k.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os sources</SelectItem>
              <SelectItem value="lp">LP</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="google_ads">Google Ads</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="organico">Orgânico</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="qualificado">Qualificado</SelectItem>
              <SelectItem value="convertido">Convertido</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <Button onClick={exportCsv} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell>{l.name || '—'}</TableCell>
                  <TableCell className="text-xs">{l.email}</TableCell>
                  <TableCell>
                    {l.source && <Badge variant="outline" className={sourceColors[l.source] || ''}>{l.source}</Badge>}
                  </TableCell>
                  <TableCell>
                    {l.status && <Badge variant="outline" className={statusColors[l.status] || ''}>{l.status}</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(l.tags || []).map((t, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">{t}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum lead encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar lead</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Source</Label>
                <Select value={editing.source || ''} onValueChange={(v) => setEditing({ ...editing, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['lp','blog','google_ads','youtube','referral','organico'].map(s =>
                      <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editing.status || ''} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['novo','qualificado','convertido','inativo'].map(s =>
                      <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Digite e Enter" />
                  <Button type="button" onClick={addTag}>Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(editing.tags || []).map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded flex items-center gap-1">
                      {t}<button onClick={() => removeTag(i)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch checked={!!editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
