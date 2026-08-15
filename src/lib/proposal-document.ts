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

  // Se proposta não tem template, busca o template padrão
  let templateId = proposal.template_id
  if (!templateId) {
    const { data: defaultTemplate } = await db
      .from('proposal_template')
      .select('id')
      .eq('is_default', true)
      .eq('organization_id', orgId)
      .limit(1)
      .maybeSingle()
    templateId = defaultTemplate?.id
  }

  const [itemsRes, blocksRes, settingsRes, templateRes] = await Promise.all([
    db.from('proposal_product').select('*').eq('proposal_id', proposal.id).order('sort_order'),
    db.from('proposal_block').select('*').eq('proposal_id', proposal.id).eq('enabled', true).order('sort_order'),
    db.from('company_settings').select('company_name, primary_color, secondary_color, pdf_footer_text, pdf_default_conditions, company_about, company_site, company_email, company_phone, company_whatsapp').eq('organization_id', orgId).limit(1).maybeSingle(),
    templateId
      ? db.from('proposal_template').select('cover_image_url, cover_video_url, default_font, base_font_size, heading_size, heading_color, heading_bold, text_color, text_line_height, background_color, accent_color, cover_text_color, custom_css').eq('id', templateId).eq('organization_id', orgId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const settings = (settingsRes.data || null) as PdfCompanySettings | null
  const templateAssets = templateRes.data as {
    cover_image_url?: string | null
    cover_video_url?: string | null
    default_font?: string | null
    base_font_size?: number | null
    heading_size?: number | null
    heading_color?: string | null
    heading_bold?: boolean
    text_color?: string | null
    text_line_height?: string | null
    background_color?: string | null
    accent_color?: string | null
    cover_text_color?: string | null
    custom_css?: string | null
  } | null

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
    cover_image_url: templateAssets?.cover_image_url || null,
    cover_video_url: templateAssets?.cover_video_url || null,
    default_font: templateAssets?.default_font || null,
    base_font_size: templateAssets?.base_font_size || null,
    heading_size: templateAssets?.heading_size || null,
    heading_color: templateAssets?.heading_color || null,
    heading_bold: templateAssets?.heading_bold,
    text_color: templateAssets?.text_color || null,
    text_line_height: templateAssets?.text_line_height || null,
    background_color: templateAssets?.background_color || null,
    accent_color: templateAssets?.accent_color || null,
    cover_text_color: templateAssets?.cover_text_color || null,
    custom_css: templateAssets?.custom_css || null,
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
