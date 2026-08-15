import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgIdForUser } from '@/lib/org'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const orgId = await getOrgIdForUser(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })

  const { status, lost_reason, lost_comment } = await req.json() as {
    status: string
    lost_reason?: string
    lost_comment?: string
  }

  if (!['open', 'won', 'lost'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  if (status === 'lost' && !lost_reason) {
    return NextResponse.json({ error: 'Motivo de perda é obrigatório' }, { status: 400 })
  }

  const db = createAdminClient()

  const { data: proposal } = await db
    .from('proposal')
    .select('id')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  const patch: {
    opportunity_status: string
    lost_reason?: string | null
    lost_comment?: string | null
  } = { opportunity_status: status }
  if (status === 'lost') {
    patch.lost_reason = lost_reason ?? null
    patch.lost_comment = lost_comment || null
  } else {
    patch.lost_reason = null
    patch.lost_comment = null
  }

  const { error } = await db.from('proposal').update(patch).eq('id', params.id).eq('organization_id', orgId)
  if (error) return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })

  const eventType =
    status === 'won'  ? 'opportunity_won' :
    status === 'lost' ? 'opportunity_lost' :
    'opportunity_reopened'

  await db.from('proposal_event').insert({
    proposal_id: params.id,
    event_type: eventType,
    created_by: user.id,
    metadata: status === 'lost'
      ? { reason: lost_reason, ...(lost_comment ? { comment: lost_comment } : {}) }
      : null,
  })

  return NextResponse.json({ ok: true })
}
