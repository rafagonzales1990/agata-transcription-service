import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTrialExpiredStatus } from '@/hooks/useTrialExpiredStatus';

export function TrialExpiredUploadGuard({ children }: { children: ReactNode }) {
  const { isTrialExpired, loading } = useTrialExpiredStatus();

  useEffect(() => {
    if (isTrialExpired) {
      toast.error('Faça upgrade para criar novas transcrições');
    }
  }, [isTrialExpired]);

  if (loading) return null;
  if (isTrialExpired) return <Navigate to="/plans" replace />;

  return <>{children}</>;
}