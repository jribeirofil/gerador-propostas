import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPdfHtml } from '@/lib/pdf-template'

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

  const [itemsRes, blocksRes, settingsRes] = await Promise.all([
    db.from('proposal_product').select('*').eq('proposal_id', proposal.id).order('sort_order'),
    db.from('proposal_block').select('*').eq('proposal_id', proposal.id).eq('enabled', true).order('sort_order'),
    db.from('company_settings').select('company_name, pdf_footer_text, pdf_default_conditions').limit(1).maybeSingle(),
  ])

  const html = buildPdfHtml({
    diagnosis: proposal.diagnosis,
    objectives: proposal.objectives,
    total_monthly: proposal.total_monthly,
    total_setup: proposal.total_setup,
    discount_percent: proposal.discount_percent,
    created_at: proposal.created_at,
    validade_dias: proposal.validade_dias,
    forma_pagamento: proposal.forma_pagamento,
    prazo_implantacao: proposal.prazo_implantacao,
    client: proposal.client,
    items: (itemsRes.data || []).map(item => ({
      snapshot: item.snapshot,
      quantity: item.quantity,
      unit_value: item.unit_value,
      monthly_value: item.monthly_value,
      setup_value: item.setup_value,
      discount_percent: item.discount_percent,
      pricing_type: item.pricing_type,
    })),
    blocks: blocksRes.data || [],
    settings: settingsRes.data || null,
  })

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
