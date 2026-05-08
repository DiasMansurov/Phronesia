create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('teacher', 'student')),
  name text not null,
  email text not null,
  organization text,
  note text
);

create table if not exists public.run_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  run_id uuid not null unique,
  scenario_id text not null,
  scenario_title text,
  difficulty_id text,
  score numeric not null,
  rank_title text,
  victory boolean not null default false,
  summary text,
  rounds_completed int,
  avg_growth numeric,
  avg_inflation numeric,
  avg_unemployment numeric,
  avg_approval numeric
);

alter table public.leads enable row level security;
alter table public.run_submissions enable row level security;

drop policy if exists "Service role can manage leads" on public.leads;
create policy "Service role can manage leads"
on public.leads
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage run submissions" on public.run_submissions;
create policy "Service role can manage run submissions"
on public.run_submissions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
