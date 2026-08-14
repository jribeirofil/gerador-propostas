import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPdfHtml } from '@/lib/pdf-template'

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

  const [itemsRes, blocksRes, settingsRes] = await Promise.all([
    supabase.from('proposal_product').select('*').eq('proposal_id', params.id).order('sort_order'),
    supabase.from('proposal_block').select('*').eq('proposal_id', params.id).eq('enabled', true).order('sort_order'),
    supabase.from('company_settings').select('company_name, pdf_footer_text, pdf_default_conditions').limit(1).maybeSingle(),
  ])

  const items = itemsRes.data
  const blocks = blocksRes.data || []
  const companySettings = settingsRes.data

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
    items: (items || []).map(item => ({
      snapshot: item.snapshot,
      quantity: item.quantity,
      unit_value: item.unit_value,
      monthly_value: item.monthly_value,
      setup_value: item.setup_value,
      discount_percent: item.discount_percent,
      pricing_type: item.pricing_type,
    })),
    blocks,
    settings: companySettings || null,
  })

  // Registra evento de geração de PDF (fire-and-forget)
  supabase.from('proposal_event').insert({
    proposal_id: params.id,
    event_type: 'pdf_generated',
    created_by: user.id,
  }).then(() => {})

  return NextResponse.json({ html, proposal })
}
