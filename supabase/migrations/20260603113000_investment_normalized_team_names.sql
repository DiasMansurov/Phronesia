alter table public.investment_accounts
  add column if not exists normalized_team_name text;

update public.investment_accounts
set normalized_team_name = lower(regexp_replace(btrim(team_name), '\s+', ' ', 'g'))
where normalized_team_name is null
   or normalized_team_name = '';

create index if not exists investment_accounts_competition_normalized_team_idx
on public.investment_accounts (competition_id, normalized_team_name);

do $$
begin
  if not exists (
    select 1
    from (
      select competition_id, normalized_team_name, count(*) as duplicate_count
      from public.investment_accounts
      where normalized_team_name is not null
        and normalized_team_name <> ''
      group by competition_id, normalized_team_name
      having count(*) > 1
    ) duplicates
  ) then
    create unique index if not exists investment_accounts_competition_normalized_team_uidx
    on public.investment_accounts (competition_id, normalized_team_name)
    where normalized_team_name is not null
      and normalized_team_name <> '';
  end if;
end $$;

grant all on table public.investment_accounts to service_role;
