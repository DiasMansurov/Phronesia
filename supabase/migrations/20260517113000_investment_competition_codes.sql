alter table public.investment_competitions
  drop constraint if exists investment_competitions_status_check;

alter table public.investment_competitions
  add constraint investment_competitions_status_check
  check (status in ('draft', 'active', 'closed', 'archived'));

alter table public.investment_competitions
  add column if not exists code text,
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists allowed_assets jsonb,
  add column if not exists trading_rules jsonb,
  add column if not exists transaction_fee numeric default 0.001,
  add column if not exists ranking_method text default 'portfolio_value',
  add column if not exists finalized_at timestamptz;

update public.investment_competitions
set
  code = coalesce(code, slug),
  name = coalesce(name, title),
  start_at = coalesce(start_at, starts_at),
  end_at = coalesce(end_at, ends_at),
  transaction_fee = coalesce(transaction_fee, 0.001),
  ranking_method = coalesce(ranking_method, 'portfolio_value')
where code is null or name is null or start_at is null or end_at is null or transaction_fee is null or ranking_method is null;

create unique index if not exists investment_competitions_code_idx
on public.investment_competitions (code);

alter table public.investment_leaderboard
  add column if not exists starting_cash numeric default 100000,
  add column if not exists profit_loss numeric default 0,
  add column if not exists trade_count integer default 0,
  add column if not exists risk_score numeric default 0,
  add column if not exists status text default 'active';

create table if not exists public.investment_competition_results (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.investment_competitions(id) on delete cascade,
  account_id uuid not null references public.investment_accounts(id) on delete cascade,
  team_name text not null,
  final_rank integer not null default 0,
  starting_cash numeric not null default 100000,
  final_value numeric not null default 0,
  profit_loss numeric not null default 0,
  total_return numeric not null default 0,
  trade_count integer not null default 0,
  diversification_score numeric not null default 0,
  risk_score numeric not null default 0,
  thesis_score numeric not null default 0,
  best_asset text,
  worst_asset text,
  finalized_at timestamptz not null default now(),
  unique (competition_id, account_id)
);

alter table public.investment_competition_results enable row level security;

drop policy if exists "Service role can manage investment competition results" on public.investment_competition_results;
create policy "Service role can manage investment competition results"
on public.investment_competition_results for all to service_role using (true) with check (true);

insert into public.investment_competitions (
  slug,
  code,
  title,
  name,
  description,
  status,
  starting_cash,
  starts_at,
  start_at,
  ends_at,
  end_at,
  transaction_fee,
  ranking_method
)
values (
  'teenvestor-school',
  'Teenvestor.school',
  'Teenvestor.school Investment Competition',
  'Teenvestor.school Investment Competition',
  'A private educational virtual portfolio competition for Teenvestor.school teams.',
  'active',
  100000,
  now(),
  now(),
  now() + interval '30 days',
  now() + interval '30 days',
  0.001,
  'portfolio_value'
)
on conflict (slug) do update
set
  code = excluded.code,
  title = excluded.title,
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  starting_cash = excluded.starting_cash,
  transaction_fee = excluded.transaction_fee,
  ranking_method = excluded.ranking_method,
  updated_at = now();
