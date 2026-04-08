import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Star, Lock, LayoutTemplate } from 'lucide-react';
import { useAtaTemplates, type AtaTemplate } from '@/hooks/useAtaTemplates';
import { TemplateEditorModal } from '@/components/ata-templates/TemplateEditorModal';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS_WITH_TEMPLATES } from '@/lib/ataTemplateCatalog';
import { Link } from 'react-router-dom';

export default function SettingsAtaTemplates() {
  const { profile } = useAuth();
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, setAsDefault } = useAtaTemplates();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AtaTemplate | null>(null);

  const planId = profile?.plan_id || 'basic';
  const hasTrial = profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
  const canCustomize = PLANS_WITH_TEMPLATES.includes(planId) || hasTrial;

  const openNew = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const openEdit = (t: AtaTemplate) => {
    setEditingTemplate(t);
    setEditorOpen(true);
  };

  const handleSave = async (data: Parameters<typeof createTemplate>[0]) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, data);
    } else {
      await createTemplate(data);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Modelos de ATA</h1>
            <p className="text-muted-foreground">Crie e gerencie seus modelos personalizados</p>
          </div>
          {canCustomize && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Novo modelo
            </Button>
          )}
        </div>

        {!canCustomize && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6 flex items-center gap-4">
              <Lock className="h-8 w-8 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Personalize seus modelos de ATA com o plano Inteligente ou superior</p>
                <p className="text-sm text-muted-foreground mt-1">Escolha as seções, renomeie rótulos e adicione instruções para a IA.</p>
                <Link to="/plans">
                  <Button size="sm" className="mt-3">Ver planos</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : templates.length === 0 && canCustomize ? (
          <Card>
            <CardContent className="p-8 text-center">
              <LayoutTemplate className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground">Você ainda não criou nenhum modelo</p>
              <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro modelo personalizado.</p>
              <Button className="mt-4" onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" /> Criar modelo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => {
              const enabledCount = t.sections.filter((s) => s.enabled).length;
              return (
                <Card key={t.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">{t.name}</h3>
                        {t.isDefault && <Badge className="bg-primary text-primary-foreground text-[10px]">Padrão</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{enabledCount} seções</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!t.isDefault && (
                        <Button variant="ghost" size="sm" onClick={() => setAsDefault(t.id)} title="Definir como padrão">
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTemplate(t.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <TemplateEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        onSave={handleSave}
      />
    </AppLayout>
  );
}
