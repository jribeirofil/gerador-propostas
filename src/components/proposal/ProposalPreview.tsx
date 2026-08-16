'use client'
import { buildProposalBody } from '@/lib/pdf-template'
import type { ProposalBlock } from '@/lib/blocks'

interface Client {
  empresa: string
  contato: string
  cargo?: string | null
  email?: string | null
  colaboradores?: number | null
  segmento?: string | null
}

interface Product {
  snapshot: {
    name: string
    description?: string | null
    unit_label?: string
    benefits?: string[]
    scope?: string[]
    differentials?: string[]
  }
  quantity: number
  unit_value?: number | null
  monthly_value?: number | null
  setup_value?: number | null
  discount_percent?: number | null
  pricing_type?: string | null
}

interface Proposal {
  id: string
  title: string
  created_at?: string | null
  total_monthly?: number | null
  total_setup?: number | null
  discount_percent?: number | null
  validade_dias?: number | null
  forma_pagamento?: string | null
  prazo_implantacao?: string | null
  diagnosis?: string | null
  objectives?: string | null
  client: Client | null
  products: Product[]
}

interface SignerData {
  name: string
  job_title: string
  email: string
  phone: string
}

interface CompanyContact {
  site?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
}

interface Props {
  proposal: Proposal
  blocks: ProposalBlock[]
  signerData: SignerData
  companyName: string
  primaryColor: string
  secondaryColor?: string | null
  coverBgUrl?: string | null
  coverVideoUrl?: string | null
  companyContact?: CompanyContact
  defaultFont?: string | null
  baseFontSize?: number | null
  headingSize?: number | null
  headingColor?: string | null
  headingBold?: boolean
  textColor?: string | null
  textLineHeight?: string | null
  backgroundColor?: string | null
  accentColor?: string | null
  customCss?: string | null
}

export default function ProposalPreview({
  proposal,
  blocks,
  companyName,
  primaryColor,
  secondaryColor,
  coverBgUrl,
  coverVideoUrl,
  companyContact,
  defaultFont,
  baseFontSize,
  headingSize,
  headingColor,
  headingBold,
  textColor,
  textLineHeight,
  backgroundColor,
  accentColor,
  customCss,
}: Props) {
  // Converter dados para formato PdfProposal
  const pdfProposal = {
    client: proposal.client || { empresa: 'Cliente', contato: '—' },
    cover_image_url: coverBgUrl || null,
    cover_video_url: coverVideoUrl || null,
    created_at: proposal.created_at,
    total_monthly: proposal.total_monthly,
    total_setup: proposal.total_setup,
    discount_percent: proposal.discount_percent,
    validade_dias: proposal.validade_dias,
    forma_pagamento: proposal.forma_pagamento,
    prazo_implantacao: proposal.prazo_implantacao,
    commercial_conditions: proposal.client ? undefined : null,
    items: proposal.products.map(p => ({
      snapshot: p.snapshot,
      quantity: p.quantity,
      unit_value: p.unit_value,
      monthly_value: p.monthly_value,
      setup_value: p.setup_value,
      discount_percent: p.discount_percent,
      pricing_type: p.pricing_type,
    })),
    blocks: blocks.map(b => ({
      type: b.type,
      sort_order: b.sort_order,
      enabled: b.enabled,
      content_json: b.content_json,
    })),
    settings: {
      company_name: companyName,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      company_site: companyContact?.site,
      company_email: companyContact?.email,
      company_phone: companyContact?.phone,
      company_whatsapp: companyContact?.whatsapp,
    },
    default_font: defaultFont,
    base_font_size: baseFontSize,
    heading_size: headingSize,
    heading_color: headingColor,
    heading_bold: headingBold,
    text_color: textColor,
    text_line_height: textLineHeight,
    background_color: backgroundColor,
    accent_color: accentColor,
    custom_css: customCss,
  }

  const html = buildProposalBody(pdfProposal as any)

  return (
    <div className="bg-white min-h-screen">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: white; }
        table { border-collapse: collapse; }
        img { max-width: 100%; }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
