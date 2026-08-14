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

## Evidência de demanda (2026-08-14)

Depoimento direto do cliente-alvo (WhatsApp), sobre o concorrente que testou:

> "uma coisa que não consegui executar no meu era ter um modelo de proposta do
> jeito que desejava. ele gerava um layout lá e só. Eu quero que a empresa inclua
> o layout que ela quer, por exemplo, informações da empresa, (toda a encheção de
> linguiça que uma proposta tem) e ao final o valor de investimento."

**Leitura para o produto:** o cliente rejeita o layout genérico do fornecedor.
A cunha não é "gerar rápido" — é **"o layout é da SUA empresa, você controla"**,
com informações da empresa + conteúdo institucional + valor de investimento no
final. O mecanismo já existe (blocos + templates + `company_settings`); o que
falta é o conteúdo institucional padrão e a propagação das informações da empresa
para dentro da proposta (ver item A6). Confirma também a decisão em aberto de
branding por organização no PROGRESS.md.

### Identidade: sistema × cliente (clarificação 14/08)

- **"FineAndYou" é o primeiro cliente piloto**, não o nome do sistema. O sistema ainda não tem nome.
- O produto é **horizontal e agnóstico de segmento**: deve servir qualquer tipo de negócio — agências, painéis de LED, rodízio de pizza em eventos, etc. Se depender de um segmento, deixa de ser útil para os demais.
- **Consequência:** cada empresa precisa colocar a própria marca na proposta (logo, cores, informações, conteúdo institucional). Branding por organização é **requisito central**, não opcional.
- **Dívida atual:** a marca FineAndYou está vazada no código — 28 ocorrências em 17 arquivos (default `company_name`, label "Sobre a FineAndYou", fallback "time FineAndYou") e a skin do sistema em si (`fay-*` no Tailwind, 41 arquivos) usa a identidade do piloto. O item A6 endereça a parte de proposta; a skin do sistema vira débito (D7).
- **Escopo do piloto:** primeiro pagante = FineAndYou (UM cliente, cunha mais estreita), mas **sem verticalizar o produto** — o que for construído para o piloto vale para qualquer empresa.

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
| A6 | **Layout e conteúdo institucional da empresa** *(adicionado 2026-08-14, demand-driven)* | Proposta começa com a cara da empresa: seed de template padrão curado com a "encheção de linguiça" preenchida (sobre, diferenciais, próximos passos), bloco `sobre` alimentado pelas `company_settings` e com label "Sobre a [empresa]", e informações de contato (site/e-mail/whatsapp) propagadas para a proposta/PDF. Remover hardcodes da marca (default `company_name`, label e fallbacks "FineAndYou"). Produto permanece agnóstico de segmento |

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
- **Segmento-alvo:** produto **horizontal** — qualquer tipo de negócio (agências, painéis de LED, rodízio de pizza em eventos). Piloto FineAndYou não verticaliza o produto; o template padrão é genérico e cada empresa preenche o próprio conteúdo.
- **Oportunidades como CRM:** pipeline já construído vira CRM vendável sozinho ou fica interno? (decisão aberta)

## Decisões travadas na revisão

A1 schema sync (agora), A2 `sent_at` (coluna), A3 audit trail IP+UA (ok), A4 guard `status='sent'` (ok), A5 tipar client admin (ok), T1 vitest para radar (ok), A6 layout/conteúdo institucional da empresa + branding por empresa como requisito central (adicionado por evidência de demanda de 2026-08-14). **Zero questões em aberto no escopo da fase.**

## Notas de governança

- **Tenant/multi-org** (branding por organização) não está decidido. Impacta a fase 1 (piloto roda single-org com branding FineAndYou) e o plano pós-piloto. Ver "Decisões em aberto" no PROGRESS.md.
- Sempre que o escopo mudar materialmente, atualizar este PRD **antes** de codar.
