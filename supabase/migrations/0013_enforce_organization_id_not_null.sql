-- Enforce organization_id NOT NULL on all tables (except auth tables)
-- This prevents accidental data entry to wrong org or root org

-- Add NOT NULL constraints back (now without defaults/fallbacks).
-- Só aplica quando a coluna existe (ver 0012).
do $$
declare
  t text;
  tables text[] := array[
    'category', 'clients', 'company_settings', 'content_library',
    'integrations', 'price_table', 'product', 'proposal', 'proposal_analytics'
  ];
begin
  foreach t in array tables loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t
        and column_name = 'organization_id'
    ) then
      execute format('alter table public.%I alter column organization_id set not null', t);
    end if;
  end loop;
end $$;

-- Safety: If any INSERT doesn't include organization_id, Postgres will reject it
-- This is intentional: developers MUST explicitly pass user's organization_id