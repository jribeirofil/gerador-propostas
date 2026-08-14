import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_BLOCK_ORDER, BLOCK_LABELS, type BlockType } from '@/lib/blocks'
import type { Json } from '@/types/database.types'

function defaultContent(type: BlockType): Json {
  switch (type) {
    case 'proximos_passos':
      return {
        items: [
          'Validação da proposta com os decisores',
          'Reunião de alinhamento técnico e comercial',
          'Aceite e assinatura do contrato',
          'Implantação e onboarding',
          'Acompanhamento contínuo com o time FineAndYou',
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
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = createAdminClient()
  const body = await req.json()
  const { name, description, is_default, product_slugs } = body as {
    name: string
    description?: string
    is_default?: boolean
    product_slugs?: string[]
  }

  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })

  // If setting as default, clear other defaults first
  if (is_default) {
    await db.from('proposal_template').update({ is_default: false }).eq('is_default', true)
  }

  const { data: template, error } = await db
    .from('proposal_template')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      is_default: is_default ?? false,
      product_slugs: product_slugs || [],
    })
    .select()
    .single()

  if (error || !template) {
    return NextResponse.json({ error: error?.message || 'Erro ao criar template.' }, { status: 500 })
  }

  const blocks = DEFAULT_BLOCK_ORDER.map((type, idx) => ({
    template_id: template.id,
    type,
    sort_order: idx,
    enabled: true,
    title: BLOCK_LABELS[type],
    default_content: defaultContent(type),
  }))

  await db.from('template_block').insert(blocks)

  return NextResponse.json(template)
}
