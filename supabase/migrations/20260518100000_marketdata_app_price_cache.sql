alter table public.investment_daily_prices
  add column if not exists price numeric,
  add column if not exists currency text default 'USD',
  add column if not exists updated_at timestamptz default now(),
  add column if not exists trading_day date,
  add column if not exists raw_source jsonb;

update public.investment_daily_prices
set
  price = coalesce(price, close_price),
  currency = coalesce(currency, 'USD'),
  trading_day = coalesce(trading_day, price_date),
  raw_source = coalesce(raw_source, raw),
  updated_at = coalesce(updated_at, fetched_at, now())
where price is null
   or currency is null
   or trading_day is null
   or raw_source is null
   or updated_at is null;

alter table public.investment_trades
  add column if not exists price_timestamp timestamptz;

create table if not exists public.investment_asset_watchlist_events (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  event_type text not null check (event_type in ('search', 'select', 'trade', 'hold')),
  created_at timestamptz not null default now()
);

create index if not exists investment_daily_prices_symbol_fetched_idx
on public.investment_daily_prices (symbol, fetched_at desc);

create index if not exists investment_asset_watchlist_events_recent_idx
on public.investment_asset_watchlist_events (created_at desc, symbol);

alter table public.investment_asset_watchlist_events enable row level security;

drop policy if exists "Service role can manage investment asset watch events" on public.investment_asset_watchlist_events;
create policy "Service role can manage investment asset watch events"
on public.investment_asset_watchlist_events for all to service_role using (true) with check (true);
