import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MeetingListItem {
  id: string;
  title: string;
  fileName: string;
  status: string;
  createdAt: string;
  summary: string | null;
  participants: string[];
  meetingDate: string | null;
  meetingTime: string | null;
  location: string | null;
  responsible: string | null;
  projectId: string | null;
  cloudStoragePath: string;
  fileDeleted: boolean | null;
  fileExpiresAt: string | null;
}

async function fetchMeetingsList(userId: string): Promise<MeetingListItem[]> {
  const { data, error } = await supabase
    .from('Meeting')
    .select('id, title, fileName, status, createdAt, summary, participants, meetingDate, meetingTime, location, responsible, projectId, cloudStoragePath, fileDeleted, fileExpiresAt')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  if (error) throw error;
  return (data as MeetingListItem[]) || [];
}

export function useMeetings(userId: string | undefined) {
  return useQuery({
    queryKey: ['meetings', userId],
    queryFn: () => fetchMeetingsList(userId!),
    enabled: !!userId,
  });
}

export { fetchMeetingsList };

