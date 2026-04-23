import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  htmlLink?: string;
}

async function fetchGoogleCalendarEvents() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { token: null, events: [] as GoogleCalendarEvent[], needsReconnect: false };

  const { data: userData } = await supabase
    .from('User')
    .select('googleCalendarToken')
    .eq('id', user.id)
    .maybeSingle();

  const token = (userData as any)?.googleCalendarToken as string | null | undefined;
  if (!token) return { token: null, events: [] as GoogleCalendarEvent[], needsReconnect: false };

  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    timeMax: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '5',
  });

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    return { token, events: [] as GoogleCalendarEvent[], needsReconnect: true };
  }

  if (!response.ok) throw new Error('Não foi possível carregar o Google Calendar');

  const data = await response.json();
  return { token, events: (data.items || []) as GoogleCalendarEvent[], needsReconnect: false };
}

export function useGoogleCalendar() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['google-calendar-events'],
    queryFn: fetchGoogleCalendarEvents,
    staleTime: 1000 * 60 * 5,
  });

  const disconnect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    await supabase.from('User').update({ googleCalendarToken: null } as any).eq('id', user.id);
    queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
  };

  return {
    events: query.data?.events || [],
    hasToken: !!query.data?.token,
    needsReconnect: !!query.data?.needsReconnect,
    loading: query.isLoading,
    error: query.error,
    disconnect,
  };
}