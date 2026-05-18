import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Play, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Newsletter {
  id: string;
  title: string;
  subject: string;
  html: string | null;
  audience: string | null;
  status: string | null;
  scheduled_at: string | null;
  recipient_count: number | null;
}

const audienceColors: Record<string, string> = {
  leads: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  users: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  all: 'bg-green-500/20 text-green-300 border-green-500/40',
};
const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  scheduled: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  sending: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  sent: 'bg-green-500/20 text-green-300 border-green-500/40',
};

const empty: Partial<Newsletter> = { title: '', subject: '', html: '', audience: 'all', status: 'draft', scheduled_at: null };

export function NewsletterTab() {
  const [items, setItems] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Newsletter> | null>(null);
  const [schedule, setSchedule] = useState<'now' | 'later'>('now');
  const [sending, setSending] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('newsletters').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Erro ao buscar newsletters');
    else setItems((data as Newsletter[]) || []);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditing({ ...empty }); setSchedule('now'); };
  const openEdit = (n: Newsletter) => {
    setEditing(n);
    setSchedule(n.scheduled_at ? 'later' : 'now');
  };

  const save = async () => {
    if (!editing?.title || !editing?.subject) {
      toast.error('Título e assunto obrigatórios'); return;
    }
    const payload: any = {
      title: editing.title,
      subject: editing.subject,
      html: editing.html || '',
      audience: editing.audience || 'all',
      status: schedule === 'later' ? 'scheduled' : 'draft',
      scheduled_at: schedule === 'later' ? editing.scheduled_at : null,
    };
    const { error } = editing.id
      ? await supabase.from('newsletters').update(payload).eq('id', editing.id)
      : await supabase.from('newsletters').insert(payload);
    if (error) toast.error('Erro ao salvar: ' + error.message);
    else { toast.success('Salvo'); setEditing(null); fetchData(); }
  };

  const sendNow = async (id: string) => {
    setSending(id);
    const { data, error } = await supabase.functions.invoke('send-newsletter', { body: { newsletter_id: id } });
    setSending(null);
    if (error) toast.error('Erro ao enviar: ' + error.message);
    else { toast.success(`Enviado para ${data?.sent || 0} destinatários`); fetchData(); }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta newsletter?')) return;
    const { error } = await supabase.from('newsletters').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else { toast.success('Excluído'); fetchData(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Newsletter</Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título interno</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Audiência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agendado para</TableHead>
                <TableHead>Enviados</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(n => (
                <TableRow key={n.id} className="cursor-pointer" onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; openEdit(n); }}>
                  <TableCell>{n.title}</TableCell>
                  <TableCell className="text-xs">{n.subject}</TableCell>
                  <TableCell>{n.audience && <Badge variant="outline" className={audienceColors[n.audience]}>{n.audience}</Badge>}</TableCell>
                  <TableCell>{n.status && <Badge variant="outline" className={statusColors[n.status]}>{n.status}</Badge>}</TableCell>
                  <TableCell className="text-xs">{n.scheduled_at ? new Date(n.scheduled_at).toLocaleString('pt-BR') : '—'}</TableCell>
                  <TableCell>{n.recipient_count || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(n.status === 'draft' || n.status === 'scheduled') && (
                        <Button size="icon" variant="ghost" disabled={sending === n.id} onClick={() => sendNow(n.id)}>
                          {sending === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        </Button>
                      )}
                      {n.status === 'draft' && (
                        <Button size="icon" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma newsletter</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar' : 'Nova'} Newsletter</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Título interno</Label>
                <Input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Assunto do e-mail</Label>
                <Input value={editing.subject || ''} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
              </div>
              <div>
                <Label>HTML do e-mail</Label>
                <Textarea
                  className="font-mono min-h-[240px]"
                  placeholder="Cole aqui o HTML do e-mail..."
                  value={editing.html || ''}
                  onChange={(e) => setEditing({ ...editing, html: e.target.value })}
                />
              </div>
              <div>
                <Label>Audiência</Label>
                <Select value={editing.audience || 'all'} onValueChange={(v) => setEditing({ ...editing, audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">Apenas Leads</SelectItem>
                    <SelectItem value="users">Apenas Usuários do App</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quando enviar</Label>
                <RadioGroup value={schedule} onValueChange={(v: 'now' | 'later') => setSchedule(v)} className="mt-2">
                  <div className="flex items-center gap-2"><RadioGroupItem value="now" id="now" /><Label htmlFor="now" className="font-normal">Enviar manualmente</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="later" id="later" /><Label htmlFor="later" className="font-normal">Agendar</Label></div>
                </RadioGroup>
                {schedule === 'later' && (
                  <Input type="datetime-local" className="mt-2"
                    value={editing.scheduled_at ? new Date(editing.scheduled_at).toISOString().slice(0,16) : ''}
                    onChange={(e) => setEditing({ ...editing, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Salvar rascunho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
