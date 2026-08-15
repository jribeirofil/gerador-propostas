import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgIdForUser } from '@/lib/org'
import crypto from 'crypto'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const orgId = await getOrgIdForUser(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })

  const db = createAdminClient()

  const { data: proposal, error } = await db
    .from('proposal')
    .select('id, public_token, status')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .single()

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  let token = proposal.public_token as string | null

  if (!token) {
    token = crypto.randomBytes(18).toString('base64url')
    const { error: updateError } = await db
      .from('proposal')
      .update({ public_token: token })
      .eq('id', params.id)
      .eq('organization_id', orgId)
    if (updateError) {
      return NextResponse.json({ error: 'Erro ao gerar token' }, { status: 500 })
    }
  }

  // Atualiza status para 'sent' se ainda estiver em draft/generated
  if (['draft', 'generated'].includes(proposal.status as string)) {
    await db
      .from('proposal')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('organization_id', orgId)

    await db.from('proposal_event').insert({
      proposal_id: params.id,
      event_type: 'sent',
      created_by: user.id,
    })
  }

  return NextResponse.json({ token })
}
