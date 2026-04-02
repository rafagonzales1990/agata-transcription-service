import * as Sentry from '@sentry/react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

Sentry.init({
  dsn: 'https://535dff649d5d630f7a0897f50581f786@o4511150762950656.ingest.us.sentry.io/4511150767210496',
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  beforeSend(event) {
    if (import.meta.env.DEV) return null;
    return event;
  },
});

createRoot(document.getElementById("root")!).render(<App />);
