import type { SupabaseClient } from '@supabase/supabase-js'
import type { PdfProposal, PdfCompanySettings, PdfClient } from '@/lib/pdf-template'

// Fonte única de dados do documento (página pública + PDF). Garante que a
// página da proposta e o PDF sejam montados com EXATAMENTE os mesmos dados.
export async function loadProposalDocument(
  db: SupabaseClient,
  proposal: {
    id: string
    organization_id: string | null
    template_id?: string | null
    diagnosis?: string | null
    objectives?: string | null
    commercial_conditions?: string | null
    total_monthly?: number | null
    total_setup?: number | null
    discount_percent?: number | null
    created_at?: string | null
    validade_dias?: number | null
    forma_pagamento?: string | null
    prazo_implantacao?: string | null
    client: Record<string, unknown> | null
  }
): Promise<{ doc: PdfProposal; settings: PdfCompanySettings | null }> {
  const orgId = proposal.organization_id as string | null

  const [itemsRes, blocksRes, settingsRes, templateRes] = await Promise.all([
    db.from('proposal_product').select('*').eq('proposal_id', proposal.id).order('sort_order'),
    db.from('proposal_block').select('*').eq('proposal_id', proposal.id).eq('enabled', true).order('sort_order'),
    db.from('company_settings').select('company_name, primary_color, secondary_color, pdf_footer_text, pdf_default_conditions, company_about, company_site, company_email, company_phone, company_whatsapp, cover_bg_url, cover_video_url').eq('organization_id', orgId).limit(1).maybeSingle(),
    proposal.template_id
      ? db.from('proposal_template').select('cover_image_url, cover_video_url').eq('id', proposal.template_id).eq('organization_id', orgId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const settings = (settingsRes.data || null) as PdfCompanySettings | null
  const templateAssets = templateRes.data as { cover_image_url?: string | null; cover_video_url?: string | null } | null

  const doc: PdfProposal = {
    diagnosis: proposal.diagnosis ?? null,
    objectives: proposal.objectives ?? null,
    commercial_conditions: proposal.commercial_conditions ?? null,
    total_monthly: proposal.total_monthly ?? null,
    total_setup: proposal.total_setup ?? null,
    discount_percent: proposal.discount_percent ?? null,
    created_at: proposal.created_at ?? undefined,
    validade_dias: proposal.validade_dias ?? undefined,
    forma_pagamento: proposal.forma_pagamento ?? null,
    prazo_implantacao: proposal.prazo_implantacao ?? null,
    client: (proposal.client as PdfClient | null) || null,
    cover_bg_url: templateAssets?.cover_image_url || settings?.cover_bg_url || null,
    cover_video_url: templateAssets?.cover_video_url || settings?.cover_video_url || null,
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
    settings,
  }

  return { doc, settings }
}
