-- ============================================================
-- Auto-create default template for each organization
-- When an org is created (or first user joins), create a default
-- proposal template with standard style settings
-- ============================================================

-- 1. Update handle_new_user to create a default template for new org
-- (if this is the first user in an organization)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_template_id uuid;
begin
  -- Determine which org: use existing or create new one
  select id into v_org_id from public.organization order by created_at limit 1;

  insert into public.profiles (id, full_name, role, organization_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'admin',
    v_org_id
  );

  -- Create default template for this org if none exists
  if not exists (
    select 1 from public.proposal_template where organization_id = v_org_id
  ) then
    v_template_id := gen_random_uuid();

    insert into public.proposal_template (
      id,
      name,
      description,
      is_default,
      product_slugs,
      organization_id,
      -- Style fields: all starting at defaults from brand
      cover_bg_color,
      body_bg_color,
      body_text_color,
      body_font_size,
      accent_color,
      accent_color_2,
      section_title_color,
      body_line_height,
      body_padding_h,
      body_padding_v,
      heading_font_size
    )
    values (
      v_template_id,
      'Padrão',
      'Template padrão — blocos essenciais para qualquer proposta.',
      true,
      '{}',
      v_org_id,
      -- Colors: green brand theme
      '#FFFFFF',          -- cover_bg_color (white)
      '#FAFAF9',          -- body_bg_color (off-white)
      '#1F2937',          -- body_text_color (dark gray)
      '16',               -- body_font_size
      '#1FE97C',          -- accent_color (brand green)
      '#00B765',          -- accent_color_2 (green deep)
      '#1F2937',          -- section_title_color (dark gray)
      '1.6',              -- body_line_height
      '40',               -- body_padding_h
      '32',               -- body_padding_v
      '24'                -- heading_font_size
    );

    -- Insert default blocks
    insert into public.template_block (
      template_id, type, sort_order, enabled, title, default_content
    )
    values
      (v_template_id, 'cover', 0, true, 'Capa', '{}'::jsonb),
      (v_template_id, 'solucao', 1, true, 'Solução', '{}'::jsonb),
      (v_template_id, 'beneficios', 2, true, 'Benefícios', '{"items": []}'::jsonb),
      (v_template_id, 'escopo', 3, true, 'Escopo', '{"items": []}'::jsonb),
      (v_template_id, 'diferenciais', 4, true, 'Diferenciais', '{"items": []}'::jsonb),
      (v_template_id, 'faq', 5, true, 'FAQ', '{"items": []}'::jsonb),
      (v_template_id, 'proximos_passos', 6, true, 'Próximos Passos', '{"items": ["Validação da proposta com os decisores", "Reunião de alinhamento técnico e comercial", "Aceite e assinatura do contrato", "Implantação e onboarding", "Acompanhamento contínuo"]}'::jsonb),
      (v_template_id, 'investimento', 7, true, 'Investimento', '{}'::jsonb),
      (v_template_id, 'assinatura', 8, true, 'Assinatura', '{}'::jsonb);
  end if;

  return new;
end; $$;
