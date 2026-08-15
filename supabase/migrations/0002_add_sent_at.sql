-- ============================================================
-- FineAndYou — 0002_add_sent_at.sql (idempotente)
-- A2 (PRD-01): radar de follow-up.
-- sent_at: quando a proposta foi enviada ao cliente (publish).
-- followup_days: janela (dias) apos sent_at para considerar a
-- proposta "parada" se nao houver decisao. Default 3.
-- ============================================================

alter table public.proposal add column if not exists sent_at timestamptz;
alter table public.proposal add column if not exists followup_days int not null default 3;

create index if not exists idx_proposal_sent_at on public.proposal(sent_at);
create index if not exists idx_proposal_opportunity on public.proposal(opportunity_status);
