-- ============================================================
-- Fase 1 — Multi-tenant (PRD-02)
-- Supabase SQL editor — rodar UMA vez, em ordem (transação única)
-- Estratégia: expand → migrate → contract (compatível retroativo)
-- Depois desta migration, o sistema continua funcionando EXATAMENTE
-- igual (todos os dados → org raiz). Aplicação NÃO precisa mudar.
-- ============================================================

begin;

-- ────────────────────────────────────────────────────────────
-- 0. TABELA organization + org raiz (backfill de dados existentes)
-- ────────────────────────────────────────────────────────────

create table if not exists public.organization (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);

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

-- ────────────────────────────────────────────────────────────
-- 1. FUNÇÕES AUXILIARES
-- ────────────────────────────────────────────────────────────
-- NOTA: profiles.organization_id é criada na seção 0.5, ANTES
-- das funções, porque current_org_id() referencia essa coluna.

-- ────────────────────────────────────────────────────────────
-- 0.5. profiles → coluna organization_id (primeiro: dependência)
-- ────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists organization_id uuid;
update public.profiles set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.profiles alter column organization_id set not null;
alter table public.profiles add constraint profiles_organization_fk
  foreign key (organization_id) references public.organization(id);
create index if not exists profiles_organization_idx on public.profiles(organization_id);

-- Org do usuário da sessão atual (null para service role / anon)
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- É admin da própria organização?
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

-- ────────────────────────────────────────────────────────────
-- 2. TABELAS TOP-LEVEL → coluna organization_id
--    Default: org da sessão; fallback = org raiz (service role).
-- ────────────────────────────────────────────────────────────

-- company_settings
alter table public.company_settings add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.company_settings set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.company_settings alter column organization_id set not null;
alter table public.company_settings add constraint company_settings_organization_fk
  foreign key (organization_id) references public.organization(id);
create unique index if not exists company_settings_org_uq on public.company_settings(organization_id);
create index if not exists company_settings_organization_idx on public.company_settings(organization_id);

-- clients
alter table public.clients add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.clients set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.clients alter column organization_id set not null;
alter table public.clients add constraint clients_organization_fk
  foreign key (organization_id) references public.organization(id);
create index if not exists clients_organization_idx on public.clients(organization_id);

-- product
alter table public.product add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.product set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.product alter column organization_id set not null;
alter table public.product add constraint product_organization_fk
  foreign key (organization_id) references public.organization(id);
create index if not exists product_organization_idx on public.product(organization_id);

-- category
alter table public.category add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.category set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.category alter column organization_id set not null;
alter table public.category add constraint category_organization_fk
  foreign key (organization_id) references public.organization(id);
create index if not exists category_organization_idx on public.category(organization_id);

-- price_table
alter table public.price_table add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.price_table set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.price_table alter column organization_id set not null;
alter table public.price_table add constraint price_table_organization_fk
  foreign key (organization_id) references public.organization(id);
create index if not exists price_table_organization_idx on public.price_table(organization_id);

-- content_library
alter table public.content_library add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.content_library set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.content_library alter column organization_id set not null;
alter table public.content_library add constraint content_library_organization_fk
  foreign key (organization_id) references public.organization(id);
create index if not exists content_library_organization_idx on public.content_library(organization_id);

-- proposal_template
alter table public.proposal_template add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.proposal_template set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.proposal_template alter column organization_id set not null;
alter table public.proposal_template add constraint proposal_template_organization_fk
  foreign key (organization_id) references public.organization(id);
create index if not exists proposal_template_organization_idx on public.proposal_template(organization_id);

-- proposal
alter table public.proposal add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.proposal set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.proposal alter column organization_id set not null;
alter table public.proposal add constraint proposal_organization_fk
  foreign key (organization_id) references public.organization(id);
create index if not exists proposal_organization_idx on public.proposal(organization_id);

-- integrations (tabela ainda não usada no código — consistência)
alter table public.integrations add column if not exists organization_id uuid
  default coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001');
update public.integrations set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;
alter table public.integrations alter column organization_id set not null;
alter table public.integrations add constraint integrations_organization_fk
  foreign key (organization_id) references public.organization(id);
create index if not exists integrations_organization_idx on public.integrations(organization_id);

-- ────────────────────────────────────────────────────────────
-- 3. CONSTRAINTS ÚNICAS → escopadas por org
--    (global → (organization_id, slug/provider))
-- ────────────────────────────────────────────────────────────

alter table public.product drop constraint if exists product_slug_key;
create unique index if not exists product_org_slug_uq on public.product(organization_id, slug);

alter table public.category drop constraint if exists category_slug_key;
create unique index if not exists category_org_slug_uq on public.category(organization_id, slug);

alter table public.proposal_template drop constraint if exists proposal_template_slug_key;
create unique index if not exists proposal_template_org_slug_uq on public.proposal_template(organization_id, slug);

alter table public.integrations drop constraint if exists integrations_provider_key;
create unique index if not exists integrations_org_provider_uq on public.integrations(organization_id, provider);

-- No máximo um template default por org
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
-- 4. ROW LEVEL SECURITY — políticas org-scoped
--    Drop das políticas legadas (auth all / específicas) e
--    recriação com isolamento por organização.
-- ────────────────────────────────────────────────────────────

-- organization
alter table public.organization enable row level security;
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

-- Self update: não pode mudar o próprio role (fecha escalada de privilégio)
drop policy if exists profiles_org_update_self on public.profiles;
create policy profiles_org_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() and organization_id = public.current_org_id())
  with check (
    id = auth.uid()
    and organization_id = public.current_org_id()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Admin da org pode gerenciar perfis da org
drop policy if exists profiles_org_update_admin on public.profiles;
create policy profiles_org_update_admin on public.profiles
  for update to authenticated
  using (
    organization_id = public.current_org_id()
    and public.is_org_admin()
  )
  with check (organization_id = public.current_org_id());

-- company_settings (leitura: qualquer membro; escrita: admin da org)
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

-- Top-level com acesso pleno restrito à org
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

-- Filhas que herdam org via FK (não têm coluna organization_id)
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

-- proposal_block (substitui políticas legadas + auth all)
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

-- template_block (leitura da org; escrita admin da org — paridade com hoje)
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

-- category (leitura da org; escrita admin da org — paridade com hoje)
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

-- content_library (leitura da org; escrita dono/admin da org)
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

-- integrations (org-any — tabela ainda sem uso no código)
alter table public.integrations enable row level security;
create policy integrations_org_all on public.integrations
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- ────────────────────────────────────────────────────────────
-- 5. TRIGGER de novo usuário (v1 — compatível retroativo)
--    Novo cadastro continua caindo na org raiz, role seller.
--    (v2 — criar org própria — entra na Fase 3)
-- ────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────
-- 6. RPC admin_list_users → org-scoped (security definer)
--    Mesmos tipos de retorno de hoje + filtro pela org da sessão
-- ────────────────────────────────────────────────────────────

-- DROP necessário: CREATE OR REPLACE não pode mudar o tipo de retorno
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
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and organization_id = public.current_org_id()
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

-- ────────────────────────────────────────────────────────────
-- 7. VERIFICAÇÃO (rodar após o commit)
-- ────────────────────────────────────────────────────────────
-- select count(*) from public.organization;
-- select id, organization_id from public.profiles;
-- select tablename, policyname from pg_policies where schemaname='public' order by tablename;
-- select name, organization_id from public.product;

commit;
