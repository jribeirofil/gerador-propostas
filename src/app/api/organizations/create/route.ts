import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidCNPJ, cleanCNPJ } from '@/lib/cnpj'
import { DEFAULT_BLOCK_ORDER, BLOCK_LABELS, type BlockType } from '@/lib/blocks'
import type { Json } from '@/types/database.types'

function defaultBlockContent(type: BlockType): Json {
  switch (type) {
    case 'proximos_passos':
      return {
        items: [
          'Validação da proposta com os decisores',
          'Reunião de alinhamento técnico e comercial',
          'Aceite e assinatura do contrato',
          'Implantação e onboarding',
          'Acompanhamento contínuo',
        ],
      } as unknown as Json
    case 'cenario':
    case 'objetivos':
    case 'sobre':
      return { text: '' } as unknown as Json
    default:
      return { items: [] } as unknown as Json
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const db = createAdminClient()
  const body = await req.json()
  const { company_name, cnpj } = body as {
    company_name?: string
    cnpj?: string
  }

  if (!company_name?.trim()) {
    return NextResponse.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 })
  }

  if (!cnpj?.trim()) {
    return NextResponse.json({ error: 'CNPJ é obrigatório' }, { status: 400 })
  }

  const cleanedCNPJ = cleanCNPJ(cnpj)

  if (!isValidCNPJ(cleanedCNPJ)) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
  }

  // Verificar se CNPJ já existe
  const { data: existingOrg } = await db
    .from('organization')
    .select('id, name')
    .eq('cnpj', cleanedCNPJ)
    .single()

  if (existingOrg) {
    return NextResponse.json(
      { error: `Esta empresa (${existingOrg.name}) já está registrada no sistema` },
      { status: 409 }
    )
  }

  // Verificar se usuário já tem organização
  const { data: userProfile } = await db
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (userProfile?.organization_id) {
    return NextResponse.json(
      { error: 'Você já tem uma empresa registrada' },
      { status: 403 }
    )
  }

  // Criar organização
  const { data: org, error: orgError } = await db
    .from('organization')
    .insert({
      name: company_name.trim(),
      cnpj: cleanedCNPJ,
      created_by: user.id,
    })
    .select()
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 })
  }

  // Atualizar profile do usuário com a org
  const { error: profileError } = await db
    .from('profiles')
    .update({ organization_id: org.id, role: 'admin' })
    .eq('id', user.id)

  if (profileError) {
    return NextResponse.json({ error: 'Erro ao vincular empresa ao perfil' }, { status: 500 })
  }

  // Criar template padrão
  const templateId = crypto.randomUUID()

  const { error: templateError } = await db
    .from('proposal_template')
    .insert({
      id: templateId,
      name: 'Padrão',
      description: 'Template padrão — blocos essenciais para qualquer proposta.',
      is_default: true,
      product_slugs: [],
      organization_id: org.id,
      cover_bg_color: '#FFFFFF',
      body_bg_color: '#FAFAF9',
      body_text_color: '#1F2937',
      body_font_size: '16',
      accent_color: '#1FE97C',
      accent_color_2: '#00B765',
      section_title_color: '#1F2937',
      body_line_height: '1.6',
      body_padding_h: '40',
      body_padding_v: '32',
      heading_font_size: '24',
    })

  if (templateError) {
    return NextResponse.json({ error: 'Erro ao criar template padrão' }, { status: 500 })
  }

  // Criar blocos padrão
  const blocks = DEFAULT_BLOCK_ORDER.map((type, idx) => ({
    template_id: templateId,
    type,
    sort_order: idx,
    enabled: true,
    title: BLOCK_LABELS[type],
    default_content: defaultBlockContent(type),
  }))

  const { error: blocksError } = await db.from('template_block').insert(blocks)

  if (blocksError) {
    return NextResponse.json({ error: 'Erro ao criar blocos do template' }, { status: 500 })
  }

  return NextResponse.json({
    organization: org,
    template: { id: templateId },
  })
}
