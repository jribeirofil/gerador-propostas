# Análise de Produto — FineAndYou Propostas
*Perspectiva: Product Owner + UX Designer + Arquiteto de Produto*
> Data: 20 de junho de 2026

---

### 1. O que está excessivamente complexo?

**Motor de precificação oculto demais**
A lógica de faixas por número de colaboradores, tabelas de preço, `manual_override` e snapshots congelados é sofisticada — e está toda dispersa entre o banco, o Step 3 e o `pdf-template.ts`. Funciona bem, mas qualquer manutenção futura exige entender cinco camadas ao mesmo tempo.

**Sistema de blocos com cinco classificações**
`REQUIRED_BLOCKS`, `AUTO_RENDER_BLOCKS`, `AI_BLOCK_TYPES`, `LIBRARY_BLOCK_TYPES`, `PRODUCT_DERIVED_BLOCKS` — cinco dimensões ortogonais que se intersectam. Para o desenvolvedor faz sentido. Para produto, fica difícil explicar "por que esse bloco não tem editor?". As classificações existem, mas não há uma regra unificada clara.

**Templates invisíveis**
O sistema de templates existe no banco, foi integrado ao código, mas **não tem UI de gestão**. Isso significa que um recurso estratégico (garantir que cada vendedor comece com a estrutura certa) é operado via SQL. Nenhum PO consegue manter isso sem desenvolvedor.

**Deduplicação de versões client-side**
Buscar todas as propostas não-arquivadas e deduplicar no browser funciona hoje, mas não escala. Com volume, é um gargalo invisível que vai aparecer tarde.

**PDF gerado via iframe + srcDoc**
A abordagem de gerar HTML, injetar num iframe e chamar `window.print()` é funcional mas frágil: quebra em bloqueadores de popup, não gera PDF server-side, não permite envio por e-mail, não cria uma URL permanente do documento.

---

### 2. O que está vazando complexidade para o vendedor?

**A palavra "blocos"**
O vendedor não pensa em "blocos de proposta". Ele pensa em "o texto do cenário", "a lista de benefícios", "os próximos passos". Chamar de "Conteúdo" na toolbar é melhor, mas o editor interno ainda usa a linguagem técnica.

**Toolbar da página PDF com 6 ações simultâneas**
`← Dashboard | Prévia Web | Conteúdo | Editar | Duplicar | Arquivar | Exportar PDF`
Para um vendedor, isso é uma tomada com seis plugues. Ele não sabe a diferença entre "Prévia Web" e "Exportar PDF". Não sabe quando usar "Editar" vs "Duplicar". "Arquivar" ao lado de "Exportar" é perigoso.

**Editor de blocos com drag-and-drop, toggles e múltiplos botões**
O BlockEditor é uma interface de CMS. Drag-and-drop, toggle de ativar/desativar, picker de biblioteca, botão de IA, botão salvar por bloco — tudo ao mesmo tempo. O vendedor quer "escrever o texto e avançar".

**Seleção manual de template no Step 3**
O sistema tenta sugerir o template automaticamente, mas ainda expõe o conceito de "template" e o picker de troca. O vendedor não sabe o que é um template — ele quer selecionar produtos e seguir em frente.

**Manual override com justificativa**
O painel âmbar de override de preço é correto como conceito, mas aparecer dentro do Step 3 ao lado de quantidades e faixas de preço cria sobrecarga cognitiva nessa etapa.

**"Prévia Web" vs "PDF"**
São duas coisas distintas para o sistema, mas para o vendedor é a mesma coisa: "ver como vai ficar". Ter dois caminhos para o mesmo destino confunde.

---

### 3. O que deveria ser movido para Admin?

| O que | Situação atual | Onde deveria estar |
|-------|---------------|-------------------|
| Templates de proposta | Só via SQL | Admin → Templates |
| Configuração de blocos padrão | Hardcoded em `blocks.ts` | Admin → Templates |
| Próximos passos padrão | Hardcoded em `fallbackContent` | Admin → Templates ou Configurações |
| Tom da IA | ✅ Já está em Admin | — |
| Biblioteca de conteúdo | ✅ Já está em Admin | — |
| Logotipo e cores no PDF | Configurado mas ignorado | Deve ser aplicado |
| Assinatura padrão da empresa | Configurada mas ignorada | Deve alimentar o bloco assinatura |
| Condições comerciais padrão | No PDF template mas manual | Editável por admin e aplicada automaticamente |
| Log de eventos da proposta | Gravado no banco, invisível | Timeline visível para admin |

---

### 4. O que pode ser simplificado?

**Unificar "Prévia Web" e "Exportar PDF" em uma única ação**
O vendedor clica em "Ver proposta" → abre o preview em tela cheia → há um botão de imprimir/baixar. Uma tela, uma ação.

**Remover "template" do vocabulário do vendedor**
A seleção de template pode ser 100% automática baseada nos produtos escolhidos. O vendedor nunca precisa saber que existe um template.

**Salvar bloco automaticamente ao perder foco** (autosave por bloco)
Eliminar o botão "Salvar" de cada bloco. O vendedor edita, clica fora, o sistema salva. O botão "Salvar" por bloco fragmenta a experiência.

**Consolidar a toolbar da página de proposta**
De 6 ações para 3: `← Voltar` | `Editar proposta` | `...` (menu overflow com Duplicar, Arquivar, Ver prévia).

**Renomear "Conteúdo" para algo mais intuitivo**
"Editar texto" ou "Personalizar proposta" comunica melhor o que acontece no BlockEditor.

**Simplificar o BlockEditor para o vendedor**
Em vez de drag-and-drop + toggle + expand, usar uma navegação por abas laterais: Cenário | Objetivos | Próximos Passos | Sobre nós. O vendedor não precisa reordenar blocos — isso é configuração de template, responsabilidade do admin.

---

### 5. Quais telas têm responsabilidades demais?

**`/propostas/[id]/pdf` — o hub da proposta**
É simultaneamente: visualizador de PDF, ponto de entrada para edição, ponto de entrada para blocos, ponto de entrada para preview web, ponto de arquivamento, ponto de exportação. Uma tela não deveria ser o hub de seis fluxos distintos.

**`Step3Products` — o step 3 do formulário**
Faz: seleção de produtos, cálculo automático de preços por faixa, desconto por item, override manual, notas internas, seleção de template. São cinco responsabilidades numa só tela.

**`BlockEditor`**
Faz: reordenação (DnD), ativação/desativação, edição de texto, edição de lista, edição de FAQ, chamada de IA, busca na biblioteca, preview de assinatura. É um editor de texto + CMS + configurador de estrutura ao mesmo tempo.

**`CompanySettingsForm`**
Cinco seções (Empresa, Branding, PDF, Assinatura, IA) numa página só. Funciona para o tamanho atual, mas vai ficar inacessível quando crescer.

---

### 6. Qual deveria ser a estrutura ideal da sidebar?

**Área do Vendedor**
```
Propostas          ← lista com busca, filtro, status
Nova Proposta      ← ação principal, destaque visual
```

**Área do Admin** *(colapsável ou separada)*
```
Admin
  ├── Produtos          ← catálogo + precificação
  ├── Templates         ← estrutura e ordem dos blocos por contexto
  ├── Biblioteca        ← textos e listas reutilizáveis
  ├── Usuários          ← gestão de equipe
  └── Configurações     ← empresa, branding, PDF, IA
```

**O que remover da sidebar atual:**
- "Nova proposta" pode ser um botão no topo da lista de propostas, não um item de menu separado
- Admin não precisa de ícone emoji — o agrupamento e hierarquia já comunicam a distinção

---

### 7. Como seria o fluxo ideal do vendedor?

```
1. LISTA DE PROPOSTAS
   → Vê todas as propostas com status e cliente
   → Busca por empresa
   → Clica em "Nova proposta"

2. NOVA PROPOSTA — 4 etapas limpas
   Etapa 1: Cliente
     → Nome da empresa, contato, segmento, número de colaboradores

   Etapa 2: Contexto
     → Qual é o problema? Qual é o objetivo?
     → (substitui "diagnóstico" por linguagem humana)

   Etapa 3: Solução
     → Seleciona produtos (cards visuais, não tabela)
     → Preço calculado automaticamente — vendedor só ajusta quantidade
     → Override de preço vai para overflow menu, não destaque

   Etapa 4: Revisão
     → Resumo: cliente, produtos, total mensal, total único, validade
     → Botão: "Gerar proposta"

3. PROPOSTA GERADA
   → Abre diretamente no preview visual (não no PDF)
   → Toolbar limpa: [← Voltar] [Personalizar texto] [Enviar]
   → "Personalizar texto" leva para o editor simplificado
   → "Enviar" gera link público ou dispara e-mail (feature futura)

4. EDITOR DE TEXTO (simplificado)
   → Abas: Cenário | Objetivos | Diferenciais | Próximos Passos | Sobre nós
   → Textarea com autosave + botão IA discreta
   → Sem DnD, sem toggles, sem "blocos" — só texto
   → Alterações refletem ao vivo no preview

5. ACOMPANHAMENTO
   → Status atualizado: Rascunho → Gerada → Enviada → Aprovada / Perdida
   → Vendedor vê quando o cliente abriu (feature futura)
```

**O vendedor nunca precisa saber que existem templates, blocos, versões ou library pickers.**

---

### 8. Como seria o fluxo ideal do administrador?

```
CONFIGURAR O SISTEMA (uma vez)
  1. Configurações → empresa, logo, cores, rodapé do PDF, tom da IA
  2. Produtos → cadastrar produtos, tabelas de preço, benefícios, escopo
  3. Templates → definir quais blocos aparecem para cada contexto de venda
                  configurar textos padrão de cada bloco
                  vincular template a produtos específicos
  4. Biblioteca → criar textos de cenário, próximos passos, sobre a empresa

GERENCIAR A EQUIPE
  5. Usuários → criar vendedores, atribuir roles, desativar

ACOMPANHAR RESULTADOS (feature futura)
  6. Dashboard → propostas enviadas, abertas, aprovadas, receita em pipeline
  7. Auditoria → log de eventos por proposta, quem editou o quê

MANTER O CATÁLOGO
  8. Atualizar preços nas tabelas (impacto em propostas futuras, não nas existentes)
  9. Atualizar textos da biblioteca (vendedores passam a usar nas próximas propostas)
```

**O admin nunca gera propostas. O vendedor nunca configura o sistema.**

---

### 9. O que falta para ser um verdadeiro Proposal OS?

**Ciclo de vida completo da proposta**

| Feature | Impacto | Complexidade |
|---------|---------|-------------|
| Link público da proposta (sem login) | Alto | Médio |
| Envio por e-mail direto do sistema | Alto | Médio |
| Rastreamento de abertura (pixel/webhook) | Alto | Baixo |
| Botão de aceite no link público | Alto | Médio |
| Notificação ao vendedor quando cliente abre | Alto | Baixo |
| Expiração automática de status | Médio | Baixo |

**Visibilidade e gestão do pipeline**

| Feature | Impacto | Complexidade |
|---------|---------|-------------|
| Dashboard com totais (enviadas, aprovadas, receita) | Alto | Baixo |
| Kanban de propostas por status | Médio | Médio |
| Filtro por vendedor (admin) | Médio | Baixo |
| Exportar lista de propostas (CSV) | Médio | Baixo |

**Qualidade e consistência do conteúdo**

| Feature | Impacto | Complexidade |
|---------|---------|-------------|
| UI de gestão de templates (admin) | Alto | Médio |
| Gerador de proposta com IA desde o diagnóstico | Alto | Alto |
| Comentários/anotações internas na proposta | Médio | Médio |
| Histórico de versões com comparativo | Médio | Alto |

**Integração com o ecossistema**

| Feature | Impacto | Complexidade |
|---------|---------|-------------|
| Webhook ao aprovar (para CRM/ERP) | Alto | Baixo |
| Assinatura digital (Clicksign) | Alto | Alto |
| Upload de logo do cliente na capa | Médio | Baixo |
| PDF com branding aplicado (logo + cor) | Médio | Médio |

---

### 10. O que implementar antes das próximas fases do roadmap?

**Antes de qualquer nova feature, resolver os fundamentos:**

**1. Simplificar o fluxo do vendedor na página de proposta**
A tela `/pdf` com 6 ações é o maior gargalo de UX hoje. Um vendedor real vai travar aqui. Consolidar antes de adicionar mais.

**2. UI de gestão de templates (Admin)**
Sem isso, o sistema de blocos é um recurso que só o dev consegue usar. É a feature mais importante para o PO ter autonomia sobre o produto.

**3. Autosave nos blocos (sem botão "Salvar" por bloco)**
Salvar por bloco é um padrão de CMS técnico, não de ferramenta de vendas. Salvar ao perder o foco remove fricção sem custo de implementação alto.

**4. Resolver débitos técnicos silenciosos**
- Regenerar `database.types.ts` (inclui `ai_tone`, colunas das fases H e I)
- Aplicar branding (logo, cor primária) no PDF — está configurado mas ignorado
- Paginação na listagem de propostas

**5. Status automation básica**
Se uma proposta tem `validade_dias = 30` e passou esse tempo, ela deveria mudar para `expirada` automaticamente. Um Cron Job no Supabase resolve. Sem isso o status vira ruído.

**6. Timeline de eventos visível para o vendedor**
`proposal_event` já grava dados. Exibir "PDF gerado em 20/06 às 14h30" na tela da proposta é uma feature de zero esforço que aumenta confiança no sistema.

---

**Resumo executivo**

O sistema tem uma base técnica sólida e bem estruturada. O risco hoje não é de engenharia — é de UX. A complexidade certa está escondida atrás das abstrações corretas. A complexidade errada está exposta para o vendedor. A prioridade antes de crescer é **estreitar o fluxo do vendedor para o mínimo necessário** e **dar autonomia ao admin sobre templates e conteúdo** — dois movimentos que não exigem reescrever nada, apenas reorganizar o que já existe.

---

*Documento gerado em 20 de junho de 2026.*
