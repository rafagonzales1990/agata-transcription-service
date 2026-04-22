// LOVABLE REPO TEST - 22/04/2026 14:45
import * as Sentry from '@sentry/react';
import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { pageview } from "@/lib/gtag";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const Meetings = lazy(() => import("./pages/Meetings"));
const MeetingDetail = lazy(() => import("./pages/MeetingDetail"));
const Routines = lazy(() => import("./pages/Routines"));
const RoutineDetail = lazy(() => import("./pages/RoutineDetail"));
const Documents = lazy(() => import("./pages/Documents"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SettingsSecurity = lazy(() => import("./pages/SettingsSecurity"));
const SettingsBranding = lazy(() => import("./pages/SettingsBranding"));
const SettingsPlaceholder = lazy(() => import("./pages/SettingsPlaceholder"));
const SettingsGroups = lazy(() => import("./pages/SettingsGroups"));
const SettingsAtaTemplates = lazy(() => import("./pages/SettingsAtaTemplates"));
const Profile = lazy(() => import("./pages/Profile"));
const Plans = lazy(() => import("./pages/Plans"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const Teams = lazy(() => import("./pages/Teams"));
const LegalTerms = lazy(() => import("./pages/LegalTerms"));
const LegalLgpd = lazy(() => import("./pages/LegalLgpd"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Demo = lazy(() => import("./pages/Demo"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const SharedMeeting = lazy(() => import("./pages/SharedMeeting"));
const EnterpriseAdmin = lazy(() => import("./pages/EnterpriseAdmin"));
const DesktopAuth = lazy(() => import("./pages/DesktopAuth"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const AskMeetings = lazy(() => import("./pages/AskMeetings"));
const Projects = lazy(() => import("./pages/Projects"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const SentryErrorFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', fontFamily: 'sans-serif' }}>
    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Algo deu errado</h1>
    <p style={{ color: '#6b7280' }}>Nossa equipe foi notificada automaticamente.</p>
    <button
      onClick={() => window.location.href = '/dashboard'}
      style={{ background: '#10B981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
    >
      Voltar ao Dashboard
    </button>
  </div>
);

const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    pageview(location.pathname);
  }, [location]);
  return null;
};

const LoadingFallback = () => {
  const isDark = typeof window !== 'undefined' && localStorage.getItem('agata-theme') === 'dark';
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: isDark ? '#0D1F2D' : '#ffffff' }}
    >
      <div className="flex flex-col items-center gap-3">
        <img src="/logo-icon.png" alt="Ágata" width={32} height={32} />
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
};

const App = () => (
  <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteTracker />
          <AuthProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
              <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
              <Route path="/meetings/:id" element={<ProtectedRoute><MeetingDetail /></ProtectedRoute>} />
              <Route path="/ask" element={<ProtectedRoute><AskMeetings /></ProtectedRoute>} />
              <Route path="/routines" element={<ProtectedRoute><Routines /></ProtectedRoute>} />
              <Route path="/routines/:id" element={<ProtectedRoute><RoutineDetail /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/settings/security" element={<ProtectedRoute><SettingsSecurity /></ProtectedRoute>} />
              <Route path="/settings/branding" element={<ProtectedRoute><SettingsBranding /></ProtectedRoute>} />
              <Route path="/settings/notifications" element={<ProtectedRoute><SettingsPlaceholder /></ProtectedRoute>} />
              <Route path="/settings/groups" element={<ProtectedRoute><SettingsGroups /></ProtectedRoute>} />
              <Route path="/settings/ata-templates" element={<ProtectedRoute><SettingsAtaTemplates /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
              <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/legal/terms" element={<LegalTerms />} />
              <Route path="/legal/lgpd" element={<LegalLgpd />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/shared/:token" element={<SharedMeeting />} />
              <Route path="/desktop-auth" element={<DesktopAuth />} />
              <Route path="/ajuda" element={<HelpCenter />} />
              <Route path="/admin/leads" element={<ProtectedRoute><AdminLeads /></ProtectedRoute>} />
              <Route path="/enterprise/admin" element={<ProtectedRoute><EnterpriseAdmin /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
