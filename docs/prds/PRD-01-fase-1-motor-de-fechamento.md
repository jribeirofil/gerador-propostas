# PRD-01 — Fase 1: Motor de Fechamento

- **Status:** APROVADO (via /office-hours + /plan-eng-review, 2026-08-14)
- **Fonte:** design doc FineAndYou Propostas (aprovado) + execution plan travado
- **Status de execução:** ver `docs/progress/PROGRESS.md`
- **Última atualização:** 2026-08-14

---

## Problema

Vendedores e donos de agências perdem negócios reais porque a proposta comercial
demora para sair ou sai amadora. Cada hora montando proposta em Word/Google Docs
é hora que não vira fechamento. A dor é de receita, não estética: proposta
lenta/feia = deal perdido ou renegociado para baixo.

## Contexto de mercado

- Mercado BR: ~74% dos pequenos negócios usam modelos amadores ou Word sem padronização.
- Concorrentes BR (propo.com.br, TOOB, appCotaMax, PropostaZap, PropoSoft, Propoza)
  são todos "gerador com aceite digital e link rastreável" — competir por feature
  genérica é brigar por preço num mercado saturado de R$19–149/mês.
- O aceite + link é o **mínimo para jogar** neste mercado; o diferencial real é o
  **ciclo de acompanhamento / radar de follow-up**, que ainda não existe no produto.

## Premissas aceitas

1. Competir como "gerador genérico" = preço; diferenciação vem de nicho OU motor comercial.
2. Produto está **superconstruído** para o estágio pré-receita — UM segmento e UM cliente pagante antes de features.
3. Distribuição é o problema real: há produto, não há canal.
4. Aceite+link = mínimo; **radar de follow-up = diferencial**.

## Abordagem recomendada (aprovada)

**A — Motor de Fechamento**, com o movimento do piloto-dono dobrado dentro:
**assinar o primeiro cliente pagante de qualquer jeito.**

Racional: usa o que já está construído como vantagem (aceite com token + analytics
+ pipeline — impossível para um gerador de PDF barato reproduzir) e ataca a dor
medida (deal perdido). O PDF bonito é necessário, mas não suficiente; o fechamento é o valor.

## Escopo da Fase 1 (execution plan travado)

Ordem de execução, pré-piloto (semana 1):

| # | Item | Entrega |
|---|---|---|
| A1 | **Sync de schema** (bloqueia o resto) | Migration versionada e idempotente do banco vivo (`proposal_analytics`, colunas `opportunity_status`, `has_pending_review`, `lost_reason`, `public_token`, `version`, `sent_at`; CHECK expandido de `proposal_event.event_type` com `opportunity_won`, `adjustments_requested`, `opportunity_lost`); regenerar `database.types.ts`; tipar `createAdminClient` com `<Database>` |
| A2 | **Radar de follow-up** (diferencial) | Coluna `sent_at` gravada na publish; dashboard "propostas paradas" (`status='sent'` AND `sent_at < now()-N` AND sem decisão); N default 3, configurável por proposta; nudge manual via WhatsApp |
| A3 | **Audit trail do aceite** | Rota de decisão captura IP + user-agent (além de name/email/cargo/comment) |
| A4 | **Guard de status** | Decisão rejeitada a menos que `status='sent'` |
| A5 | **Tipagem do client admin** | `createAdminClient` tipado com `<Database>` (drift volta a ser erro de compilação) |
| T1 | **Testes do radar** | Lógica de threshold em função pura + vitest com teste unitário |

### Especificação do radar de follow-up

- **Gatilho:** proposta enviada (link publicado) há N dias sem decisão do cliente. N default = 3, configurável por proposta.
- **Canal piloto:** lista no dashboard ("propostas paradas") + nudge manual de WhatsApp (zero custo). WhatsApp Business API fica pós-piloto.
- **Evidência de aceite:** rota de decisão persiste token + timestamp + identificador do dispositivo (trilha de auditoria — LGPD e validade contratual do aceite).

## Fora de escopo (adiado para pós-piloto)

Billing integrado (Stripe/Asaas), WhatsApp Business API, índice em `proposal_analytics`,
CI/CD automático, projeto de auth completo, PDF server-side, CRM multi-tenant.

## Checklist pré-cobrança (antes de qualquer feature nova)

1. Confirmar com o piloto a forma de pagamento (Pix/transferência) e aceitação de recibo sem NF (ou emitir recibo simples).
2. Verificar que `decision/route.ts` persiste token + timestamp + dispositivo — se não, corrigir antes de vender o aceite como vantagem contratual.
3. Cobrar o piloto — assinatura anual simbólica **R$~300–500** (não mensal; compromisso de 1 ano separa curiosidade de cliente). Billing manual via Pix/transferência.
4. Sentar ao lado do piloto (ou gravar tela) enquanto ele gera UMA proposta real, sem ajudar, e anotar onde trava.
5. Plano B se disser não: segundo candidato da rede OU gatear a construção do radar na confirmação do pagamento.

## Critérios de sucesso

- **Primeiro cliente pagante:** paga (anual simbólico, R$~300–500) em ≤ 30 dias via Pix/transferência manual.
- **Uso real:** usa o fluxo completo (gerar → enviar → aceite) em todas as propostas reais por 2 semanas.
- **Evidência de receita potencial:** tempo de proposta manual (≥ 2h) vs. sistema (**meta** ≤ 10min — a documentar em sessão de observação, não assumido).
- **1 indicação:** apresenta a 5 colegas; ≥ 1 demonstra interesse de pagamento.

## Dependências / riscos

- **NF/recibo:** confirmar com o piloto (pessoa física/MEI) antes de cobrar.
- **Auth:** não é bloqueador — usuário seed `role != admin` (o `requireAdmin()` já oculta superfícies admin).
- **Escopo do que o piloto vê:** congelar/ocultar superfícies admin para o piloto — só o fluxo proposta + link.
- **Segmento-alvo:** agências/estúdios digitais (hipótese) — confirmar com o cliente antes de qualquer mensagem pública.
- **Oportunidades como CRM:** pipeline já construído vira CRM vendável sozinho ou fica interno? (decisão aberta)

## Decisões travadas na revisão

A1 schema sync (agora), A2 `sent_at` (coluna), A3 audit trail IP+UA (ok), A4 guard `status='sent'` (ok), A5 tipar client admin (ok), T1 vitest para radar (ok). **Zero questões em aberto no escopo da fase.**

## Notas de governança

- **Tenant/multi-org** (branding por organização) não está decidido. Impacta a fase 1 (piloto roda single-org com branding FineAndYou) e o plano pós-piloto. Ver "Decisões em aberto" no PROGRESS.md.
- Sempre que o escopo mudar materialmente, atualizar este PRD **antes** de codar.
