-- Remove fallback to root org on inserts
-- After this migration, all tables require explicit organization_id
-- Users without org_id cannot insert into any table (which is correct)

-- Remove defaults that fallback to root org.
-- Só aplica quando a coluna existe (a baseline não cria organization_id
-- em proposal_analytics — tabela filha que herda org via proposal).
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
      execute format('alter table public.%I alter column organization_id drop default', t);
    end if;
  end loop;
end $$;

-- Now: Users without organization_id cannot create records
-- They MUST create their org first via /dashboard/criar-empresa
-- Then try to create proposals/products/etc