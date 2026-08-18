-- =============================================================================
-- 0014 — Correções descobertas no E2E manual (17-18/08)
-- -----------------------------------------------------------------------------
-- 1. DML para service_role: a baseline (0001) só concedia a `authenticated`,
--    então o service_role (usado por createAdminClient em rotas server e na
--    página pública /p/[token]) ficou SEM permissão de INSERT/UPDATE/DELETE.
--    Consequência vista no E2E: criar empresa → "Erro ao criar empresa" (500).
--
-- 2. Restaurar `default public.current_org_id()` nas colunas organization_id:
--    a 0012 removeu o default de TODAS as colunas, mas o app (componentes
--    client que usam RLS) não passou a informar organization_id explicitamente
--    em todos os inserts. Resultado: RLS rejeitava todo INSERT ("violates
--    row-level security policy").
--    A barreira de segurança continua sendo o RLS:
--      * usuário sem org → current_org_id() retorna NULL → NOT NULL barra;
--      * usuário tentando gravar em outra org → policy with check barra.
--    O default apenas devolve o comportamento correto para o usuário com org.
--
-- 3. `proposal.code` era NOT NULL sem default e sem geração no app (toda a UI
--    já o trata como opcional: `p.code ? '#001' : '—'`). Vira nullable.
--
-- 4. Reset de dados: zera as tabelas de negócio antes do go-live (dados do
--    piloto não devem migrar para produção).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Grants DML para service_role (+ reforço para authenticated/anon por paridade)
-- ---------------------------------------------------------------------------
grant usage on schema public to service_role, anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

-- anon: leitura mínima é desnecessária — a página pública usa service_role.
-- Mantém-se apenas o usage no schema (já concedido na baseline).

-- ---------------------------------------------------------------------------
-- 2. Restaurar default current_org_id() nas colunas organization_id
-- ---------------------------------------------------------------------------
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
      execute format(
        'alter table public.%I alter column organization_id set default public.current_org_id()',
        t
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. proposal.code passa a ser opcional (a UI já trata como opcional)
-- ---------------------------------------------------------------------------
alter table public.proposal alter column code drop not null;

-- ---------------------------------------------------------------------------
-- 4. Reset de dados (somente quando aplicado antes do go-live)
-- ---------------------------------------------------------------------------
truncate table
  public.proposal_analytics,
  public.proposal_event,
  public.proposal_product,
  public.proposal_block,
  public.proposal,
  public.clients,
  public.price_table_item,
  public.price_table,
  public.product,
  public.product_benefit,
  public.product_differential,
  public.product_faq,
  public.product_scope,
  public.category,
  public.content_library,
  public.company_settings,
  public.integrations,
  public.template_block,
  public.proposal_template,
  public.profiles,
  public.organization
restart identity cascade;

-- Mantém auth.users intacto (identidades de autenticação são gerenciadas pelo GoTrue).
-- Obs: se quiser zerar também os usuários do auth, faça manualmente via Supabase
-- Dashboard ou SQL direto em auth.users (fora do escopo de migrations versionadas).
