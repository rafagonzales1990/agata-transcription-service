
-- Create the trigger that uses the existing prevent_privilege_escalation function
CREATE TRIGGER prevent_privilege_escalation_trigger
BEFORE UPDATE ON public."User"
FOR EACH ROW
EXECUTE FUNCTION public.prevent_privilege_escalation();
