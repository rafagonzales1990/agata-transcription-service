import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, FileText, Upload, FolderOpen, FolderKanban, Settings,
  Repeat, Sparkles, LogOut, Menu, X, User, CreditCard,
  ChevronDown, Shield, Users, HelpCircle, ExternalLink,
  Sun, Moon, Building2, Download, Monitor, Globe, Smartphone,
  MessageCircle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { TrialBanner } from '@/components/TrialBanner';
import { LogoIcon } from '@/components/LogoIcon';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { VersionBadge } from '@/components/VersionBadge';
import { TrialAds } from '@/components/TrialAds';
import { TrialUpgradeBanners } from '@/components/TrialUpgradeBanners';

import { supabase } from '@/integrations/supabase/client';
import { fetchMeetingsList } from '@/hooks/useMeetings';
import { CpfRequiredModal } from '@/components/CpfRequiredModal';
import { useTheme } from '@/hooks/useTheme';
import { PWAInstallModal } from '@/components/PWAInstallModal';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Nova Transcrição', href: '/upload', icon: Upload },
  { label: 'Reuniões', href: '/meetings', icon: FileText },
  { label: 'Perguntar às Reuniões', href: '/ask', icon: MessageCircle, requiresMeetings: true, paidOnly: true },
  { label: 'Rotinas', href: '/routines', icon: Repeat },
  { label: 'Documentos', href: '/documents', icon: FolderOpen },
  { label: 'Projetos', href: '/projects', icon: FolderKanban },
  { label: 'Planos', href: '/plans', icon: CreditCard },
  { label: 'Equipe', href: '/teams', icon: Users, enterpriseOnly: true },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEnterpriseAdmin, setIsEnterpriseAdmin] = useState(false);
  const [userCpf, setUserCpf] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [hasCompletedMeetings, setHasCompletedMeetings] = useState(false);

  const fetchCpfAndAdmin = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data } = await supabase
        .from('User')
        .select('isAdmin, cpf, role, isTeamOwner, hasCompletedOnboarding')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.isAdmin) setIsAdmin(true);
      if (data?.role === 'enterprise_admin' || data?.isTeamOwner) setIsEnterpriseAdmin(true);
      setUserCpf(data?.cpf ?? null);
      setHasCompletedOnboarding(data?.hasCompletedOnboarding ?? false);
    } catch (error: any) {
      if (error?.message?.includes('lock') || error?.message?.includes('stolen')) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;
        const { data } = await supabase
          .from('User')
          .select('isAdmin, cpf, role, isTeamOwner, hasCompletedOnboarding')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.isAdmin) setIsAdmin(true);
        if (data?.role === 'enterprise_admin' || data?.isTeamOwner) setIsEnterpriseAdmin(true);
        setUserCpf(data?.cpf ?? null);
        setHasCompletedOnboarding(data?.hasCompletedOnboarding ?? false);
      }
    } finally {
      setUserDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchCpfAndAdmin();
  }, [fetchCpfAndAdmin]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { count } = await supabase
        .from('Meeting')
        .select('id', { count: 'exact', head: true })
        .eq('userId', session.user.id)
        .eq('status', 'completed');
      if (!cancelled) setHasCompletedMeetings((count || 0) > 0);
    })();
    return () => { cancelled = true; };
  }, []);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const needsCpf = userDataLoaded && !hasCompletedOnboarding && !userCpf;
  const authUser = profile;

  const initial = profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || '?';
  const planLabel = profile?.plan_id === 'enterprise' ? 'Enterprise' : profile?.plan_id === 'automacao' ? 'Pro' : profile?.plan_id === 'inteligente' ? 'Essencial' : 'Gratuito';
  const isEnterprise = profile?.plan_id === 'enterprise';
  const isPaid = ['inteligente', 'automacao', 'enterprise'].includes(profile?.plan_id || '');

  const activeClasses = 'bg-sidebar-accent text-primary border-l-2 border-primary font-medium';
  const inactiveClasses = 'text-foreground/70 hover:bg-sidebar-accent hover:text-foreground';

  const LogoBrand = ({ logoSize = 32 }: { logoSize?: number }) => (
    <Link to="/" className="flex items-center gap-2.5">
      <LogoIcon size={logoSize} />
      <div className="flex flex-col">
        <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent leading-tight">Ágata</span>
        <span className="text-[10px] text-muted-foreground -mt-0.5">Transcription</span>
      </div>
    </Link>
  );

  const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {menuItems
          .filter(item => !('enterpriseOnly' in item && item.enterpriseOnly) || isEnterprise)
          .filter(item => !('requiresMeetings' in item && item.requiresMeetings) || hasCompletedMeetings)
          .filter(item => !('paidOnly' in item && item.paidOnly) || isPaid)
          .map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            onMouseEnter={item.href === '/meetings' && profile?.user_id ? () => {
              qc.prefetchQuery({
                queryKey: ['meetings', profile.user_id],
                queryFn: () => fetchMeetingsList(profile.user_id),
              });
            } : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
              isActive(item.href) ? activeClasses : inactiveClasses
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        {isEnterpriseAdmin && (
          <Link
            to="/enterprise/admin"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              location.pathname.startsWith('/enterprise/admin')
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            )}
          >
            <Users className="h-5 w-5" />
            Painel do Time
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/admin"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              location.pathname.startsWith('/admin')
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                : 'text-destructive hover:bg-destructive/10'
            )}
          >
            <Shield className="h-5 w-5" />
            Painel Dev
          </Link>
        )}
        {!isPaid && (
          <Link to="/plans" onClick={onNavigate}>
            <button className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              UPGRADE AGORA
            </button>
          </Link>
        )}
        {/* Mobile/tablet: show install button instead of Downloads */}
        <button
          onClick={() => { onNavigate?.(); setPwaModalOpen(true); }}
          className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left lg:hidden', inactiveClasses)}
        >
          <Smartphone className="h-4 w-4" />
          Instalar no Celular
        </button>
        {/* Desktop: show Downloads dropdown */}
        <div className="hidden lg:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left', inactiveClasses)}>
                <Download className="h-4 w-4" />
                Downloads
                <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuItem asChild>
                <a href="https://github.com/rafagonzales1990/agata-desktop/releases/latest/download/Agata-Transcription-1.0.4-Windows.exe" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Windows</p>
                    <p className="text-xs text-muted-foreground">v1.0.4 · Desktop App</p>
                  </div>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50">
                <span className="flex items-center gap-2">
                  <span className="text-base">🍎</span>
                  <div>
                    <p className="text-sm font-medium">Mac</p>
                    <p className="text-xs text-muted-foreground">Em breve</p>
                  </div>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="https://chromewebstore.google.com/detail/hhefgnokghkmeekjjpaipjmfhnhbnpjb" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Extensão Chrome</p>
                    <p className="text-xs text-muted-foreground">Meet, Zoom & Teams</p>
                  </div>
                  <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Link
          to="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
            isActive('/settings') ? activeClasses : inactiveClasses
          )}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
        <Link
          to="/ajuda"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
            isActive('/ajuda') ? activeClasses : inactiveClasses
          )}
        >
          <HelpCircle className="h-4 w-4" />
          Ajuda
        </Link>
        <button
          onClick={() => { onNavigate?.(); handleLogout(); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
        <div className="px-3 pb-3 pt-1">
          <VersionBadge />
        </div>
      </div>
    </>
  );

  return (
    <div className={cn('flex h-screen overflow-hidden bg-background', isDark && 'dark')}>
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col fixed inset-y-0 left-0 z-30">
        <div className="h-14 lg:h-16 flex items-center px-4 border-b border-sidebar-border">
          <LogoBrand />
        </div>
        <SidebarNav />
      </aside>

      <div className="fixed top-0 left-0 right-0 md:left-64 z-40 h-14 lg:h-16 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <LogoBrand logoSize={28} />
        </div>

        <div className="hidden md:flex items-center">
          <VersionBadge showChangelog={false} className="opacity-70" />
        </div>

        <div className="flex items-center gap-3">
          <PWAInstallButton />
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {isEnterprise && (
            <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              ENTERPRISE
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                  {initial}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground leading-tight">{profile?.name || 'Usuário'}</p>
                  <p className="text-[10px] text-muted-foreground">{planLabel}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" /> Meu Perfil
              </DropdownMenuItem>
              {isEnterprise && (
                <DropdownMenuItem onClick={() => navigate('/settings/branding')}>
                  <Settings className="h-4 w-4 mr-2" /> Personalização
                </DropdownMenuItem>
              )}
              {!isPaid && (
                <DropdownMenuItem onClick={() => navigate('/plans')} className="text-amber-600 font-medium">
                  <CreditCard className="h-4 w-4 mr-2" /> Upgrade
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
              <LogoBrand />
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 md:ml-64 pt-14 lg:pt-16 overflow-y-auto bg-background">
        <TrialBanner />
        {profile?.gift_plan_id && profile?.gift_ends_at && new Date(profile.gift_ends_at) > new Date() && (
          <div className="mx-4 md:mx-8 mt-3 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span>🎁</span>
            <span>
              Você está com acesso <strong>{profile.gift_plan_id === 'enterprise' ? 'Enterprise' : profile.gift_plan_id === 'automacao' ? 'Pro' : 'Essencial'}</strong> até{' '}
              <strong>{new Date(profile.gift_ends_at).toLocaleDateString('pt-BR')}</strong> — Aproveite!
            </span>
          </div>
        )}
        <div className="p-4 md:p-8">
          {children}
        </div>
        <TrialAds />
      </main>
      <TrialUpgradeBanners />
      {needsCpf && authUser && (
        <CpfRequiredModal userId={authUser.user_id} onSaved={fetchCpfAndAdmin} onDismiss={() => setUserCpf('dismissed')} />
      )}
      <PWAInstallModal open={pwaModalOpen} onOpenChange={setPwaModalOpen} />
    </div>
  );
}
