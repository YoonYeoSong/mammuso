-- Run this once if the original schema was already applied.
-- Allows Mammuso's server-only Supabase secret key to access case records.
grant all privileges on table public.cases to service_role;
