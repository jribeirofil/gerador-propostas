# Decisões — Modelo de conteúdo da proposta

- **Status:** APROVADO (dono, 2026-08-14) — referência única antes de codar
- **Objetivo:** acabar com a confusão de "onde o texto mora". Cada texto tem **um único dono** e a precedência é previsível.
- **Referência de mercado:** padrão PandaDoc/Proposify/Qwilr + CPQ — catálogo de produtos é a fonte dos fatos; template é estrutura + processo de venda; empresa é branding/termos.

---

## Os 4 donos

| Dono | O que guarda |
|---|---|
| **Empresa** (settings da org) | Identidade e termos: logo, capa, cores, contatos, rodapé, "Sobre a empresa", condições comerciais **globais** |
| **Produto** (página de produtos) | Fatos do produto: nome, descrição, benefícios, escopo, diferenciais, FAQ, preços e condições **específicas** do produto |
| **Template** | **Só estrutura**: quais seções aparecem, em que ordem, on/off — **+** texto de processo "Próximos passos". **Não guarda texto de produto.** |
| **Proposta** | O negócio: cliente, produtos escolhidos, valores, condições negociadas — e os blocos (cópia viva, editável) |

## Regra única

> *Fato do produto → **produto** · processo de venda → **template** · identidade e termos da empresa → **empresa** · o que muda por negócio → **proposta**.*

**Precedência (substitui, nunca mescla):** proposta → produto → empresa.
Template não guarda texto, então não compete por texto; ele define apenas a estrutura.

## Onde fica cada conteúdo

| Conteúdo | Dono |
|---|---|
| Logo, capa, cores, contatos, rodapé | Empresa |
| Sobre a empresa | Empresa |
| Condições comerciais globais (padrão, validade) | Empresa |
| Nome, descrição, benefícios, escopo, diferenciais, FAQ | Produto |
| Preço e condições específicas do produto | Produto |
| Seções do documento (quais, ordem, on/off) | Template |
| Próximos passos | Template |
| Cliente, produtos, valores, condições negociadas | Proposta |

## Como a proposta é criada

1. **Cliente** — dados básicos
2. **Produtos** — escolha; os blocos são copiados dos **produtos** (fatos), seguindo a **estrutura do template**
3. **Condições comerciais** — pré-selecionadas (produto → empresa) e **editáveis**
4. **Resumo / prévia do documento** — render real (o que o cliente vê) → **Gerar**

Sem etapa de diagnóstico/contexto. Depois de gerada, o vendedor pode editar os blocos da proposta; **seção vazia → some** (nada é inventado no render).

## Estrutura do documento

Capa → dados de contato → Solução recomendada (produtos) → Investimento (recorrente/pontual) → Totais → Condições comerciais → Próximos passos → Sobre a empresa.

A seção **Contexto não existe mais** (blocos `cenario`/`objetivos` saem do modelo).

## Impactos de migração (para o código)

> Status da implementação em 14/08: código pronto e build limpo; resta aplicar o SQL abaixo.

- [x] `buildProposalBody` em `src/lib/pdf-template.ts`: seção Contexto removida; fallbacks hardcoded removidos (condições default, próximos passos, "Com base no cenário..."); seção vazia → some.
- [x] Campo novo na `proposal`: `commercial_conditions` (condições negociadas no passo "Condições").
- [x] Blocos `cenario`/`objetivos`/`sobre`: parados de criar em novas propostas; `sobre` lido das `company_settings` (bloco legado é só fallback).
- [x] "Sobre a empresa" e condições globais: leitura direta das `company_settings`.
- [x] Template: `DEFAULT_BLOCK_ORDER` sem os blocos removidos; `proximos_passos` sem default hardcoded (vazio → seção some).
- [ ] **SQL pendente (aplicar no Supabase):** `add-model-content.sql` — `company_settings.company_about`, `product.commercial_conditions`, `proposal.commercial_conditions`.
- [ ] Prévia real no passo Resumo (render do documento antes de gerar) — próxima iteração.
