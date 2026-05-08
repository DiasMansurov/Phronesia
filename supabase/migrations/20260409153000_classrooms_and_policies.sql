create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  clerk_user_id text not null unique,
  display_name text not null,
  role text not null check (role in ('teacher', 'student')),
  school_name text,
  country_code text not null,
  jurisdiction text not null,
  age_band text check (age_band in ('under_13', '13_to_local_digital_consent_age', 'above_local_digital_consent_age')),
  school_managed boolean not null default false,
  onboarding_completed boolean not null default false
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  teacher_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  school_name text,
  country_code text not null,
  jurisdiction text not null,
  age_band_default text not null check (age_band_default in ('under_13', '13_to_local_digital_consent_age', 'above_local_digital_consent_age')),
  status text not null default 'active' check (status in ('active', 'archived'))
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  sort_order int not null default 1
);

create table if not exists public.join_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  class_id uuid not null references public.classes(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  code text not null unique,
  token text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  expires_at timestamptz not null,
  created_by_profile_id uuid not null references public.profiles(id) on delete cascade
);

create table if not exists public.class_memberships (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  class_id uuid not null references public.classes(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  status text not null default 'active' check (status in ('active', 'pending', 'blocked')),
  joined_via_token_id uuid references public.join_tokens(id) on delete set null,
  unique (class_id, profile_id)
);

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  policy_key text not null,
  policy_version text not null,
  jurisdiction text not null,
  accepted_by text not null check (accepted_by in ('student', 'teacher', 'parent', 'school')),
  acceptance_context text not null check (acceptance_context in ('consumer', 'school_signup', 'teacher_dashboard', 'join_flow')),
  class_id uuid references public.classes(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null
);

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.groups enable row level security;
alter table public.join_tokens enable row level security;
alter table public.class_memberships enable row level security;
alter table public.legal_acceptances enable row level security;

drop policy if exists "Service role can manage profiles" on public.profiles;
create policy "Service role can manage profiles"
on public.profiles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage classes" on public.classes;
create policy "Service role can manage classes"
on public.classes
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage groups" on public.groups;
create policy "Service role can manage groups"
on public.groups
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage join tokens" on public.join_tokens;
create policy "Service role can manage join tokens"
on public.join_tokens
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage class memberships" on public.class_memberships;
create policy "Service role can manage class memberships"
on public.class_memberships
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage legal acceptances" on public.legal_acceptances;
create policy "Service role can manage legal acceptances"
on public.legal_acceptances
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
