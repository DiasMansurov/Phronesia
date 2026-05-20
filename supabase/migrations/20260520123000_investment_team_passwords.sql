alter table public.investment_accounts
  add column if not exists password_hash text,
  add column if not exists last_login_at timestamptz,
  add column if not exists cash_balance numeric;

update public.investment_accounts
set cash_balance = cash
where cash_balance is null;
