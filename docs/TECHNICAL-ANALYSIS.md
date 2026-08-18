# 🔍 ANÁLISE TÉCNICA COMPLETA — Dependências, Blast Radius & Execução

**Data:** 2026-08-17 | **Versão:** 1.0 | **Estado:** PRD-00/01/02 Consolidados

---

## 📊 TABELA 1: ESTADO ATUAL (FASE 0)

### Stack
```
Frontend/Backend:  Next.js 14.2.3 (App Router)
Database:          Supabase (PostgreSQL) — sem migrations versionadas
Auth:              Supabase Auth + RLS
IA:                Anthropic Claude Haiku
PDF:               Browser print + iframe
```

### Módulos Funcionais
| Módulo | Status | Tenant | Isolamento |
|--------|--------|--------|------------|
| Propostas (6 etapas, edit, duplicate) | ✅ | Single | Sim (RLS browser) |
| Blocos + Editor + IA | ✅ | Single | Sim (RLS browser) |
| Templates | ✅ | Single | Sim (RLS browser) |
| Aceite Online (`p/[token]`) | ✅ | Single | Sim (public token) |
| Admin (produtos, usuários, config) | ✅ | Single | Sim (requireAdmin) |
| Follow-up Radar | ✅ | Single | Sim (RLS browser) |

### Banco de Dados — Tabelas Top-Level
```
organization          — NÃO EXISTE (será criada)
profiles              — sem organization_id ainda
company_settings      — singleton global (não isolada)
proposal              — sem organization_id ainda
clients               — sem organization_id ainda
product, category     — compartilhados entre usuários
price_table           — compartilhado
proposal_template     — compartilhado (is_default global!)
content_library       — compartilhado
```

### Clientes Supabase
| Client | Context | RLS | Breaking Potential |
|--------|---------|-----|-------------------|
| `createClient()` (server) | SSR, middleware | ✅ Respeita | Baixo (adicionar org_id não quebra) |
| `createClient()` (browser) | Components | ✅ Respeita | Baixo (default org_id fecha) |
| `createAdminClient()` | APIs, rotas admin | ❌ Bypassa | **ALTO** (precisa filtro explícito) |

---

## 🔗 TABELA 2: DEPENDÊNCIAS ENTRE PRDs

```
PRD-00 (Fundação)
  └── Pré-requisito: dívidas D1 (migrations), D5 (types) criadas

PRD-01 (Motor de Fechamento)
  ├── Depende de: PRD-00 OK + A1 (sync schema) + A5 (types tipadas)
  ├── Entrega: sent_at, radar follow-up, audit trail, guard status
  └── Bloqueante: A6 (layout da empresa) requer isolamento multi-tenant
          ⇒ PRD-02 deve ser feito ANTES de A6 rodar em produção

PRD-02 (Multi-tenant SaaS) ⭐ **BLOQUEANTE**
  ├── Depende de: PRD-01 A1/A5 (schema e types OK)
  ├── Fases 1-6: expand → migrate → contract (estratégia segura)
  └── Libera: A6 (layout), novas orgs self-service, rotas públicas

PRD-03 (PDF Sections Control) — A DEFINIR
  ├── Depende de: PRD-02 completa (Fase 6)
  ├── Escopo: toggle blocos, preview realtime no PDF
  └── Impacto: componentes frontend (BlockEditor, ProposalPreview), nenhuma mudança DB
```

### Diagrama de Dependências
```
Phase 0          Phase 1          Phase 2            Phase 3
(Initial)        (Follow-up)      (Multi-tenant)     (PDF UI)
   |                 |                 |                |
   v                 v                 v                v
PRD-00 ──┬─────→ PRD-01 ──┬─────→ PRD-02 ──────────→ PRD-03
         │              │            ├─ Fases 1-6
         │              └─ A1,A5     └─ Expand/Migrate/Contract
         └─ D1,D2,D5
```

---

## 💥 TABELA 3: BLAST RADIUS POR CAMADA

### 🗄️ **Database Layer**

| Tabela | Mudança | Risco | Breaking | Fase |
|--------|---------|-------|----------|------|
| organization | CREATE nova | Baixo | Não | PRD-02/F1 |
| profiles | ADD organization_id | **ALTO** | SIM → trigger handle_new_user | PRD-02/F1 |
| company_settings | ADD organization_id | **ALTO** | SIM → unique(org), limit(1) → limit(1)+org | PRD-02/F1 |
| proposal | ADD organization_id | **ALTO** | SIM → default + RLS | PRD-02/F1 |
| clients | ADD organization_id | **ALTO** | SIM → default + RLS | PRD-02/F1 |
| product | ADD organization_id | **ALTO** | SIM → unique(org,slug), default | PRD-02/F1 |
| category | ADD organization_id | Médio | Talvez → unique(org,slug) | PRD-02/F1 |
| price_table | ADD organization_id | Médio | SIM → default + RLS | PRD-02/F1 |
| proposal_template | ADD organization_id | **ALTO** | SIM → unique(org, is_default), default | PRD-02/F1 |
| content_library | ADD organization_id | Médio | SIM → default + RLS | PRD-02/F1 |
| proposal_analytics | FILHA | Baixo | Não (herda via FK) | PRD-02/F1 |
| proposal_block | FILHA | Baixo | Não (herda via FK) | PRD-02/F1 |
| proposal_product | FILHA | Baixo | Não (herda via FK) | PRD-02/F1 |

**Estratégia:** Expand (add nullable) → Migrate (backfill + NOT NULL) → Contract (RLS + defaults).

---

### 🔌 **API Layer (Service-Role Clients)**

| Rota | Mudança | Risco | Consumidores |
|------|---------|-------|-------------|
| `/api/ai/text` | Add `orgId` filter em company_settings | Médio | ProposalForm, BlockEditor |
| `/api/proposals/[id]/blocks/[blockId]/ai` | Add `orgId` filter em settings + proposal | Médio | BlockEditor |
| `/api/proposals/[id]/publish` | Add `orgId` guard em proposta | Médio | PublishButton |
| `/api/proposals/[id]/share` | Add `orgId` guard em proposta | Médio | ShareButton |
| `/api/proposals/[id]/opportunity` | Add `orgId` guard em proposta | Médio | OppDialog |
| `/api/p/[token]/decision` | Resolve org from proposta token | **ALTO** | Link público (Fase 4) |
| `/api/p/[token]/pdf` | Resolve org from proposta token | **ALTO** | Link público (Fase 4) |
| `/api/p/[token]/analytics` | Resolve org from proposta token | **ALTO** | Link público (Fase 4) |
| `/api/admin/users` | Add `orgId` on create | Médio | UserDialog |
| `/api/templates/*` | Add `orgId` filters (esp. is_default) | **ALTO** | TemplateSelector |
| `/api/clients/search` | Add `orgId` filter | Médio | ClientSearch |

**Padrão:** Antes de mutation/read, extrair `orgId` via `getSessionOrgId()` (RLS) ou resolver de proposta (token público). Aplicar `.eq('organization_id', orgId)` em TODA query.

---

### 🎨 **Frontend Layer (Browser/RLS Clients)**

| Componente | Mudança | Impacto |
|------------|---------|--------|
| ProposalForm | Zero (RLS + default org_id) | Nenhum |
| ProposalTable | Zero (RLS filtra) | Nenhum |
| BlockEditor | Zero (RLS filtra) | Nenhum |
| ProductForm, ProductTable | Zero (RLS filtra) | Nenhum |
| PriceTableEditor | Zero (RLS filtra) | Nenhum |
| CategoryManager | Zero (RLS filtra) | Nenhum |
| ContentLibraryManager | Zero (RLS filtra) | Nenhum |
| CompanySettingsForm | ADD logo upload path prefix org | Baixo (Fase 5) |
| TemplateEditor | ADD cover upload path prefix org | Baixo (Fase 5) |
| ProposalPreview | Zero (serve blocos já isolados) | Nenhum |

**Padrão:** RLS + default `current_org_id()` = nenhum código quebra no browser.

---

### 📱 **Integrações**

| Integração | Status | PRD | Impacto |
|------------|--------|-----|--------|
| RD Station (CRM) | Read-only, data in from link | PRD-01 | Nenhum (sem escrita) |
| Anthropic (IA) | Via `/api/ai/text` | PRD-01 | Isolado por org (Fase 2) |
| Storage (Assets) | Logo, cover, exports | PRD-02 | Prefixo org (Fase 5) ✅ |
| Email (futuro) | Notificações | Pós-PRD-02 | Escopo org |
| WhatsApp (futuro) | Follow-up nudge | PRD-01 | Escopo org |

---

## ⚠️ TABELA 4: RISCOS & BREAKING CHANGES

### Identificados (PRD-02, R1-R10)

| # | Risco | Severidade | Fase | Mitigação |
|---|-------|-----------|------|-----------|
| **R1** | `is_default` global → desmarca default de OUTRAS orgs | **ALTA** | 2 | Unique `(org, is_default)` + `.eq('org', id)` |
| **R2** | `company_settings` `.limit(1)` retorna linha errada | **ALTA** | 2 | Adicionar `.eq('org', id)` + única por org |
| **R3** | Trigger `handle_new_user` quebra → novo user sem org | **ALTA** | 1 | Atualizar trigger na MESMA migration |
| **R4** | `product.slug` único global → conflito 2ª org | Média | 1 | Unique `(org, slug)` |
| **R5** | `category.slug` único global | Média | 1 | Unique `(org, slug)` |
| **R6** | RLS de profiles permite autoelevação de privilégio | **ALTA (seg)** | 1 | `with check (role = old.role OR admin)` |
| **R7** | `admin_list_users` sem filtro org | **ALTA** | 1 | Reescrever com `where org_id = current` |
| **R8** | Storage `assets` sem org prefix → sobrescrita | Média | 5 | Prefixo `{org}/` em paths |
| **R9** | Types desatualizados (database.types.ts) | Média | 2/6 | Regenerar via CLI / tipar admin client |
| **R10** | `company_settings` múltiplas linhas hoje | Média | 1 | Contar, dedupe, aplicar unique(org) |

### Estratégia Expand-Migrate-Contract

```
EXPAND (semana 1):
  ├─ CREATE organization table
  ├─ ADD organization_id (nullable) a todas tabelas
  ├─ CREATE RLS policies (scoped)
  ├─ UPDATE trigger handle_new_user v1 (org raiz)
  └─ Sistema: 100% funcional, dados na org raiz

MIGRATE (semana 2):
  ├─ BACKFILL todos registros → org raiz
  ├─ ALTER organization_id NOT NULL
  ├─ ADD constraints (unique, FK, index)
  └─ Sistema: 100% funcional, org raiz completa

CONTRACT (semanas 3+):
  ├─ Isolamento service-role (Fase 2)
  ├─ Self-service org (Fase 3)
  ├─ Rotas públicas (Fase 4)
  └─ Storage org-scoped (Fase 5)
```

**Propriedade:** Em CADA estágio, sistema é 100% funcional e deployável.

---

## 📋 TABELA 5: ORDEM DE EXECUÇÃO (PHASES)

### FASE 0-CURRENT: ESTADO ATUAL (Snapshot)

**Objetivo:** Limpar git, documentar, tagear v0.0.0.

- [ ] Reorganizar `docs/`
- [ ] Atualizar PROGRESS.md
- [ ] Criar tag `v0.0.0`
- [ ] Criar este documento (TECHNICAL-ANALYSIS.md)

**Arquivos afetados:** docs/ (não quebra nada)
**Critérios de conclusão:** Git limpo, docs consolidadas, v0.0.0 tagged

---

### FASE 1-A: PRD-01 A1/A5 (Sync Schema + Types)

**Objetivo:** Migrations versionadas + database.types.ts atualizado.

**PRD-01 Items:** A1 (schema sync), A5 (tipar admin client)

**Mudanças necessárias:**
```
1. supabase/migrations/0001_baseline.sql
   ├─ CREATE all tables (proposal_analytics, etc.)
   ├─ ADD columns (sent_at, followup_days, opportunity_status, etc.)
   ├─ CREATE functions (current_org_id() — NÃO EXECUTAR AINDA)
   └─ Nota: organization_id vira na FASE 2

2. database.types.ts (regenerado)
   └─ Tipagem completa com novo schema

3. src/lib/supabase/admin.ts
   └─ Tipar com <Database>
```

**Arquivos afetados:** `supabase/migrations/0001_baseline.sql`, `database.types.ts`, `src/lib/supabase/admin.ts`

**Testes:**
- [ ] `npm run build` + `npx tsc --noEmit` limpo
- [ ] `createAdminClient()` não reclama de tipos

**Critérios de conclusão:**
- Build limpo
- Types sincronizados com schema

**Rollback:** `git revert` (nenhuma mudança DB em produção)

---

### FASE 1-B: PRD-01 A2-A6 (Motor de Fechamento)

**Objetivo:** Follow-up radar, audit trail, guard status, layout empresa.

**PRD-01 Items:** A2, A3, A4, A6, T1

**Mudanças necessárias:**
```
1. Database (migrations 0002...)
   ├─ sent_at + followup_days columns (já em A1)
   ├─ Índices em proposal.created_at, proposal.sent_at
   └─ Nada ainda com organization_id

2. Backend (src/lib/followup.ts)
   ├─ isStalled(sent_at, days)
   ├─ daysStalled(sent_at)
   └─ buildWhatsAppNudgeUrl(token, phone, days)

3. Frontend (ProposalTable, Dashboard)
   ├─ Column "Parada há X dias"
   ├─ WhatsApp nudge button
   └─ Dashboard stat "Paradas"

4. SQL (audit trail)
   ├─ proposal_event.metadata JSON
   ├─ ip_address, user_agent capture
   └─ decision/route.ts persiste

5. SQL (guard status)
   ├─ decision/route.ts verifica status='sent'
   └─ 409 se não enviada

6. Content (A6 — Layout da empresa)
   ├─ company_settings.company_about
   ├─ product.commercial_conditions
   ├─ proposal.commercial_conditions
   └─ Template padrão seed (TODO: após PRD-02)
```

**Arquivos afetados:**
- `supabase/migrations/` (0002, 0003...)
- `src/lib/followup.ts` (novo)
- `src/lib/followup.test.ts` (novo, vitest)
- `src/app/api/proposals/[id]/publish/route.ts`
- `src/app/api/proposals/[id]/share/route.ts`
- `src/app/api/p/[token]/decision/route.ts`
- `src/components/proposal/ProposalTable.tsx`
- `src/app/dashboard/page.tsx`

**Testes:**
- [ ] `npm test` — 21+ testes em `followup.test.ts`
- [ ] E2E manual: proposta enviada → parada em 3 dias → radar mostra
- [ ] Audit trail: IP + UA capturados no decision
- [ ] Guard: decisão rejeitada se `status != 'sent'`

**Critérios de conclusão:**
- Tests passing
- E2E manual validado
- Git limpo (sem debug commits)

**Rollback:** `git revert` (migrations podem ser dropadas se não aplicadas em prod)

---

### FASE 2: PRD-02 (Multi-Tenant SaaS)

**Objetivo:** Isolamento por organização. 6 sub-fases (expand → migrate → contract).

**Dependência:** FASE 1-A completa (types sincronizados)

**Estrutura:**

```
Fase 2.0: Pré-flight (leitura)
  └─ Capturar estado atual (handle_new_user, RLS, storage policies)

Fase 2.1: Fundação DB (EXPAND)
  ├─ CREATE organization table
  ├─ ADD organization_id (nullable) + RLS
  ├─ CREATE current_org_id() function
  ├─ UPDATE trigger handle_new_user v1
  └─ Sistema funcional, tudo na org raiz

Fase 2.2: Contratos (backend)
  ├─ src/lib/org.ts (getUserOrgId, requireOrg)
  ├─ 11 rotas API escopadas por org
  ├─ Review de grep (zero org_id sem .eq check)
  └─ Nenhuma mudança frontend

Fase 2.3: Lógica (self-service)
  ├─ signup com "Empresa" field
  ├─ trigger handle_new_user v2
  ├─ criar organization + template padrão + settings
  └─ Novo user → org própria + admin

Fase 2.4: Consumidores (rotas públicas)
  ├─ p/[token] resolve org from proposta
  ├─ company_settings escopado
  ├─ PDF + decision isolados
  └─ Link público renderiza marca certa

Fase 2.5: Integrações (storage)
  ├─ Prefixo {org}/ em logo/cover
  ├─ CompanySettingsForm, TemplateEditor
  └─ Status: ✅ JÁ FEITA

Fase 2.6: Cleanup
  ├─ database.types.ts (com organization)
  ├─ tsc + build
  ├─ E2E manual: 2 orgs sem cruzamento
  └─ Status: ✅ JÁ FEITA
```

**Arquivos por fase:** (vide PRD-02 "Fases de execução")

**Testes/Validação:**
- [ ] Build limpo
- [ ] Grep: nenhum `.limit(1).maybeSingle()` sem org filter
- [ ] E2E: 2+ orgs coexistem sem vazamento
- [ ] Link público: logo/branding isolados

**Critérios de conclusão:** ✅ PRD-02 diz "EXECUTADO E VALIDADO (Fases 0–6; e2e manual concluído 2026-08-15)"

**Rollback:** Git revert (DB migrations podem ser dropadas)

---

### FASE 3-FUTURE: PRD-03+ (PDF Sections, etc.)

**A definir após PRD-02 validado em produção.**

---

## 🎯 TABELA 6: CHECKLIST DE EXECUÇÃO

### FASE 0 (Esta Semana)

- [ ] Ler este documento (TECHNICAL-ANALYSIS.md)
- [ ] Aprovar ordem de fases
- [ ] Reorganizar docs/ (PHASES.md, INDEX.md)
- [ ] Atualizar PROGRESS.md
- [ ] Tag v0.0.0 + branch versioning
- [ ] Criar PRD-03 template

### FASE 1-A (Week 1)

- [ ] Criar `supabase/migrations/0001_baseline.sql` (completo, idempotente)
- [ ] Regenerar `database.types.ts`
- [ ] Tipar `createAdminClient`
- [ ] `npm run build` + `tsc` limpo
- [ ] Commit + tag v0.1.0-rc1

### FASE 1-B (Week 2-3)

- [ ] Implementar follow-up radar (src/lib/followup.ts + testes)
- [ ] Audit trail (decision/route.ts)
- [ ] Guard status
- [ ] A6 content schema (não implementar UI ainda)
- [ ] `npm test` passando
- [ ] E2E manual
- [ ] Commit + tag v0.1.0

### FASE 2 (Week 4-6)

- [ ] 2.0: Pré-flight (SQL editor leitura)
- [ ] 2.1: Fundação DB (migrations, RLS, trigger v1)
- [ ] 2.2: Contratos (src/lib/org.ts, rotas API)
- [ ] 2.3: Lógica (signup, trigger v2)
- [ ] 2.4: Rotas públicas
- [ ] 2.5: Storage (JÁ FEITA)
- [ ] 2.6: Cleanup + E2E
- [ ] Commit + tag v1.0.0

### FASE 3+ (After v1.0)

- [ ] Define PRD-03 (PDF Sections, etc.)
- [ ] Roadmap 2026-Q4+

---

## 🚨 NOTAS CRÍTICAS

1. **FASE 1-A é bloqueante:** tipos desincronizados quebram PRD-02.
2. **FASE 2 é bloqueante para multi-tenant:** sem isolamento, cada novo customer vê dados de outros.
3. **Expand-Migrate-Contract:** cada estágio mantém sistema funcional — nada de "wait for next phase to work".
4. **Git: um commit por fase** (ou sub-fase se grande). Tags de versão claras.
5. **Testes: obrigatório.** Sem cobertura, migração falha em produção.
6. **Documentação: atualizar PRDs após cada fase** (status, achados, decisões).

---

**Próximo passo:** Sua aprovação desta ordem antes de executar FASE 0.
