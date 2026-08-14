import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgIdForUser } from '@/lib/org'
import { BLOCK_LABELS, type BlockType } from '@/lib/blocks'
import type { Json } from '@/types/database.types'

async function requireAdmin(userId: string, db: ReturnType<typeof createAdminClient>) {
  const { data } = await db.from('profiles').select('role').eq('id', userId).single()
  return data?.role === 'admin'
}

async function templateBelongsToOrg(
  db: ReturnType<typeof createAdminClient>,
  templateId: string,
  orgId: string
): Promise<boolean> {
  const { data } = await db
    .from('proposal_template')
    .select('id')
    .eq('id', templateId)
    .eq('organization_id', orgId)
    .maybeSingle()
  return Boolean(data)
}

// PUT /api/templates/[id]/blocks — replace structure (order + enabled)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const orgId = await getOrgIdForUser(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })

  const db = createAdminClient()
  if (!(await requireAdmin(user.id, db))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  if (!(await templateBelongsToOrg(db, params.id, orgId))) {
    return NextResponse.json({ error: 'Template não encontrado.' }, { status: 404 })
  }

  const { blocks } = await req.json() as {
    blocks: Array<{ type: string; sort_order: number; enabled: boolean }>
  }

  // Fetch current blocks to preserve default_content
  const { data: existing } = await db
    .from('template_block')
    .select('id, type, default_content')
    .eq('template_id', params.id)

  const contentByType = Object.fromEntries(
    (existing || []).map(b => [b.type, b.default_content as Json])
  )

  await db.from('template_block').delete().eq('template_id', params.id)

  const { error } = await db.from('template_block').insert(
    blocks.map(b => ({
      template_id: params.id,
      type: b.type,
      sort_order: b.sort_order,
      enabled: b.enabled,
      title: BLOCK_LABELS[b.type as BlockType] ?? b.type,
      default_content: contentByType[b.type] ?? ({ items: [] } as unknown as Json),
    }))
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH /api/templates/[id]/blocks — update default_content for a block type
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const orgId = await getOrgIdForUser(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })

  const db = createAdminClient()
  if (!(await requireAdmin(user.id, db))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  if (!(await templateBelongsToOrg(db, params.id, orgId))) {
    return NextResponse.json({ error: 'Template não encontrado.' }, { status: 404 })
  }

  const { type, default_content } = await req.json() as {
    type: string
    default_content: Json
  }

  const { error } = await db
    .from('template_block')
    .update({ default_content })
    .eq('template_id', params.id)
    .eq('type', type)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
