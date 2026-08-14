# Documentação do projeto

Índice de documentação do Gerador de Propostas (FineAndYou Propostas).

## Estrutura

```
docs/
├── README.md          <- você está aqui
├── prds/              <- PRDs, um por fase
│   ├── PRD-00-fase-0-fundacao.md
│   └── PRD-01-fase-1-motor-de-fechamento.md
└── progress/          <- acompanhamento de execução
    └── PROGRESS.md
```

## Como o projeto é organizado

O produto evolui em **fases numeradas**. Cada fase tem um PRD em `docs/prds/` e
seu status de execução em `docs/progress/PROGRESS.md`.

- **Fase 0** — Fundação: baseline do produto (estado atual, commit inicial).
- **Fase 1** — Motor de Fechamento: primeira venda + ciclo proposta → aceite → follow-up.

Regra: toda mudança de escopo material vira PRD antes de vira código.

## Convenções de git

- Histórico limpo, um commit por mudança coesa, mensagem descritiva.
- Fases marcam milestones de desenvolvimento.
- Não commitamos segredos (`.env*` ignorado; só `.env.example` versionado).
