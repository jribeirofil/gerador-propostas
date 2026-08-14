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

async function requireAdmin(user: { id: string }, db: ReturnType<typeof createAdminClient>) {
  const { data } = await db.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = createAdminClient()
  if (!(await requireAdmin(user, db))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  const body = await req.json()
  const { name, description, is_default, product_slugs, cover_image_url, cover_video_url } = body as {
    name?: string
    description?: string
    is_default?: boolean
    product_slugs?: string[]
    cover_image_url?: string | null
    cover_video_url?: string | null
  }

  // Guard: cannot unset the only default without assigning another first
  if (is_default === false) {
    const { data: current } = await db
      .from('proposal_template')
      .select('is_default')
      .eq('id', params.id)
      .single()

    if (current?.is_default === true) {
      const { data: otherDefault } = await db
        .from('proposal_template')
        .select('id')
        .eq('is_default', true)
        .neq('id', params.id)
        .limit(1)
        .maybeSingle()

      if (!otherDefault) {
        return NextResponse.json(
          { error: 'Defina outro template como padrão antes de remover este.' },
          { status: 400 }
        )
      }
    }
  }

  // Setting this as default: clear all other defaults
  if (is_default === true) {
    await db.from('proposal_template').update({ is_default: false }).eq('is_default', true).neq('id', params.id)
  }

  const { data, error } = await db
    .from('proposal_template')
    .update({
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(is_default !== undefined ? { is_default } : {}),
      ...(product_slugs !== undefined ? { product_slugs } : {}),
      ...(cover_image_url !== undefined ? { cover_image_url: cover_image_url || null } : {}),
      ...(cover_video_url !== undefined ? { cover_video_url: cover_video_url || null } : {}),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = createAdminClient()
  if (!(await requireAdmin(user, db))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  const { data: allTemplates } = await db
    .from('proposal_template')
    .select('id, is_default')
    .order('created_at', { ascending: true })

  const total = allTemplates?.length ?? 0

  if (total <= 1) {
    return NextResponse.json(
      { error: 'É necessário manter pelo menos um template disponível para novas propostas.' },
      { status: 400 }
    )
  }

  const target = allTemplates!.find(t => t.id === params.id)

  // If deleting the default template, auto-promote the next available template
  if (target?.is_default) {
    const next = allTemplates!.find(t => t.id !== params.id)
    if (next) {
      await db.from('proposal_template').update({ is_default: true }).eq('id', next.id)
    }
  }

  await db.from('template_block').delete().eq('template_id', params.id)
  const { error } = await db.from('proposal_template').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Duplicate template
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = createAdminClient()
  if (!(await requireAdmin(user, db))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  const [templateRes, blocksRes] = await Promise.all([
    db.from('proposal_template').select('*').eq('id', params.id).single(),
    db.from('template_block').select('*').eq('template_id', params.id).order('sort_order'),
  ])

  if (!templateRes.data) return NextResponse.json({ error: 'Template não encontrado.' }, { status: 404 })

  const { data: newTemplate, error } = await db
    .from('proposal_template')
    .insert({
      name: `${templateRes.data.name} (cópia)`,
      description: templateRes.data.description,
      is_default: false,
      product_slugs: templateRes.data.product_slugs,
    })
    .select()
    .single()

  if (error || !newTemplate) return NextResponse.json({ error: error?.message }, { status: 500 })

  const sourceBlocks = blocksRes.data || []
  if (sourceBlocks.length > 0) {
    await db.from('template_block').insert(
      sourceBlocks.map(b => ({
        template_id: newTemplate.id,
        type: b.type,
        sort_order: b.sort_order,
        enabled: b.enabled,
        title: b.title,
        default_content: b.default_content,
      }))
    )
  } else {
    // Fallback: create default blocks
    await db.from('template_block').insert(
      DEFAULT_BLOCK_ORDER.map((type, idx) => ({
        template_id: newTemplate.id,
        type,
        sort_order: idx,
        enabled: true,
        title: BLOCK_LABELS[type],
        default_content: defaultContent(type),
      }))
    )
  }

  return NextResponse.json({ id: newTemplate.id })
}
