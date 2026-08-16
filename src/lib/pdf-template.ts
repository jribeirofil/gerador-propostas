import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ProductSnapshot } from '@/types/engine'

export interface PdfClient {
  empresa: string
  contato: string
  cargo?: string | null
  email?: string | null
  colaboradores?: number | null
  segmento?: string | null
}

export interface PdfProposalProduct {
  snapshot: ProductSnapshot
  quantity: number
  unit_value?: number | null
  monthly_value?: number | null
  setup_value?: number | null
  discount_percent?: number | null
  pricing_type?: string | null
}

export interface PdfCompanySettings {
  company_name: string
  primary_color?: string | null
  secondary_color?: string | null
  pdf_footer_text?: string | null
  pdf_default_conditions?: string | null
  company_about?: string | null
  company_site?: string | null
  company_email?: string | null
  company_phone?: string | null
  company_whatsapp?: string | null
}

export interface PdfBlock {
  type: string
  content_json: Record<string, unknown>
  enabled: boolean
  sort_order: number
}

export interface PdfProposal {
  diagnosis?: string | null
  objectives?: string | null
  commercial_conditions?: string | null
  total_monthly?: number | null
  total_setup?: number | null
  discount_percent?: number | null
  validade_dias?: number
  forma_pagamento?: string | null
  prazo_implantacao?: string | null
  created_at?: string
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
  client: PdfClient | null
  items: PdfProposalProduct[]
  blocks?: PdfBlock[]
  settings?: PdfCompanySettings | null
}

function formatCurrency(value?: number | null): string {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Igual a formatCurrency, mas nunca mostra "—" para zero. Usada na coluna
// Investimento, onde um produto com 100% de benefício precisa aparecer
// como "R$ 0,00" de forma explícita, não pode sumir nem virar travessão.
function formatCurrencyAlwaysShow(value?: number | null): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

// Reconstrói o valor de referência (bruto, sem desconto).
// Prefere unit_value × quantity quando disponível — é o único caminho
// seguro quando discount_percent = 100 (contracted = 0, a divisão
// 0/(1-1) resulta em NaN). Para propostas antigas sem unit_value,
// usa a retrocomputação pelo valor contratado + desconto.
function grossValue(item: PdfProposalProduct): number {
  if (item.unit_value != null && item.unit_value > 0) {
    return item.unit_value * (item.quantity || 1)
  }
  const contracted = (item.monthly_value || 0) + (item.setup_value || 0)
  const discountPct = item.discount_percent || 0
  if (discountPct <= 0 || discountPct >= 100) return contracted
  return contracted / (1 - discountPct / 100)
}

// pricing_type é a fonte autoritativa. Checar monthly_value > 0 quebra
// quando discount_percent = 100 (monthly_value fica 0 mesmo sendo recorrente).
function isRecurring(item: PdfProposalProduct): boolean {
  if (item.pricing_type) {
    return item.pricing_type === 'monthly' || item.pricing_type === 'per_employee'
  }
  return (item.monthly_value || 0) > 0
}

// Retorna a unidade de medida no singular ou plural conforme a quantidade.
// Usa snapshot.unit_label (campo adicionado na Fase G) quando disponível.
// Para propostas antigas sem esse campo no snapshot, deriva a partir do
// pricing_type como antes — preservando a exibição correta de todas as
// propostas já geradas.
function unitLabel(item: PdfProposalProduct, quantity: number): string {
  const plural = quantity !== 1
  if (item.snapshot.unit_label) {
    const labelPlural = item.snapshot.unit_label
    const labelSingular = labelPlural.endsWith('s') ? labelPlural.slice(0, -1) : labelPlural
    return plural ? labelPlural : labelSingular
  }
  if (item.pricing_type === 'per_employee') return plural ? 'vidas' : 'vida'
  if (item.pricing_type === 'per_project') return plural ? 'projetos' : 'projeto'
  return plural ? 'unidades' : 'unidade'
}

function blockContent(blocks: PdfBlock[] | undefined, type: string): Record<string, unknown> | null {
  if (!blocks) return null
  const b = blocks.find(b => b.type === type && b.enabled)
  return b ? b.content_json : null
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Escurece a cor de marca até ficar legível como texto sobre fundo claro.
function darken(hex: string, percent: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const amt = Math.round((percent / 100) * 255)
  const chan = (value: number) => Math.max(0, value - amt).toString(16).padStart(2, '0')
  return `#${chan(parseInt(h.substring(0, 2), 16))}${chan(parseInt(h.substring(2, 4), 16))}${chan(parseInt(h.substring(4, 6), 16))}`
}

// Corpo do documento (sem <html>/<head>) — usado tanto no PDF quanto na
// página pública, garantindo que os dois tenham EXATAMENTE o mesmo layout.
export function buildProposalBody(proposal: PdfProposal): string {
  const defaultFont = proposal.default_font || 'Inter'
  const baseFontSize = proposal.base_font_size || 13
  const headingSize = proposal.heading_size || 28
  const headingColor = proposal.heading_color || '#000000'
  const headingBold = proposal.heading_bold !== false
  const textColor = proposal.text_color || '#1a1a1a'
  const textLineHeight = proposal.text_line_height || '1.6'
  const backgroundColor = proposal.background_color || '#ffffff'
  const coverTextColor = proposal.cover_text_color || '#ffffff'
  const customCss = proposal.custom_css || ''
  const client = proposal.client || { empresa: 'Cliente', contato: '—' }
  const items = proposal.items || []
  const blocks = proposal.blocks
  const today = proposal.created_at
    ? format(new Date(proposal.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  const companyName = proposal.settings?.company_name || 'Sua empresa'
  const primary = proposal.settings?.primary_color || '#1FE97C'
  const secondary = proposal.settings?.secondary_color || null
  const brandDeep = darken(primary, 42)
  const brandMuted = darken(primary, 25)
  const brandTint = hexToRgba(primary, 0.10)
  const brandTintBorder = hexToRgba(primary, 0.35)
  const secDeep = secondary ? darken(secondary, 42) : brandDeep
  const secMuted = secondary ? darken(secondary, 25) : brandMuted

  const footerText = proposal.settings?.pdf_footer_text || ''
  const coverContacts = [
    proposal.settings?.company_site,
    proposal.settings?.company_email,
    proposal.settings?.company_phone,
    proposal.settings?.company_whatsapp,
  ].filter(Boolean).join(' · ')
  const coverContactsHtml = coverContacts
    ? `<p style="color:#B9BFC7;font-size:12px;margin-top:16px;font-style:italic;">${coverContacts}</p>`
    : ''

  const sobreBlock = blockContent(blocks, 'sobre')
  const sobreText =
    proposal.settings?.company_about?.trim() ||
    ((sobreBlock?.text as string) || '').trim() ||
    null
  const proximosBlock = blockContent(blocks, 'proximos_passos')
  const proximosItems = (proximosBlock?.items as string[]) || null

  // Condições: as negociadas na proposta (passo Condições) vencem; senão a global da organização.
  const commercialConditions = proposal.commercial_conditions?.trim() || proposal.settings?.pdf_default_conditions || ''
  const staticConditions = commercialConditions.split('\n').map(s => s.trim()).filter(Boolean)

  const conditionLi = (text: string) =>
    `<li style="font-size:12px;color:#444;padding:5px 0;">✓ ${text}</li>`

  const conditionsHtml = [
    conditionLi(`Valores válidos por ${proposal.validade_dias || 30} dias a partir desta data`),
    ...staticConditions.map(conditionLi),
    proposal.prazo_implantacao
      ? conditionLi(`Implantação conforme cronograma acordado (${proposal.prazo_implantacao})`)
      : null,
    proposal.forma_pagamento
      ? conditionLi(`Forma de pagamento: ${proposal.forma_pagamento}`)
      : null,
  ].filter(Boolean).join('\n        ')

  const productsHtml = items.map(item => `
    <div style="background:#f9fafb;border-radius:8px;padding:10px 14px;margin-bottom:8px;">
      <h4 style="font-size:12px;font-weight:600;color:#161B20;margin:0 0 4px">${item.snapshot.name}</h4>
      <p style="font-size:11px;color:#555;margin:0">${item.snapshot.description || ''}</p>
      ${item.snapshot.benefits.length > 0 ? `
        <ul style="margin:8px 0 0;padding-left:16px;">
          ${item.snapshot.benefits.map(b => `<li style="font-size:10px;color:#666;margin-bottom:3px">${b}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `).join('')

  const recurringItems = items.filter(isRecurring)
  const oneTimeItems = items.filter(i => !isRecurring(i))

  function buildInvestmentRow(item: PdfProposalProduct, contractedValue: number): string {
    const gross = grossValue(item)
    const qty = item.quantity || 1
    const unitGross = qty > 0 ? gross / qty : 0
    const hasBenefit = (item.discount_percent || 0) > 0
    return `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#161B20;font-weight:500">${item.snapshot.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#777;text-align:center">${qty} ${unitLabel(item, qty)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:11px;color:#999;text-align:center">${qty} × ${formatCurrency(unitGross)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#999;text-align:right;${hasBenefit ? 'text-decoration:line-through' : ''}">${formatCurrency(gross)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#777;text-align:right">${hasBenefit ? item.discount_percent + '%' : '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#161B20;font-weight:700;text-align:right">${formatCurrencyAlwaysShow(contractedValue)}</td>
    </tr>`
  }

  const recurringRowsHtml = recurringItems.map(item => buildInvestmentRow(item, item.monthly_value || 0)).join('')
  const oneTimeRowsHtml = oneTimeItems.map(item => buildInvestmentRow(item, item.setup_value || 0)).join('')

  const recurringGross = recurringItems.reduce((sum, i) => sum + grossValue(i), 0)
  const recurringNet = proposal.total_monthly || 0
  const recurringBenefit = recurringGross - recurringNet

  const oneTimeGross = oneTimeItems.reduce((sum, i) => sum + grossValue(i), 0)
  const oneTimeNet = proposal.total_setup || 0
  const oneTimeBenefit = oneTimeGross - oneTimeNet

  const totalGross = recurringGross + oneTimeGross
  const totalBenefit = recurringBenefit + oneTimeBenefit

  const investmentTableHeader = `
        <tr>
          <th style="padding:8px 12px;text-align:left;color:#999;font-weight:500;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">Produto</th>
          <th style="padding:8px 12px;text-align:center;color:#999;font-weight:500;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">Quantidade</th>
          <th style="padding:8px 12px;text-align:center;color:#999;font-weight:500;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">Base de cálculo</th>
          <th style="padding:8px 12px;text-align:right;color:#999;font-weight:500;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">Valor de Referência</th>
          <th style="padding:8px 12px;text-align:right;color:#999;font-weight:500;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">Benefício</th>
          <th style="padding:8px 12px;text-align:right;color:#999;font-weight:500;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">Investimento</th>
        </tr>`

  const coverBgUrl = proposal.cover_image_url || null

  return `
  <style>
    .proposal-body {
      font-family: '${defaultFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: ${baseFontSize}px;
      color: ${textColor} !important;
      background-color: ${backgroundColor} !important;
      line-height: ${textLineHeight};
    }
    .proposal-body h1, .proposal-body h2, .proposal-body h3, .proposal-body h4 {
      font-size: ${headingSize}px;
      color: ${headingColor} !important;
      font-weight: ${headingBold ? 'bold' : 'normal'};
    }
    .proposal-body * {
      color: ${textColor} !important;
    }
    .proposal-body h1, .proposal-body h2, .proposal-body h3, .proposal-body h4 {
      color: ${headingColor} !important;
    }
    .cover-section h1, .cover-section p, .cover-section span {
      color: ${coverTextColor} !important;
    }
    ${customCss}
  </style>
  <div class="proposal-body cover-section" style="position:relative;background:${coverBgUrl ? '#ffffff' : '#161B20'};padding:56px 40px;min-height:500px;display:flex;flex-direction:column;justify-content:space-between;${coverBgUrl ? `background-image:url('${coverBgUrl}');background-size:contain;background-position:center;background-repeat:no-repeat;` : ''}">
    <div style="display:flex;align-items:center;gap:8px;position:relative;">
      <div style="width:10px;height:10px;border-radius:50%;background:${primary};"></div>
      <span style="font-weight:600;font-size:16px;letter-spacing:0.3px;">${companyName}</span>
    </div>
    <div style="margin-top:32px;position:relative;">
      <div style="width:56px;height:3px;border-radius:2px;background:linear-gradient(to right, ${primary} ${secondary ? '55%, ' + secondary : '100%' });margin-bottom:20px;"></div>
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Proposta Comercial</p>
      <h1 style="font-size:28px;font-weight:700;margin-bottom:6px;">${client.empresa}</h1>
      <p style="font-size:13px;">${today}</p>
      ${coverContactsHtml}
    </div>
  </div>

  <div style="padding:32px 40px;">

    <div style="margin-bottom:28px;padding:16px;background:#f9fafb;border-radius:8px;display:flex;gap:32px;flex-wrap:wrap;">
      <div><p style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Contato</p><p style="font-size:13px;font-weight:600;margin-top:2px">${client.contato}${client.cargo ? ` · ${client.cargo}` : ''}</p></div>
      ${client.email ? `<div><p style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">E-mail</p><p style="font-size:13px;margin-top:2px">${client.email}</p></div>` : ''}
      ${client.colaboradores ? `<div><p style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Vidas</p><p style="font-size:13px;font-weight:600;margin-top:2px">${client.colaboradores}</p></div>` : ''}
      ${client.segmento ? `<div><p style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Segmento</p><p style="font-size:13px;margin-top:2px">${client.segmento}</p></div>` : ''}
    </div>

    <div style="margin-bottom:28px;">
      <div style="font-size:10px;font-weight:700;color:${brandDeep};text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;border-bottom:1.5px solid ${brandTintBorder};margin-bottom:12px;">Solução recomendada</div>
      ${productsHtml || '<p style="font-size:12px;color:#888">Sem produtos selecionados.</p>'}
    </div>

    ${recurringItems.length > 0 ? `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:15px;font-weight:600;color:#161B20;margin-bottom:2px;">Investimento Recorrente</h2>
      <p style="font-size:11px;color:#888;margin-bottom:14px;">Valores mensais referentes aos serviços contínuos.</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>${investmentTableHeader}</thead>
        <tbody>${recurringRowsHtml}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-top:10px;">
        <table style="font-size:12px;min-width:260px;">
          <tr><td style="padding:3px 12px;color:#888;text-align:right;">Valor de Referência</td><td style="padding:3px 0;color:#444;text-align:right;width:110px;">${formatCurrency(recurringGross)}</td></tr>
          ${recurringBenefit > 0 ? `<tr><td style="padding:3px 12px;color:${secDeep};text-align:right;font-weight:600;">Benefício concedido</td><td style="padding:3px 0;color:${secDeep};text-align:right;font-weight:600;">− ${formatCurrency(recurringBenefit)}</td></tr>` : ''}
        </table>
      </div>
    </div>
    ` : ''}

    ${oneTimeItems.length > 0 ? `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:15px;font-weight:600;color:#161B20;margin-bottom:2px;">Investimento Pontual</h2>
      <p style="font-size:11px;color:#888;margin-bottom:14px;">Valores cobrados apenas uma vez.</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>${investmentTableHeader}</thead>
        <tbody>${oneTimeRowsHtml}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-top:10px;">
        <table style="font-size:12px;min-width:260px;">
          <tr><td style="padding:3px 12px;color:#888;text-align:right;">Valor de Referência</td><td style="padding:3px 0;color:#444;text-align:right;width:110px;">${formatCurrency(oneTimeGross)}</td></tr>
          ${oneTimeBenefit > 0 ? `<tr><td style="padding:3px 12px;color:${secDeep};text-align:right;font-weight:600;">Benefício concedido</td><td style="padding:3px 0;color:${secDeep};text-align:right;font-weight:600;">− ${formatCurrency(oneTimeBenefit)}</td></tr>` : ''}
        </table>
      </div>
    </div>
    ` : ''}

    <div style="background:${brandTint};border-radius:16px;padding:28px 32px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:20px;">
        <div>
          <p style="font-size:10px;color:${brandMuted};text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Valor de Referência</p>
          <p style="font-size:16px;color:${brandDeep};font-weight:500;">${formatCurrency(totalGross)}</p>
        </div>
        ${totalBenefit > 0 ? `
        <div>
          <p style="font-size:10px;color:${secMuted};text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Benefício Total</p>
          <p style="font-size:16px;color:${secDeep};font-weight:500;">${formatCurrency(totalBenefit)}</p>
        </div>
        ` : ''}
        <div>
          <p style="font-size:10px;color:${brandMuted};text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Investimento Mensal</p>
          <p style="font-size:22px;color:${brandDeep};font-weight:700;">${formatCurrencyAlwaysShow(recurringNet)}</p>
        </div>
        ${oneTimeNet > 0 ? `
        <div>
          <p style="font-size:10px;color:${brandMuted};text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Investimento Único</p>
          <p style="font-size:22px;color:${brandDeep};font-weight:700;">${formatCurrencyAlwaysShow(oneTimeNet)}</p>
        </div>
        ` : ''}
      </div>
      ${totalBenefit > 0 ? `
      <div style="margin-top:18px;padding-top:18px;border-top:1px solid ${brandTintBorder};display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;">✓</span>
        <p style="font-size:12px;color:${secMuted};">Esta proposta contempla <strong style="color:${secDeep};">${formatCurrency(totalBenefit)}</strong> em benefícios comerciais em relação ao valor de referência das soluções.</p>
      </div>
      ` : ''}
    </div>

    <div style="margin-bottom:28px;">
      <div style="font-size:10px;font-weight:700;color:${brandDeep};text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;border-bottom:1.5px solid ${brandTintBorder};margin-bottom:12px;">Condições comerciais</div>
      <ul style="list-style:none;padding:0;margin:0;">
        ${conditionsHtml}
      </ul>
    </div>

    ${proximosItems && proximosItems.length > 0 ? `
    <div style="margin-bottom:28px;">
      <div style="font-size:10px;font-weight:700;color:${brandDeep};text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;border-bottom:1.5px solid ${brandTintBorder};margin-bottom:12px;">Próximos passos</div>
      <ol style="font-size:12px;color:#444;line-height:2;padding-left:18px;">
        ${proximosItems.map(item => `<li>${item}</li>`).join('\n        ')}
      </ol>
    </div>
    ` : ''}

    ${sobreText ? `
    <div style="margin-bottom:28px;">
      <div style="font-size:10px;font-weight:700;color:${brandDeep};text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;border-bottom:1.5px solid ${brandTintBorder};margin-bottom:12px;">Sobre a ${companyName}</div>
      <p style="font-size:12px;color:#444;line-height:1.7">
        ${sobreText.replace(/\n/g, '<br>')}
      </p>
    </div>` : ''}

  </div>

  <footer style="background:#f9fafb;padding:20px 40px;border-top:1px solid #eee;">
    <div style="display:flex;flex-wrap:wrap;gap:12px 24px;font-size:12px;color:#666;margin-bottom:12px;">
      <span style="font-weight:600;color:#161B20;">${companyName}</span>
      ${proposal.settings?.company_site ? `<span>${proposal.settings.company_site}</span>` : ''}
      ${proposal.settings?.company_email ? `<span>${proposal.settings.company_email}</span>` : ''}
      ${proposal.settings?.company_phone ? `<span>${proposal.settings.company_phone}</span>` : ''}
      ${proposal.settings?.company_whatsapp ? `<span>${proposal.settings.company_whatsapp}</span>` : ''}
    </div>
    ${footerText ? `<div style="font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:12px;margin-top:12px;">${footerText}</div>` : ''}
  </footer>
  `
}

export function buildPdfHtml(proposal: PdfProposal): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; background: white; }
    table { border-collapse: collapse; }
  </style>
</head>
<body>
${buildProposalBody(proposal)}
</body>
</html>
  `
}
