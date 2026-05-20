alter table public.investment_accounts
  add column if not exists password_hash text,
  add column if not exists last_login_at timestamptz;

create table if not exists public.investment_team_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.investment_accounts(id) on delete cascade,
  competition_id uuid not null references public.investment_competitions(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists investment_team_sessions_token_hash_idx
on public.investment_team_sessions (session_token_hash);

create index if not exists investment_team_sessions_account_idx
on public.investment_team_sessions (account_id, expires_at desc);

alter table public.investment_team_sessions enable row level security;

drop policy if exists "Service role can manage investment team sessions" on public.investment_team_sessions;
create policy "Service role can manage investment team sessions"
on public.investment_team_sessions for all to service_role using (true) with check (true);
