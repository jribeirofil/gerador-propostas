# PROGRESS — Acompanhamento do projeto

Dashboard de fases e execução. Atualizar a cada mudança de status.

Última atualização: **2026-08-14**

---

## Fases

| Fase | Nome | PRD | Status | Nota |
|---|---|---|---|---|
| 0 | Fundação (initial commit) | [PRD-00](../prds/PRD-00-fase-0-fundacao.md) | ✅ Concluída | Baseline: estado atual consolidado em 1 commit |
| 1 | Motor de Fechamento | [PRD-01](../prds/PRD-01-fase-1-motor-de-fechamento.md) | 🚧 Planejada — não iniciada | Primeira venda + radar de follow-up |

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
| **Multi-tenant / branding por organização** | Visão SaaS: cada cliente quer a proposta com a própria marca. Hoje o branding é FineAndYou (single-org). Fase 1 roda piloto single-org; per-org branding é pré-requisito de venda fora do piloto | Pré-requisito para escalar venda; o momento pré-dados é o mais barato para a mudança | dono |
| **Pipeline de oportunidades vira CRM vendável?** | Já construído; pode ser produto próprio ou recurso interno | Posicionamento da Fase 2 | dono |
| **Segmento-alvo (agências/estúdios?)** | Hipótese a confirmar com o primeiro cliente | Mensagem e templates | dono |

## Dívidas registradas (baseline Fase 0)

| # | Dívida | Severidade | Endereçada na fase |
|---|---|---|---|
| D1 | Sem migrations versionadas (drift de schema) | Alta | Fase 1 (A1) |
| D2 | Sem suite de testes (vitest) | Alta | Fase 1 (T1) |
| D3 | Sem CI/CD (deploy manual Vercel) | Média | Pós-piloto |
| D4 | Sem billing | Média | Pós-piloto |
| D5 | `database.types.ts` desatualizado | Média | Fase 1 (A1) |
| D6 | PDF server-side, auth completo | Baixa | Pós-piloto |

## Como usar este arquivo

- Marque `[x]` quando a entrega estiver feita **e verificada**.
- Nunca marque como feito sem evidência (teste, demo ou screenshot).
- A cada fase concluída, mova-a para a tabela de fases e crie o PRD da próxima.
