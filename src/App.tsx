import * as Sentry from '@sentry/react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import Meetings from "./pages/Meetings";
import MeetingDetail from "./pages/MeetingDetail";
import Routines from "./pages/Routines";
import RoutineDetail from "./pages/RoutineDetail";
import Documents from "./pages/Documents";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SettingsPage from "./pages/SettingsPage";
import SettingsSecurity from "./pages/SettingsSecurity";
import SettingsBranding from "./pages/SettingsBranding";
import SettingsPlaceholder from "./pages/SettingsPlaceholder";
import SettingsGroups from "./pages/SettingsGroups";
import Profile from "./pages/Profile";
import Plans from "./pages/Plans";
import AdminPanel from "./pages/AdminPanel";
import Blog from "./pages/Blog";
import BlogPostPage from "./pages/BlogPost";
import Teams from "./pages/Teams";
import LegalTerms from "./pages/LegalTerms";
import LegalLgpd from "./pages/LegalLgpd";

const queryClient = new QueryClient();

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

const App = () => (
  <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
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
            <Route path="/routines" element={<ProtectedRoute><Routines /></ProtectedRoute>} />
            <Route path="/routines/:id" element={<ProtectedRoute><RoutineDetail /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/security" element={<ProtectedRoute><SettingsSecurity /></ProtectedRoute>} />
            <Route path="/settings/branding" element={<ProtectedRoute><SettingsBranding /></ProtectedRoute>} />
            <Route path="/settings/notifications" element={<ProtectedRoute><SettingsPlaceholder /></ProtectedRoute>} />
            <Route path="/settings/groups" element={<ProtectedRoute><SettingsGroups /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/legal/terms" element={<LegalTerms />} />
            <Route path="/legal/lgpd" element={<LegalLgpd />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
