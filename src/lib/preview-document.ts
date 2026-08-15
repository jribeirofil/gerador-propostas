import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProposalFormData } from '@/components/proposal/ProposalForm'
import type { PdfProposal, PdfBlock, PdfCompanySettings } from '@/lib/pdf-template'
import { buildProductSnapshot } from '@/lib/snapshot'
import { calculateLineItem, calculateProposalTotals } from '@/lib/pricing'
import { assembleBlocks, resolveTemplate, type TemplateBlockRow } from '@/lib/blocks'

// Monta o documento do passo Resumo (prévia real) a partir dos dados do form.
// Espelha o que o save fará (submitNew): mesmos items/totais, mesmo template
// (manual ou auto-resolvido) e os mesmos blocos via assembleBlocks — para que
// a prévia seja fiel ao documento que será salvo e gerado.
export async function buildPreviewDocument(
  supabase: SupabaseClient,
  data: ProposalFormData
): Promise<PdfProposal | null> {
  const catalogProducts = data.catalog_products || []
  const selectedProducts = catalogProducts.filter(p => (data.product_ids || []).includes(p.id))
  const pricing = data.product_pricing || []

  const lineItems = selectedProducts.map(product => {
    const p = pricing.find(x => x.product_id === product.id) || {
      product_id: product.id,
      pricing_type: 'monthly' as const,
      unit_value: 0,
      quantity: 1,
      discount_percent: 0,
    }
    return { product, calc: calculateLineItem(p) }
  })

  const totals = calculateProposalTotals(
    lineItems.map(li => li.calc),
    data.desconto_pct || 0
  )

  const items = lineItems.map(({ product, calc }) => ({
    snapshot: buildProductSnapshot(product),
    quantity: calc.quantity,
    unit_value: calc.unit_value,
    monthly_value: calc.is_recurring ? calc.subtotal : 0,
    setup_value: !calc.is_recurring ? calc.subtotal : 0,
    discount_percent: calc.discount_percent,
    pricing_type: calc.pricing_type,
  }))

  const productContent = {
    beneficios: selectedProducts.flatMap(p => p.benefits.map(b => b.title)),
    escopo: selectedProducts.flatMap(p => p.scope.map(s => s.title)),
    diferenciais: selectedProducts.flatMap(p => p.differentials.map(d => d.title)),
    faq: selectedProducts.flatMap(p => p.faq.map(f => ({ question: f.question, answer: f.answer }))),
  }

  const productSlugs = selectedProducts.map(p => p.slug)
  const templateId = data.template_id || await resolveTemplate(supabase, productSlugs)

  const [settingsRes, templateRes] = await Promise.all([
    supabase
      .from('company_settings')
      .select(
        'company_name, primary_color, secondary_color, pdf_footer_text, pdf_default_conditions, company_about, company_site, company_email, company_phone, company_whatsapp, cover_bg_url, cover_video_url'
      )
      .limit(1)
      .maybeSingle(),
    templateId
      ? supabase
          .from('proposal_template')
          .select('cover_image_url, cover_video_url')
          .eq('id', templateId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const settings = (settingsRes.data || null) as PdfCompanySettings | null
  const templateAssets = templateRes.data as {
    cover_image_url?: string | null
    cover_video_url?: string | null
  } | null

  let templateBlocks: TemplateBlockRow[] = []
  if (templateId) {
    const { data } = await supabase
      .from('template_block')
      .select('type, sort_order, enabled, title, default_content')
      .eq('template_id', templateId)
      .order('sort_order')
    templateBlocks = (data || []) as TemplateBlockRow[]
  }
  const blocks: PdfBlock[] = assembleBlocks(templateBlocks, productContent).map(b => ({
    type: b.type,
    sort_order: b.sort_order,
    enabled: b.enabled,
    content_json: (b.content_json ?? {}) as Record<string, unknown>,
  }))

  return {
    client: {
      empresa: data.empresa || 'Cliente',
      contato: data.contato || '—',
      cargo: data.cargo || null,
      email: data.email || null,
      colaboradores: data.colaboradores || null,
      segmento: data.segmento || null,
    },
    commercial_conditions: data.commercial_conditions?.trim() || null,
    total_monthly: totals.total_monthly,
    total_setup: totals.total_setup,
    discount_percent: data.desconto_pct || 0,
    validade_dias: data.validade_dias || 30,
    forma_pagamento: (data.forma_pagamento || []).join(', ') || null,
    prazo_implantacao: data.prazo_implantacao || null,
    created_at: new Date().toISOString(),
    cover_bg_url: templateAssets?.cover_image_url || settings?.cover_bg_url || null,
    cover_video_url: templateAssets?.cover_video_url || settings?.cover_video_url || null,
    items,
    blocks,
    settings,
  }
}
