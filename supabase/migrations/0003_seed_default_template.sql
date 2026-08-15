-- ============================================================
-- FineAndYou — 0003_seed_default_template.sql (idempotente)
-- A6 (PRD-01): template padrão curado para a org raiz.
-- Garante que a organização raiz tenha um template padrão com
-- todos os blocos padrão (DEFAULT_BLOCK_ORDER + BLOCK_LABELS).
-- ============================================================

-- 1) Template padrão para a org raiz (id fixo distinto da org)
insert into public.proposal_template (
  id,
  name,
  description,
  is_default,
  product_slugs,
  organization_id
) values (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Padrão',
  'Template padrão do sistema — blocos essenciais para qualquer proposta.',
  true,
  '{}'::text[],
  '00000000-0000-0000-0000-000000000001'::uuid
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_default = excluded.is_default,
  product_slugs = excluded.product_slugs;

-- 2) Blocos do template (idempotente: limpa e recria na ordem padrão)
delete from public.template_block
where template_id = '11111111-1111-1111-1111-111111111111'::uuid;

insert into public.template_block (
  template_id,
  type,
  sort_order,
  enabled,
  title,
  default_content
) values
  -- cover
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'cover',
    0,
    true,
    'Capa',
    '{}'::jsonb
  ),
  -- solucao
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'solucao',
    1,
    true,
    'Solução',
    '{}'::jsonb
  ),
  -- beneficios
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'beneficios',
    2,
    true,
    'Benefícios',
    '{"items": []}'::jsonb
  ),
  -- escopo
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'escopo',
    3,
    true,
    'Escopo',
    '{"items": []}'::jsonb
  ),
  -- diferenciais
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'diferenciais',
    4,
    true,
    'Diferenciais',
    '{"items": []}'::jsonb
  ),
  -- faq
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'faq',
    5,
    true,
    'FAQ',
    '{"items": []}'::jsonb
  ),
  -- proximos_passos
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'proximos_passos',
    6,
    true,
    'Próximos Passos',
    '{"items": ["Validação da proposta com os decisores", "Reunião de alinhamento técnico e comercial", "Aceite e assinatura do contrato", "Implantação e onboarding", "Acompanhamento contínuo"]}'::jsonb
  ),
  -- investimento
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'investimento',
    7,
    true,
    'Investimento',
    '{}'::jsonb
  ),
  -- assinatura
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'assinatura',
    8,
    true,
    'Assinatura',
    '{}'::jsonb
  );

-- 3) Garantir que só existe um template default por org (já há unique index partial)
-- Nada a fazer — index proposal_template_one_default_per_org já existe.