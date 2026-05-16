alter table public.investment_trades
add column if not exists gross_value numeric,
add column if not exists fee_rate numeric not null default 0.001,
add column if not exists net_value numeric,
add column if not exists price_date date,
add column if not exists price_source text,
add column if not exists executed_at timestamptz;

update public.investment_trades
set gross_value = coalesce(gross_value, gross_amount),
    net_value = coalesce(net_value, abs(net_amount)),
    fee_rate = coalesce(fee_rate, 0.001),
    executed_at = coalesce(executed_at, created_at),
    price_date = coalesce(price_date, trade_date)
where gross_value is null
   or net_value is null
   or executed_at is null
   or price_date is null;

create index if not exists investment_trades_executed_idx
on public.investment_trades (account_id, executed_at desc);
