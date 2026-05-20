alter table public.investment_trades
  add column if not exists team_id uuid,
  add column if not exists asset_name text,
  add column if not exists gross_value numeric,
  add column if not exists fee_rate numeric default 0.001,
  add column if not exists fee_amount numeric,
  add column if not exists net_value numeric,
  add column if not exists price_source text,
  add column if not exists price_timestamp timestamptz,
  add column if not exists executed_at timestamptz;

update public.investment_trades
set
  team_id = coalesce(team_id, account_id),
  gross_value = coalesce(gross_value, gross_amount),
  net_value = coalesce(net_value, abs(net_amount)),
  price_timestamp = coalesce(price_timestamp, executed_at, created_at)
where team_id is null
   or gross_value is null
   or net_value is null
   or price_timestamp is null;

create index if not exists investment_trades_team_created_idx
on public.investment_trades (team_id, created_at desc);

create index if not exists investment_trades_competition_team_idx
on public.investment_trades (competition_id, team_id);

alter table public.investment_holdings
  add column if not exists team_id uuid,
  add column if not exists competition_id uuid,
  add column if not exists asset_name text;

update public.investment_holdings h
set
  team_id = coalesce(h.team_id, h.account_id),
  competition_id = coalesce(h.competition_id, a.competition_id)
from public.investment_accounts a
where h.account_id = a.id
  and (h.team_id is null or h.competition_id is null);

create index if not exists investment_holdings_team_idx
on public.investment_holdings (team_id);

create index if not exists investment_holdings_competition_idx
on public.investment_holdings (competition_id);

alter table public.investment_leaderboard
  add column if not exists team_id uuid,
  add column if not exists cash_balance numeric default 0,
  add column if not exists holdings_value numeric default 0,
  add column if not exists total_portfolio_value numeric default 0,
  add column if not exists return_percent numeric default 0,
  add column if not exists trades_count integer default 0,
  add column if not exists rank integer default 0;

update public.investment_leaderboard
set
  team_id = coalesce(team_id, account_id),
  total_portfolio_value = coalesce(nullif(total_portfolio_value, 0), total_value),
  return_percent = coalesce(nullif(return_percent, 0), total_return),
  trades_count = coalesce(nullif(trades_count, 0), trade_count),
  rank = coalesce(nullif(rank, 0), rank_position)
where team_id is null
   or total_portfolio_value = 0
   or return_percent = 0
   or trades_count = 0
   or rank = 0;

create index if not exists investment_leaderboard_competition_rank_idx
on public.investment_leaderboard (competition_id, rank asc, total_portfolio_value desc);

drop policy if exists "Service role can manage investment trades" on public.investment_trades;
create policy "Service role can manage investment trades"
on public.investment_trades for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage investment holdings" on public.investment_holdings;
create policy "Service role can manage investment holdings"
on public.investment_holdings for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage investment leaderboard" on public.investment_leaderboard;
create policy "Service role can manage investment leaderboard"
on public.investment_leaderboard for all to service_role using (true) with check (true);
