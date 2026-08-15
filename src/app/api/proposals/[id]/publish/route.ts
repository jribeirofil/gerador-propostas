import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgIdForUser } from '@/lib/org'
import crypto from 'crypto'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const orgId = await getOrgIdForUser(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })

  const db = createAdminClient()

  const { data: proposal, error } = await db
    .from('proposal')
    .select('id, public_token, version, status')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .single()

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  const newVersion = (proposal.version as number) + 1
  const token = (proposal.public_token as string | null) ?? crypto.randomBytes(18).toString('base64url')

  let followupDays = 3
  try {
    const body = await req.json()
    if (typeof body.followup_days === 'number' && body.followup_days > 0) {
      followupDays = Math.min(Math.floor(body.followup_days), 365)
    }
  } catch {
    // body ausente ou inválido — usa o default
  }

  const { error: updateError } = await db
    .from('proposal')
    .update({
      version: newVersion,
      status: 'sent',
      public_token: token,
      has_pending_review: false,
      sent_at: new Date().toISOString(),
      followup_days: followupDays,
    })
    .eq('id', params.id)
    .eq('organization_id', orgId)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao publicar versão' }, { status: 500 })
  }

  await db.from('proposal_event').insert({
    proposal_id: params.id,
    event_type: 'sent',
    created_by: user.id,
    metadata: { version: String(newVersion) },
  })

  return NextResponse.json({ token, version: newVersion })
}
