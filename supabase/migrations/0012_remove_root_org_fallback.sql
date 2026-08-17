-- Remove fallback to root org on inserts
-- After this migration, all tables require explicit organization_id
-- Users without org_id cannot insert into any table (which is correct)

-- Tabelas que usam COALESCE fallback para org raiz:
-- category, clients, company_settings, content_library, integrations,
-- price_table, product, proposal, proposal_analytics

-- Remove defaults that fallback to root org
alter table public.category
  alter column organization_id drop default;

alter table public.clients
  alter column organization_id drop default;

alter table public.company_settings
  alter column organization_id drop default;

alter table public.content_library
  alter column organization_id drop default;

alter table public.integrations
  alter column organization_id drop default;

alter table public.price_table
  alter column organization_id drop default;

alter table public.product
  alter column organization_id drop default;

alter table public.proposal
  alter column organization_id drop default;

alter table public.proposal_analytics
  alter column organization_id drop default;

-- Now: Users without organization_id cannot create records
-- They MUST create their org first via /dashboard/criar-empresa
-- Then try to create proposals/products/etc
