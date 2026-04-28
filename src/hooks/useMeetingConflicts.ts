import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MeetingConflict {
  id: string;
  meetingId: string;
  conflictingMeetingId: string;
  conflictDescription: string;
  severity: "low" | "medium" | "high";
  conflictType: string;
  createdAt: string;
}

export function useMeetingConflicts(meetingId: string) {
  const [conflicts, setConflicts] = useState<MeetingConflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!meetingId) return;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    supabase
      .from("MeetingConflict")
      .select("*")
      .eq("meetingId", meetingId)
      .order("severity", { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(new Error(err.message));
        } else {
          setConflicts((data as MeetingConflict[]) || []);
        }
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  return { conflicts, isLoading, error };
}
