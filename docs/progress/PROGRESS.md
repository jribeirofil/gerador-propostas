# PROGRESS — Acompanhamento do projeto

Dashboard de fases e execução. Atualizar a cada mudança de status.

Última atualização: **2026-08-15**

> **Multi-tenant (15/08):** PRD-02 executado — Fases 0–6 implementadas. Storage org-isolado
> (Fase 5: SQL aplicado, policies `assets_org_*` ativas, legadas permissivas removidas).
> `database.types.ts` regenerado do schema vivo, clients tipados, `tsc`+`build` limpos (Fase 6).
> Falta apenas o teste e2e manual org raiz × org nova.

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
| 1 | Motor de Fechamento | [PRD-01](../prds/PRD-01-fase-1-motor-de-fechamento.md) | 🚧 Planejada — não iniciada | Primeira venda + radar de follow-up |
| 2 | Multi-tenant SaaS | [PRD-02](../prds/PRD-02-multi-tenant-saas.md) | ✅ Executada (Fases 0–6) — falta e2e manual | Branding/isolamento por organização; storage org-scoped; types regenerados |

## Fase 1 — Motor de Fechamento (execução)

### Escopo técnico (execution plan travado)

- [ ] **A1 — Sync de schema** (bloqueia o resto)
  - [ ] Migration versionada e idempotente do banco vivo
  - [ ] Regenerar `database.types.ts` (`supabase gen types typescript`)
  - [ ] Tipar `createAdminClient` com `<Database>` (A5)
  - [ ] Verificar que `decision/route.ts` persiste token+timestamp
- [ ] **A2 — Radar de follow-up**
  - [ ] Coluna `sent_at timestamptz` na migration (A1), gravada na rota publish
  - [ ] Dashboard "propostas paradas" (`status='sent'` + `sent_at < now()-N` + sem decisão)
  - [ ] N default 3, configurável por proposta
  - [ ] Nudge manual via WhatsApp
- [ ] **A3 — Audit trail do aceite** (IP + user-agent na decisão)
- [ ] **A4 — Guard de status** (decisão só com `status='sent'`)
- [ ] **T1 — Testes do radar** (função pura do threshold + vitest)
- [ ] **A6 — Layout da empresa** *(adicionado 2026-08-14 — evidência do cliente)*
  - [x] Remover hardcodes da marca (30 ocorrências em 17 arquivos — capa/PDF/login/APIs)
  - [x] Label dinâmico "Sobre a [empresa]" (preview web, documento e PDF)
  - [x] Contatos da empresa (site/e-mail/whatsapp) na capa, rodapé e PDF
  - [x] Fallbacks do PDF neutralizados (cenário não assume vertical saúde mental)
  - [x] Campo `company_about` em `company_settings` + leitura no documento (settings vence, bloco `sobre` é fallback legado) *(código pronto; SQL pendente — `add-model-content.sql`)*
  - [ ] Template padrão curado no banco (seed) *(depende de A1 — migration)*

### Modelo de conteúdo da proposta (implementação 14/08)

Decisão e referência: [`docs/DECISOES-MODELO-DE-CONTEUDO.md`](../DECISOES-MODELO-DE-CONTEUDO.md). Base: padrão PandaDoc/Proposify/Qwilr + CPQ — catálogo de produtos é a fonte dos fatos; template é só estrutura.

- [x] **Seção Contexto removida** do documento (blocos `cenario`/`objetivos` fora do modelo)
- [x] **Fallbacks hardcoded removidos** (condições padrão "Sem taxa de setup...", próximos passos, texto "Com base no cenário...")
- [x] **Seção vazia → some** (próximos passos sem itens não renderiza)
- [x] **Condições comerciais**: hierarquia proposta → produto → empresa; pré-selecionadas no passo Condições (`commercial_conditions`)
- [x] **Etapa Diagnóstico removida do fluxo** (wizard: Cliente → Produtos → Preços → Condições → Resumo)
- [x] **"Sobre a empresa"** agora é config da organização (`company_about`), não bloco
- [ ] **Prévia real no passo Resumo** (render do documento antes de gerar — próxima iteração, junto do renderer único F1)
- [ ] SQL `add-model-content.sql` aplicado no Supabase (3 colunas: `company_settings.company_about`, `product.commercial_conditions`, `proposal.commercial_conditions`)

### Checklist pré-cobrança (antes de features novas)

- [ ] Confirmar forma de pagamento com o piloto (Pix/transferência)
- [ ] Confirmar aceitação de recibo sem NF (ou emitir recibo simples)
- [ ] Verificar audit trail do aceite (A3)
- [ ] Cobrar o piloto — anual simbólico R$~300–500
- [ ] Sessão de observação: piloto gera UMA proposta real, sem ajuda
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
| D2 | Sem suite de testes (vitest) | Alta | Fase 1 (T1) |
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
