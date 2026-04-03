import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Copy, Search, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  interested: 'bg-yellow-100 text-yellow-700',
  demo_started: 'bg-orange-100 text-orange-700',
  demo_completed: 'bg-emerald-100 text-emerald-700',
  trial_started: 'bg-teal-100 text-teal-700',
  paid: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-700',
};

interface Lead {
  id: string;
  createdAt: string;
  name: string | null;
  email: string | null;
  company: string | null;
  role: string | null;
  source: string;
  campaign: string | null;
  persona: string | null;
  status: string;
  lastStep: string;
  notes: string | null;
  userId: string | null;
  meetingId: string | null;
}

export default function AdminLeads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]); // eslint-disable-line

  const checkAdminAndLoad = async () => {
    if (!user) return;
    const { data } = await supabase.from('User').select('isAdmin').eq('id', user.id).maybeSingle();
    if (!data?.isAdmin) { navigate('/dashboard'); return; }
    loadLeads();
  };

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Lead' as any)
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(500);
    if (!error) setLeads((data as any) || []);
    setLoading(false);
  }, []);

  const filtered = leads.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (l.name?.toLowerCase().includes(s) || l.email?.toLowerCase().includes(s) || l.company?.toLowerCase().includes(s));
    }
    return true;
  });

  const markContacted = async (id: string) => {
    await supabase.from('Lead' as any).update({ status: 'contacted' } as any).eq('id', id);
    toast.success('Lead marcado como contatado');
    loadLeads();
  };

  const saveNotes = async () => {
    if (!detailLead) return;
    setSaving(true);
    await supabase.from('Lead' as any).update({ notes } as any).eq('id', detailLead.id);
    toast.success('Notas salvas');
    setSaving(false);
    setDetailLead(null);
    loadLeads();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Leads do Demo</h1>
          <Button variant="outline" size="sm" onClick={loadLeads}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome, email ou empresa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Empresa</TableHead>
                      <TableHead className="text-xs">Source</TableHead>
                      <TableHead className="text-xs">Persona</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Último passo</TableHead>
                      <TableHead className="text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs font-mono">{new Date(l.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-xs">{l.name || '—'}</TableCell>
                        <TableCell className="text-xs font-mono">{l.email || '—'}</TableCell>
                        <TableCell className="text-xs">{l.company || '—'}</TableCell>
                        <TableCell className="text-xs">{l.source}</TableCell>
                        <TableCell className="text-xs">{l.persona || '—'}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${STATUS_COLORS[l.status] || 'bg-gray-100 text-gray-700'}`}>{l.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.lastStep}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setDetailLead(l); setNotes(l.notes || ''); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {l.email && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(l.email!); toast.success('Email copiado'); }}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">Nenhum lead encontrado</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead detail dialog */}
        <Dialog open={!!detailLead} onOpenChange={(o) => !o && setDetailLead(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Detalhes do Lead</DialogTitle></DialogHeader>
            {detailLead && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="text-muted-foreground">Nome:</span> {detailLead.name || '—'}</p>
                  <p><span className="text-muted-foreground">Email:</span> {detailLead.email || '—'}</p>
                  <p><span className="text-muted-foreground">Empresa:</span> {detailLead.company || '—'}</p>
                  <p><span className="text-muted-foreground">Cargo:</span> {detailLead.role || '—'}</p>
                  <p><span className="text-muted-foreground">Source:</span> {detailLead.source}</p>
                  <p><span className="text-muted-foreground">Campaign:</span> {detailLead.campaign || '—'}</p>
                  <p><span className="text-muted-foreground">Persona:</span> {detailLead.persona || '—'}</p>
                  <p><span className="text-muted-foreground">Status:</span> <Badge className={STATUS_COLORS[detailLead.status]}>{detailLead.status}</Badge></p>
                  <p><span className="text-muted-foreground">Último passo:</span> {detailLead.lastStep}</p>
                  <p><span className="text-muted-foreground">User ID:</span> {detailLead.userId || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Notas</label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Adicione notas sobre este lead..." />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => markContacted(detailLead.id)}>Marcar como contatado</Button>
                  <Button size="sm" onClick={saveNotes} disabled={saving}>
                    {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Salvar notas
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
