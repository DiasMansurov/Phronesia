alter table public.investment_accounts
  add column if not exists cash_balance numeric,
  add column if not exists last_login_at timestamptz;

update public.investment_accounts
set cash_balance = coalesce(cash_balance, cash, starting_cash, 100000)
where cash_balance is null;

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
  price_timestamp = coalesce(price_timestamp, executed_at, created_at),
  executed_at = coalesce(executed_at, created_at)
where team_id is null
   or gross_value is null
   or net_value is null
   or price_timestamp is null
   or executed_at is null;

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

alter table public.investment_leaderboard
  add column if not exists team_id uuid,
  add column if not exists starting_cash numeric default 100000,
  add column if not exists cash_balance numeric default 0,
  add column if not exists holdings_value numeric default 0,
  add column if not exists total_portfolio_value numeric default 0,
  add column if not exists profit_loss numeric default 0,
  add column if not exists return_percent numeric default 0,
  add column if not exists trade_count integer default 0,
  add column if not exists trades_count integer default 0,
  add column if not exists risk_score numeric default 0,
  add column if not exists rank integer default 0,
  add column if not exists status text default 'active';

update public.investment_leaderboard
set
  team_id = coalesce(team_id, account_id),
  total_portfolio_value = coalesce(nullif(total_portfolio_value, 0), total_value),
  profit_loss = coalesce(nullif(profit_loss, 0), coalesce(nullif(total_portfolio_value, 0), total_value, 0) - coalesce(starting_cash, 100000)),
  return_percent = coalesce(nullif(return_percent, 0), total_return),
  trade_count = coalesce(nullif(trade_count, 0), trades_count),
  trades_count = coalesce(nullif(trades_count, 0), trade_count),
  rank = coalesce(nullif(rank, 0), rank_position),
  status = coalesce(status, 'active')
where team_id is null
   or total_portfolio_value = 0
   or rank = 0
   or status is null;

create index if not exists investment_accounts_competition_team_idx
on public.investment_accounts (competition_id, team_name);

create index if not exists investment_trades_competition_team_created_idx
on public.investment_trades (competition_id, team_id, created_at desc);

create index if not exists investment_holdings_competition_team_idx
on public.investment_holdings (competition_id, team_id);

create index if not exists investment_leaderboard_competition_value_idx
on public.investment_leaderboard (competition_id, total_portfolio_value desc, rank asc);

grant all on table public.investment_accounts to service_role;
grant all on table public.investment_trades to service_role;
grant all on table public.investment_holdings to service_role;
grant all on table public.investment_leaderboard to service_role;
