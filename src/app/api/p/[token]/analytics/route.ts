import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const VALID_EVENTS = ['opened', 'heartbeat']

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const limiter = rateLimit({ key: `analytics:${clientIp(req)}`, limit: 60, windowMs: 60_000 })
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Muitas tentativas.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
      )
    }

    const body = await req.json()
    const { event, sessionId } = body as { event: string; sessionId?: string }

    if (!VALID_EVENTS.includes(event)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const db = createAdminClient()

    const { data: proposal } = await db
      .from('proposal')
      .select('id')
      .eq('public_token', params.token)
      .single()

    if (!proposal) return NextResponse.json({ ok: false })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || null
    const userAgent = req.headers.get('user-agent') || null

    await db.from('proposal_analytics').insert({
      proposal_id: proposal.id,
      event_type: event,
      session_id: sessionId || null,
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
