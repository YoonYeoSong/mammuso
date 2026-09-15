-- Run this once in Supabase SQL Editor. The public API is locked down;
-- only Mammuso's server uses the server-only secret key through Route Handlers.
create extension if not exists pgcrypto;

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  public_case_number text not null unique,
  department text not null default 'relationship-dispute',
  relationship_type text not null,
  status text not null,
  complainant_statement text not null,
  complainant_answers jsonb not null default '{}'::jsonb,
  applicant_token_hash text not null unique,
  respondent_token_hash text unique,
  respondent_statement text,
  respondent_answers jsonb not null default '{}'::jsonb,
  applicant_questions jsonb not null default '[]'::jsonb,
  respondent_questions jsonb not null default '[]'::jsonb,
  neutral_issues jsonb not null default '[]'::jsonb,
  safety_level text not null default 'none',
  preliminary_result jsonb,
  final_result jsonb,
  appeal_text text,
  appeal_result jsonb,
  applicant_policy_version text,
  applicant_policy_agreed_at timestamptz,
  applicant_ai_processing_agreed_at timestamptz,
  respondent_policy_version text,
  respondent_policy_agreed_at timestamptz,
  respondent_ai_processing_agreed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at before update on public.cases
for each row execute function public.set_updated_at();

alter table public.cases enable row level security;
revoke all on table public.cases from anon, authenticated;
grant all privileges on table public.cases to service_role;
