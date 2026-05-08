create table if not exists public.class_run_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  run_id text not null unique,
  class_id uuid not null references public.classes(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  student_profile_id uuid not null references public.profiles(id) on delete cascade,
  scenario_id text not null,
  scenario_title text not null,
  difficulty_id text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  final_score numeric,
  rank_title text,
  victory boolean,
  summary text,
  rounds_completed int,
  completed_at timestamptz
);

create table if not exists public.class_policy_decisions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  attempt_id uuid not null references public.class_run_attempts(id) on delete cascade,
  run_id text not null,
  round int not null,
  year int not null,
  policies jsonb not null,
  before_state jsonb not null,
  after_state jsonb,
  prediction_ad text not null check (prediction_ad in ('increase', 'decrease', 'no_change')),
  prediction_as text not null check (prediction_as in ('increase', 'decrease', 'no_change')),
  prediction_unemployment text not null check (prediction_unemployment in ('increase', 'decrease', 'no_change')),
  prediction_inflation text not null check (prediction_inflation in ('increase', 'decrease', 'no_change')),
  explanation text not null,
  policy_summary text,
  citizen_summary text,
  score_after numeric,
  unique (attempt_id, round)
);

create table if not exists public.teacher_decision_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decision_id uuid not null unique references public.class_policy_decisions(id) on delete cascade,
  teacher_profile_id uuid not null references public.profiles(id) on delete cascade,
  mark text not null check (mark in ('correct', 'partial', 'incorrect')),
  comment text not null default ''
);

alter table public.class_run_attempts enable row level security;
alter table public.class_policy_decisions enable row level security;
alter table public.teacher_decision_feedback enable row level security;

drop policy if exists "Service role can manage class run attempts" on public.class_run_attempts;
create policy "Service role can manage class run attempts"
on public.class_run_attempts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage class policy decisions" on public.class_policy_decisions;
create policy "Service role can manage class policy decisions"
on public.class_policy_decisions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage teacher decision feedback" on public.teacher_decision_feedback;
create policy "Service role can manage teacher decision feedback"
on public.teacher_decision_feedback
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
