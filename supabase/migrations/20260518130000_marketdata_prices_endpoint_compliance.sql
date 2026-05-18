alter table public.investment_daily_prices
  add column if not exists endpoint text;

update public.investment_daily_prices
set endpoint = coalesce(endpoint, 'stocks/prices')
where provider = 'marketdata_app'
  and endpoint is null;

comment on column public.investment_daily_prices.endpoint is
  'Market data endpoint used for the cached educational simulation price. MarketData.app is restricted to stocks/prices.';
