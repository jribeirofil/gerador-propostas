# PROGRESS — Acompanhamento do projeto

Dashboard de fases e execução. Atualizar a cada mudança de status.

Última atualização: **2026-08-17**

> **Multi-tenant (15/08):** PRD-02 executado e validado — Fases 0–6 implementadas. Storage org-isolado
> (Fase 5: SQL aplicado, policies `assets_org_*` ativas, legadas permissivas removidas).
> `database.types.ts` regenerado do schema vivo, clients tipados, `tsc`+`build` limpos (Fase 6).
> E2E manual concluído: org nova por cadastro nasce isolada (dashboard/catálogo/branding vazios)
> e a org raiz segue íntegra (propostas, PDF e link público com a marca FineAndYou).
>
> **Radar de follow-up (15/08):** A2 implementado — `sent_at`+`followup_days` nas rotas publish/share,
> stat "Paradas" no dashboard, selo "Parada há N dias" + botão wa.me na tabela, N configurável por
> proposta (modal de publicar, default 3), threshold isolado em `src/lib/followup.ts` (pronto p/ T1).
> `tsc --noEmit` limpo. Pendente: E2E manual no ambiente vivo.
>
> **Audit trail + guard (15/08):** A3 e A4 implementados em `decision/route.ts` — decisões gravam IP +
> user-agent no `metadata` do evento; decisão só é aceita com `status='sent'` (409 caso contrário).
>
> **Prévia real (15/08):** passo Resumo renderiza o documento antes de gerar (`buildProposalBody` + blocos
> `assembleBlocks`, `22b92bf`). Correção de reatividade: `template_id` não era watcheado e `setValue` em campo
> não-registrado não re-renderizava o form (filtro do subscriber raiz do RHF) — `Step6Review` agora consome
> `useWatch({ control })` e a prévia atualiza em tempo real em qualquer mudança de valor (`9b2f6e9`). Validado
> E2E manual bidirecional (Automático/Canal ↔ Teste).

> **Organizações isoladas com CNPJ (17/08):** Preparação para marketplace públi — validação por CNPJ obrigatório
> previne duplicação (múltiplos colaboradores não criam mesma empresa 2x). Fluxo: signup individual → dashboard
> → "Criar empresa" (CNPJ único) → template padrão + user=admin. Migration 0008 com trigger `handle_new_user`
> recriada para admin role + template auto-criado. Testado em local com signup flow: novo usuário → role=admin ✅,
> template "Padrão" criado ✅, 9 blocos presentes ✅.
>
> **Logo upload UX grid 2-colunas (17/08):** CompanySettingsForm.tsx refatorada — light + dark mode em cards
> separados lado a lado (grid `grid-cols-1 md:grid-cols-2`), preview maior (h-24), fundo claro/escuro no preview.
> Melhora visual e UX para upload de logos multi-tema.
>
> **Evidência de demanda (14/08):** cliente-alvo rejeitou o concorrente porque "gerava um layout lá e só";
> quer o layout da empresa (informações + conteúdo institucional + valor de investimento ao final).
> Vira o item **A6** e reforça o posicionamento "o layout é da SUA empresa". Detalhe no PRD-01.
>
> **Identidade (14/08):** "FineAndYou" é o primeiro cliente **piloto**, não o nome do sistema (ainda sem nome).
> O produto é **horizontal/agnóstico de segmento** — agências, painéis de LED, rodízio de pizza, etc.
> Branding por empresa é requisito central; remover hardcodes da marca (28 ocorrências em 17 arquivos).

---

## Fases

| Fase | Nome | PRD | Status | Nota |
|---|---|---|---|---|
| 0 | Fundação (initial commit) | [PRD-00](../prds/PRD-00-fase-0-fundacao.md) | ✅ Concluída | Baseline: estado atual consolidado em 1 commit |
| 1 | Motor de Fechamento | [PRD-01](../prds/PRD-01-fase-1-motor-de-fechamento.md) | ✅ Concluída (A1-A6, T1 + e2e manual) | Sync schema, radar follow-up, auditoria, guard status, layout empresa, testes |
| 2 | Multi-tenant SaaS | [PRD-02](../prds/PRD-02-multi-tenant-saas.md) | ✅ Concluída (Fases 0–6 + e2e manual) | Branding/isolamento por organização; storage org-scoped; types regenerados |

## Fase 1 — Motor de Fechamento (execução)

### Escopo técnico (execution plan travado)

- [x] **A1 — Sync de schema** (15/08)
  - [x] Migration versionada e idempotente do banco vivo — `supabase/migrations/0001_baseline.sql` (21 tabelas, RLS org-scoped, funções, storage, seeds — reconstruído do OpenAPI do PostgREST + `database.types.ts` + `supabase-multi-tenant.sql`)
  - [x] `supabase/migrations/0002_add_sent_at.sql` — `sent_at` + `followup_days` (A2)
  - [x] `database.types.ts` atualizado manualmente (`sent_at`, `followup_days` — regeneração via `supabase gen types` pendente de CLI)
  - [x] Tipar `createAdminClient` com `<Database>` (A5)
  - [x] Verificar que `decision/route.ts` persiste token+timestamp
- [ ] **A2 — Radar de follow-up** *(implementado 15/08 — validação E2E pendente)*
  - [x] Coluna `sent_at timestamptz` + `followup_days` na migration `0002` (A1)
  - [x] `sent_at` gravado nas rotas `publish` (com `followup_days` do body) e `share` (draft/generated → sent)
  - [x] Dashboard: stat "Paradas" (sem resposta há +N dias) + grid 6 cards
  - [x] Tabela: selo "Parada há N dias" + botão "Lembrar por WhatsApp" (`wa.me` com link público `/p/{token}`)
  - [x] N default 3, configurável por proposta (campo no modal de publicar)
  - [x] `src/lib/followup.ts` — `isStalled`/`daysStalled`/`buildWhatsAppNudgeUrl` (função pura do threshold, pronta para T1)
  - [ ] Validação E2E manual no ambiente vivo
- [ ] **A3 — Audit trail do aceite** *(implementado 15/08 — validação E2E pendente)*
  - [x] IP (`cf-connecting-ip`/`x-forwarded-for`) + user-agent gravados no `metadata` dos eventos `opportunity_won`/`adjustments_requested`/`opportunity_lost`
- [ ] **A4 — Guard de status** *(implementado 15/08 — validação E2E pendente)*
  - [x] `decision/route.ts` recusa com 409 quando `status != 'sent'` ("Proposta não está aberta para decisão")
- [x] **T1 — Testes do radar** (função pura do threshold + vitest) *(15/08)*
  - [x] `vitest@4` instalado, script `npm test`/`test:watch`, `vitest.config.ts` (include `src/**/*.test.ts`)
  - [x] `src/lib/followup.test.ts` — 21 testes: `isStalled` (prazo/limite exato/decididas/não-enviadas/legado), `daysStalled` (floor, futuro), `buildWhatsAppNudgeUrl` (código país, máscara, não-duplica, encode) — ✅ 21 passed
- [x] **A6 — Layout da empresa** *(adicionado 2026-08-14 — evidência do cliente, concluído 15/08)*
  - [x] Remover hardcodes da marca (30 ocorrências em 17 arquivos — capa/PDF/login/APIs)
  - [x] Label dinâmico "Sobre a [empresa]" (preview web, documento e PDF)
  - [x] Contatos da empresa (site/e-mail/whatsapp) na capa, rodapé e PDF
  - [x] Fallbacks do PDF neutralizados (cenário não assume vertical saúde mental)
  - [x] Campo `company_about` em `company_settings` + leitura no documento (settings vence, bloco `sobre` é fallback legado) *(SQL aplicado e verificado em 15/08)*
  - [x] **Template padrão curado no banco (seed)** *(migration 0003 aplicada no Supabase em 15/08)*
    - [x] `supabase/migrations/0003_seed_default_template.sql` — template "Padrão" (id fixo `11111111-1111-1111-1111-111111111111`) para a org raiz, `is_default=true`, `product_slugs=[]`
    - [x] 9 `template_block` na ordem padrão: cover, solucao, beneficios, escopo, diferenciais, faq, proximos_passos (com 5 itens padrão), investimento, assinatura
    - [x] Aplicado no SQL Editor do Supabase — org raiz com template curado; novas propostas usam `resolveTemplate` → template id fixo

### Modelo de conteúdo da proposta (implementação 14/08)

Decisão e referência: [`docs/DECISOES-MODELO-DE-CONTEUDO.md`](../DECISOES-MODELO-DE-CONTEUDO.md). Base: padrão PandaDoc/Proposify/Qwilr + CPQ — catálogo de produtos é a fonte dos fatos; template é só estrutura.

- [x] **Seção Contexto removida** do documento (blocos `cenario`/`objetivos` fora do modelo)
- [x] **Fallbacks hardcoded removidos** (condições padrão "Sem taxa de setup...", próximos passos, texto "Com base no cenário...")
- [x] **Seção vazia → some** (próximos passos sem itens não renderiza)
- [x] **Condições comerciais**: hierarquia proposta → produto → empresa; pré-selecionadas no passo Condições (`commercial_conditions`)
- [x] **Etapa Diagnóstico removida do fluxo** (wizard: Cliente → Produtos → Preços → Condições → Resumo)
- [x] **"Sobre a empresa"** agora é config da organização (`company_about`), não bloco
- [x] **Prévia real no passo Resumo** (render do documento antes de gerar — `22b92bf`; reativa a mudanças de valores via `useWatch` — `9b2f6e9`)
- [x] SQL `add-model-content.sql` aplicado no Supabase (3 colunas: `company_settings.company_about`, `product.commercial_conditions`, `proposal.commercial_conditions` — verificado via API em 15/08)

### Checklist pré-cobrança (antes de features novas)

- [ ] Verificar audit trail do aceite (A3)
- [ ] Usuário seed `role != admin` (superfícies admin ocultas para o piloto)

### Critérios de sucesso (definição de "pronto")

- [ ] Primeiro cliente pagante em ≤ 30 dias
- [ ] Uso real do fluxo completo por 2 semanas
- [ ] Documentar tempo manual vs. sistema (meta ≤ 10min)
- [ ] 1 indicação com interesse de pagamento

---

## Decisões em aberto

| Decisão | Contexto | Impacto | Responsável |
|---|---|---|---|
| **Branding por empresa** | **DECIDIDO como requisito central** (14/08): cada cliente coloca a própria marca na proposta (logo, cores, informações, conteúdo). Hoje a marca FineAndYou está hardcoded (28 ocorrências) e o produto veste a identidade do piloto | Pré-requisito de qualquer venda fora do piloto; o momento pré-dados é o mais barato para a mudança | dono |
| **Multi-tenant SaaS** | **DECIDIDO e IMPLEMENTADO (15/08):** cada organização tem textos, cores, logos, produtos e clientes próprios; novo cadastro cria a própria org. PRD-02 Fases 0–6 executadas ([PRD-02](../prds/PRD-02-multi-tenant-saas.md)); falta e2e manual | Base para escalar clientes; A6 fora do piloto desbloqueado | dono |
| **Nome do sistema** | Sem nome ainda. "FineAndYou" é o piloto, não o produto. Usar placeholder neutro ("Gerador de Propostas") até decidir | Identidade visual do admin, docs, landing | dono |
| **Segmento-alvo** | **Fechado (14/08):** produto horizontal/agnóstico — qualquer negócio (agências, LED, rodízio). Piloto FineAndYou não verticaliza | Template padrão genérico; cada empresa preenche o próprio conteúdo | dono |
| **Onde o texto mora** | **DECIDIDO (14/08):** um dono por texto — produto (fatos), empresa (identidade/termos), template (só estrutura + próximos passos), proposta (negócio). Precedência: proposta → produto → empresa. Referência: `docs/DECISOES-MODELO-DE-CONTEUDO.md` | Código implementado; SQL `add-model-content.sql` pendente | dono |
| **Pipeline de oportunidades vira CRM vendável?** | Já construído; pode ser produto próprio ou recurso interno | Posicionamento da Fase 2 | dono |

## Dívidas registradas (baseline Fase 0)

| # | Dívida | Severidade | Endereçada na fase |
|---|---|---|---|
| D1 | Sem migrations versionadas (drift de schema) | Alta | Fase 1 (A1) |
| D2 | Sem suite de testes (vitest) | Alta | Fase 1 (T1 — resolvida 15/08) |
| D3 | Sem CI/CD (deploy manual Vercel) | Média | Pós-piloto |
| D4 | Sem billing | Média | Pós-piloto |
| D5 | `database.types.ts` desatualizado | Média | Fase 1 (A1) |
| D6 | PDF server-side, auth completo | Baixa | Pós-piloto |
| D7 | Marca do piloto no produto (FineAndYou hardcoded + skin `fay-*`) | Média | Fase 1 (A6) |
| D8 | ESLint sem configuração (`next lint` abre wizard) | Baixa | Pós-piloto |

## Como usar este arquivo

- Marque `[x]` quando a entrega estiver feita **e verificada**.
- Nunca marque como feito sem evidência (teste, demo ou screenshot).
- A cada fase concluída, mova-a para a tabela de fases e crie o PRD da próxima.
