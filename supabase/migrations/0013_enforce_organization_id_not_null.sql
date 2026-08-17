-- Enforce organization_id NOT NULL on all tables (except auth tables)
-- This prevents accidental data entry to wrong org or root org

-- Add NOT NULL constraints back (now without defaults/fallbacks)
alter table public.category
  alter column organization_id set not null;

alter table public.clients
  alter column organization_id set not null;

alter table public.company_settings
  alter column organization_id set not null;

alter table public.content_library
  alter column organization_id set not null;

alter table public.integrations
  alter column organization_id set not null;

alter table public.price_table
  alter column organization_id set not null;

alter table public.product
  alter column organization_id set not null;

alter table public.proposal
  alter column organization_id set not null;

alter table public.proposal_analytics
  alter column organization_id set not null;

-- Safety: If any INSERT doesn't include organization_id, Postgres will reject it
-- This is intentional: developers MUST explicitly pass user's organization_id
