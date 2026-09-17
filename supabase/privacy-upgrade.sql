-- Run once in the Supabase SQL Editor before the privacy-enabled deployment.
alter table public.cases
  add column if not exists applicant_policy_version text,
  add column if not exists applicant_policy_agreed_at timestamptz,
  add column if not exists applicant_ai_processing_agreed_at timestamptz,
  add column if not exists respondent_policy_version text,
  add column if not exists respondent_policy_agreed_at timestamptz,
  add column if not exists respondent_ai_processing_agreed_at timestamptz,
  add column if not exists neutral_summary text not null default '',
  add column if not exists incident_date date,
  add column if not exists respondent_invite_expires_at timestamptz;
