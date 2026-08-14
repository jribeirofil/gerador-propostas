# BLUEPRINT — FineAndYou Propostas
> Estado atual do sistema — documentação estrutural em 7 camadas
> Data de referência: 2026-06-20

---

## Camada 1 — Entidades

### Diagrama de Relacionamentos (simplificado)

```
profiles (1) ──< proposal (N) >── clients (1)
                     │
                     ├──< proposal_product >── product
                     ├──< proposal_block
                     └──< proposal_event

product ──< product_benefit
        ──< product_scope
        ──< product_faq
        ──< product_differential
        ──< price_table ──< price_table_item

template_block (global, sem FK de proposta)
content_library (global, sem FK de proposta)
company_settings (singleton)
```

---

### Tabelas

#### `profiles`
Extensão do `auth.users` do Supabase. Criada automaticamente por trigger ao signup.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | Igual ao `auth.users.id` |
| full_name | text | |
| job_title | text | |
| phone | text | |
| role | text | `admin` / `manager` / `seller` / `viewer` |
| active | boolean | Usuário desativado não acessa |

---

#### `clients`
Dados do cliente. Criado ou reutilizado a cada proposta.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| empresa | text | |
| cnpj | text | |
| contato | text | Nome do responsável |
| cargo | text | |
| email | text | |
| whatsapp | text | |
| colaboradores | integer | Qtd. de funcionários (base de cálculo) |
| segmento | text | |

---

#### `proposal`
Registro central da proposta comercial.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| title | text | Gerado automaticamente |
| status | text | `draft` / `generated` / `approved` / `rejected` / `expired` |
| version | integer | Versão dentro do grupo |
| version_group | uuid | UUID compartilhado por edições da mesma proposta |
| client_id | uuid FK → clients | |
| template_id | uuid FK → proposal_template | Pode ser null |
| diagnosis | text | Campo legado — "dor principal" |
| objectives | text | Campo legado — "objetivo" |
| commercial_notes | text | Observações comerciais |
| total_monthly | numeric | Calculado pelo pricing engine |
| total_setup | numeric | |
| discount_percent | numeric | Desconto global |
| validade_dias | integer | Default 30 |
| forma_pagamento | text | |
| prazo_implantacao | text | |
| is_archived | boolean | Soft delete |
| archived_at | timestamptz | |
| created_by | uuid FK → profiles | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

#### `proposal_product`
Produto incluído em uma proposta com precificação customizada.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| proposal_id | uuid FK → proposal | |
| product_id | uuid FK → product | |
| pricing_type | text | `monthly` / `one_time` / `annual` |
| unit_value | numeric | Valor unitário acordado |
| quantity | integer | Qtd. de vidas/unidades |
| discount_percent | numeric | Desconto por linha |
| notes | text | |
| manual_override | boolean | Se true, usa `override_reason` |
| override_reason | text | |
| monthly_value | numeric | Calculado |
| setup_value | numeric | Calculado |
| sort_order | integer | |
| snapshot | jsonb | Snapshot do produto no momento da criação |

---

#### `proposal_block`
Bloco de conteúdo de uma proposta. 12 tipos possíveis.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| proposal_id | uuid FK → proposal | |
| type | text | Ver tipos abaixo |
| title | text | Rótulo exibido no editor |
| content_json | jsonb | Estrutura varia por tipo |
| enabled | boolean | Se falso, bloco não aparece no PDF |
| sort_order | integer | Ordem de exibição |

**Tipos de bloco e sua estrutura de `content_json`:**

| Tipo | Renderização | Estrutura `content_json` |
|------|-------------|--------------------------|
| `cover` | Auto (dados do cliente) | `{}` |
| `cenario` | TextEditor / AI | `{ text: string }` |
| `objetivos` | TextEditor / AI | `{ text: string }` |
| `solucao` | Auto (produtos) | `{}` |
| `beneficios` | ListEditor | `{ items: string[] }` |
| `escopo` | ListEditor | `{ items: string[] }` |
| `diferenciais` | ListEditor + Biblioteca | `{ items: string[] }` |
| `faq` | FaqEditor + Biblioteca | `{ items: [{question, answer}] }` |
| `proximos_passos` | ListEditor / AI | `{ items: string[] }` |
| `sobre` | TextEditor / AI | `{ text: string }` |
| `investimento` | Auto (tabela de preços) | `{}` |
| `assinatura` | Auto (dados do signatário) | `{}` |

**Classificações funcionais:**
- `REQUIRED_BLOCKS` (não podem ser desativados): `cover`, `solucao`, `investimento`, `assinatura`
- `AUTO_RENDER_BLOCKS` (sem editor manual): `cover`, `solucao`, `investimento`, `assinatura`
- `AI_BLOCK_TYPES` (têm botão IA): `cenario`, `objetivos`, `diferenciais`, `proximos_passos`, `sobre`
- `LIBRARY_BLOCK_TYPES` (aceitam itens da biblioteca): `cenario`, `objetivos`, `proximos_passos`, `sobre`, `diferenciais`, `faq`
- `PRODUCT_DERIVED_BLOCKS` (populados a partir do produto): `beneficios`, `escopo`, `diferenciais`, `faq`

---

#### `proposal_event`
Log de eventos por proposta.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| proposal_id | uuid FK → proposal | |
| event_type | text | `created` / `pdf_generated` / `archived` / etc. |
| created_by | uuid FK → profiles | |
| created_at | timestamptz | |

---

#### `product`
Produto do catálogo.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| slug | text | Identificador legível |
| description | text | |
| active | boolean | |
| sort_order | integer | |
| unit_label | text | Ex: "por vida" |
| calculation_type | text | `per_employee` / `fixed` / `project` / `custom` |
| billing_frequency | text | `monthly` / `one_time` / `annual` |
| default_price_table_id | uuid FK → price_table | |

---

#### `product_benefit` / `product_scope` / `product_differential`
Itens filhos de produto — lista simples.

| Coluna | Tipo |
|--------|------|
| id | uuid PK |
| product_id | uuid FK → product |
| title | text |
| sort_order | integer |
| active | boolean |

---

#### `product_faq`
FAQ por produto.

| Coluna | Tipo |
|--------|------|
| id | uuid PK |
| product_id | uuid FK → product |
| question | text |
| answer | text |
| sort_order | integer |
| active | boolean |

---

#### `price_table` / `price_table_item`
Tabela de preços em faixas por produto.

`price_table`: `id`, `product_id`, `name`, `description`, `active`

`price_table_item`: `id`, `price_table_id`, `minimum_quantity`, `maximum_quantity`, `unit_price`, `sort_order`, `active`

---

#### `template_block`
Blocos padrão de um template de proposta. Se não existir template, o sistema usa `DEFAULT_BLOCK_ORDER` do TypeScript.

| Coluna | Tipo |
|--------|------|
| id | uuid PK |
| template_id | uuid |
| type | text |
| title | text |
| default_content | jsonb |
| sort_order | integer |
| enabled | boolean |

---

#### `content_library`
Itens reutilizáveis criados por admins — texto ou lista.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| type | text | `text` / `list` |
| title | text | Identificador legível |
| content_json | jsonb | `{ text: string }` ou `{ items: string[] }` |
| created_by | uuid FK → profiles | |
| created_at | timestamptz | |

---

#### `company_settings`
Singleton. Configurações globais da empresa.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| company_name | text | |
| company_site | text | |
| company_email | text | |
| company_phone | text | |
| company_whatsapp | text | |
| logo_url | text | URL externa |
| primary_color | text | Hex; default `#1FE97C` |
| secondary_color | text | |
| pdf_footer_text | text | Rodapé do PDF |
| pdf_default_conditions | text | Uma condição por linha |
| signer_name | text | Responsável comercial |
| signer_role | text | |
| signer_email | text | |
| signer_phone | text | |
| ai_tone | text | Instrução de tom para IA |
| updated_at | timestamptz | |
| updated_by | uuid | |

---

## Camada 2 — Rotas

### Páginas (Next.js App Router)

| Rota | Arquivo | Auth | Renderização |
|------|---------|------|-------------|
| `/` | `src/app/page.tsx` | — | SSR → redirect `/dashboard` |
| `/login` | `src/app/login/page.tsx` | Anon | Client |
| `/cadastro` | `src/app/cadastro/page.tsx` | Anon | Client |
| `/dashboard` | `src/app/dashboard/page.tsx` | Auth | SSR |
| `/dashboard/nova` | `src/app/dashboard/nova/page.tsx` | Auth | SSR |
| `/dashboard/propostas/[id]/editar` | `.../editar/page.tsx` | Auth | SSR |
| `/dashboard/propostas/[id]/duplicar` | `.../duplicar/page.tsx` | Auth | SSR |
| `/dashboard/propostas/[id]/pdf` | `.../pdf/page.tsx` | Auth | Client |
| `/dashboard/propostas/[id]/preview` | `.../preview/page.tsx` | Auth | SSR |
| `/dashboard/propostas/[id]/blocos` | `.../blocos/page.tsx` | Auth | SSR |
| `/dashboard/admin/produtos` | `.../admin/produtos/page.tsx` | Admin | SSR |
| `/dashboard/admin/produtos/novo` | `.../admin/produtos/novo/page.tsx` | Admin | SSR |
| `/dashboard/admin/produtos/[id]` | `.../admin/produtos/[id]/page.tsx` | Admin | SSR |
| `/dashboard/admin/conteudo` | `.../admin/conteudo/page.tsx` | Admin | SSR |
| `/dashboard/admin/usuarios` | `.../admin/usuarios/page.tsx` | Admin | SSR |
| `/dashboard/admin/usuarios/[id]` | `.../admin/usuarios/[id]/page.tsx` | Admin | SSR |
| `/dashboard/admin/configuracoes` | `.../admin/configuracoes/page.tsx` | Admin | SSR |

### API Routes

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/proposals/[id]/pdf` | Gera HTML da proposta para PDF/iframe |
| `POST` | `/api/proposals/[id]/blocks/[blockId]/ai` | IA: improve / rewrite / expand bloco |
| `POST` | `/api/admin/users` | Cria usuário (admin) + envia e-mail de reset |

> **Nota:** A criação de propostas ainda não tem rota API dedicada — ocorre dentro do `ProposalForm` (client component) via Supabase client diretamente.

### Layout

| Arquivo | Função |
|---------|--------|
| `src/app/layout.tsx` | Root layout: fonte Sora, ToastProvider |
| `src/app/dashboard/layout.tsx` | Dashboard layout: Sidebar + conteúdo principal |

---

## Camada 3 — Telas

### 1. Login (`/login`)
Formulário de e-mail + senha. Erro inline. Link para `/cadastro`.

### 2. Cadastro (`/cadastro`)
Formulário de signup com nome completo + e-mail + senha. Dois fluxos:
- Supabase retorna sessão → redirect imediato ao dashboard
- Supabase exige confirmação por e-mail → tela de sucesso

### 3. Dashboard — Lista de Propostas (`/dashboard`)
- 4 KPIs: Total, Aprovadas, Geradas, Conversão (%)
- Tabela com colunas: Cliente, Status, Versão, Valor Mensal, Valor Setup, Validade, Atualizado em
- Dedup automático por `version_group`: exibe apenas a versão mais recente de cada grupo
- Botão "Nova proposta" → `/dashboard/nova`
- Cada linha → `/dashboard/propostas/[id]/pdf`

### 4. Nova Proposta / Editar / Duplicar (`/dashboard/nova`, `.../editar`, `.../duplicar`)
Formulário em 6 etapas usando `react-hook-form`. Persiste rascunho em `localStorage` por chave derivada do modo.

**Etapas:**
1. Dados do cliente (empresa, CNPJ, contato, cargo, e-mail, WhatsApp, colaboradores, segmento)
2. Diagnóstico (dor principal, contexto, objetivo, observações internas)
3. Seleção de produtos (busca no catálogo)
4. Precificação (tipo de preço, valor unitário, quantidade, desconto por linha)
5. Condições (desconto global, validade, forma de pagamento, prazo de implantação, obs. comerciais)
6. Revisão (resumo completo antes de gerar)

Ao confirmar: cria/atualiza `proposal`, `clients`, `proposal_product` → `createBlocksFromTemplate` / `copyBlocksFromProposal` → redirect para `/blocos`.

### 5. PDF Preview (`/dashboard/propostas/[id]/pdf`)
- Barra de ação com: ← Dashboard, Prévia Web, Conteúdo, Editar, Duplicar, Arquivar, Exportar PDF
- Iframe (`srcDoc`) carregado via `GET /api/proposals/[id]/pdf`
- Botão "Arquivar" abre `ConfirmDialog` → `is_archived = true`

### 6. Prévia Web (`/dashboard/propostas/[id]/preview`)
- Barra sticky com: ← Voltar, "Editar conteúdo" → `/blocos`, "Imprimir / PDF" (`PrintButton`)
- `ProposalPreview` renderiza todos os blocos habilitados em HTML limpo
- `print:hidden` na barra → ao imprimir só o conteúdo aparece

### 7. Editor de Blocos (`/dashboard/propostas/[id]/blocos`)
- Lista de todos os 12 blocos com toggle (ativo/inativo), título e editor inline
- Drag-and-drop para reordenar (dnd-kit)
- Cada bloco tem seu editor específico:
  - `TextEditor` → cenario, objetivos, sobre (textarea)
  - `ListEditor` → beneficios, escopo, diferenciais, proximos_passos (itens com add/remove/DnD)
  - `FaqEditor` → faq (pergunta + resposta por item)
- Botão IA (para AI_BLOCK_TYPES): abre dropdown improve / rewrite / expand → `POST .../ai`
- Botão "Biblioteca" (para LIBRARY_BLOCK_TYPES): abre picker de itens da `content_library`
- Blocos AUTO_RENDER: apenas toggle + rótulo, sem editor (conteúdo gerado automaticamente)

### 8. Admin — Catálogo de Produtos (`/dashboard/admin/produtos`)
Tabela de produtos (nome, slug, status ativo/inativo). Botão "+ Novo produto".

### 9. Admin — Editar Produto (`/dashboard/admin/produtos/[id]`)
- `ProductForm`: nome, slug, descrição, tipo de cálculo, frequência de cobrança
- `SortableListEditor` × 3: Benefícios, Escopo, Diferenciais
- `SortableFaqEditor`: FAQ
- `DeleteProductButton`: exclusão com confirmação

### 10. Admin — Biblioteca de Conteúdo (`/dashboard/admin/conteudo`)
- `ContentLibraryManager`: criar/excluir itens de texto ou lista
- Itens criados ficam disponíveis no picker do BlockEditor

### 11. Admin — Usuários (`/dashboard/admin/usuarios`)
- `UserList`: tabela com nome, e-mail, cargo, role badge, status ativo/inativo
- Botão "+ Novo usuário" abre `NewUserDialog` → `POST /api/admin/users`
- Linha → `/dashboard/admin/usuarios/[id]`

### 12. Admin — Editar Usuário (`/dashboard/admin/usuarios/[id]`)
- `UserEditForm`: nome, cargo, telefone, role, ativar/desativar
- Proteções: não permite remover o último admin ativo; "eu mesmo" não muda o próprio role

### 13. Admin — Configurações (`/dashboard/admin/configuracoes`)
- `CompanySettingsForm`: 5 seções — Empresa, Branding, PDF, Assinatura padrão, Inteligência Artificial
- Campo "Tom e estilo de escrita" injetado em todos os prompts de IA

---

## Camada 4 — Componentes

### Layout
```
src/components/layout/
  Sidebar.tsx           ← Client. Navegação principal + admin. Logout.
```

### Proposta
```
src/components/proposal/
  ProposalForm.tsx      ← Client. Formulário 6 etapas (react-hook-form).
    Step1Client.tsx     ← Dados do cliente
    Step2Diagnostic.tsx ← Diagnóstico e contexto
    Step3Products.tsx   ← Seleção de produtos do catálogo
    Step4Pricing.tsx    ← Precificação por produto
    Step5Conditions.tsx ← Condições comerciais
    Step6Review.tsx     ← Revisão final antes de gerar

  ProposalSummaryCard.tsx ← Resumo lateral exibido nas etapas 4-6
  ProposalTable.tsx       ← Client. Tabela do dashboard.
  ProposalPreview.tsx     ← Client. Renderização web da proposta.
  BlockEditor.tsx         ← Client. Editor DnD de blocos com IA e biblioteca.
    ↳ TextEditor          ← sub-editor interno (textarea)
    ↳ ListEditor          ← sub-editor interno (lista com DnD)
    ↳ FaqEditor           ← sub-editor interno (pares pergunta/resposta)
```

### Admin
```
src/components/admin/
  CompanySettingsForm.tsx  ← Client. Configurações globais da empresa.
  ContentLibraryManager.tsx ← Client. CRUD de biblioteca de conteúdo.
  DeleteProductButton.tsx  ← Client. Botão de exclusão com confirmação.
  NewUserDialog.tsx        ← Client. Modal de criação de usuário.
  PriceTableEditor.tsx     ← Client. Editor de tabela de preços.
  ProductForm.tsx          ← Client. Dados básicos do produto.
  SortableFaqEditor.tsx    ← Client. Editor FAQ com DnD (dnd-kit).
  SortableListEditor.tsx   ← Client. Lista benefit/scope/differential com DnD.
  UserEditForm.tsx         ← Client. Edição de usuário.
  UserList.tsx             ← Client. Tabela de usuários.
```

### UI (utilitários)
```
src/components/ui/
  ConfirmDialog.tsx   ← Modal de confirmação genérico.
  StatusBadge.tsx     ← Badge de status de proposta.
  StepIndicator.tsx   ← Indicador de progresso do formulário.
  Toast.tsx           ← Sistema de notificações (Context + hook).
```

### Preview
```
src/app/dashboard/propostas/[id]/preview/
  PrintButton.tsx     ← 'use client'. Botão window.print() isolado.
```

---

## Camada 5 — Fluxos

### Fluxo 1 — Criar proposta nova

```
Usuário → /dashboard/nova
  → ProposalForm (6 etapas, draft salvo em localStorage)
  → Step 6 submit:
      1. Upsert/cria client em `clients`
      2. INSERT em `proposal` (status: draft)
      3. INSERT em `proposal_product` (com snapshot de produto)
      4. Calcula totais → UPDATE `proposal` (total_monthly, total_setup)
      5. createBlocksFromTemplate(supabase, proposalId, templateId, productContent)
         → busca template_block ou usa DEFAULT_BLOCK_ORDER
         → INSERT em `proposal_block` (12 blocos)
      6. INSERT `proposal_event` (event_type: created)
  → redirect /dashboard/propostas/[id]/blocos
```

### Fluxo 2 — Editar proposta (nova versão)

```
/dashboard/propostas/[id]/editar
  → ProposalForm (mode: edit, dados pré-preenchidos)
  → Submit:
      1. INSERT nova `proposal` (version = atual+1, mesmo version_group)
      2. Mantém client_id existente ou atualiza cliente
      3. INSERT novos `proposal_product`
      4. copyBlocksFromProposal(supabase, novoId, idOriginal)
         → copia blocos com todo content_json
  → redirect /dashboard/propostas/[novoId]/blocos
```

### Fluxo 3 — Duplicar proposta (novo cliente)

```
/dashboard/propostas/[id]/duplicar
  → ProposalForm (mode: duplicate, produtos/condições pré-preenchidos, cliente em branco)
  → Submit:
      1. Cria novo `client`
      2. INSERT nova `proposal` (novo version_group, version 1)
      3. INSERT `proposal_product`
      4. createBlocksFromTemplate(supabase, novoId, null)
  → redirect /dashboard/propostas/[novoId]/blocos
```

### Fluxo 4 — Gerar PDF

```
/dashboard/propostas/[id]/pdf (Client Component)
  → useEffect: GET /api/proposals/[id]/pdf
      1. Busca proposal + client
      2. Busca proposal_product
      3. Busca proposal_block (enabled=true)
      4. Busca company_settings
      5. buildPdfHtml({ ... blocks, settings })
         → Renderiza blocos habilitados (blocks > legacy fields)
      6. INSERT proposal_event (pdf_generated) [fire-and-forget]
  → Retorna { html, proposal }
  → Renderiza iframe srcDoc={html}
  → Botão "Exportar PDF" chama iframe.contentWindow.print()
```

### Fluxo 5 — Editar blocos com IA

```
/dashboard/propostas/[id]/blocos
  → BlockEditor carrega initialBlocks (server-side)
  → Usuário edita bloco → onSave → PATCH proposal_block (content_json)
  → Usuário reordena → PATCH sort_order por bloco
  → Usuário clica IA:
      POST /api/proposals/[id]/blocks/[blockId]/ai
        { operation: 'improve'|'rewrite'|'expand', content, blockType }
      → Verifica auth + existência do bloco
      → Busca ai_tone de company_settings
      → Anthropic claude-haiku-4-5-20251001, max_tokens: 256
      → Retorna { result: string }
  → Usuário aceita → conteúdo substituído no editor
  → Usuário salva → PATCH no bloco
```

### Fluxo 6 — Biblioteca de conteúdo no editor

```
Usuário clica "Biblioteca" em bloco LIBRARY_BLOCK_TYPE
  → Exibe lista de content_library filtrada por tipo compatível
  → Seleciona item → content_json do item injetado no sub-editor
    (useEffect sincroniza estado local do TextEditor/ListEditor/FaqEditor)
  → Usuário salva → PATCH proposal_block
```

### Fluxo 7 — Criar usuário (admin)

```
/dashboard/admin/usuarios → NewUserDialog
  → POST /api/admin/users { full_name, email, job_title, phone, role }
  → API: cria auth.user via admin SDK (email_confirm: true)
  → API: upsert profile com role
  → API: supabase.auth.resetPasswordForEmail → e-mail enviado ao novo usuário
  → Redirect/refresh da lista
```

---

## Camada 6 — Permissões

### Roles de usuário

| Role | Acesso |
|------|--------|
| `admin` | Tudo: dashboard + todas as telas admin |
| `manager` | Dashboard + propostas |
| `seller` | Dashboard + propostas |
| `viewer` | Dashboard (somente leitura — controle ainda pendente de implementação) |

### Proteção de rotas (server-side)

| Mecanismo | Uso |
|-----------|-----|
| `createClient().auth.getUser()` | Verifica autenticação em todas as páginas SSR |
| `redirect('/login')` | Usuário não autenticado |
| `requireAdmin()` | Verifica `profiles.role === 'admin'` → `redirect('/dashboard')` se não for admin |
| `notFound()` | Proposta não encontrada ou arquivada |

### RLS (Row Level Security) — Supabase

| Tabela | Política SELECT | Política INSERT | Política DELETE |
|--------|-----------------|-----------------|-----------------|
| `proposal` | `created_by = auth.uid()` | `auth.uid()` | — |
| `proposal_block` | Authenticated | `auth.uid() = created_by` (ou admin client) | Criador |
| `content_library` | Authenticated | `created_by = auth.uid()` | Criador ou admin |
| `template_block` | Authenticated | Admin | Admin |
| `product` | Authenticated | Admin | Admin |
| `company_settings` | Authenticated | Admin | — |

> **Padrão crítico:** Páginas SSR que fazem INSERT ou SELECT de tabelas protegidas por RLS usam `createAdminClient()` (service role, bypassa RLS) **após** verificar autenticação via `createClient()`. O client anon+cookies não garante `auth.uid()` no contexto do servidor.

### Clients Supabase

| Client | Arquivo | Contexto | RLS |
|--------|---------|----------|-----|
| `createClient()` | `src/lib/supabase/server.ts` | SSR — usa cookies | Respeita |
| `createClient()` | `src/lib/supabase/client.ts` | Browser | Respeita |
| `createAdminClient()` | `src/lib/supabase/admin.ts` | Server only | Bypassa |

---

## Camada 7 — Roadmap

### Concluído (Fase 0 + Fase I)

**Fase 0 — Fundação**
- [x] Auth (login, cadastro, sessão)
- [x] Sidebar com navegação por role
- [x] CRUD de produtos (catálogo, benefícios, escopo, FAQ, diferenciais)
- [x] Tabelas de preços por faixas de quantidade
- [x] Formulário de proposta em 6 etapas
- [x] Pricing engine (per_employee, fixed, project, custom)
- [x] Geração de PDF via iframe
- [x] Gerenciamento de usuários (criar, editar role, ativar/desativar)
- [x] Configurações da empresa (branding, PDF, assinatura)
- [x] Versionamento de propostas (edit = nova versão no mesmo grupo)
- [x] Arquivamento (soft delete)

**Fase I — Motor de blocos + IA**
- [x] Sistema de 12 blocos de conteúdo por proposta
- [x] Template de blocos padrão (`DEFAULT_BLOCK_ORDER`)
- [x] `createBlocksFromTemplate` com merge de conteúdo de produto
- [x] `copyBlocksFromProposal` ao editar/duplicar
- [x] `BlockEditor`: toggle, drag-and-drop, editores específicos por tipo
- [x] `TextEditor`, `ListEditor`, `FaqEditor` com sync de `useEffect`
- [x] IA por bloco: improve / rewrite / expand (claude-haiku, max 256 tokens)
- [x] Tom de IA configurável em `company_settings.ai_tone`
- [x] Biblioteca de conteúdo (`content_library`) com picker no editor
- [x] PDF renderizando a partir de blocos (com fallback para campos legados)
- [x] Prévia web (`ProposalPreview`) com print

### Pendente / Planejado

**Infraestrutura imediata**
- [ ] `supabase gen types typescript` para atualizar `database.types.ts` (inclui `ai_tone` e demais mudanças recentes)
- [ ] SQL: `ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS ai_tone text;`
- [ ] Tela `/dashboard/admin/produtos/novo` (formulário de criação) — página referenciada no catálogo mas não implementada

**Fase II — Portal do cliente / compartilhamento**
- [ ] Link público de proposta (token de acesso sem login)
- [ ] Status "enviado ao cliente" e tracking de abertura
- [ ] Aceite digital pelo cliente

**Fase III — Analytics**
- [ ] Funil de propostas (por status, por vendedor, por produto)
- [ ] Taxa de conversão por período
- [ ] Relatório de produtos mais vendidos

**Futuro**
- [ ] Logo e cores da empresa renderizados no PDF (branding)
- [ ] Assinatura digital (integração DocuSign / D4Sign)
- [ ] Templates múltiplos (por segmento ou produto)
- [ ] Editor `viewer` com controle de acesso por proposta
- [ ] Notificações (e-mail ao criar proposta, ao aprovar)

---

## Referência rápida — libs e deps relevantes

| Lib | Uso |
|-----|-----|
| `@supabase/ssr` | Auth + DB no App Router |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop em BlockEditor, SortableListEditor, SortableFaqEditor |
| `react-hook-form` | ProposalForm (6 etapas) |
| `@anthropic-ai/sdk` | IA nos blocos |
| `next` 14 (App Router) | Framework principal |
| `tailwindcss` | Estilização |

**Cores customizadas Tailwind:**

| Token | Hex |
|-------|-----|
| `fay-dark` | `#161B20` |
| `fay-green` | `#1FE97C` |
| `fay-green-deep` | `#00B765` |
| `fay-muted` | `#50565C` |
| `fay-border` | (branco/10 — `white/10`) |

---

*Documento gerado com base no estado do código em 2026-06-20. Atualizar após cada fase concluída.*
