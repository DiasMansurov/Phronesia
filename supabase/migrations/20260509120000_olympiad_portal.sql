create table if not exists public.olympiad_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  olympiad_slug text not null,
  olympiad_title text not null,
  access_code text not null,
  participant_login text not null,
  team_name text not null,
  run_id text not null unique,
  scenario_id text not null,
  scenario_title text not null,
  difficulty_id text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  final_score numeric,
  rank_title text,
  victory boolean,
  summary text,
  rounds_completed integer,
  score_breakdown jsonb,
  final_state jsonb
);

create table if not exists public.olympiad_decisions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  attempt_id uuid not null references public.olympiad_attempts(id) on delete cascade,
  run_id text not null,
  round integer not null,
  year integer not null,
  policies jsonb not null,
  before_state jsonb not null,
  after_state jsonb,
  prediction jsonb,
  policy_summary text,
  citizen_summary text,
  score_after numeric,
  unique (run_id, round)
);

create index if not exists olympiad_attempts_slug_score_idx
on public.olympiad_attempts (olympiad_slug, final_score desc nulls last);

create index if not exists olympiad_decisions_attempt_round_idx
on public.olympiad_decisions (attempt_id, round);

alter table public.olympiad_attempts enable row level security;
alter table public.olympiad_decisions enable row level security;

drop policy if exists "Service role can manage olympiad attempts" on public.olympiad_attempts;
create policy "Service role can manage olympiad attempts"
on public.olympiad_attempts
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage olympiad decisions" on public.olympiad_decisions;
create policy "Service role can manage olympiad decisions"
on public.olympiad_decisions
for all
to service_role
using (true)
with check (true);
