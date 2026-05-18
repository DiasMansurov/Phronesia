alter table public.investment_daily_prices
  add column if not exists endpoint text;

update public.investment_daily_prices
set endpoint = 'stocks/quotes'
where provider = 'marketdata_app';

comment on column public.investment_daily_prices.endpoint is
  'Market data endpoint used for the cached educational simulation price.';
