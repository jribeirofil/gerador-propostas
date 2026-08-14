-- Fase 3 — Signup self-service: trigger handle_new_user v2
-- Novo usuário com `company_name` no user_metadata cria a PRÓPRIA organização
-- (role admin + company_settings + template padrão com blocos genéricos).
-- Sem company_name (ex.: convidado via /api/admin/users) mantém comportamento
-- legado: org raiz + role seller.
begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_name text;
  v_org_id uuid;
  v_template_id uuid;
begin
  v_company_name := nullif(btrim(coalesce(new.raw_user_meta_data->>'company_name', '')), '');

  if v_company_name is null then
    select id into v_org_id from public.organization order by created_at limit 1;

    insert into public.profiles (id, full_name, role, organization_id)
    values (new.id, new.raw_user_meta_data->>'full_name', 'seller', v_org_id);

    return new;
  end if;

  insert into public.organization (name, created_by)
  values (v_company_name, null)
  returning id into v_org_id;

  insert into public.profiles (id, full_name, role, organization_id)
  values (new.id, new.raw_user_meta_data->>'full_name', 'admin', v_org_id);

  -- FK: created_by → profiles(id) — preenchido agora que o perfil existe
  update public.organization set created_by = new.id where id = v_org_id;

  insert into public.company_settings (organization_id, company_name)
  values (v_org_id, v_company_name);

  insert into public.proposal_template (organization_id, name, description, is_default, product_slugs)
  values (v_org_id, 'Proposta padrão', 'Estrutura padrão de proposta comercial.', true, '{}')
  returning id into v_template_id;

  insert into public.template_block (template_id, type, sort_order, enabled, title, default_content)
  select v_template_id, b.type, b.sort_order, true, b.title, b.default_content
  from (
    values
      ('cover'::text,          0,  'Capa'::text,              '{}'::jsonb),
      ('cenario',               1,  'Cenário',                 '{"text": ""}'::jsonb),
      ('objetivos',             2,  'Objetivos',               '{"text": ""}'::jsonb),
      ('solucao',               3,  'Solução',                 '{}'::jsonb),
      ('beneficios',            4,  'Benefícios',              '{"items": []}'::jsonb),
      ('escopo',                5,  'Escopo',                  '{"items": []}'::jsonb),
      ('diferenciais',          6,  'Diferenciais',            '{"items": []}'::jsonb),
      ('faq',                   7,  'FAQ',                     '{"items": []}'::jsonb),
      ('proximos_passos',       8,  'Próximos Passos',         '{"items": ["Validação da proposta com os decisores", "Reunião de alinhamento técnico e comercial", "Aceite e assinatura do contrato", "Implantação e onboarding", "Acompanhamento contínuo"]}'::jsonb),
      ('sobre',                 9,  'Sobre a empresa',         '{"text": ""}'::jsonb),
      ('investimento',          10, 'Investimento',            '{}'::jsonb),
      ('assinatura',            11, 'Assinatura',              '{}'::jsonb)
  ) as b(type, sort_order, title, default_content)
  order by b.sort_order;

  return new;
end;
$$;

commit;
