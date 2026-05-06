import { PublicClientApplication } from '@azure/msal-browser';

const origin = typeof window !== 'undefined' ? window.location.origin : '';

// Pagina HTML estatica mínima em public/auth/microsoft-callback.html.
// MSAL faz polling do popup e extrai o token assim que ele aterrissa nessa URL,
// sem precisar carregar a SPA inteira (que rotearia para a landing page).
// Esta URL DEVE estar registrada como redirect URI tipo SPA no Azure AD.
export const microsoftCalendarRedirectUri = origin
  ? `${origin}/auth/microsoft-callback.html`
  : '';

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '8fbbec4e-2f38-4179-8147-fff591b79d19',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: microsoftCalendarRedirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
});

export const calendarScopes = ['Calendars.Read'];
