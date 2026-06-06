create table if not exists public.investment_positions (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.investment_competitions(id) on delete cascade,
  team_id uuid not null references public.investment_accounts(id) on delete cascade,
  symbol text not null,
  asset_name text,
  side text not null default 'long',
  quantity numeric not null default 0,
  entry_price numeric not null default 0,
  current_price numeric,
  leverage numeric not null default 1,
  margin_locked numeric not null default 0,
  exposure_value numeric not null default 0,
  unrealized_pnl numeric not null default 0,
  realized_pnl numeric not null default 0,
  status text not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint investment_positions_side_check check (side in ('long', 'short')),
  constraint investment_positions_status_check check (status in ('open', 'closed', 'liquidated'))
);

create index if not exists investment_positions_team_idx
on public.investment_positions (team_id);

create index if not exists investment_positions_competition_idx
on public.investment_positions (competition_id);

create index if not exists investment_positions_symbol_idx
on public.investment_positions (symbol);

create index if not exists investment_positions_status_idx
on public.investment_positions (status);

alter table public.investment_trades
  add column if not exists position_id uuid,
  add column if not exists action text,
  add column if not exists leverage numeric,
  add column if not exists margin_used numeric,
  add column if not exists exposure_value numeric,
  add column if not exists realized_pnl numeric;

do $$
declare
  constraint_name text;
begin
  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.investment_trades'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%side%'
    and pg_get_constraintdef(oid) ilike '%buy%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.investment_trades drop constraint %I', constraint_name);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.investment_trades'::regclass
      and conname = 'investment_trades_side_extended_check'
  ) then
    alter table public.investment_trades
      add constraint investment_trades_side_extended_check check (side in ('buy', 'sell', 'long', 'short'));
  end if;
end $$;

alter table public.investment_positions enable row level security;

drop policy if exists "Service role can manage investment positions" on public.investment_positions;
create policy "Service role can manage investment positions"
on public.investment_positions for all to service_role using (true) with check (true);

grant all on table public.investment_positions to service_role;
grant all on table public.investment_trades to service_role;
