alter table public.investment_daily_prices
  add column if not exists trading_day date,
  add column if not exists provider text default 'alpha_vantage',
  add column if not exists fetched_at timestamptz default now(),
  add column if not exists raw_source jsonb;

update public.investment_daily_prices
set
  trading_day = coalesce(trading_day, price_date),
  raw_source = coalesce(raw_source, raw),
  fetched_at = coalesce(fetched_at, now())
where trading_day is null or raw_source is null or fetched_at is null;

create index if not exists investment_daily_prices_symbol_trading_day_idx
on public.investment_daily_prices (symbol, trading_day desc);
