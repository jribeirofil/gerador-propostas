import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const ALLOWED_TYPES = ['view', 'request'] as const

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const limiter = rateLimit({ key: `update-request:${clientIp(req)}`, limit: 30, windowMs: 60_000 })
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde e tente novamente.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
      )
    }

    const body = await req.json()
    const type = body.type as string

    if (!ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number])) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    const db = createAdminClient()

    const { data: proposal, error } = await db
      .from('proposal')
      .select('id, created_at, validade_dias')
      .eq('public_token', params.token)
      .single()

    if (error || !proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
    }

    const eventType = type === 'view' ? 'expired_opened' : 'update_requested'

    await db.from('proposal_event').insert({
      proposal_id: proposal.id,
      event_type: eventType,
      metadata: null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
