import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { msalInstance, calendarScopes } from '@/lib/msalConfig';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = '578919463179-g71m7sm55ovphvfc3h8u99rn71vmh1ac.apps.googleusercontent.com';

type Provider = 'google' | 'microsoft';

interface IntegrationStatus {
  google: boolean;
  microsoft: boolean;
}

export function CalendarIntegration() {
  const { user } = useAuth();
  const [status, setStatus] = useState<IntegrationStatus>({ google: false, microsoft: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Provider | null>(null);
  const [gisReady, setGisReady] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    if (document.getElementById('gis-script')) {
      setGisReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setGisReady(true);
    document.head.appendChild(script);
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await (supabase as any)
      .from('CalendarIntegration')
      .select('provider')
      .eq('userId', user.id);
    const connected = (data || []).map((r: any) => r.provider as Provider);
    setStatus({
      google: connected.includes('google'),
      microsoft: connected.includes('microsoft'),
    });
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const connectGoogle = () => {
    if (!gisReady || !window.google) {
      toast.error('Google Identity Services ainda carregando. Tente novamente.');
      return;
    }
    setConnecting('google');
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          toast.error('Erro ao conectar Google Calendar');
          setConnecting(null);
          return;
        }
        if (tokenResponse.access_token) {
          await (supabase as any).from('CalendarIntegration').upsert({
            userId: user!.id,
            provider: 'google',
            accessToken: tokenResponse.access_token,
            expiresAt: new Date(Date.now() + (tokenResponse.expires_in ?? 3600) * 1000).toISOString(),
          }, { onConflict: 'userId,provider' });
          toast.success('Google Calendar conectado!');
          await fetchStatus();
        }
        setConnecting(null);
      },
    });
    client.requestAccessToken();
  };

  const connectMicrosoft = async () => {
    setConnecting('microsoft');
    try {
      await msalInstance.initialize();
      const result = await msalInstance.acquireTokenPopup({ scopes: calendarScopes });
      await (supabase as any).from('CalendarIntegration').upsert({
        userId: user!.id,
        provider: 'microsoft',
        accessToken: result.accessToken,
        expiresAt: result.expiresOn?.toISOString() ?? null,
      }, { onConflict: 'userId,provider' });
      toast.success('Outlook Calendar conectado!');
      await fetchStatus();
    } catch (err: any) {
      if (err?.errorCode !== 'user_cancelled') {
        toast.error('Erro ao conectar Outlook Calendar');
      }
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = async (provider: Provider) => {
    await (supabase as any)
      .from('CalendarIntegration')
      .delete()
      .eq('userId', user!.id)
      .eq('provider', provider);
    toast.success(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar desconectado`);
    await fetchStatus();
  };

  if (loading) return null;

  const cards: { provider: Provider; label: string; description: string }[] = [
    { provider: 'google', label: 'Google Calendar', description: 'Veja suas próximas reuniões Google e grave com um clique' },
    { provider: 'microsoft', label: 'Outlook Calendar', description: 'Veja suas próximas reuniões Microsoft e grave com um clique' },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Integrações</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map(({ provider, label, description }) => {
          const connected = status[provider];
          const isConnecting = connecting === provider;
          const onConnect = provider === 'google' ? connectGoogle : connectMicrosoft;

          return (
            <Card key={provider} className="hover:shadow-md transition-shadow h-full border-l-4 border-l-primary">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{label}</h3>
                      {connected && (
                        <Badge variant="secondary" className="text-[10px]">
                          <CheckCircle className="h-3 w-3 mr-1" /> conectado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={onConnect}
                      disabled={isConnecting}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isConnecting ? 'Conectando...' : connected ? 'Reconectar' : 'Conectar'}
                    </Button>
                    {connected && (
                      <Button
                        variant="ghost"
                        onClick={() => disconnect(provider)}
                        className="text-destructive hover:text-destructive"
                      >
                        Desconectar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
