# Auditoria Técnica — FineAndYou Propostas

> Data: 20 de junho de 2026  
> Escopo: Fase I completa (Motor de Precificação + Sistema de Blocos + IA + Biblioteca de Conteúdo)  
> Instrução: documento de leitura e análise. Nenhum código foi alterado.

---

## 1. Navegação

### Estrutura da sidebar

A navegação é gerenciada por `src/components/layout/Sidebar.tsx`. Há dois grupos de links: um para usuários comuns e outro restrito a `role === 'admin'`.

**Área comum (todos os usuários autenticados)**
- `/dashboard` — Listagem de propostas

**Área administrativa (`role === 'admin'`)**
| Rota | Descrição |
|------|-----------|
| `/dashboard/admin/produtos` | Catálogo de produtos |
| `/dashboard/admin/conteudo` | Biblioteca de conteúdo |
| `/dashboard/admin/usuarios` | Gestão de usuários |
| `/dashboard/admin/configuracoes` | Configurações da empresa |

O controle de exibição da seção admin é feito no lado cliente via leitura do perfil do usuário logado. A rota em si também protegida por `requireAdmin()` no servidor.

### Layout raiz

`src/app/dashboard/layout.tsx` envolve todas as rotas do dashboard com a Sidebar e o ToastProvider. A autenticação não é verificada no layout — cada página verifica individualmente via `createClient().auth.getUser()` ou `requireAdmin()`.

---

## 2. Fluxo de Propostas

### Criação (nova proposta)

1. Usuário acessa `/dashboard` e clica em "Nova proposta"
2. `ProposalForm` (modo `new`) abre em 3 etapas (Steps):
   - **Step 1** — Dados do cliente (empresa, CNPJ, contato, cargo, e-mail, WhatsApp, colaboradores, segmento)
   - **Step 2** — Diagnóstico (dor principal, objetivo, obs. comerciais)
   - **Step 3** — Produtos e precificação (seleção, tipo de preço, quantidade, desconto, notas)
3. Ao salvar, o formulário chama a API `/api/proposals` (POST) que:
   - Cria ou reutiliza o registro em `clients`
   - Cria o registro em `proposal`
   - Cria registros em `proposal_product` com snapshot congelado dos dados do produto
4. O usuário é redirecionado para `/dashboard/propostas/[id]/pdf`

### Visualização da proposta (hub)

`/dashboard/propostas/[id]/pdf` é o hub de uma proposta. É uma página **client-side** que:
- Faz fetch para `/api/proposals/[id]/pdf` (GET) que retorna HTML renderizado
- Exibe o HTML em um `<iframe srcDoc>`
- Oferece ações: Editar, Duplicar, Prévia Web, Conteúdo (blocos), Arquivar, Exportar PDF

### Edição de proposta

`/dashboard/propostas/[id]/editar` carrega os dados existentes da proposta + produtos e pre-popula o `ProposalForm` no modo `edit`. Ao salvar, gera uma **nova versão** (version + 1) dentro do mesmo `version_group`. A versão anterior é preservada.

### Duplicação

`/dashboard/propostas/[id]/duplicar` pré-popula o `ProposalForm` com produtos e condições da proposta original, mas com campos do cliente em branco. Resulta numa proposta completamente nova (novo `version_group`).

### Blocos de conteúdo

`/dashboard/propostas/[id]/blocos` abre o `BlockEditor` (DnD + inline editing). Se a proposta ainda não tiver blocos, `createBlocksFromTemplate` é chamado automaticamente para inicializá-los.

### Preview web

`/dashboard/propostas/[id]/preview` renderiza o `ProposalPreview` em modo leitura com toolbar de impressão. `PrintButton` (componente client) chama `window.print()`.

### Arquivamento

Proposta pode ser arquivada via botão na página PDF. O campo `is_archived` é setado para `true` e `archived_at` para o timestamp atual. Propostas arquivadas ficam ocultas na listagem principal (filtradas no dashboard) mas não são deletadas.

### Versionamento e deduplicação

- Cada proposta tem `version` (número inteiro) e `version_group` (UUID — igual ao id da primeira proposta daquele grupo)
- O dashboard agrupa por `version_group` e exibe apenas a versão mais recente de cada grupo
- A deduplicação é feita **client-side** em `ProposalTable` após buscar todas as propostas não-arquivadas

### Autosave (localStorage)

O `ProposalForm` salva rascunhos localmente usando três chaves:
- `fay:draft:new` — nova proposta
- `fay:draft:edit:{id}` — edição
- `fay:draft:dup:{id}` — duplicação

O rascunho é restaurado ao abrir o formulário e limpo após salvar com sucesso.

---

## 3. Estrutura Administrativa

### Admin Guard

`src/lib/admin-guard.ts` exporta `requireAdmin()`. Essa função:
1. Verifica autenticação via `createClient().auth.getUser()`
2. Busca `profiles.role` do usuário autenticado
3. Redireciona para `/dashboard` se `role !== 'admin'`
4. Retorna `{ user, profile }` se autorizado

É usada em todas as páginas admin server-side.

### Catálogo de Produtos (`/admin/produtos`)

- Lista todos os produtos ordenados por `sort_order`
- Link para `/admin/produtos/novo` e `/admin/produtos/[id]` (edição)
- Cada produto tem: nome, slug, descrição, status (ativo/inativo)
- Sub-páginas gerenciam benefícios, escopo, FAQ e diferenciais do produto (via abas)
- Usa `createClient()` (SSR com anon key) — funcionou porque as políticas RLS de leitura de `product` permitem usuários autenticados

### Biblioteca de Conteúdo (`/admin/conteudo`)

- Lista e cria itens reutilizáveis agrupados por tipo de bloco
- Usa `createAdminClient()` no servidor (necessário por políticas RLS restritivas)
- Tipos disponíveis: `cenario`, `objetivos`, `proximos_passos`, `sobre`, `diferenciais`, `faq`
- Gerenciado pelo componente `ContentLibraryManager`

### Usuários (`/admin/usuarios`)

- Lista usuários via RPC `admin_list_users` (função SQL com acesso admin)
- Permite criar usuário via `/api/admin/users` (POST) — usa `createAdminClient()` para criar na auth do Supabase
- Link para `/admin/usuarios/[id]` para editar role, cargo, telefone, status ativo
- Detecta "último admin" e impede desativação ou rebaixamento

### Configurações (`/admin/configuracoes`)

- Formulário com 5 seções: Empresa, Branding, PDF, Assinatura padrão, Inteligência Artificial
- Persiste na tabela `company_settings` (singleton — uma linha)
- O campo `ai_tone` (adicionado na Fase I) é injetado nos prompts da IA

---

## 4. Entidades do Banco de Dados

### Tabelas — visão geral

| Tabela | Finalidade |
|--------|-----------|
| `profiles` | Perfil de usuário (role, nome, cargo, telefone, ativo) |
| `company_settings` | Configurações da empresa (singleton) |
| `clients` | Clientes cadastrados |
| `product` | Catálogo de produtos |
| `product_benefit` | Benefícios de cada produto |
| `product_scope` | Itens de escopo de cada produto |
| `product_faq` | FAQ de cada produto |
| `product_differential` | Diferenciais de cada produto |
| `price_table` | Tabelas de preços por produto |
| `price_table_item` | Faixas de preço (min/max quantidade × preço unitário) |
| `proposal` | Proposta comercial |
| `proposal_product` | Produtos incluídos em uma proposta (com snapshot e pricing) |
| `proposal_block` | Blocos de conteúdo de uma proposta |
| `proposal_event` | Log de eventos da proposta (pdf_generated, archived, etc.) |
| `proposal_template` | Templates de proposta (define quais blocos e em que ordem) |
| `template_block` | Blocos padrão de um template |
| `content_library` | Biblioteca de textos e listas reutilizáveis |

### Campos notáveis

**`proposal`**
- `version` (int) + `version_group` (uuid) — controle de revisões
- `is_archived` (bool) + `archived_at` (timestamptz) — soft delete
- `template_id` — FK para `proposal_template` (pode ser null)
- `diagnosis` / `objectives` — campos legados (substituídos pelos blocos `cenario` e `objetivos`)
- `total_monthly` / `total_setup` / `discount_percent` / `discount_value` — totais calculados
- `validade_dias`, `forma_pagamento`, `prazo_implantacao` — condições comerciais

**`proposal_product`**
- `snapshot` (jsonb) — cópia congelada de nome, descrição, benefícios, escopo, diferenciais e FAQ no momento da proposta
- `pricing_type` — `monthly | one_time | per_employee | per_project`
- `unit_value`, `monthly_value`, `setup_value` — valores após desconto
- `manual_override` + `override_reason` — flag para preços negociados manualmente

**`proposal_block`**
- `type` (text) — um dos 12 tipos da Fase I (CHECK constraint atualizado)
- `content_json` (jsonb) — estrutura varia por tipo (ver Seção 5)
- `enabled` (bool) — bloco pode ser desativado sem ser excluído
- `sort_order` (int) — posição no documento

**`company_settings`**
- `ai_tone` (text, nullable) — instrução de tom para a IA (adicionado na Fase I, requer migration manual)
- `signer_name/role/email/phone` — dados do assinante padrão (ainda não usados no PDF)
- `logo_url`, `primary_color`, `secondary_color` — branding (ainda não aplicado ao PDF)

**`content_library`**
- `type` — mesmo vocabulário dos tipos de bloco (`cenario`, `objetivos`, etc.)
- `content` (jsonb) — mesma estrutura do `content_json` dos blocos
- `created_by` — FK para `profiles`

**`proposal_template`**
- `product_slugs` (text[]) — slugs dos produtos associados ao template (para seleção automática)
- `is_default` (bool) — se verdadeiro, usado quando nenhum template específico é encontrado

---

## 5. Proposal Blocks

### Os 12 tipos de bloco (Fase I)

| Tipo | Label | Conteúdo |
|------|-------|----------|
| `cover` | Capa | Auto-renderizado (dados da proposta) |
| `cenario` | Cenário | `{ text: string }` |
| `objetivos` | Objetivos | `{ text: string }` |
| `solucao` | Solução | Auto-renderizado (produtos) |
| `beneficios` | Benefícios | `{ items: string[] }` |
| `escopo` | Escopo | `{ items: string[] }` |
| `diferenciais` | Diferenciais | `{ items: string[] }` |
| `faq` | FAQ | `{ items: { question: string; answer: string }[] }` |
| `proximos_passos` | Próximos Passos | `{ items: string[] }` |
| `sobre` | Sobre a FineAndYou | `{ text: string }` |
| `investimento` | Investimento | Auto-renderizado (totais da proposta) |
| `assinatura` | Assinatura | Auto-renderizado (dados do signatário) |

### Classificações dos blocos

Definidas em `src/lib/blocks.ts`:

```typescript
REQUIRED_BLOCKS      = ['cover', 'solucao', 'investimento', 'assinatura']
AUTO_RENDER_BLOCKS   = ['cover', 'solucao', 'investimento', 'assinatura']
AI_BLOCK_TYPES       = ['cenario', 'objetivos', 'diferenciais', 'proximos_passos', 'sobre']
LIBRARY_BLOCK_TYPES  = ['cenario', 'objetivos', 'proximos_passos', 'sobre', 'diferenciais', 'faq']
PRODUCT_DERIVED_BLOCKS = ['beneficios', 'escopo', 'diferenciais', 'faq']
```

- `REQUIRED_BLOCKS`: não podem ser desativados no `BlockEditor`
- `AUTO_RENDER_BLOCKS`: não têm editor de conteúdo — são gerados a partir dos dados da proposta
- `AI_BLOCK_TYPES`: exibem o botão "✨ IA" no editor (requer texto existente para ser acionado)
- `LIBRARY_BLOCK_TYPES`: exibem o picker da biblioteca de conteúdo no editor
- `PRODUCT_DERIVED_BLOCKS`: conteúdo inicial populado a partir dos snapshots dos produtos

### Inicialização de blocos

Ao acessar `/blocos` ou `/preview`, se `proposal_block` não tiver registros para aquela proposta:
1. `createBlocksFromTemplate` é chamado com o `template_id` da proposta
2. Se não houver template, usa `DEFAULT_BLOCK_ORDER` com `fallbackContent()` para cada tipo
3. Se houver template, mescla `template_block.default_content` com dados de produto para os `PRODUCT_DERIVED_BLOCKS`

### Cópia de blocos em edição e duplicação

- **Edição** (`/editar`): os blocos são copiados da proposta-fonte via `copyBlocksFromProposal`
- **Duplicação** (`/duplicar`): idem — o conteúdo editorial é preservado

### Drag-and-drop e persistência

O `BlockEditor` usa `@dnd-kit/core` + `@dnd-kit/sortable`. Cada reordenação persiste imediatamente via `PATCH /api/proposals/[id]/blocks/reorder`. Alterações de conteúdo são salvas por debounce ou ao clicar "Salvar".

---

## 6. Templates

### Estrutura

- `proposal_template` — template com nome, slug, descrição, `is_default`, `product_slugs`
- `template_block` — blocos do template (tipo, ordem, habilitado, título, conteúdo padrão)

### Seleção automática de template

Durante a criação da proposta (Step 3 / `ProposalForm`), a lógica seleciona o template cujos `product_slugs` têm a maior intersecção com os produtos selecionados. Se nenhum template específico for encontrado, usa o marcado como `is_default`.

### Uso no `createBlocksFromTemplate`

```
proposal.template_id → template_block[] → proposta + fallbackContent para PRODUCT_DERIVED_BLOCKS
```

Se `template_id` for `null` ou não houver `template_block` para aquele template, usa o `DEFAULT_BLOCK_ORDER` hardcoded em `blocks.ts`.

### Estado atual

Templates existem no banco mas a UI de gestão de templates (admin) ainda **não foi implementada**. Templates só podem ser criados/gerenciados via SQL ou Supabase Studio.

---

## 7. Inteligência Artificial

### Modelo e configuração

- Modelo: `claude-haiku-4-5-20251001`
- `max_tokens`: 256 (limite explícito para evitar respostas longas)
- Chave: `ANTHROPIC_API_KEY` (variável de ambiente)

### Endpoint

`POST /api/proposals/[id]/blocks/[blockId]/ai`

**Body:**
```json
{
  "operation": "improve" | "rewrite" | "expand",
  "content": "texto atual do bloco",
  "blockType": "cenario" | "objetivos" | ...
}
```

**Response:**
```json
{ "result": "texto gerado pela IA" }
```

### Operações disponíveis

| Operação | Instrução |
|----------|-----------|
| `improve` | Melhore o texto: mais claro, profissional e convincente |
| `rewrite` | Reescreva com novas palavras preservando significado |
| `expand` | Expanda com mais detalhes, exemplos ou contexto |

### Tom configurável

- `company_settings.ai_tone` é lido a cada chamada à IA
- Se preenchido, é injetado como instrução adicional no prompt:  
  `"Instrução de tom: {ai_tone}"`
- Deixar em branco usa o comportamento padrão do modelo

### Restrições de uso

- O botão "✨ IA" só é habilitado quando o bloco tem texto existente (`disabled={!text.trim()}`)
- Apenas blocos em `AI_BLOCK_TYPES` exibem o botão
- O resultado não é salvo automaticamente — o usuário pode aceitar ou ignorar

### Segurança

- A rota verifica autenticação via `createClient().auth.getUser()`
- O `blockId` é validado contra o `proposal_id` antes de chamar a API da Anthropic (evita acesso cross-proposta)

---

## 8. Permissões

### Padrão geral: SSR com dois clientes

O sistema usa dois clientes Supabase:

| Cliente | Chave | Bypassa RLS? | Uso |
|---------|-------|-------------|-----|
| `createClient()` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Não | Verificação de auth (`auth.getUser()`), leituras de dados do usuário logado |
| `createAdminClient()` | `SUPABASE_SERVICE_ROLE_KEY` | **Sim** | Operações server-side em tabelas com RLS restritivas |

### Onde `createAdminClient()` é obrigatório

| Página / Rota | Motivo |
|--------------|--------|
| `/admin/conteudo` (server page) | `content_library` tem RLS; SSR não tem sessão |
| `/propostas/[id]/blocos` (server page) | `proposal_block` INSERT/SELECT com RLS |
| `/propostas/[id]/preview` (server page) | Idem + `company_settings` |
| `/api/proposals/[id]/blocks/[blockId]/ai` | Leitura de `proposal_block` e `company_settings` |
| `/api/admin/users` | Criação de usuário via `auth.admin.createUser()` |

### Políticas RLS implementadas

**`content_library`**
- SELECT: todos os usuários autenticados
- INSERT: autenticados (com `auth.uid() = created_by`)
- DELETE: criador do item ou admin

**`template_block`**
- SELECT: todos os usuários autenticados
- INSERT/UPDATE/DELETE: admins somente

**`proposal_block`**
- SELECT: dono da proposta ou admin
- INSERT: dono da proposta ou admin
- UPDATE: dono da proposta ou admin
- DELETE: dono da proposta ou admin

### Verificação de admin

`requireAdmin()` em `src/lib/admin-guard.ts` verifica `profiles.role === 'admin'`. Redireciona para `/dashboard` se não for admin. Usado em todas as páginas admin.

### Criação de usuário

A rota `POST /api/admin/users` verifica role=admin **antes** de chamar `createAdminClient()`, garantindo que a chave de serviço nunca seja exposta a não-admins.

### Consideração: `database.types.ts` desatualizado

O tipo `company_settings.Row` em `database.types.ts` **não inclui `ai_tone`** — o campo foi adicionado via SQL (`ALTER TABLE`) mas o tipo não foi regenerado. Isso não causa erro em runtime (Supabase retorna o campo igualmente), mas pode causar falsos negativos no TypeScript.

---

## 9. Componentes Principais

### `ProposalForm` (`src/components/proposal/ProposalForm.tsx`)

Formulário multi-step (3 etapas) para criação/edição/duplicação de propostas.
- Gerencia estado completo via `useState` + autosave no `localStorage`
- Props principais: `mode` (`new` | `edit` | `duplicate`), `initialData`, `sourceProposalId`
- Etapas: `Step1Client` → `Step2Diagnosis` → `Step3Products`

### `Step3Products` (`src/components/proposal/Step3Products.tsx`)

Gerencia a seleção de produtos e configuração de preços.
- Busca catálogo de produtos e tabelas de preços do Supabase
- Para `calculation_type = 'per_employee'`, busca `price_table_item` e calcula `unit_value` automaticamente por faixa de quantidade
- Suporta `manual_override` para preços negociados fora da tabela

### `ProposalTable` (`src/components/proposal/ProposalTable.tsx`)

Tabela de listagem do dashboard.
- Deduplicação por `version_group` client-side
- Toggle para exibir versões anteriores
- Filtros por status e busca por empresa/contato
- Inclui `StatusBadge` e links para as ações de cada proposta

### `BlockEditor` (`src/components/proposal/BlockEditor.tsx`)

Componente client-side complexo que gerencia os blocos de uma proposta.
- DnD via `@dnd-kit` para reordenação
- Sub-editores: `TextEditor`, `ListEditor`, `FaqEditor`
- `useEffect` sincroniza estado local quando `block.content_json` muda (necessário para o library picker funcionar)
- Botão IA condicionado a `AI_BLOCK_TYPES` e a ter texto existente
- Picker de biblioteca condicionado a `LIBRARY_BLOCK_TYPES`
- Blocos `AUTO_RENDER_BLOCKS` exibem preview estático, sem editor

### `ProposalPreview` (`src/components/proposal/ProposalPreview.tsx`)

Renderização visual da proposta para o browser (modo web preview).
- Client component (`'use client'`)
- Consome `ProposalBlock[]` e dados da proposta
- Renderiza cada bloco habilitado na ordem correta
- Blocos `AUTO_RENDER_BLOCKS` calculam o conteúdo a partir dos dados da proposta

### `ContentLibraryManager` (`src/components/admin/ContentLibraryManager.tsx`)

Gerencia a biblioteca de conteúdo reutilizável.
- Tabs por tipo de bloco
- Formulário inline `NewItemForm` para criação
- Suporta texto (`cenario`, `objetivos`, `sobre`), listas e FAQ

### `CompanySettingsForm` (`src/components/admin/CompanySettingsForm.tsx`)

5 seções: Empresa, Branding, PDF, Assinatura, IA.
- Usa `supabase.upsert` para manter o singleton de `company_settings`
- `ai_tone` configurável via textarea

### `UserList` / `UserEditForm` / `NewUserDialog`

Gestão completa de usuários: listagem com avatares, edição de perfil, criação via modal.
- Cria usuário chamando `POST /api/admin/users` (que usa service role)
- Dispara `resetPasswordForEmail` para onboarding do novo usuário

### Componentes UI

| Componente | Finalidade |
|-----------|-----------|
| `StatusBadge` | Badge colorido para status da proposta (7 estados) |
| `ConfirmDialog` | Modal de confirmação com variante `danger` |
| `Toast` / `useToast` | Notificações não-bloqueantes |
| `PrintButton` | Client component isolado para `window.print()` |

---

## 10. Rotas

### Páginas (App Router)

| Rota | Tipo | Proteção |
|------|------|---------|
| `/login` | Server | Pública |
| `/dashboard` | Client | `auth.getUser()` |
| `/dashboard/propostas/nova` | Client (form) | `auth.getUser()` |
| `/dashboard/propostas/[id]/pdf` | Client | `auth.getUser()` (via API) |
| `/dashboard/propostas/[id]/editar` | Server | `auth.getUser()` |
| `/dashboard/propostas/[id]/duplicar` | Server | `auth.getUser()` |
| `/dashboard/propostas/[id]/blocos` | Server | `auth.getUser()` + `createAdminClient()` |
| `/dashboard/propostas/[id]/preview` | Server | `auth.getUser()` + `createAdminClient()` |
| `/dashboard/admin/produtos` | Server | `requireAdmin()` |
| `/dashboard/admin/produtos/[id]` | Server | `requireAdmin()` |
| `/dashboard/admin/produtos/novo` | Server | `requireAdmin()` |
| `/dashboard/admin/conteudo` | Server | `requireAdmin()` + `createAdminClient()` |
| `/dashboard/admin/usuarios` | Server | `requireAdmin()` |
| `/dashboard/admin/usuarios/[id]` | Server | `requireAdmin()` |
| `/dashboard/admin/configuracoes` | Server | `requireAdmin()` |

### API Routes

| Método | Endpoint | Finalidade |
|--------|----------|-----------|
| `POST` | `/api/proposals` | Criar proposta |
| `GET` | `/api/proposals/[id]/pdf` | Gerar HTML do PDF |
| `GET` | `/api/proposals/[id]/blocks` | Listar blocos |
| `PATCH` | `/api/proposals/[id]/blocks/reorder` | Reordenar blocos |
| `PATCH` | `/api/proposals/[id]/blocks/[blockId]` | Salvar conteúdo do bloco |
| `POST` | `/api/proposals/[id]/blocks/[blockId]/ai` | Operação de IA no bloco |
| `POST` | `/api/admin/users` | Criar usuário (admin only) |
| `PATCH` | `/api/admin/users/[id]` | Editar usuário (admin only) |

### Geração de PDF

O PDF é gerado client-side via `<iframe>` com `srcDoc`:
1. `/api/proposals/[id]/pdf` retorna `{ html, proposal }`
2. A página `/pdf` injeta o HTML num `<iframe srcDoc>`
3. O botão "Exportar PDF" chama `iframe.contentWindow.print()`
4. `buildPdfHtml` em `src/lib/pdf-template.ts` gera o HTML completo com estilos inline

O HTML renderizado pelos blocos extrai `content_json` de cada bloco habilitado e renderiza conforme o tipo.

---

## 11. Estado Atual do Produto

### O que está completo (Fase I)

| Funcionalidade | Status |
|---------------|--------|
| Criação de propostas multi-step | ✅ Completo |
| Precificação automática por faixa | ✅ Completo |
| Desconto por item e global | ✅ Completo |
| Versionamento de propostas | ✅ Completo |
| Soft delete (arquivamento) | ✅ Completo |
| Autosave com localStorage | ✅ Completo |
| Sistema de blocos (12 tipos) | ✅ Completo |
| Drag-and-drop de blocos | ✅ Completo |
| Biblioteca de conteúdo reutilizável | ✅ Completo |
| AI (improve/rewrite/expand) | ✅ Completo |
| Tom de voz da IA configurável | ✅ Completo |
| Preview web de proposta | ✅ Completo |
| Geração de PDF via iframe | ✅ Completo |
| Catálogo de produtos admin | ✅ Completo |
| Gestão de usuários admin | ✅ Completo |
| Configurações da empresa | ✅ Completo |
| Templates de proposta | ✅ Parcial (banco pronto; UI admin ausente) |
| Log de eventos (`proposal_event`) | ✅ Registrado (não exibido na UI) |

### Limitações e dívidas técnicas conhecidas

1. **`database.types.ts` desatualizado**: `company_settings` não inclui `ai_tone`. Nenhum erro em runtime, mas IntelliSense falha.

2. **Templates sem UI admin**: Templates só gerenciáveis via Supabase Studio ou SQL.

3. **Branding não aplicado ao PDF**: `logo_url`, `primary_color`, `secondary_color` são persistidos mas ignorados pelo `buildPdfHtml`.

4. **Assinatura padrão não usada**: `signer_name/role/email/phone` em `company_settings` existem mas o PDF usa apenas os dados do usuário logado.

5. **`proposal_event` sem UI**: Eventos são gravados (`pdf_generated`, `archived`) mas não há timeline ou log de auditoria na interface.

6. **Listagem de propostas**: Sem paginação — pode degradar com volume alto.

7. **RLS de `product` / `product_benefit` etc.**: Não auditadas diretamente neste documento; usam `createClient()` SSR. Se tiverem políticas restritivas podem falhar silenciosamente (mesmo padrão do bug de `content_library`).

8. **Constraint `proposal_block_type_check`**: Foi atualizada para incluir os 12 tipos da Fase I. Qualquer adição futura de tipo requer nova migration.

9. **`diagnosis` / `objectives` na tabela `proposal`**: Campos legados. Os dados agora vivem nos blocos `cenario` e `objetivos`. O `buildPdfHtml` faz fallback para esses campos se os blocos não existirem.

---

## 12. Mapa de Dependências

### Dependências externas principais

| Dependência | Versão aprox. | Uso |
|-------------|--------------|-----|
| Next.js 14 | 14.x | Framework principal (App Router) |
| Supabase JS | 2.x | Banco de dados + auth |
| `@anthropic-ai/sdk` | Latest | IA para blocos |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Latest | Drag-and-drop dos blocos |
| `date-fns` | 3.x | Formatação de datas no PDF |
| Tailwind CSS | 3.x | Estilização |
| `font-sora` | via CSS | Tipografia principal |

### Fluxo de dados — proposta completa

```
ProposalForm (3 steps)
  └── POST /api/proposals
        ├── INSERT clients
        ├── INSERT proposal
        └── INSERT proposal_product[]
              └── snapshot congelado de product.*

/propostas/[id]/pdf (client page)
  └── GET /api/proposals/[id]/pdf
        ├── SELECT proposal + clients
        ├── SELECT proposal_product
        ├── SELECT proposal_block (enabled)
        └── buildPdfHtml(proposal, items, blocks, settings)
              └── blockContent() → content_json por tipo

/propostas/[id]/blocos (server page)
  └── createAdminClient()
        ├── SELECT proposal + products
        ├── SELECT proposal_block
        └── se vazio → createBlocksFromTemplate()
                        ├── SELECT template_block (se template_id)
                        └── INSERT proposal_block[]

BlockEditor (client component)
  ├── PATCH /api/proposals/[id]/blocks/[blockId]  (salvar)
  ├── PATCH /api/proposals/[id]/blocks/reorder     (DnD)
  └── POST  /api/proposals/[id]/blocks/[blockId]/ai (IA)
              └── Anthropic claude-haiku-4-5-20251001

/propostas/[id]/preview (server page)
  └── createAdminClient()
        ├── SELECT proposal + client + products
        ├── SELECT proposal_block
        └── ProposalPreview (client component)
```

### Dependências internas críticas

```
src/lib/blocks.ts
  ├── Importado por: BlockEditor, ProposalPreview, buildPdfHtml,
  │                  /blocos page, /preview page, ContentLibraryManager
  └── Define: BlockType, constantes de classificação, createBlocksFromTemplate

src/lib/pdf-template.ts
  └── Importado por: /api/proposals/[id]/pdf

src/lib/admin-guard.ts
  └── Importado por: todas as páginas /admin/*

src/lib/supabase/admin.ts (createAdminClient)
  └── Importado por: /admin/conteudo, /blocos, /preview, /api/admin/users, /api/.../ai

src/types/database.types.ts
  └── Importado por: múltiplos componentes (tipo Json, tipos de tabela)
      ⚠️ Desatualizado: falta ai_tone em company_settings

src/types/engine.ts (ProductSnapshot, PricingType, etc.)
  └── Importado por: Step3Products, ProposalForm, pdf-template, editar/duplicar pages

src/types/admin.ts (AdminProduct, CompanySettings, AdminUser, etc.)
  └── Importado por: páginas admin e componentes admin
      ⚠️ CompanySettings.ai_tone adicionado manualmente (fora do database.types.ts)
```

---

*Fim da auditoria. Documento gerado a partir da leitura do código-fonte em 20/06/2026.*
