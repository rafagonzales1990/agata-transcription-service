import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pencil, Trash2, Plus, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  cover_image_url: string | null;
  excerpt: string | null;
  content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean | null;
  scheduled_publish_at: string | null;
  published_at: string | null;
  view_count: number | null;
  created_at: string | null;
}

const empty: Partial<BlogPost> = {
  title: '', slug: '', category: '', cover_image_url: '', excerpt: '', content: '',
  seo_title: '', seo_description: '', published: false, scheduled_publish_at: null,
};

const slugify = (s: string) =>
  s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');

function statusOf(p: BlogPost) {
  if (p.published) return { label: 'Publicado', cls: 'bg-green-500/20 text-green-300 border-green-500/40' };
  if (p.scheduled_publish_at && !p.published) return { label: 'Agendado', cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' };
  return { label: 'Rascunho', cls: 'bg-gray-500/20 text-gray-300 border-gray-500/40' };
}

export function BlogTab() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Erro ao buscar posts');
    else setItems((data as BlogPost[]) || []);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditing({ ...empty }); setScheduleEnabled(false); setSlugTouched(false); setSeoOpen(false); };
  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setScheduleEnabled(!!p.scheduled_publish_at);
    setSlugTouched(true);
    setSeoOpen(false);
  };

  const handleTitle = (v: string) => {
    if (!editing) return;
    setEditing({ ...editing, title: v, slug: slugTouched ? editing.slug : slugify(v) });
  };

  const save = async () => {
    if (!editing?.title || !editing?.slug) { toast.error('Título e slug obrigatórios'); return; }
    const payload: any = {
      title: editing.title,
      slug: editing.slug,
      category: editing.category || null,
      cover_image_url: editing.cover_image_url || null,
      excerpt: editing.excerpt || null,
      content: editing.content || null,
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
      published: !!editing.published,
      scheduled_publish_at: scheduleEnabled ? editing.scheduled_publish_at : null,
      published_at: editing.published && !editing.published_at ? new Date().toISOString() : editing.published_at,
    };
    const { error } = editing.id
      ? await supabase.from('blog_posts').update(payload).eq('id', editing.id)
      : await supabase.from('blog_posts').insert(payload);
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Salvo'); setEditing(null); fetchData(); }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este post?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else { toast.success('Excluído'); fetchData(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Post</Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(p => {
                const s = statusOf(p);
                const date = p.published_at || p.created_at;
                return (
                  <TableRow key={p.id}>
                    <TableCell>{p.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.slug}</TableCell>
                    <TableCell>{p.category || '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={s.cls}>{s.label}</Badge></TableCell>
                    <TableCell>{p.view_count || 0}</TableCell>
                    <TableCell className="text-xs">{date ? new Date(date).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum post</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar' : 'Novo'} Post</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={editing.title || ''} onChange={(e) => handleTitle(e.target.value)} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={editing.slug || ''} onChange={(e) => { setSlugTouched(true); setEditing({ ...editing, slug: e.target.value }); }} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              </div>
              <div>
                <Label>URL da imagem de capa</Label>
                <Input value={editing.cover_image_url || ''} onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })} />
              </div>
              <div>
                <Label>Resumo</Label>
                <Textarea value={editing.excerpt || ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
              </div>
              <div>
                <Label>Conteúdo HTML</Label>
                <Textarea
                  className="font-mono min-h-[320px]"
                  placeholder="Cole aqui o HTML do post..."
                  value={editing.content || ''}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                />
              </div>

              <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    SEO <ChevronDown className={`h-4 w-4 transition-transform ${seoOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div>
                    <Label>SEO Title <span className="text-xs text-muted-foreground">({(editing.seo_title || '').length}/60)</span></Label>
                    <Input maxLength={60} value={editing.seo_title || ''} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} />
                  </div>
                  <div>
                    <Label>SEO Description <span className="text-xs text-muted-foreground">({(editing.seo_description || '').length}/160)</span></Label>
                    <Textarea maxLength={160} value={editing.seo_description || ''} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label>Publicado</Label>
                  <Switch checked={!!editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="sched" checked={scheduleEnabled} onCheckedChange={(v) => setScheduleEnabled(!!v)} />
                  <Label htmlFor="sched" className="font-normal">Agendar publicação</Label>
                </div>
                {scheduleEnabled && (
                  <Input type="datetime-local"
                    value={editing.scheduled_publish_at ? new Date(editing.scheduled_publish_at).toISOString().slice(0,16) : ''}
                    onChange={(e) => setEditing({ ...editing, scheduled_publish_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
