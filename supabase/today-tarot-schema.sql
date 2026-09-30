-- Apply in Supabase SQL Editor after the existing schema. This intentionally
-- grants no client Data API access: application requests use a server-only key.
create table if not exists public.saju_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  birth_date date not null,
  birth_time time,
  birth_time_unknown boolean not null default false,
  gender text not null check (gender in ('female', 'male', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((birth_time_unknown and birth_time is null) or (not birth_time_unknown and birth_time is not null))
);

create table if not exists public.tarot_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  reading_date date not null,
  main_card_id text not null,
  main_orientation text not null check (main_orientation in ('upright', 'reversed')),
  clarifier_card_id text,
  created_at timestamptz not null default now(),
  unique (user_id, session_id)
);

alter table public.saju_profiles enable row level security;
alter table public.tarot_readings enable row level security;
revoke all on table public.saju_profiles, public.tarot_readings from anon, authenticated;

-- TODO before public launch: review the actual operator, retention/deletion
-- workflow, privacy policy, commercial-registration disclosures, and RLS if a
-- browser-side authenticated client is ever introduced.
