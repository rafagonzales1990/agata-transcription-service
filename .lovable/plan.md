

## Review: Redirect URLs Configuration

The application code is correct — all redirect URLs use `window.location.origin` dynamically, so they adapt to whatever domain the app runs on. No code changes are needed.

### What you need to verify in the Supabase Dashboard

Go to **Authentication → URL Configuration** at:
https://supabase.com/dashboard/project/hblczvmpyaznbxvdcaze/auth/url-configuration

1. **Site URL** — must be your published domain:
   `https://agatatranscription.lovable.app`

2. **Redirect URLs** — must include these entries:
   - `https://agatatranscription.lovable.app/**`
   - `https://id-preview--fecdc2ef-e597-4fee-a785-8f8d4d787833.lovable.app/**`

   The wildcard `/**` pattern allows all sub-paths (like `/auth/reset-password`) to work.

3. **Remove** any old entries pointing to `localhost:3000` or old Next.js domains.

### Why this matters

Supabase validates the redirect URL against the allowlist. If `agatatranscription.lovable.app` isn't listed, the password reset link will either fail or redirect to the wrong place.

### No code changes required

All three files (`Login.tsx`, `ForgotPassword.tsx`, `Signup.tsx`) already use `window.location.origin` correctly.

