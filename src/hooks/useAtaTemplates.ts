import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { TemplateSectionData } from '@/lib/ataTemplateCatalog';

export interface AtaTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  sections: TemplateSectionData[];
  createdAt: string;
  updatedAt: string;
}

export function useAtaTemplates() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [templates, setTemplates] = useState<AtaTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('AtaTemplate')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(
        (data || []).map((t: any) => ({
          ...t,
          sections: (typeof t.sections === 'string' ? JSON.parse(t.sections) : t.sections) as TemplateSectionData[],
        }))
      );
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = useCallback(
    async (input: { name: string; description?: string; isDefault: boolean; sections: TemplateSectionData[] }) => {
      if (!userId) return null;

      if (input.isDefault) {
        await supabase.from('AtaTemplate').update({ isDefault: false } as any).eq('userId', userId).eq('isDefault', true);
      }

      const { data, error } = await supabase
        .from('AtaTemplate')
        .insert({ userId, name: input.name, description: input.description || null, isDefault: input.isDefault, sections: input.sections as any })
        .select()
        .maybeSingle();

      if (error) {
        toast.error('Erro ao criar modelo');
        console.error(error);
        return null;
      }
      toast.success('Modelo criado!');
      await fetchTemplates();
      return data;
    },
    [userId, fetchTemplates]
  );

  const updateTemplate = useCallback(
    async (id: string, input: { name: string; description?: string; isDefault: boolean; sections: TemplateSectionData[] }) => {
      if (!userId) return;

      if (input.isDefault) {
        await supabase.from('AtaTemplate').update({ isDefault: false } as any).eq('userId', userId).eq('isDefault', true);
      }

      const { error } = await supabase
        .from('AtaTemplate')
        .update({ name: input.name, description: input.description || null, isDefault: input.isDefault, sections: input.sections as any } as any)
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar modelo');
        console.error(error);
        return;
      }
      toast.success('Modelo atualizado!');
      await fetchTemplates();
    },
    [userId, fetchTemplates]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('AtaTemplate').delete().eq('id', id);
      if (error) {
        toast.error('Erro ao excluir modelo');
        return;
      }
      toast.success('Modelo excluído');
      await fetchTemplates();
    },
    [fetchTemplates]
  );

  const setAsDefault = useCallback(
    async (id: string) => {
      if (!userId) return;
      await supabase.from('AtaTemplate').update({ isDefault: false } as any).eq('userId', userId).eq('isDefault', true);
      await supabase.from('AtaTemplate').update({ isDefault: true } as any).eq('id', id);
      toast.success('Modelo definido como padrão');
      await fetchTemplates();
    },
    [userId, fetchTemplates]
  );

  const defaultTemplate = templates.find((t) => t.isDefault) || null;

  return { templates, defaultTemplate, isLoading, createTemplate, updateTemplate, deleteTemplate, setAsDefault, refetch: fetchTemplates };
}
