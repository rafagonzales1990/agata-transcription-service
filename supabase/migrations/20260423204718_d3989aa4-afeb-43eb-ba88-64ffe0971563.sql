ALTER TABLE public."User"
ADD COLUMN IF NOT EXISTS "googleCalendarToken" TEXT;