-- ============================================================
-- FineAndYou — 0001_baseline.sql (idempotente)
-- Snapshot canonico do schema vivo (2026-08-15).
-- Fontes:
--   - OpenAPI do PostgREST (tabelas, colunas, tipos, defaults, NOT NULL)
--   - database.types.ts (FKs) — regenerado do banco vivo (PRD-02 Fase 6)
--   - supabase-multi-tenant.sql (funcoes, RLS org-scoped, constraints)
--   - supabase-multi-tenant-fase5.sql (storage 'assets')
--   - codigo do app (valores de CHECKs)
-- Executavel em banco novo OU existente (IF NOT EXISTS / drop+create).
-- ============================================================

create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 1. ORGANIZACAO + ORG RAIZ
-- ────────────────────────────────────────────────────────────

create table if not exists public.organization (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  created_by uuid,
  created_at timestamptz default now()
);


do $$
declare
  v_root uuid := '00000000-0000-0000-0000-000000000001';
  v_org_count int;
begin
  select count(*) into v_org_count from public.organization;
  if v_org_count = 0 then
    insert into public.organization (id, name, created_by)
    values (v_root, 'FineAndYou', null);
  end if;
end $$;

-- ────────────────────────────────────────────────────────────
-- 2. PROFILES (dependencia de current_org_id)
-- ────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  role text default 'seller' not null,
  created_at timestamptz default now(),
  job_title text,
  phone text,
  active boolean default true not null,
  organization_id uuid not null
);


-- ────────────────────────────────────────────────────────────
-- 3. FUNCOES AUXILIARES + TRIGGER DE NOVO USUARIO
-- ────────────────────────────────────────────────────────────

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;



create or replace function public.is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and organization_id = public.current_org_id()
  )
$$;



create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, organization_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'seller',
    (select id from public.organization order by created_at limit 1)
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ────────────────────────────────────────────────────────────

-- 4. DEMAIS TABELAS (colunas/typ defaults do OpenAPI)

-- ────────────────────────────────────────────────────────────

create table if not exists public.category (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  color text default 'blue' not null,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null,
  organization_id uuid default COALESCE(public.current_org_id(), '00000000-0000-0000-0000-000000000001'::uuid) not null
);


create table if not exists public.clients (
  id uuid primary key default extensions.uuid_generate_v4(),
  empresa text not null,
  cnpj text,
  contato text not null,
  cargo text,
  email text,
  whatsapp text,
  colaboradores integer,
  segmento text,
  created_by uuid,
  created_at timestamptz default now(),
  rd_lead_id text,
  origem text default 'manual',
  updated_from_rd_at timestamptz,
  organization_id uuid default COALESCE(public.current_org_id(), '00000000-0000-0000-0000-000000000001'::uuid) not null
);


create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text default 'FineAndYou' not null,
  company_site text,
  company_email text,
  company_phone text,
  company_whatsapp text,
  logo_url text,
  primary_color text default '#1FE97C' not null,
  secondary_color text,
  pdf_footer_text text,
  pdf_default_conditions text,
  signer_name text,
  signer_role text,
  signer_email text,
  signer_phone text,
  updated_at timestamptz default now(),
  updated_by uuid,
  ai_tone text,
  cover_bg_url text,
  organization_id uuid default COALESCE(public.current_org_id(), '00000000-0000-0000-0000-000000000001'::uuid) not null,
  cover_video_url text,
  company_about text
);


create table if not exists public.content_library (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  content jsonb not null,
  created_by uuid,
  created_at timestamptz default now(),
  organization_id uuid default COALESCE(public.current_org_id(), '00000000-0000-0000-0000-000000000001'::uuid) not null
);


create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  refresh_token text not null,
  connected_at timestamptz default now(),
  updated_at timestamptz default now(),
  organization_id uuid default COALESCE(public.current_org_id(), '00000000-0000-0000-0000-000000000001'::uuid) not null
);


create table if not exists public.price_table (
  id uuid primary key default extensions.uuid_generate_v4(),
  product_id uuid not null,
  name text not null,
  description text,
  active boolean default true not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  organization_id uuid default COALESCE(public.current_org_id(), '00000000-0000-0000-0000-000000000001'::uuid) not null
);


create table if not exists public.price_table_item (
  id uuid primary key default extensions.uuid_generate_v4(),
  price_table_id uuid not null,
  minimum_quantity integer default 1 not null,
  maximum_quantity integer,
  unit_price numeric not null,
  sort_order integer default 0 not null,
  active boolean default true not null,
  created_at timestamptz default now()
);


create table if not exists public.product (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  slug text not null,
  description text,
  active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  calculation_type text,
  billing_frequency text,
  default_price_table_id uuid,
  unit_label text default 'unidades' not null,
  category text,
  organization_id uuid default COALESCE(public.current_org_id(), '00000000-0000-0000-0000-000000000001'::uuid) not null,
  commercial_conditions text
);


create table if not exists public.product_benefit (
  id uuid primary key default extensions.uuid_generate_v4(),
  product_id uuid not null,
  title text not null,
  sort_order integer default 0 not null,
  active boolean default true not null
);


create table if not exists public.product_differential (
  id uuid primary key default extensions.uuid_generate_v4(),
  product_id uuid not null,
  title text not null,
  sort_order integer default 0 not null,
  active boolean default true not null
);


create table if not exists public.product_faq (
  id uuid primary key default extensions.uuid_generate_v4(),
  product_id uuid not null,
  question text not null,
  answer text not null,
  sort_order integer default 0 not null,
  active boolean default true not null
);


create table if not exists public.product_scope (
  id uuid primary key default extensions.uuid_generate_v4(),
  product_id uuid not null,
  title text not null,
  sort_order integer default 0 not null,
  active boolean default true not null
);


create table if not exists public.proposal (
  id uuid primary key default extensions.uuid_generate_v4(),
  client_id uuid,
  template_id uuid,
  title text default 'Nova proposta' not null,
  status text default 'draft' not null,
  diagnosis text,
  objectives text,
  commercial_notes text,
  discount_percent numeric default 0,
  discount_value numeric default 0,
  total_setup numeric default 0,
  total_monthly numeric default 0,
  total_amount numeric default 0,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  version integer default 1 not null,
  version_group uuid,
  is_archived boolean default false not null,
  archived_at timestamptz,
  validade_dias integer default 30 not null,
  forma_pagamento text,
  prazo_implantacao text,
  public_token text,
  opportunity_status text default 'open' not null,
  lost_reason text,
  lost_comment text,
  code integer not null,
  has_pending_review boolean default false,
  vigencia_contrato text,
  organization_id uuid default COALESCE(public.current_org_id(), '00000000-0000-0000-0000-000000000001'::uuid) not null,
  commercial_conditions text
);


create table if not exists public.proposal_analytics (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null,
  event_type text not null,
  session_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);


create table if not exists public.proposal_block (
  id uuid primary key default extensions.uuid_generate_v4(),
  proposal_id uuid not null,
  type text not null,
  title text,
  content_json jsonb not null,
  sort_order integer default 0 not null,
  enabled boolean default true not null,
  created_at timestamptz default now()
);


create table if not exists public.proposal_event (
  id uuid primary key default extensions.uuid_generate_v4(),
  proposal_id uuid not null,
  event_type text not null,
  created_by uuid,
  created_at timestamptz default now(),
  metadata jsonb
);


create table if not exists public.proposal_product (
  id uuid primary key default extensions.uuid_generate_v4(),
  proposal_id uuid not null,
  product_id uuid,
  quantity integer default 1 not null,
  pricing_type text default 'monthly' not null,
  unit_value numeric,
  monthly_value numeric,
  setup_value numeric default 0,
  discount_percent numeric default 0,
  discount_value numeric default 0,
  subtotal numeric,
  notes text,
  snapshot jsonb not null,
  sort_order integer default 0 not null,
  created_at timestamptz default now(),
  manual_override boolean default false not null,
  override_reason text
);


create table if not exists public.proposal_template (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  description text,
  is_default boolean default false not null,
  created_at timestamptz default now(),
  slug text,
  product_slugs text[] not null,
  cover_image_url text,
  cover_video_url text,
  organization_id uuid default COALESCE(public.current_org_id(), '00000000-0000-0000-0000-000000000001'::uuid) not null
);


create table if not exists public.template_block (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  type text not null,
  sort_order integer default 0 not null,
  enabled boolean default true not null,
  title text,
  default_content jsonb not null,
  created_at timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 5. DRIFT-HEAL: organization_id em tabelas top-level
-- ────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.profiles set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.profiles alter column organization_id set not null;

alter table public.company_settings add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.company_settings set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.company_settings alter column organization_id set not null;

alter table public.clients add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.clients set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.clients alter column organization_id set not null;

alter table public.product add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.product set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.product alter column organization_id set not null;

alter table public.category add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.category set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.category alter column organization_id set not null;

alter table public.price_table add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.price_table set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.price_table alter column organization_id set not null;

alter table public.content_library add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.content_library set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.content_library alter column organization_id set not null;

alter table public.proposal_template add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.proposal_template set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.proposal_template alter column organization_id set not null;

alter table public.proposal add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.proposal set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.proposal alter column organization_id set not null;

alter table public.integrations add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.integrations set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.integrations alter column organization_id set not null;



do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_organization_fk' and conrelid = 'public.profiles'::regclass
  ) then
    execute 'alter table public.profiles add constraint profiles_organization_fk foreign key (organization_id) references public.organization(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'company_settings_organization_fk' and conrelid = 'public.company_settings'::regclass
  ) then
    execute 'alter table public.company_settings add constraint company_settings_organization_fk foreign key (organization_id) references public.organization(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clients_organization_fk' and conrelid = 'public.clients'::regclass
  ) then
    execute 'alter table public.clients add constraint clients_organization_fk foreign key (organization_id) references public.organization(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clients_created_by_fkey' and conrelid = 'public.clients'::regclass
  ) then
    execute 'alter table public.clients add constraint clients_created_by_fkey foreign key (created_by) references public.profiles(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_organization_fk' and conrelid = 'public.product'::regclass
  ) then
    execute 'alter table public.product add constraint product_organization_fk foreign key (organization_id) references public.organization(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'category_organization_fk' and conrelid = 'public.category'::regclass
  ) then
    execute 'alter table public.category add constraint category_organization_fk foreign key (organization_id) references public.organization(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'price_table_organization_fk' and conrelid = 'public.price_table'::regclass
  ) then
    execute 'alter table public.price_table add constraint price_table_organization_fk foreign key (organization_id) references public.organization(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'price_table_product_id_fkey' and conrelid = 'public.price_table'::regclass
  ) then
    execute 'alter table public.price_table add constraint price_table_product_id_fkey foreign key (product_id) references public.product(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'price_table_item_price_table_id_fkey' and conrelid = 'public.price_table_item'::regclass
  ) then
    execute 'alter table public.price_table_item add constraint price_table_item_price_table_id_fkey foreign key (price_table_id) references public.price_table(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'content_library_organization_fk' and conrelid = 'public.content_library'::regclass
  ) then
    execute 'alter table public.content_library add constraint content_library_organization_fk foreign key (organization_id) references public.organization(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'content_library_created_by_fkey' and conrelid = 'public.content_library'::regclass
  ) then
    execute 'alter table public.content_library add constraint content_library_created_by_fkey foreign key (created_by) references public.profiles(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_template_organization_fk' and conrelid = 'public.proposal_template'::regclass
  ) then
    execute 'alter table public.proposal_template add constraint proposal_template_organization_fk foreign key (organization_id) references public.organization(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_organization_fk' and conrelid = 'public.proposal'::regclass
  ) then
    execute 'alter table public.proposal add constraint proposal_organization_fk foreign key (organization_id) references public.organization(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_client_id_fkey' and conrelid = 'public.proposal'::regclass
  ) then
    execute 'alter table public.proposal add constraint proposal_client_id_fkey foreign key (client_id) references public.clients(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_template_id_fkey' and conrelid = 'public.proposal'::regclass
  ) then
    execute 'alter table public.proposal add constraint proposal_template_id_fkey foreign key (template_id) references public.proposal_template(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_created_by_fkey' and conrelid = 'public.proposal'::regclass
  ) then
    execute 'alter table public.proposal add constraint proposal_created_by_fkey foreign key (created_by) references public.profiles(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'integrations_organization_fk' and conrelid = 'public.integrations'::regclass
  ) then
    execute 'alter table public.integrations add constraint integrations_organization_fk foreign key (organization_id) references public.organization(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_benefit_product_id_fkey' and conrelid = 'public.product_benefit'::regclass
  ) then
    execute 'alter table public.product_benefit add constraint product_benefit_product_id_fkey foreign key (product_id) references public.product(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_scope_product_id_fkey' and conrelid = 'public.product_scope'::regclass
  ) then
    execute 'alter table public.product_scope add constraint product_scope_product_id_fkey foreign key (product_id) references public.product(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_faq_product_id_fkey' and conrelid = 'public.product_faq'::regclass
  ) then
    execute 'alter table public.product_faq add constraint product_faq_product_id_fkey foreign key (product_id) references public.product(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_differential_product_id_fkey' and conrelid = 'public.product_differential'::regclass
  ) then
    execute 'alter table public.product_differential add constraint product_differential_product_id_fkey foreign key (product_id) references public.product(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_product_proposal_id_fkey' and conrelid = 'public.proposal_product'::regclass
  ) then
    execute 'alter table public.proposal_product add constraint proposal_product_proposal_id_fkey foreign key (proposal_id) references public.proposal(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_product_product_id_fkey' and conrelid = 'public.proposal_product'::regclass
  ) then
    execute 'alter table public.proposal_product add constraint proposal_product_product_id_fkey foreign key (product_id) references public.product(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_event_proposal_id_fkey' and conrelid = 'public.proposal_event'::regclass
  ) then
    execute 'alter table public.proposal_event add constraint proposal_event_proposal_id_fkey foreign key (proposal_id) references public.proposal(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_event_created_by_fkey' and conrelid = 'public.proposal_event'::regclass
  ) then
    execute 'alter table public.proposal_event add constraint proposal_event_created_by_fkey foreign key (created_by) references public.profiles(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_analytics_proposal_id_fkey' and conrelid = 'public.proposal_analytics'::regclass
  ) then
    execute 'alter table public.proposal_analytics add constraint proposal_analytics_proposal_id_fkey foreign key (proposal_id) references public.proposal(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_block_proposal_id_fkey' and conrelid = 'public.proposal_block'::regclass
  ) then
    execute 'alter table public.proposal_block add constraint proposal_block_proposal_id_fkey foreign key (proposal_id) references public.proposal(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'template_block_template_id_fkey' and conrelid = 'public.template_block'::regclass
  ) then
    execute 'alter table public.template_block add constraint template_block_template_id_fkey foreign key (template_id) references public.proposal_template(id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organization_created_by_fkey' and conrelid = 'public.organization'::regclass
  ) then
    execute 'alter table public.organization add constraint organization_created_by_fkey foreign key (created_by) references public.profiles(id)';
  end if;
end $$;



create index if not exists profiles_organization_idx on public.profiles(organization_id);
create index if not exists company_settings_organization_idx on public.company_settings(organization_id);
create index if not exists clients_organization_idx on public.clients(organization_id);
create index if not exists product_organization_idx on public.product(organization_id);
create index if not exists category_organization_idx on public.category(organization_id);
create index if not exists price_table_organization_idx on public.price_table(organization_id);
create index if not exists content_library_organization_idx on public.content_library(organization_id);
create index if not exists proposal_template_organization_idx on public.proposal_template(organization_id);
create index if not exists proposal_organization_idx on public.proposal(organization_id);
create index if not exists integrations_organization_idx on public.integrations(organization_id);
create unique index if not exists company_settings_org_uq on public.company_settings(organization_id);


-- ────────────────────────────────────────────────────────────
-- 6. UNIQUE ESCOPADO POR ORG
-- ────────────────────────────────────────────────────────────

alter table public.product drop constraint if exists product_slug_key;
create unique index if not exists product_org_slug_uq on public.product(organization_id, slug);

alter table public.category drop constraint if exists category_slug_key;
create unique index if not exists category_org_slug_uq on public.category(organization_id, slug);

alter table public.proposal_template drop constraint if exists proposal_template_slug_key;
create unique index if not exists proposal_template_org_slug_uq on public.proposal_template(organization_id, slug);

alter table public.integrations drop constraint if exists integrations_provider_key;
create unique index if not exists integrations_org_provider_uq on public.integrations(organization_id, provider);

update public.proposal_template t
set is_default = false
where t.is_default
  and exists (
    select 1 from public.proposal_template t2
    where t2.organization_id = t.organization_id
      and t2.id < t.id
      and t2.is_default
  );
create unique index if not exists proposal_template_one_default_per_org
  on public.proposal_template(organization_id) where is_default;


-- ────────────────────────────────────────────────────────────
-- 7. RPC admin_list_users
-- ────────────────────────────────────────────────────────────

drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  job_title text,
  phone text,
  active boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.organization_id = public.current_org_id()
  ) then
    raise exception 'Access denied';
  end if;

  return query
  select
    p.id,
    p.full_name,
    u.email::text,
    p.role::text,
    p.job_title,
    p.phone,
    p.active,
    u.created_at,
    u.last_sign_in_at,
    count(pr.id)::bigint
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.proposal pr on pr.created_by = p.id
  where p.organization_id = public.current_org_id()
  group by p.id, p.full_name, u.email, p.role, p.job_title, p.phone, p.active,
           u.created_at, u.last_sign_in_at
  order by u.created_at desc;
end; $$;

grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_list_users() to service_role;


-- ────────────────────────────────────────────────────────────
-- 8. CHECK CONSTRAINTS (reconstruidos do codigo do app)
-- ────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check' and conrelid = 'public.profiles'::regclass
  ) then
    execute 'alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'seller', 'viewer'))';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_status_check' and conrelid = 'public.proposal'::regclass
  ) then
    execute 'alter table public.proposal add constraint proposal_status_check check (status in ('draft', 'generated', 'sent', 'won', 'lost'))';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_block_type_check' and conrelid = 'public.proposal_block'::regclass
  ) then
    execute 'alter table public.proposal_block add constraint proposal_block_type_check check (type in ('cover','cenario','objetivos','solucao','beneficios','escopo','diferenciais','faq','proximos_passos','sobre','investimento','assinatura'))';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_event_event_type_check' and conrelid = 'public.proposal_event'::regclass
  ) then
    execute 'alter table public.proposal_event add constraint proposal_event_event_type_check check (event_type in ('created','edited','pdf_generated','pdf_downloaded','sent','approved','lost','opened','heartbeat','opportunity_won','opportunity_lost','adjustments_requested','update_requested','duplicated','archived'))';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_product_pricing_type_check' and conrelid = 'public.proposal_product'::regclass
  ) then
    execute 'alter table public.proposal_product add constraint proposal_product_pricing_type_check check (pricing_type in ('monthly','one_time','per_employee','per_project'))';
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY (org-scoped)
-- ────────────────────────────────────────────────────────────

-- enable RLS
alter table public.organization enable row level security;
alter table public.profiles enable row level security;
alter table public.company_settings enable row level security;
alter table public.clients enable row level security;
alter table public.product enable row level security;
alter table public.category enable row level security;
alter table public.price_table enable row level security;
alter table public.price_table_item enable row level security;
alter table public.content_library enable row level security;
alter table public.proposal_template enable row level security;
alter table public.proposal enable row level security;
alter table public.proposal_product enable row level security;
alter table public.proposal_event enable row level security;
alter table public.proposal_analytics enable row level security;
alter table public.proposal_block enable row level security;
alter table public.template_block enable row level security;
alter table public.product_benefit enable row level security;
alter table public.product_scope enable row level security;
alter table public.product_faq enable row level security;
alter table public.product_differential enable row level security;
alter table public.integrations enable row level security;

-- organization
drop policy if exists organization_org_read on public.organization;
create policy organization_org_read on public.organization
  for select to authenticated
  using (id = public.current_org_id());

-- profiles
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "auth read own profile" on public.profiles;
drop policy if exists profiles_org_select on public.profiles;
create policy profiles_org_select on public.profiles
  for select to authenticated
  using (organization_id = public.current_org_id() or id = auth.uid());

drop policy if exists profiles_org_insert on public.profiles;
create policy profiles_org_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_org_update_self on public.profiles;
create policy profiles_org_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() and organization_id = public.current_org_id())
  with check (
    id = auth.uid()
    and organization_id = public.current_org_id()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists profiles_org_update_admin on public.profiles;
create policy profiles_org_update_admin on public.profiles
  for update to authenticated
  using (
    organization_id = public.current_org_id()
    and public.is_org_admin()
  )
  with check (organization_id = public.current_org_id());

-- company_settings
drop policy if exists company_settings_read on public.company_settings;
drop policy if exists company_settings_insert on public.company_settings;
drop policy if exists company_settings_update on public.company_settings;
drop policy if exists company_settings_org_read on public.company_settings;
drop policy if exists company_settings_org_admin_write on public.company_settings;
create policy company_settings_org_read on public.company_settings
  for select to authenticated
  using (organization_id = public.current_org_id());
create policy company_settings_org_admin_write on public.company_settings
  for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_org_admin());
create policy company_settings_org_admin_update on public.company_settings
  for update to authenticated
  using (organization_id = public.current_org_id() and public.is_org_admin())
  with check (organization_id = public.current_org_id() and public.is_org_admin());

-- top-level org-scoped
drop policy if exists "auth all" on public.clients;
drop policy if exists "auth all" on public.product;
drop policy if exists "auth all" on public.price_table;
drop policy if exists "auth all" on public.price_table_item;
drop policy if exists "auth all" on public.proposal;
drop policy if exists "auth all" on public.proposal_product;
drop policy if exists "auth all" on public.proposal_event;
drop policy if exists "auth all" on public.proposal_template;
drop policy if exists "auth all" on public.product_benefit;
drop policy if exists "auth all" on public.product_scope;
drop policy if exists "auth all" on public.product_faq;
drop policy if exists "auth all" on public.product_differential;

create policy clients_org_all on public.clients
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
create policy product_org_all on public.product
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
create policy price_table_org_all on public.price_table
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
create policy proposal_org_all on public.proposal
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
create policy proposal_template_org_all on public.proposal_template
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy product_benefit_org_all on public.product_benefit
  for all to authenticated
  using (exists (
    select 1 from public.product p
    where p.id = product_benefit.product_id and p.organization_id = public.current_org_id()))
  with check (exists (
    select 1 from public.product p
    where p.id = product_benefit.product_id and p.organization_id = public.current_org_id()));
create policy product_scope_org_all on public.product_scope
  for all to authenticated
  using (exists (
    select 1 from public.product p
    where p.id = product_scope.product_id and p.organization_id = public.current_org_id()))
  with check (exists (
    select 1 from public.product p
    where p.id = product_scope.product_id and p.organization_id = public.current_org_id()));
create policy product_faq_org_all on public.product_faq
  for all to authenticated
  using (exists (
    select 1 from public.product p
    where p.id = product_faq.product_id and p.organization_id = public.current_org_id()))
  with check (exists (
    select 1 from public.product p
    where p.id = product_faq.product_id and p.organization_id = public.current_org_id()));
create policy product_differential_org_all on public.product_differential
  for all to authenticated
  using (exists (
    select 1 from public.product p
    where p.id = product_differential.product_id and p.organization_id = public.current_org_id()))
  with check (exists (
    select 1 from public.product p
    where p.id = product_differential.product_id and p.organization_id = public.current_org_id()));
create policy price_table_item_org_all on public.price_table_item
  for all to authenticated
  using (exists (
    select 1 from public.price_table pt
    where pt.id = price_table_item.price_table_id and pt.organization_id = public.current_org_id()))
  with check (exists (
    select 1 from public.price_table pt
    where pt.id = price_table_item.price_table_id and pt.organization_id = public.current_org_id()));
create policy proposal_product_org_all on public.proposal_product
  for all to authenticated
  using (exists (
    select 1 from public.proposal pr
    where pr.id = proposal_product.proposal_id and pr.organization_id = public.current_org_id()))
  with check (exists (
    select 1 from public.proposal pr
    where pr.id = proposal_product.proposal_id and pr.organization_id = public.current_org_id()));
create policy proposal_event_org_all on public.proposal_event
  for all to authenticated
  using (exists (
    select 1 from public.proposal pr
    where pr.id = proposal_event.proposal_id and pr.organization_id = public.current_org_id()))
  with check (exists (
    select 1 from public.proposal pr
    where pr.id = proposal_event.proposal_id and pr.organization_id = public.current_org_id()));

-- proposal_block
drop policy if exists "auth all" on public.proposal_block;
drop policy if exists proposal_block_select on public.proposal_block;
drop policy if exists proposal_block_insert on public.proposal_block;
drop policy if exists proposal_block_update on public.proposal_block;
drop policy if exists proposal_block_delete on public.proposal_block;
create policy proposal_block_org_all on public.proposal_block
  for all to authenticated
  using (exists (
    select 1 from public.proposal pr
    where pr.id = proposal_block.proposal_id and pr.organization_id = public.current_org_id()))
  with check (exists (
    select 1 from public.proposal pr
    where pr.id = proposal_block.proposal_id and pr.organization_id = public.current_org_id()));

-- template_block
drop policy if exists template_block_select on public.template_block;
drop policy if exists template_block_insert on public.template_block;
drop policy if exists template_block_update on public.template_block;
drop policy if exists template_block_delete on public.template_block;
create policy template_block_org_read on public.template_block
  for select to authenticated
  using (exists (
    select 1 from public.proposal_template t
    where t.id = template_block.template_id and t.organization_id = public.current_org_id()));
create policy template_block_org_admin_write on public.template_block
  for insert to authenticated
  with check (
    public.is_org_admin()
    and exists (
      select 1 from public.proposal_template t
      where t.id = template_block.template_id and t.organization_id = public.current_org_id()));
create policy template_block_org_admin_update on public.template_block
  for update to authenticated
  using (
    public.is_org_admin()
    and exists (
      select 1 from public.proposal_template t
      where t.id = template_block.template_id and t.organization_id = public.current_org_id()))
  with check (
    public.is_org_admin()
    and exists (
      select 1 from public.proposal_template t
      where t.id = template_block.template_id and t.organization_id = public.current_org_id()));
create policy template_block_org_admin_delete on public.template_block
  for delete to authenticated
  using (
    public.is_org_admin()
    and exists (
      select 1 from public.proposal_template t
      where t.id = template_block.template_id and t.organization_id = public.current_org_id()));

-- category
drop policy if exists categories_select on public.category;
drop policy if exists categories_insert on public.category;
drop policy if exists categories_update on public.category;
drop policy if exists categories_delete on public.category;
create policy category_org_read on public.category
  for select to authenticated
  using (organization_id = public.current_org_id());
create policy category_org_admin_write on public.category
  for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_org_admin());
create policy category_org_admin_update on public.category
  for update to authenticated
  using (organization_id = public.current_org_id() and public.is_org_admin())
  with check (organization_id = public.current_org_id() and public.is_org_admin());
create policy category_org_admin_delete on public.category
  for delete to authenticated
  using (organization_id = public.current_org_id() and public.is_org_admin());

-- content_library
drop policy if exists content_library_select on public.content_library;
drop policy if exists content_library_insert on public.content_library;
drop policy if exists content_library_delete on public.content_library;
create policy content_library_org_read on public.content_library
  for select to authenticated
  using (organization_id = public.current_org_id());
create policy content_library_org_insert on public.content_library
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and organization_id = public.current_org_id());
create policy content_library_org_update on public.content_library
  for update to authenticated
  using (
    organization_id = public.current_org_id()
    and (created_by = auth.uid() or public.is_org_admin()))
  with check (organization_id = public.current_org_id());
create policy content_library_org_delete on public.content_library
  for delete to authenticated
  using (
    organization_id = public.current_org_id()
    and (created_by = auth.uid() or public.is_org_admin()));

-- integrations
create policy integrations_org_all on public.integrations
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());


-- ────────────────────────────────────────────────────────────
-- 10. STORAGE 'assets'
-- ────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
select 'assets', 'assets', true
where not exists (select 1 from storage.buckets where id = 'assets');

drop policy if exists assets_org_insert on storage.objects;
drop policy if exists assets_org_update on storage.objects;
drop policy if exists assets_org_delete on storage.objects;
drop policy if exists assets_org_select on storage.objects;

create policy assets_org_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] =
        coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001')::text
  );

create policy assets_org_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] =
        coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001')::text
  );

create policy assets_org_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] =
        coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001')::text
  );

create policy assets_org_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] =
        coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001')::text
  );


-- ────────────────────────────────────────────────────────────
-- 11. SEED + GRANTS
-- ────────────────────────────────────────────────────────────

do $$
declare
  v_root uuid := '00000000-0000-0000-0000-000000000001';
  v_org_count int;
begin
  select count(*) into v_org_count from public.organization;
  if v_org_count = 0 then
    insert into public.organization (id, name, created_by)
    values (
      v_root,
      coalesce((select company_name from public.company_settings limit 1), 'Empresa'),
      null
    );
  end if;
end $$;

update public.profiles set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

