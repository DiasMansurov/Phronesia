alter table public.investment_assets
add column if not exists provider text not null default 'alpha_vantage';

alter table public.investment_daily_prices
add column if not exists trading_day date,
add column if not exists raw_source jsonb;

update public.investment_daily_prices
set trading_day = coalesce(trading_day, price_date),
    raw_source = coalesce(raw_source, raw)
where trading_day is null or raw_source is null;

insert into public.investment_assets (symbol, name, asset_type, theme, region, currency, exchange, reference_price, featured, enabled, sort_order, provider)
values
  ('AMD', 'Advanced Micro Devices Inc.', 'Stock', 'Semiconductors', 'United States', 'USD', 'NASDAQ', 150, true, true, 16, 'alpha_vantage'),
  ('NFLX', 'Netflix Inc.', 'Stock', 'Streaming media', 'United States', 'USD', 'NASDAQ', 640, true, true, 17, 'alpha_vantage'),
  ('DIS', 'The Walt Disney Company', 'Stock', 'Media and entertainment', 'United States', 'USD', 'NYSE', 105, true, true, 18, 'alpha_vantage'),
  ('WMT', 'Walmart Inc.', 'Stock', 'Retail', 'United States', 'USD', 'NYSE', 68, true, true, 19, 'alpha_vantage'),
  ('COST', 'Costco Wholesale Corporation', 'Stock', 'Retail membership', 'United States', 'USD', 'NASDAQ', 815, true, true, 20, 'alpha_vantage'),
  ('BAC', 'Bank of America Corporation', 'Stock', 'Banking', 'United States', 'USD', 'NYSE', 39, true, true, 21, 'alpha_vantage'),
  ('V', 'Visa Inc.', 'Stock', 'Payments', 'United States', 'USD', 'NYSE', 280, true, true, 22, 'alpha_vantage'),
  ('MA', 'Mastercard Incorporated', 'Stock', 'Payments', 'United States', 'USD', 'NYSE', 455, true, true, 23, 'alpha_vantage'),
  ('PEP', 'PepsiCo Inc.', 'Stock', 'Consumer staples', 'United States', 'USD', 'NASDAQ', 175, true, true, 24, 'alpha_vantage'),
  ('MCD', 'McDonald''s Corporation', 'Stock', 'Restaurants', 'United States', 'USD', 'NYSE', 290, true, true, 25, 'alpha_vantage')
on conflict (symbol) do update
set name = excluded.name,
    asset_type = excluded.asset_type,
    theme = excluded.theme,
    region = excluded.region,
    currency = excluded.currency,
    exchange = excluded.exchange,
    reference_price = excluded.reference_price,
    featured = true,
    enabled = true,
    sort_order = excluded.sort_order,
    provider = excluded.provider;

create table if not exists public.investment_option_contracts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  underlying_symbol text not null references public.investment_assets(symbol),
  contract_symbol text not null unique,
  option_type text not null check (option_type in ('call', 'put')),
  strike_price numeric not null,
  expiration_date date not null,
  provider text not null default 'educational_estimate',
  raw_source jsonb
);

create table if not exists public.investment_option_trades (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  account_id uuid references public.investment_accounts(id) on delete cascade,
  contract_symbol text not null,
  side text not null default 'buy' check (side in ('buy')),
  quantity numeric not null default 0,
  premium numeric not null default 0,
  gross_amount numeric not null default 0,
  rejected boolean not null default false,
  reject_reason text
);

create table if not exists public.investment_option_positions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.investment_accounts(id) on delete cascade,
  contract_symbol text not null,
  underlying_symbol text not null,
  option_type text not null check (option_type in ('call', 'put')),
  strike_price numeric not null,
  expiration_date date not null,
  premium_paid numeric not null default 0,
  quantity numeric not null default 0,
  current_estimated_value numeric not null default 0,
  max_loss numeric not null default 0,
  breakeven numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (account_id, contract_symbol)
);

create table if not exists public.investment_option_price_cache (
  id uuid primary key default gen_random_uuid(),
  contract_symbol text not null,
  underlying_symbol text not null,
  premium numeric not null,
  provider text not null default 'educational_estimate',
  raw_source jsonb,
  fetched_at timestamptz not null default now(),
  unique (contract_symbol)
);

alter table public.investment_option_contracts enable row level security;
alter table public.investment_option_trades enable row level security;
alter table public.investment_option_positions enable row level security;
alter table public.investment_option_price_cache enable row level security;

drop policy if exists "Service role can manage option contracts" on public.investment_option_contracts;
create policy "Service role can manage option contracts"
on public.investment_option_contracts for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage option trades" on public.investment_option_trades;
create policy "Service role can manage option trades"
on public.investment_option_trades for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage option positions" on public.investment_option_positions;
create policy "Service role can manage option positions"
on public.investment_option_positions for all to service_role using (true) with check (true);

drop policy if exists "Service role can manage option price cache" on public.investment_option_price_cache;
create policy "Service role can manage option price cache"
on public.investment_option_price_cache for all to service_role using (true) with check (true);
