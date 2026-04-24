import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  htmlLink?: string;
  provider: 'google' | 'microsoft';
}

// Backward-compat alias
export type GoogleCalendarEvent = CalendarEvent;

async function fetchCalendarEvents() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { hasToken: false, events: [] as CalendarEvent[], needsReconnect: false };

  const { data: integrations } = await (supabase as any)
    .from('CalendarIntegration')
    .select('provider, accessToken, expiresAt')
    .eq('userId', user.id);

  if (!integrations || integrations.length === 0) {
    return { hasToken: false, events: [] as CalendarEvent[], needsReconnect: false };
  }

  const now = new Date();
  let needsReconnect = false;
  const allEvents: CalendarEvent[] = [];

  for (const integration of integrations) {
    const isExpired = integration.expiresAt && new Date(integration.expiresAt) < now;
    if (isExpired) {
      needsReconnect = true;
      continue;
    }

    if (integration.provider === 'google') {
      const params = new URLSearchParams({
        timeMin: now.toISOString(),
        timeMax: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '5',
      });
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${integration.accessToken}` } }
      );
      if (res.status === 401) { needsReconnect = true; continue; }
      if (res.ok) {
        const json = await res.json();
        allEvents.push(...(json.items || []).map((e: any) => ({ ...e, provider: 'google' as const })));
      }
    }

    if (integration.provider === 'microsoft') {
      const msParams = new URLSearchParams({
        startDateTime: now.toISOString(),
        endDateTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        '$top': '5',
        '$orderby': 'start/dateTime',
      });
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendarView?${msParams}`,
        { headers: { Authorization: `Bearer ${integration.accessToken}` } }
      );
      if (res.status === 401) { needsReconnect = true; continue; }
      if (res.ok) {
        const json = await res.json();
        allEvents.push(
          ...(json.value || []).map((e: any) => ({
            id: e.id,
            summary: e.subject,
            start: { dateTime: e.start?.dateTime },
            htmlLink: e.webLink,
            provider: 'microsoft' as const,
          }))
        );
      }
    }
  }

  allEvents.sort((a, b) => {
    const aTime = a.start?.dateTime || a.start?.date || '';
    const bTime = b.start?.dateTime || b.start?.date || '';
    return aTime.localeCompare(bTime);
  });

  return {
    hasToken: true,
    events: allEvents.slice(0, 5),
    needsReconnect,
  };
}

export function useGoogleCalendar() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['calendar-integrations-events'],
    queryFn: fetchCalendarEvents,
    staleTime: 1000 * 60 * 5,
  });

  const disconnect = async (provider?: 'google' | 'microsoft') => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    if (provider) {
      await (supabase as any).from('CalendarIntegration').delete().eq('userId', user.id).eq('provider', provider);
    } else {
      await (supabase as any).from('CalendarIntegration').delete().eq('userId', user.id);
    }
    queryClient.invalidateQueries({ queryKey: ['calendar-integrations-events'] });
  };

  return {
    events: query.data?.events || [],
    hasToken: !!query.data?.hasToken,
    needsReconnect: !!query.data?.needsReconnect,
    loading: query.isLoading,
    error: query.error,
    disconnect,
  };
}
