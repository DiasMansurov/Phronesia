create table if not exists public.investment_price_overrides (
  id uuid primary key,
  symbol text not null,
  price numeric not null check (price > 0),
  note text,
  created_at timestamptz not null default now(),
  created_by text not null
);

create index if not exists investment_price_overrides_symbol_created_idx
  on public.investment_price_overrides (symbol, created_at desc);

grant select, insert, update, delete on table public.investment_price_overrides to service_role;
