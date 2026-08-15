# PRD-02 — Multi-tenant SaaS (branding/isolamento por organização)

- **Status:** EXECUTADO (Fases 0–6 implementadas; validação e2e manual pendente) — sequenciamento aprovado em 2026-08-14
- **Fonte:** decisão do dono (cada cliente usa textos, cores, logos, produtos e clientes próprios; base sólida para muitos clientes) + PROGRESS.md "Decisões em aberto"
- **Depende de:** [PRD-01](PRD-01-fase-1-motor-de-fechamento.md) (Fase 1 roda single-org; A6 *layout da empresa* depende do isolamento por org — coordenar landing de A6 com Fase 2+ deste PRD)
- **Última atualização:** 2026-08-15

---

## Problema

O sistema é single-tenant de fato: `company_settings` tem UMA linha global, catálogo
(produtos/preços/categorias/biblioteca/templates) é compartilhado, e qualquer usuário
autenticado lê/escreve tudo. Para vender como SaaS (muitos clientes, cada um com sua
marca), é necessário isolar por **organização** sem perder o que já existe.

**Requisito central (confirmado pelo dono):** cada organização tem seus próprios
textos, cores, logos, produtos e clientes. Novo cadastro cria a própria organização.

## Descobertas da análise (baseline, 2026-08-14)

### Modelo de acesso atual — 3 clients

| Client | Arquivo | Papel | RLS |
|---|---|---|---|
| SSR anon+cookies | `src/lib/supabase/server.ts` | rotas/páginas autenticadas | ✅ respeita RLS |
| Service role | `src/lib/supabase/admin.ts` | rotas admin + rotas públicas `p/[token]` | ❌ **bypassa RLS** — exige filtro explícito por org |
| Browser anon | `src/lib/supabase/client.ts` | componentes client | ✅ respeita RLS |

**Descoberta crítica:** TODAS as escritas do dashboard (propostas, clientes, produtos,
preços, categorias, biblioteca, blocos, eventos, `company_settings`) passam pelo
**browser client (RLS)** em ~17 componentes. Apenas rotas admin/API usam service role.
⇒ Se as políticas RLS forem org-scoped e houver um **default `current_org_id()`** na
coluna `organization_id`, **nenhum componente de escrita muda de código**.

### Tabelas no banco vivo (fonte de verdade; sem supabase CLI — SQL manual)

Top-level (ganham coluna `organization_id`): `profiles`, `company_settings`, `clients`,
`product`, `category`, `price_table`, `content_library`, `proposal_template`, `proposal`.
+ nova tabela `organization`.

Filhas (NÃO ganham coluna — herdam org via FK + subquery RLS): `product_benefit`,
`product_scope`, `product_faq`, `product_differential`, `price_table_item`,
`template_block`, `proposal_product`, `proposal_block`, `proposal_event`,
`proposal_analytics`.

### Ponto de escritura por layer

- **Service-role (exigirá org explícito):** `api/templates/route.ts`, `api/templates/[id]/route.ts`, `api/templates/[id]/blocks/route.ts`, `api/ai/text/route.ts`, `api/proposals/[id]/blocks/[blockId]/ai/route.ts`, `api/clients/search/route.ts`, `api/admin/users/route.ts`, `api/proposals/[id]/publish|share|opportunity/route.ts`, `api/p/[token]/pdf|decision|analytics|update-request/route.ts`, `src/app/p/[token]/page.tsx`, páginas `dashboard/admin/templates(+[id])`, `dashboard/admin/conteudo`, `dashboard/propostas/[id](-blocos/-preview/-preview-web)`.
- **Browser/RLS (sem mudança, via default + políticas):** `ProposalForm`, `ProposalTable`, `ProposalWorkspace`, `BlockEditor`, `lib/blocks.ts`, `ProductForm`, `ProductTable`, `PriceTableEditor`, `PriceTablesClient`, `SortableListEditor`, `SortableFaqEditor`, `CategoryManager`, `ContentLibraryManager`, `BibliotecaPage`, `DeleteProductButton`, `CompanySettingsForm`, `Step3Products`.

### Riscos / breaking changes identificados

| # | Risco | Severidade | Onde entra |
|---|---|---|---|
| R1 | `is_default` de `proposal_template` é global: `update(...).eq('is_default', true)` no service-role desmarca default de OUTRAS orgs (vazamento cross-tenant) | **Alta** | Fase 2 |
| R2 | `company_settings` com `.limit(1)` via service-role retorna linha errada quando existir >1 org | **Alta** | Fase 2/4 |
| R3 | `profiles.organization_id NOT NULL` sem atualizar trigger `handle_new_user` quebra cadastro de novos usuários | **Alta** | Fase 1 (mesmo migration) |
| R4 | `product.slug` único global → 2ª org não pode reusar `nr1` | Média | Fase 1 |
| R5 | `category.slug`/outros únicos globais (verificar na Fase 0) | Média | Fase 1 |
| R6 | RBAC aplicado só em camada de app (`requireAdmin`); RLS de `profiles` permite qualquer usuário da org editar role (escalada de privilégio) | **Alta (segurança)** | Fase 1 (políticas) |
| R7 | `admin_list_users` existe só no banco vivo (não no repo) e é `security definer` sem filtro de org | **Alta** | Fase 0 (capturar assinatura) + Fase 1 (reescrever) |
| R8 | Storage `assets` sem prefixo de org → upload de org B pode sobrescrever arquivo de org A (logo/cover) | Média | Fase 5 |
| R9 | Tipos `database.types.ts` desatualizados (sem `category`, `proposal_analytics`, `public_token`, `rd_lead_id`, `opportunity_status`, etc.); clients sem `<Database>` | Média | Fase 6 (e A1/A5 do PRD-01) |
| R10 | `company_settings` pode ter >1 linha na raiz hoje (padrão `.limit(1)`) → unique(org) falha no backfill | Média | Fase 0 (contagem) |

### Não-impactados (verificado)

- **RD Station:** `src/lib/rdstation.ts` é read-only externo (API do CRM). Cliente de RD entra via `ProposalForm` (browser/RLS). Sem escrita service-role ⇒ sem risco de tenant.
- **Auth/middleware:** `middleware.ts` só renova sessão — sem lógica de org.
- **`proposal_analytics`:** só recebe insert via service-role (filha de `proposal`). Sem coluna de org.
- **`proposal_product`/`proposal_block`:** filhas; snapshot/jsonb não expõem org.

## Estratégia expand → migrate → contract

1. **Expand:** adicionar `organization` + colunas `organization_id` (nullable) + RLS org-scoped. Sistema inteiro continua single-org na prática (todos os dados → org raiz). Nenhum código quebra.
2. **Migrate:** backfill de todos os registros existentes para a org raiz; `NOT NULL`; constraints escopadas (`(organization_id, slug)` etc.); trigger v1 (novo usuário → org raiz, comportamento de hoje).
3. **Contract:** isolamento service-role (Fase 2), signup self-service (Fase 3), rotas públicas (Fase 4), storage por org (Fase 5). Em cada ponto o sistema permanece 100% funcional para a org raiz e compatível retroativo.

---

## Fases de execução (cada fase termina funcional/testável/deployável)

### Fase 0 — Pré-flight (read-only, ~30min)

Verificações no SQL editor do Supabase (sem alterar nada):
- Capturar definição atual de `handle_new_user`, `admin_list_users`, políticas de RLS existentes, policies do bucket `assets`.
- Contar linhas de `company_settings` (risco R10), conferir constraints únicas globais em `product.slug`/`category.slug`/`proposal_template.slug` (R4/R5).
- Registrar snapshot para rollback.

**Arquivos:** nenhum (só leitura). **Validação:** lista de achados documentada. **Conclusão:** conhecer assinatura do RPC e constraints reais. **Rollback:** N/A.

### Fase 1 — Fundação (banco de dados) — *expand+migrate*

Novo arquivo `supabase-multi-tenant.sql` na raiz (idempotente, estilo dos `.sql` existentes):

1. `create table public.organization (id uuid pk default uuid_generate_v4(), name text not null, created_by uuid references profiles(id), created_at timestamptz default now())`.
2. `create or replace function public.current_org_id() returns uuid language sql stable security definer set search_path = public as $$ select organization_id from public.profiles where id = auth.uid() $$;`
   - security definer: evita recursão de RLS no próprio select de profiles.
3. `profiles`: add `organization_id uuid` nullable → backfill `(select id from organization limit 1)` → `NOT NULL` + FK + index.
4. Top-level tables (R2 lista): add `organization_id uuid default public.current_org_id()` nullable → backfill raiz → `NOT NULL` + FK + index.
   - **Default `current_org_id()`** é o coração do `contract`: inserts via browser client não mudam (R6-não-aplica: default preenche com a org da sessão e `with check` passa).
5. Trigger `handle_new_user` v1 (comportamento atual preservado): novo usuário → perfil `seller` na **org raiz** (`select id from organization order by created_at limit 1`). Necessário na MESMA migration (R3). A criação de org própria vira só na Fase 3.
6. RLS — drop `auth all`/`auth read own profile` e recriar:
   - Top-level: `for all to authenticated using (organization_id = current_org_id()) with check (organization_id = current_org_id())`.
   - Filhas: `for all to authenticated using (parent FK in (select id from parent where organization_id = current_org_id())) with check (mesmo)`.
   - `profiles`: select `(organization_id = current_org_id() or id = auth.uid())`; update `(organization_id = current_org_id())` + **`with check` exigindo `role` igual ao anterior OU usuário é admin da org** (fecha R6); insert `with check (id = auth.uid())`.
7. Constraints: drop unique global `product.slug` → `unique (organization_id, slug)`; idem para `category.slug`/`proposal_template.slug` se existirem (R4/R5); `company_settings` `unique (organization_id)` (após dedupe, R10); opcional: partial unique `(organization_id) where is_default` em `proposal_template`.
8. Reescrita de `admin_list_users` org-scoped (assinatura capturada na Fase 0), `security definer`, com `where p.organization_id = current_org_id()`.

**Arquivos:** `supabase-multi-tenant.sql` (novo). **Código app: nenhuma mudança.**
**Testes/validação:** login seed funciona; criar proposta; páginas admin; novo cadastro cai na org raiz; SQL anônimo (RLS) não lê `clients`/`product`.
**Conclusão:** sistema funciona idêntico, já isolado por org (só existe a raiz). **Rollback:** SQL reverso (drop colunas/policies/org) ou restore de snapshot.

### Fase 2 — Contratos (isolamento service-role)

Novo `src/lib/org.ts`: `getUserOrgId()` (via `createClient`/RLS) e helper `requireOrg()` para rotas API. Aplicar nos arquivos service-role:

- `company_settings`: trocar `.limit(1).maybeSingle()` por `.eq('organization_id', orgId)` em `api/ai/text`, `api/proposals/[id]/blocks/[blockId]/ai`, `dashboard/propostas/[id](-preview/-preview-web)`, `dashboard/admin/templates/*`.
- `proposal_template`: escopar leituras (`templates`, `[id]`, `conteudo`) e TODOS os updates de `is_default` por `.eq('organization_id', orgId)` (R1).
- `clients/search` e `admin/users` (write): filtrar por org; `admin/users` grava `organization_id` = org do invocador.
- `publish/share/opportunity`: leitura da proposta escopada por org; eventos (filhas) sem mudança.

**Arquivos:** `src/lib/org.ts` (novo) + ~11 rotas + 4 páginas. **UX: zero mudança.**
**Testes:** rotas admin retornam os mesmos dados (só existe raiz); review de diff garante que nenhum `.eq` de org falta (grep).
**Conclusão:** nenhum path service-role acessa dado de outra org. **Rollback:** `git revert` dos commits (DB intocado).

### Fase 3 — Lógica (self-service de organização)

- `src/app/cadastro/page.tsx`: novo campo "Empresa" → `signUp({ options: { data: { full_name, company_name } } })`.
- Trigger `handle_new_user` v2: cria `organization (name = company_name || full_name)`, perfil `admin` + org, linha de `company_settings (organization_id, company_name)`, template padrão genérico da org.

**Arquivos:** `cadastro/page.tsx` + SQL (trigger v2). **Testes:** cadastro novo → dashboard vazio isolado, role admin, settings próprias; cadastro antigo intocado.
**Conclusão:** 2+ orgs reais coexistindo sem vazamento. **Rollback:** reverter trigger para v1 + reverter página.

### Fase 4 — Consumidores (rotas públicas `p/[token]`)

Resolver org a partir da proposta: `select organization_id from proposal where public_token = X` → então `company_settings` com `.eq('organization_id', org)`. Aplicar em `src/app/p/[token]/page.tsx`, `api/p/[token]/pdf|decision|analytics|update-request`. Updates top-level em `decision` ganham `.eq('organization_id', org)` (defesa em profundidade).

**Arquivos:** 6 (página + 5 rotas). **Testes:** link de proposta da org B renderiza branding B; org A segue igual; 404 se token não existe.
**Conclusão:** pública nunca lê branding errado. **Rollback:** git revert.

### Fase 5 — Integrações (storage por org)

Prefixar paths do bucket `assets` com org: `CompanySettingsForm` (`{org}/company/logo.{ext}`) e `TemplateEditor` (`{org}/templates/{templateId}/cover-image.{ext}`), obtendo org via profile do usuário logado. Opcional: política de storage limitando escrita a `{auth.uid()→org}/`.

**Arquivos:** `CompanySettingsForm.tsx`, `TemplateEditor.tsx`, helper client de org. **Testes:** upload de logo/cover em org B cai em path de B. **Rollback:** git revert.

**Status (2026-08-15): ✅ executada.** `supabase-multi-tenant-fase5.sql` aplicado e verificado via `pg_policies` (4 policies `assets_org_*` ativas). Policies legadas permissivas (`assets_insert`/`assets_update`/`assets_select`) removidas — sem elas o OR combinaria e anularia o isolamento. Paths org-prefixados confirmados no bucket (`<org>/company`, `<org>/templates`); dados legados permanecem na raiz.

### Fase 6 — Cleanup e validação end-to-end

- Atualizar `database.types.ts` (tabela `organization`, colunas `organization_id`, e drifts conhecidos R9). Alinhar com A1/A5 do PRD-01 (tipar `createAdminClient`).
- `npx tsc --noEmit` e `npm run build`.
- Teste end-to-end manual: org raiz (dados antigos) × org nova (cadastro) — produtos/clientes/propostas/templates/branding/PDF/link público isolados.
- Atualizar `docs/progress/PROGRESS.md` (marcar decisão multi-tenant; fechar Fase 2) e `docs/prds/PRD-02` (status).

**Arquivos:** `database.types.ts`, `PROGRESS.md`. **Validação:** build limpo + roteiro manual. **Rollback:** git revert.

**Status (2026-08-15): ✅ parcial.** `database.types.ts` regenerado via `scripts/gen-types.mjs` (dump OpenAPI vivo), `createAdminClient` tipado com `<Database>` (R9/A5), `npx tsc --noEmit` e `npm run build` limpos. **⏳ Pendente:** teste e2e manual (org raiz × org nova) e roteiro de validação visual.

---

## Ordem de dependências (mapa do PRD)

```
org table + current_org_id() + colunas + RLS  (Fase 1, fundação)
   └─► helper org (Fase 2, contratos)
         ├─► is_default / company_settings / admin API  (Fase 2)
         └─► signup trigger v2 + cadastro  (Fase 3, lógica)
              └─► rotas públicas p/[token]  (Fase 4, consumidores)
                   └─► storage por org  (Fase 5, integrações)
                        └─► types + validação  (Fase 6, cleanup)
```

## Critérios de sucesso

- Dois cadastros independentes (org raiz + org nova) sem qualquer cruzamento de dados (produtos, clientes, propostas, templates, branding).
- Cadastro novo: role `admin`, `company_settings` própria, dashboard vazio.
- Link público e PDF usam a marca da org da proposta.
- Nenhum path service-role lê dado de outra org (review de grep).
- Build `tsc`/`next` limpo; PROGRESS.md atualizado.

## Fora de escopo

Billing (PRD-01), convite/convite de membros além de `admin/users`, multi-org por usuário (membership), UI de troca de org, migração de storage existente (arquivos antigos permanecem na raiz; só novos uploads são prefixados).
