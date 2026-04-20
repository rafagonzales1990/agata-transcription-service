import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress known AdSense internal errors (not actionable)
const isAdsenseNoise = (msg: string) =>
  msg.includes('Object Not Found Matching Id') ||
  msg.includes('adsbygoogle.push() error') ||
  msg.includes('adsbygoogle') ||
  msg.includes('already have ads in them');

// Suppress Supabase auth lock conflicts (multi-tab / rapid re-renders, not actionable)
const isSupabaseLockNoise = (msg: string) =>
  (msg.includes('Lock') || msg.includes('lock')) &&
  (msg.includes('stole') || msg.includes('stolen') || msg.includes('sb-hblczvmpyaznbxvdcaze') || msg.includes('NavigatorLockAcquireTimeoutError'));

window.addEventListener('unhandledrejection', (event) => {
  const msg = event?.reason?.message || String(event?.reason || '');
  if (isAdsenseNoise(msg) || isSupabaseLockNoise(msg)) event.preventDefault();
});

window.addEventListener('error', (event) => {
  const msg = event?.message || String(event?.error || '');
  if (isAdsenseNoise(msg) || isSupabaseLockNoise(msg)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

// Defer Sentry init — not needed before first paint
import("@sentry/react").then((Sentry) => {
  Sentry.init({
    dsn: "https://535dff649d5d630f7a0897f50581f786@o4511150762950656.ingest.us.sentry.io/4511150767210496",
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration()],
    beforeSend(event) {
      if (import.meta.env.DEV) return null;
      const msg = event.exception?.values?.[0]?.value || event.message || '';
      if (isAdsenseNoise(msg)) return null;
      if (isSupabaseLockNoise(msg)) return null;
      return event;
    },
  });
});

// PWA Service Worker registration — only in production and outside iframes/preview
if ("serviceWorker" in navigator) {
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com");

  if (isPreviewHost || isInIframe) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((r) => r.unregister());
    });
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    });
  }
}

const LoadingShell = () => {
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

createRoot(document.getElementById("root")!).render(<App />);
