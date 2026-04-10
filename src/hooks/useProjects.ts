import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Project {
  id: string;
  name: string;
  userId: string;
  teamId: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('Project')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects((data as Project[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (name: string, color: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from('Project')
      .insert({ name, color, userId: user.id })
      .select()
      .maybeSingle();

    if (error) {
      toast.error('Erro ao criar projeto');
      return null;
    }
    if (data) {
      setProjects(prev => [...prev, data as Project].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
    }
    return data as Project | null;
  };

  const renameProject = async (id: string, name: string) => {
    const { error } = await supabase
      .from('Project')
      .update({ name, updatedAt: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao renomear projeto');
      return false;
    }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    return true;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('Project')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir projeto');
      return false;
    }
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Projeto excluído');
    return true;
  };

  return { projects, loading, createProject, renameProject, deleteProject, refetch: fetchProjects };
}
