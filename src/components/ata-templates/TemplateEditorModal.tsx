import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Lock, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_SECTIONS, buildDefaultSections, type TemplateSectionData } from '@/lib/ataTemplateCatalog';
import type { AtaTemplate } from '@/hooks/useAtaTemplates';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: AtaTemplate | null;
  onSave: (data: { name: string; description?: string; isDefault: boolean; sections: TemplateSectionData[] }) => Promise<void>;
}

interface SortableSectionItemProps {
  section: TemplateSectionData;
  isSelected: boolean;
  atLimit: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

function SortableSectionItem({ section, isSelected, atLimit, onToggle, onSelect }: SortableSectionItemProps) {
  const catalog = ALL_SECTIONS.find((s) => s.id === section.id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: section.isFixed || !section.enabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => section.enabled && !section.isFixed && onSelect(section.id)}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-colors flex items-center gap-2',
        section.isFixed && 'bg-emerald-50 border-primary/30',
        !section.isFixed && section.enabled && 'border-primary/40 bg-background',
        !section.isFixed && !section.enabled && 'border-border bg-muted/50 opacity-60',
        isSelected && 'ring-2 ring-primary',
        section.enabled && !section.isFixed && 'cursor-pointer'
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'shrink-0 touch-none',
          section.isFixed || !section.enabled ? 'opacity-20 cursor-default' : 'cursor-grab active:cursor-grabbing'
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Section info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {section.isFixed && <Lock className="h-3.5 w-3.5 text-primary shrink-0" />}
          <span className="text-sm font-medium truncate">{section.label}</span>
          {section.isFixed && (
            <Badge variant="outline" className="text-[10px] shrink-0">FIXO</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{catalog?.description}</p>
      </div>

      {/* Toggle */}
      {!section.isFixed ? (
        <Switch
          checked={section.enabled}
          onCheckedChange={() => onToggle(section.id)}
          disabled={!section.enabled && atLimit}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />
      ) : (
        <Badge variant="outline" className="text-[10px] shrink-0 opacity-0">FIXO</Badge>
      )}
    </div>
  );
}

export function TemplateEditorModal({ open, onOpenChange, template, onSave }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [sections, setSections] = useState<TemplateSectionData[]>(buildDefaultSections());
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>('identificacao');
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setIsDefault(template.isDefault);
      setSections(template.sections);
    } else {
      setName('');
      setDescription('');
      setIsDefault(false);
      setSections(buildDefaultSections());
    }
    setSelectedSectionId('identificacao');
  }, [template, open]);

  const enabledCount = sections.filter((s) => s.enabled).length;
  const optionalEnabledCount = enabledCount - 1;
  const atLimit = optionalEnabledCount >= 6;

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.isFixed) return s;
        if (!s.enabled && atLimit) return s;
        return { ...s, enabled: !s.enabled, order: !s.enabled ? enabledCount + 1 : 0 };
      })
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const fixedIndex = prev.findIndex((s) => s.isFixed);
      if (newIndex <= fixedIndex) return prev;

      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const updateSectionLabel = (id: string, label: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));
  };

  const updateSectionInstruction = (id: string, instruction: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, instruction: instruction || null } : s)));
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const catalogSection = ALL_SECTIONS.find((s) => s.id === selectedSectionId);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), description: description.trim() || undefined, isDefault, sections });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar Modelo de ATA' : 'Novo Modelo de ATA'}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-4">
          {/* LEFT — Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome do modelo *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Modelo Sprint" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descrição</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              <span className="text-sm">Usar como padrão</span>
            </div>
            <div className="text-sm">
              <Badge variant={atLimit ? 'destructive' : 'secondary'} className={cn(atLimit && 'bg-amber-500 hover:bg-amber-600')}>
                {enabledCount}/7 seções
              </Badge>
            </div>
          </div>

          {/* CENTER — Section selector with drag-and-drop */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Seções (1 fixa + até 6 opcionais)</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <SortableSectionItem
                      key={section.id}
                      section={section}
                      isSelected={selectedSectionId === section.id}
                      atLimit={atLimit}
                      onToggle={toggleSection}
                      onSelect={setSelectedSectionId}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* RIGHT — Customization */}
          <div className="space-y-4">
            {selectedSection && selectedSection.enabled ? (
              <>
                <p className="text-sm font-medium">Personalizar seção</p>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Rótulo personalizado</label>
                  <Input
                    value={selectedSection.label}
                    onChange={(e) => updateSectionLabel(selectedSection.id, e.target.value)}
                    placeholder={catalogSection?.label}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Instrução para a IA</label>
                  <Textarea
                    value={selectedSection.instruction || ''}
                    onChange={(e) => updateSectionInstruction(selectedSection.id, e.target.value)}
                    placeholder="Ex: Extraia apenas compromissos com prazo definido"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">A IA seguirá essa instrução ao gerar esta seção</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Selecione uma seção ativa para personalizar
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Salvando...' : 'Salvar modelo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
