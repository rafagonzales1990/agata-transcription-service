import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, FileText, Upload, FolderOpen, Settings,
  Repeat, Sparkles, LogOut, Menu, X, User, CreditCard,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { TrialBanner } from '@/components/TrialBanner';
import { LogoIcon } from '@/components/LogoIcon';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Nova Transcrição', href: '/upload', icon: Upload },
  { label: 'Reuniões', href: '/meetings', icon: FileText },
  { label: 'Rotinas', href: '/routines', icon: Repeat },
  { label: 'Documentos', href: '/documents', icon: FolderOpen },
  { label: 'Planos', href: '/plans', icon: CreditCard },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const initial = profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || '?';
  const planLabel = profile?.plan_id === 'enterprise' ? 'Enterprise' : profile?.plan_id === 'automacao' ? 'Automação' : profile?.plan_id === 'inteligente' ? 'Inteligente' : 'Gratuito';
  const isEnterprise = profile?.plan_id === 'enterprise';
  const isPaid = ['inteligente', 'automacao', 'enterprise'].includes(profile?.plan_id || '');

  const activeClasses = 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md';
  const inactiveClasses = 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';

  const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
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
        {!isPaid && (
          <Link to="/plans" onClick={onNavigate}>
            <button className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              UPGRADE AGORA
            </button>
          </Link>
        )}
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
        <button
          onClick={() => { onNavigate?.(); handleLogout(); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-border flex-col fixed inset-y-0 left-0 z-30">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoIcon size={32} />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground leading-tight">Ágata</span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">Transcription</span>
            </div>
          </Link>
        </div>
        <SidebarNav />
      </aside>

      {/* Topbar */}
      <div className="fixed top-0 left-0 right-0 md:left-64 z-40 h-14 lg:h-16 bg-white/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-bold text-foreground">Ágata</span>
          </Link>
        </div>

        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-border flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#logo-grad-s)" />
                    <path d="M16 6L26 26H6L16 6Z" fill="white" fillOpacity="0.9" />
                    <defs>
                      <linearGradient id="logo-grad-s" x1="0" y1="0" x2="32" y2="32">
                        <stop stopColor="#059669" />
                        <stop offset="1" stopColor="#0d9488" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="text-lg font-bold text-foreground">Ágata</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-14 lg:pt-16">
        <TrialBanner />
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
