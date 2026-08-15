import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPdfHtml } from '@/lib/pdf-template'
import { loadProposalDocument } from '@/lib/proposal-document'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: proposal, error: proposalError } = await supabase
    .from('proposal')
    .select('*, client:clients(*)')
    .eq('id', params.id)
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  const { doc } = await loadProposalDocument(supabase, proposal)
  const html = buildPdfHtml(doc)

  // Registra evento de geração de PDF (fire-and-forget)
  supabase.from('proposal_event').insert({
    proposal_id: params.id,
    event_type: 'pdf_generated',
    created_by: user.id,
  }).then(() => {})

  return NextResponse.json({ html, proposal })
}
