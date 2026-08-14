# PRD-00 — Fase 0: Fundação (initial commit)

- **Status:** CONCLUÍDA
- **Data do baseline:** 2026-08-14
- **Entregável:** estado atual do produto consolidado como commit inicial
- **Última atualização:** 2026-08-14

---

## Objetivo da fase

Estabelecer um baseline limpo e versionável do produto: o estado atual vira o
commit inicial do repositório, com histórico consolidado e documentação mínima
(PRDs + tracker de progresso) para que todas as fases seguintes sejam rastreáveis.

## O que o produto é hoje (estado da arte)

**FineAndYou Propostas** — plataforma web para montar, enviar e acompanhar
propostas comerciais. Fases A–I anteriores (templates, blocks, identidade
visual, oportunidades) estão consolidadas nesta fase.

### Stack

- **Frontend/Backend:** Next.js 14.2.3 (App Router), React 18, TypeScript 5
- **Estilo:** Tailwind CSS 3.4, `next-themes` (modo claro/escuro)
- **Dados:** Supabase (Postgres) via `@supabase/ssr` + `supabase-js`
- **PDF:** Puppeteer (server-side) + jspdf/html2canvas (cliente)
- **IA:** Anthropic SDK (rota `/api/ai/text`, geração assistida por bloco)
- **Utilidades:** dnd-kit (drag & drop), react-hook-form, date-fns, lucide-react

### Módulos funcionais

| Área | O que faz |
|---|---|
| **Propostas** | Workspace de 6 etapas (cliente → diagnóstico → produtos → preços → condições → revisão), edição, duplicação, preview web/PDF |
| **Blocos** | Editor de blocos reordenáveis, com IA por bloco |
| **Templates** | CRUD de templates, reutilização entre propostas |
| **Aceite online** | Página pública `p/[token]` com decisão, analytics de link, pedido de ajuste, download de PDF |
| **Oportunidades** | Gestão de pipeline de oportunidades por proposta |
| **Admin** | Produtos, categorias, tabelas de preço, usuários, conteúdo (biblioteca), configurações da empresa, identidade visual |
| **Auth** | Login/cadastro, `requireAdmin()` para superfícies admin |

### Rotas de API relevantes

- `p/[token]/decision` — aceite/recusa com token
- `p/[token]/analytics` — métricas de visualização do link
- `proposals/[id]/publish`, `share`, `pdf`, `opportunity`
- `templates/[id]/blocks`, `admin/categories`, `clients/search`, `ai/text`

## Estado atual

- **Pré-receita:** produto em uso pelo próprio dono; nenhum pagamento ainda.
- **Uma pessoa específica pediu para usar o sistema** (validação de pagamento pendente — vira o primeiro cliente na Fase 1).
- **Uso:** fluxo completo (gerar → enviar → aceite) já funcional no código.

## Dívidas conhecidas (registradas, não resolvidas nesta fase)

| # | Dívida | Severidade |
|---|---|---|
| D1 | **Drift de schema:** `supabase/` não tem `migrations/` — o schema vive só no banco cloud, sem histórico versionado no repo (ex.: `proposal_analytics`, `opportunity_status` existem no banco mas não em migration) | Alta |
| D2 | **Sem testes:** nenhuma suite configurada (sem vitest) | Alta |
| D3 | **Sem CI/CD:** sem pipeline; deploy manual Vercel (`npx vercel --prod`) | Média |
| D4 | **Sem billing:** nenhuma integração de pagamento (Stripe/Asaas/etc.) | Média |
| D5 | **`database.types.ts` desatualizado/desconfiado:** tipos não regenerados do schema vivo | Média |
| D6 | PDF server-side e auth multi-usuário completo ficam para depois | Baixa |

## Critérios de conclusão

- [x] Tree do git limpa (`.gitignore` cobre `.DS_Store`, build artifacts e tooling)
- [x] Histórico consolidado em um commit inicial (baseline rastreável via reflog)
- [x] PRDs por fase em `docs/prds/` e tracker em `docs/progress/PROGRESS.md`

## Próxima fase

**Fase 1 — Motor de Fechamento:** ver `PRD-01-fase-1-motor-de-fechamento.md`.
