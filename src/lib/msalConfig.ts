import { PublicClientApplication } from '@azure/msal-browser';

// TODO: Register Azure AD app and add clientId
// https://portal.azure.com → App registrations → New registration
export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: 'PLACEHOLDER_AZURE_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
});

export const calendarScopes = ['Calendars.Read'];
