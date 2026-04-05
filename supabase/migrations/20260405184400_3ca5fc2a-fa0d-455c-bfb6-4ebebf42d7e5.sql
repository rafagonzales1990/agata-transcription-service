-- Remove user-level write access to Usage table
-- Only service_role (edge functions) should write usage data
DROP POLICY IF EXISTS "Users can insert own usage" ON public."Usage";
DROP POLICY IF EXISTS "Users can update own usage" ON public."Usage";