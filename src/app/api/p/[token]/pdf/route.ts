import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPdfHtml } from '@/lib/pdf-template'
import { loadProposalDocument } from '@/lib/proposal-document'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
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
  const ip = _req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || _req.headers.get('x-real-ip')
    || null
  db.from('proposal_analytics').insert({
    proposal_id: proposal.id,
    event_type: 'pdf_downloaded',
    session_id: null,
    ip_address: ip,
    user_agent: _req.headers.get('user-agent') || null,
  }).then(() => {})

  return NextResponse.json({ html })
}
