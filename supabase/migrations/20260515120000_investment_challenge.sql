create table if not exists public.investment_competitions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique,
  title text not null,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  starting_cash numeric not null default 100000,
  starts_at timestamptz,
  ends_at timestamptz
);

create table if not exists public.investment_assets (
  symbol text primary key,
  name text not null,
  asset_type text not null check (asset_type in ('ETF', 'Stock')),
  theme text,
  enabled boolean not null default true,
  sort_order integer not null default 100
);

create table if not exists public.investment_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  competition_id uuid not null references public.investment_competitions(id) on delete cascade,
  team_name text not null,
  participant_login text,
  starting_cash numeric not null default 100000,
  cash numeric not null default 100000,
  unique (competition_id, team_name)
);

create table if not exists public.investment_trades (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  account_id uuid not null references public.investment_accounts(id) on delete cascade,
  competition_id uuid not null references public.investment_competitions(id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('buy', 'sell')),
  quantity numeric not null default 0,
  price numeric,
  gross_amount numeric,
  fee_amount numeric,
  net_amount numeric,
  rejected boolean not null default false,
  reject_reason text,
  trade_date date
);

create table if not exists public.investment_holdings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.investment_accounts(id) on delete cascade,
  symbol text not null references public.investment_assets(symbol),
  quantity numeric not null default 0,
  average_buy_price numeric not null default 0,
  realized_gain_loss numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (account_id, symbol)
);

create table if not exists public.investment_daily_prices (
  id uuid primary key default gen_random_uuid(),
  symbol text not null references public.investment_assets(symbol),
  price_date date not null,
  close_price numeric not null,
  adjusted_close_price numeric,
  volume numeric,
  provider text not null default 'alpha_vantage',
  raw jsonb,
  fetched_at timestamptz not null default now(),
  unique (symbol, price_date)
);

create table if not exists public.investment_portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.investment_accounts(id) on delete cascade,
  competition_id uuid not null references public.investment_competitions(id) on delete cascade,
  snapshot_date date not null,
  cash numeric not null default 0,
  holdings_value numeric not null default 0,
  total_value numeric not null default 0,
  daily_change numeric not null default 0,
  total_return numeric not null default 0,
  diversification_score numeric not null default 0,
  risk_score numeric,
  drawdown numeric,
  created_at timestamptz not null default now(),
  unique (account_id, snapshot_date)
);

create table if not exists public.investment_theses (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.investment_accounts(id) on delete cascade,
  competition_id uuid not null references public.investment_competitions(id) on delete cascade,
  thesis text not null default '',
  risks text not null default '',
  diversification_logic text not null default '',
  macro_view text not null default '',
  thesis_score numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (account_id)
);

create table if not exists public.investment_leaderboard (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.investment_competitions(id) on delete cascade,
  account_id uuid not null references public.investment_accounts(id) on delete cascade,
  team_name text not null,
  total_value numeric not null default 0,
  total_return numeric not null default 0,
  risk_adjusted_score numeric not null default 0,
  diversification_score numeric not null default 0,
  thesis_score numeric not null default 0,
  drawdown_score numeric not null default 0,
  overall_score numeric not null default 0,
  rank_position integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (competition_id, account_id)
);

create index if not exists investment_accounts_competition_idx
on public.investment_accounts (competition_id, team_name);

create index if not exists investment_trades_account_created_idx
on public.investment_trades (account_id, created_at desc);

create index if not exists investment_holdings_account_idx
on public.investment_holdings (account_id);

create index if not exists investment_daily_prices_symbol_date_idx
on public.investment_daily_prices (symbol, price_date desc);

create index if not exists investment_snapshots_account_date_idx
on public.investment_portfolio_snapshots (account_id, snapshot_date desc);

create index if not exists investment_leaderboard_rank_idx
on public.investment_leaderboard (competition_id, rank_position asc, overall_score desc);

alter table public.investment_competitions enable row level security;
alter table public.investment_assets enable row level security;
alter table public.investment_accounts enable row level security;
alter table public.investment_trades enable row level security;
alter table public.investment_holdings enable row level security;
alter table public.investment_daily_prices enable row level security;
alter table public.investment_portfolio_snapshots enable row level security;
alter table public.investment_theses enable row level security;
alter table public.investment_leaderboard enable row level security;

drop policy if exists "Service role can manage investment competitions" on public.investment_competitions;
create policy "Service role can manage investment competitions"
on public.investment_competitions for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage investment assets" on public.investment_assets;
create policy "Service role can manage investment assets"
on public.investment_assets for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage investment accounts" on public.investment_accounts;
create policy "Service role can manage investment accounts"
on public.investment_accounts for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage investment trades" on public.investment_trades;
create policy "Service role can manage investment trades"
on public.investment_trades for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage investment holdings" on public.investment_holdings;
create policy "Service role can manage investment holdings"
on public.investment_holdings for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage investment daily prices" on public.investment_daily_prices;
create policy "Service role can manage investment daily prices"
on public.investment_daily_prices for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage investment snapshots" on public.investment_portfolio_snapshots;
create policy "Service role can manage investment snapshots"
on public.investment_portfolio_snapshots for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage investment theses" on public.investment_theses;
create policy "Service role can manage investment theses"
on public.investment_theses for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage investment leaderboard" on public.investment_leaderboard;
create policy "Service role can manage investment leaderboard"
on public.investment_leaderboard for all to service_role using (true) with check (true);

insert into public.investment_competitions (slug, title, status, starting_cash)
values ('phronesia-investment-challenge', 'Phronesia Investment Challenge', 'active', 100000)
on conflict (slug) do update
set title = excluded.title,
    status = excluded.status,
    starting_cash = excluded.starting_cash,
    updated_at = now();

insert into public.investment_assets (symbol, name, asset_type, theme, sort_order)
values
  ('SPY', 'SPDR S&P 500 ETF', 'ETF', 'Broad US stocks', 1),
  ('QQQ', 'Invesco QQQ ETF', 'ETF', 'Large technology stocks', 2),
  ('VTI', 'Vanguard Total Stock Market ETF', 'ETF', 'Total US market', 3),
  ('GLD', 'SPDR Gold Shares', 'ETF', 'Gold exposure', 4),
  ('TLT', 'iShares 20+ Year Treasury Bond ETF', 'ETF', 'Long US bonds', 5),
  ('AAPL', 'Apple', 'Stock', 'Consumer technology', 6),
  ('MSFT', 'Microsoft', 'Stock', 'Software and cloud', 7),
  ('NVDA', 'NVIDIA', 'Stock', 'AI chips', 8),
  ('TSLA', 'Tesla', 'Stock', 'Electric vehicles', 9),
  ('JPM', 'JPMorgan Chase', 'Stock', 'Banking', 10),
  ('KO', 'Coca-Cola', 'Stock', 'Consumer staples', 11),
  ('XOM', 'Exxon Mobil', 'Stock', 'Energy', 12),
  ('AMZN', 'Amazon', 'Stock', 'E-commerce and cloud', 13),
  ('META', 'Meta Platforms', 'Stock', 'Social media and AI', 14),
  ('GOOGL', 'Alphabet', 'Stock', 'Search, ads, and cloud', 15)
on conflict (symbol) do update
set name = excluded.name,
    asset_type = excluded.asset_type,
    theme = excluded.theme,
    sort_order = excluded.sort_order,
    enabled = true;
