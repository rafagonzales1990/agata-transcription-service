import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  teamId: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  meetingCount?: number;
}

export interface ProjectLimits {
  maxProjects: number | null; // null = unlimited
  used: number;
  isAtLimit: boolean;
  isUnlimited: boolean;
}

export function useProjects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [limits, setLimits] = useState<ProjectLimits>({
    maxProjects: 3, used: 0, isAtLimit: false, isUnlimited: false,
  });
  const [uncategorizedCount, setUncategorizedCount] = useState(0);

  const fetchProjects = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) { setLoading(false); return; }

    // Fetch projects (own + team)
    const { data, error } = await supabase
      .from('Project')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
      return;
    }

    const projectList = (data || []) as Project[];

    // Fetch meeting counts per project
    const { data: meetings } = await supabase
      .from('Meeting')
      .select('id, projectId')
      .eq('userId', user.id);

    const countMap: Record<string, number> = {};
    let uncategorized = 0;
    (meetings || []).forEach((m: any) => {
      if (m.projectId) {
        countMap[m.projectId] = (countMap[m.projectId] || 0) + 1;
      } else {
        uncategorized++;
      }
    });

    const enriched = projectList.map(p => ({
      ...p,
      meetingCount: countMap[p.id] || 0,
    }));

    setProjects(enriched);
    setUncategorizedCount(uncategorized);

    // Fetch plan limits
    const { data: userData } = await supabase
      .from('User')
      .select('planId')
      .eq('id', user.id)
      .maybeSingle();

    const planId = userData?.planId || 'basic';
    const { data: planData } = await supabase
      .from('Plan')
      .select('maxProjects')
      .eq('id', planId)
      .maybeSingle();

    const maxProjects = planData?.maxProjects ?? 3;
    const isUnlimited = maxProjects === null;
    setLimits({
      maxProjects,
      used: enriched.filter(p => p.userId === user.id).length,
      isAtLimit: !isUnlimited && enriched.filter(p => p.userId === user.id).length >= (maxProjects ?? 0),
      isUnlimited,
    });

    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (name: string, color: string, description?: string, shareWithTeam?: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;

    if (limits.isAtLimit) {
      toast.error(`Você atingiu o limite de ${limits.maxProjects} projetos do seu plano.`);
      return null;
    }

    let teamId: string | null = null;
    if (shareWithTeam) {
      const { data: userData } = await supabase
        .from('User')
        .select('teamId')
        .eq('id', user.id)
        .maybeSingle();
      teamId = userData?.teamId || null;
    }

    const insertPayload: Record<string, unknown> = {
      name,
      color,
      userId: user.id,
      teamId,
    };
    if (description) insertPayload.description = description;

    const { data, error } = await supabase
      .from('Project')
      .insert(insertPayload as any)
      .select()
      .maybeSingle();

    if (error) {
      toast.error('Erro ao criar projeto');
      return null;
    }
    if (data) {
      await fetchProjects();
      toast.success('Projeto criado!');
    }
    return data as Project | null;
  };

  const updateProject = async (id: string, updates: { name?: string; description?: string; color?: string; teamId?: string | null }) => {
    const { error } = await supabase
      .from('Project')
      .update({ ...updates, updatedAt: new Date().toISOString() } as any)
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar projeto');
      return false;
    }
    await fetchProjects();
    return true;
  };

  const deleteProject = async (id: string) => {
    // First remove projectId from all meetings in this project
    await supabase
      .from('Meeting')
      .update({ projectId: null, updatedAt: new Date().toISOString() })
      .eq('projectId', id);

    const { error } = await supabase
      .from('Project')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir projeto');
      return false;
    }
    await fetchProjects();
    toast.success('Projeto excluído');
    return true;
  };

  return {
    projects,
    loading,
    limits,
    uncategorizedCount,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
    // Keep backward compatibility
    renameProject: async (id: string, name: string) => updateProject(id, { name }),
  };
}
