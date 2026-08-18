import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPdfHtml } from '@/lib/pdf-template'
import { loadProposalDocument } from '@/lib/proposal-document'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const limiter = rateLimit({ key: `pdf:${clientIp(req)}`, limit: 30, windowMs: 60_000 })
  if (!limiter.ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde e tente novamente.' },
      { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
    )
  }
  const db = createAdminClient()

  const { data: proposal, error } = await db
    .from('proposal')
    .select('*, client:clients(*)')
    .eq('public_token', params.token)
    .single()

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  const { doc } = await loadProposalDocument(db, proposal)
  const html = buildPdfHtml(doc)

  // Track pdf_downloaded (fire-and-forget)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || null
  db.from('proposal_analytics').insert({
    proposal_id: proposal.id,
    event_type: 'pdf_downloaded',
    session_id: null,
    ip_address: ip,
    user_agent: req.headers.get('user-agent') || null,
  }).then(() => {})

  return NextResponse.json({ html })
}
