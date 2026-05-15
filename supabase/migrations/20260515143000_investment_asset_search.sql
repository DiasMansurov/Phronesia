alter table public.investment_assets
add column if not exists region text not null default 'United States',
add column if not exists currency text not null default 'USD',
add column if not exists exchange text,
add column if not exists reference_price numeric not null default 0,
add column if not exists featured boolean not null default false;

update public.investment_assets
set region = 'United States',
    currency = 'USD',
    reference_price = case symbol
      when 'SPY' then 520
      when 'QQQ' then 440
      when 'VTI' then 255
      when 'GLD' then 215
      when 'TLT' then 92
      when 'AAPL' then 190
      when 'MSFT' then 420
      when 'NVDA' then 120
      when 'TSLA' then 180
      when 'JPM' then 205
      when 'KO' then 62
      when 'XOM' then 115
      when 'AMZN' then 185
      when 'META' then 500
      when 'GOOGL' then 170
      else reference_price
    end,
    featured = symbol in ('SPY', 'QQQ', 'VTI', 'GLD', 'TLT', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'JPM', 'KO', 'XOM', 'AMZN', 'META', 'GOOGL')
where symbol in ('SPY', 'QQQ', 'VTI', 'GLD', 'TLT', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'JPM', 'KO', 'XOM', 'AMZN', 'META', 'GOOGL');

create index if not exists investment_assets_search_idx
on public.investment_assets (enabled, featured desc, symbol);
