'use client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BLOCK_LABELS,
  type ProposalBlock, type BlockType, type FaqItem,
} from '@/lib/blocks'

export type Variant = 'document' | 'web'

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

interface Props {
  proposal: Proposal
  blocks: ProposalBlock[]
  signerData: SignerData
  companyName: string
  primaryColor: string
  coverBgUrl?: string | null
  coverVideoUrl?: string | null
  variant?: Variant
}

function fmtCurrency(value?: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function isRecurring(p: Product): boolean {
  return p.pricing_type === 'monthly' || p.pricing_type === 'per_employee'
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(31,233,124,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}

// ─── Document layout helper (PDF) ────────────────────────────────────────────

function Inner({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  if (variant === 'web') {
    return (
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-20 lg:py-28">
        {children}
      </div>
    )
  }
  return <>{children}</>
}

// ─── Web LP primitives ────────────────────────────────────────────────────────

function WebSection({
  children,
  bg = '#ffffff',
  className = '',
}: {
  children: React.ReactNode
  bg?: string
  className?: string
}) {
  return (
    <section className={`py-24 lg:py-32 ${className}`} style={{ backgroundColor: bg }}>
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
        {children}
      </div>
    </section>
  )
}

function WebLabel({ text, color }: { text: string; color: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[4px] mb-10" style={{ color }}>
      {text}
    </p>
  )
}

// ─── BlockCover (shared — already premium) ────────────────────────────────────

function BlockCover({ proposal, companyName, coverBgUrl, coverVideoUrl, primaryColor, variant = 'document' }: {
  proposal: Proposal
  companyName: string
  coverBgUrl?: string | null
  coverVideoUrl?: string | null
  primaryColor: string
  variant?: Variant
}) {
  const client = proposal.client
  const date = proposal.created_at
    ? format(new Date(proposal.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })

  const isWeb = variant === 'web'

  const hasVideo = isWeb && !!coverVideoUrl

  return (
    <section
      className={
        isWeb
          ? 'relative min-h-screen flex flex-col justify-between px-6 sm:px-10 lg:px-20 py-12 lg:py-20'
          : 'relative min-h-[92vh] flex flex-col justify-between px-16 py-20'
      }
      style={{
        backgroundColor: '#0f1318',
        backgroundImage: !hasVideo && coverBgUrl ? `url(${coverBgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {hasVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src={coverVideoUrl!} type="video/mp4" />
          <source src={coverVideoUrl!} type="video/webm" />
        </video>
      )}
      {(hasVideo || coverBgUrl) && <div className="absolute inset-0 bg-black/30" style={{ zIndex: 1 }} />}
      <div className="relative flex flex-col justify-between flex-1" style={{ zIndex: 2 }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span className="text-white font-semibold text-sm tracking-wide">{companyName}</span>
        </div>
        <div>
          <p className="text-[#50565C] text-[11px] uppercase tracking-[3px] mb-6">Proposta Comercial</p>
          <h1 className={`text-white font-light tracking-tight leading-none mb-4 ${
            isWeb ? 'text-4xl sm:text-5xl lg:text-7xl' : 'text-6xl'
          }`}>
            {client?.empresa}
          </h1>
          <div className="h-px w-24 my-8" style={{ backgroundColor: primaryColor }} />
          <div className="flex flex-wrap items-center gap-6 text-sm text-[#8A9099]">
            {client?.contato && <span>{client.contato}{client.cargo ? ` · ${client.cargo}` : ''}</span>}
            <span>{date}</span>
            {client?.colaboradores && <span>{client.colaboradores} vidas</span>}
          </div>
          {client?.segmento && (
            <p className="mt-3 text-xs text-[#50565C]">{client.segmento}</p>
          )}
        </div>
        <p className="text-[#2A3038] text-xs italic">Tecnologia com coração para cuidar de pessoas e empresas.</p>
      </div>
    </section>
  )
}

// ─── BlockCenario ─────────────────────────────────────────────────────────────

function BlockCenario({ block, proposal, primaryColor, variant = 'document' }: {
  block: ProposalBlock
  proposal: Proposal
  primaryColor: string
  variant?: Variant
}) {
  const content = block.content_json as { text?: string }
  const text = content.text || proposal.diagnosis
  if (!text) return null

  if (variant === 'web') {
    return (
      <WebSection bg="#ffffff">
        <WebLabel text={block.title || BLOCK_LABELS['cenario']} color={primaryColor} />
        <div className="flex gap-8">
          <div className="w-0.5 rounded-full flex-shrink-0 self-stretch" style={{ backgroundColor: primaryColor }} />
          <p className="text-gray-600 font-light leading-relaxed text-xl lg:text-2xl max-w-2xl">
            {text}
          </p>
        </div>
      </WebSection>
    )
  }

  return (
    <section className="px-16 py-20 border-b border-gray-100">
      <p className="text-[10px] font-semibold text-[#1FE97C] uppercase tracking-[3px] mb-8">
        {block.title || BLOCK_LABELS['cenario']}
      </p>
      <p className="text-gray-700 font-light leading-relaxed max-w-2xl text-lg">{text}</p>
    </section>
  )
}

// ─── BlockObjetivos ───────────────────────────────────────────────────────────

function BlockObjetivos({ block, proposal, primaryColor, variant = 'document' }: {
  block: ProposalBlock
  proposal: Proposal
  primaryColor: string
  variant?: Variant
}) {
  const content = block.content_json as { text?: string }
  const text = content.text || proposal.objectives
  if (!text) return null

  if (variant === 'web') {
    return (
      <WebSection bg="#f5f5f3">
        <WebLabel text={block.title || BLOCK_LABELS['objetivos']} color={primaryColor} />
        <p className="text-gray-800 font-light leading-relaxed text-3xl lg:text-4xl max-w-2xl">
          {text}
        </p>
      </WebSection>
    )
  }

  return (
    <section className="px-16 py-20 bg-gray-50 border-b border-gray-100">
      <p className="text-[10px] font-semibold text-[#1FE97C] uppercase tracking-[3px] mb-8">
        {block.title || BLOCK_LABELS['objetivos']}
      </p>
      <p className="text-gray-800 font-light leading-relaxed max-w-2xl text-2xl">{text}</p>
    </section>
  )
}

// ─── BlockSolucao ─────────────────────────────────────────────────────────────

function BlockSolucao({ block, proposal, primaryColor, variant = 'document' }: {
  block: ProposalBlock
  proposal: Proposal
  primaryColor: string
  variant?: Variant
}) {
  const products = proposal.products || []
  if (products.length === 0) return null

  if (variant === 'web') {
    return (
      <WebSection bg="#ffffff">
        <WebLabel text={block.title || BLOCK_LABELS['solucao']} color={primaryColor} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {products.map((p, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mb-5 text-white text-xs font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-gray-900 font-semibold text-lg mb-2">{p.snapshot.name}</h3>
              {p.snapshot.description && (
                <p className="text-gray-500 text-sm leading-relaxed">{p.snapshot.description}</p>
              )}
            </div>
          ))}
        </div>
      </WebSection>
    )
  }

  return (
    <section className="px-16 py-20 border-b border-gray-100">
      <p className="text-[10px] font-semibold text-[#1FE97C] uppercase tracking-[3px] mb-10">
        {block.title || BLOCK_LABELS['solucao']}
      </p>
      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        {products.map((p, i) => (
          <div key={i} className="flex gap-6">
            <div className="w-1 bg-[#1FE97C] rounded-full flex-shrink-0 self-stretch" />
            <div>
              <h3 className="text-gray-900 font-semibold text-lg mb-2">{p.snapshot.name}</h3>
              {p.snapshot.description && (
                <p className="text-gray-500 text-sm leading-relaxed">{p.snapshot.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── BlockList (benefícios, escopo, diferenciais) ─────────────────────────────

function BlockList({ block, fallbackItems, primaryColor, variant = 'document', webBg = '#ffffff' }: {
  block: ProposalBlock
  fallbackItems?: string[]
  primaryColor: string
  variant?: Variant
  webBg?: string
}) {
  const content = block.content_json as { items?: string[] }
  const items = (content.items && content.items.length > 0) ? content.items : (fallbackItems || [])
  if (items.length === 0) return null

  if (variant === 'web') {
    return (
      <WebSection bg={webBg}>
        <WebLabel text={block.title || BLOCK_LABELS[block.type as BlockType]} color={primaryColor} />
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-4">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: hexToRgba(primaryColor, 0.12) }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
              </span>
              <span className="text-gray-700 leading-relaxed text-[15px]">{item}</span>
            </li>
          ))}
        </ul>
      </WebSection>
    )
  }

  return (
    <section className="px-16 py-20 border-b border-gray-100">
      <p className="text-[10px] font-semibold text-[#1FE97C] uppercase tracking-[3px] mb-10">
        {block.title || BLOCK_LABELS[block.type as BlockType]}
      </p>
      <ul className="space-y-4 max-w-2xl">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-4">
            <span className="w-5 h-5 rounded-full border border-[#1FE97C] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1FE97C]" />
            </span>
            <span className="text-gray-700 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ─── BlockFaq ─────────────────────────────────────────────────────────────────

function BlockFaq({ block, primaryColor, variant = 'document' }: {
  block: ProposalBlock
  primaryColor: string
  variant?: Variant
}) {
  const content = block.content_json as { items?: FaqItem[] }
  const items = content.items || []
  if (items.length === 0) return null

  if (variant === 'web') {
    return (
      <WebSection bg="#f5f5f3">
        <WebLabel text={block.title || BLOCK_LABELS['faq']} color={primaryColor} />
        <div className="max-w-3xl divide-y divide-gray-200">
          {items.map((item, i) => (
            <div key={i} className="py-8">
              <p className="text-gray-900 font-medium text-lg mb-3">{item.question}</p>
              <p className="text-gray-500 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </WebSection>
    )
  }

  return (
    <section className="px-16 py-20 bg-gray-50 border-b border-gray-100">
      <p className="text-[10px] font-semibold text-[#1FE97C] uppercase tracking-[3px] mb-10">
        {block.title || BLOCK_LABELS['faq']}
      </p>
      <div className="space-y-8 max-w-2xl">
        {items.map((item, i) => (
          <div key={i}>
            <p className="text-gray-900 font-semibold mb-2">{item.question}</p>
            <p className="text-gray-500 leading-relaxed text-sm">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── BlockProxPassos ──────────────────────────────────────────────────────────

function BlockProxPassos({ block, primaryColor, variant = 'document' }: {
  block: ProposalBlock
  primaryColor: string
  variant?: Variant
}) {
  const content = block.content_json as { items?: string[] }
  const items = content.items || []
  if (items.length === 0) return null

  if (variant === 'web') {
    return (
      <section className="py-24 lg:py-32" style={{ backgroundColor: '#0f1318' }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <WebLabel text={block.title || BLOCK_LABELS['proximos_passos']} color={primaryColor} />
          <ol className="space-y-10">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-8">
                <span
                  className="text-4xl font-light leading-none flex-shrink-0 w-12 text-right"
                  style={{ color: primaryColor, opacity: 0.9 }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="pt-1 border-t border-white/10 flex-1">
                  <p className="text-white/80 leading-relaxed text-lg pt-3">{item}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  }

  return (
    <section className="px-16 py-20 border-b border-gray-100">
      <p className="text-[10px] font-semibold text-[#1FE97C] uppercase tracking-[3px] mb-10">
        {block.title || BLOCK_LABELS['proximos_passos']}
      </p>
      <ol className="space-y-5 max-w-2xl">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-5">
            <span className="text-[#1FE97C] font-light text-2xl leading-none w-7 flex-shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-gray-700 leading-relaxed pt-1">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ─── BlockSobre ───────────────────────────────────────────────────────────────

function BlockSobre({ block, primaryColor, variant = 'document' }: {
  block: ProposalBlock
  primaryColor: string
  variant?: Variant
}) {
  const content = block.content_json as { text?: string }
  const text = content.text
  if (!text) return null

  if (variant === 'web') {
    return (
      <section className="py-24 lg:py-32" style={{ backgroundColor: '#161b22' }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <WebLabel text={block.title || BLOCK_LABELS['sobre']} color={primaryColor} />
          <p className="text-white/60 font-light leading-relaxed text-xl lg:text-2xl max-w-2xl">
            {text}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="px-16 py-20 bg-[#0f1318] border-b border-white/5">
      <p className="text-[10px] font-semibold text-[#1FE97C] uppercase tracking-[3px] mb-8">
        {block.title || BLOCK_LABELS['sobre']}
      </p>
      <p className="text-[#8A9099] font-light leading-relaxed max-w-2xl text-lg">{text}</p>
    </section>
  )
}

// ─── BlockInvestimento ────────────────────────────────────────────────────────

function BlockInvestimento({ block, proposal, primaryColor, variant = 'document' }: {
  block: ProposalBlock
  proposal: Proposal
  primaryColor: string
  variant?: Variant
}) {
  const products = proposal.products || []
  const recurring = products.filter(isRecurring)
  const oneTime = products.filter(p => !isRecurring(p))
  const totalMonthly = proposal.total_monthly || 0
  const totalSetup = proposal.total_setup || 0

  const grossRecurring = recurring.reduce((s, p) => s + (p.unit_value || 0) * (p.quantity || 1), 0)
  const grossOneTime = oneTime.reduce((s, p) => s + (p.unit_value || 0) * (p.quantity || 1), 0)
  const totalGross = grossRecurring + grossOneTime
  const totalBeneficio = totalGross - (totalMonthly + totalSetup)

  const isWeb = variant === 'web'

  const thClass = 'py-2.5 px-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider'
  const thLeft = 'text-left pr-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider'

  const premiumCards = [true, true, totalSetup > 0, totalMonthly > 0].filter(Boolean).length
  const premiumGrid = isWeb
    ? `grid-cols-2 ${premiumCards >= 4 ? 'sm:grid-cols-4' : premiumCards === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`
    : `grid-cols-${premiumCards}`

  const heroValue = isWeb ? 'text-2xl sm:text-3xl' : 'text-3xl'

  const primaryLight = hexToRgba(primaryColor, 0.08)
  const primaryMid = hexToRgba(primaryColor, 0.2)
  const primaryDark = hexToRgba(primaryColor, 0.5)

  const investimentoContent = (
    <div className="max-w-4xl space-y-10">

      {/* ── Recorrente ──────────────────────────────── */}
      {recurring.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-[3px] mb-5">Investimento Recorrente</p>
          <div className={isWeb ? 'overflow-x-auto -mx-1' : ''}>
            <table className={`w-full text-sm ${isWeb ? 'min-w-[520px]' : ''}`}>
              <thead>
                <tr className="border-b border-gray-200">
                  <th className={thLeft}>Produto</th>
                  <th className={`text-right ${thClass}`}>Qtd.</th>
                  <th className={`text-right ${thClass}`}>Base de Cálculo</th>
                  <th className={`text-right ${thClass}`}>Valor de Referência</th>
                  <th className={`text-right ${thClass}`}>Benefício</th>
                  <th className="text-right pl-3 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Investimento</th>
                </tr>
              </thead>
              <tbody>
                {recurring.map((p, i) => {
                  const gross = (p.unit_value || 0) * (p.quantity || 1)
                  const beneficioVal = gross - (p.monthly_value || 0)
                  const beneficioPct = gross > 0 ? Math.round((beneficioVal / gross) * 100) : 0
                  const hasDiscount = beneficioPct > 0
                  const qty = p.snapshot.unit_label
                    ? `${p.quantity} ${p.snapshot.unit_label}`
                    : String(p.quantity)
                  return (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-4 pr-4 text-gray-800 font-medium">{p.snapshot.name}</td>
                      <td className="py-4 px-3 text-right text-gray-500 whitespace-nowrap">{qty}</td>
                      <td className="py-4 px-3 text-right text-gray-500">{fmtCurrency(p.unit_value)}</td>
                      <td className="py-4 px-3 text-right text-gray-400">
                        {hasDiscount
                          ? <span className="line-through decoration-[0.5px]">{fmtCurrency(gross)}</span>
                          : <span className="text-gray-700">{fmtCurrency(gross)}</span>
                        }
                      </td>
                      <td className="py-4 px-3 text-right font-medium" style={{ color: primaryColor }}>
                        {beneficioPct > 0 ? `${beneficioPct}%` : '0%'}
                      </td>
                      <td className="py-4 pl-3 text-right font-semibold text-gray-900">
                        {fmtCurrency(p.monthly_value)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {grossRecurring > totalMonthly && (
            <div className="flex justify-end mt-5">
              <div className="min-w-[300px] space-y-2 text-sm">
                <div className="flex justify-between gap-12 text-gray-500">
                  <span>Valor de Referência</span>
                  <span>{fmtCurrency(grossRecurring)}</span>
                </div>
                <div className="flex justify-between gap-12 font-medium" style={{ color: primaryColor }}>
                  <span>Benefício concedido</span>
                  <span>– {fmtCurrency(grossRecurring - totalMonthly)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Único ─────────────────────────────────── */}
      {oneTime.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-[3px] mb-5">Investimento Único</p>
          <div className={isWeb ? 'overflow-x-auto -mx-1' : ''}>
            <table className={`w-full text-sm ${isWeb ? 'min-w-[520px]' : ''}`}>
              <thead>
                <tr className="border-b border-gray-200">
                  <th className={thLeft}>Produto</th>
                  <th className={`text-right ${thClass}`}>Qtd.</th>
                  <th className={`text-right ${thClass}`}>Base de Cálculo</th>
                  <th className={`text-right ${thClass}`}>Valor de Referência</th>
                  <th className={`text-right ${thClass}`}>Benefício</th>
                  <th className="text-right pl-3 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Investimento</th>
                </tr>
              </thead>
              <tbody>
                {oneTime.map((p, i) => {
                  const gross = (p.unit_value || 0) * (p.quantity || 1)
                  const beneficioVal = gross - (p.setup_value || 0)
                  const beneficioPct = gross > 0 ? Math.round((beneficioVal / gross) * 100) : 0
                  const hasDiscount = beneficioPct > 0
                  const qty = p.snapshot.unit_label
                    ? `${p.quantity} ${p.snapshot.unit_label}`
                    : String(p.quantity)
                  return (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-4 pr-4 text-gray-800 font-medium">{p.snapshot.name}</td>
                      <td className="py-4 px-3 text-right text-gray-500 whitespace-nowrap">{qty}</td>
                      <td className="py-4 px-3 text-right text-gray-500">{fmtCurrency(p.unit_value)}</td>
                      <td className="py-4 px-3 text-right text-gray-400">
                        {hasDiscount
                          ? <span className="line-through decoration-[0.5px]">{fmtCurrency(gross)}</span>
                          : <span className="text-gray-700">{fmtCurrency(gross)}</span>
                        }
                      </td>
                      <td className="py-4 px-3 text-right font-medium" style={{ color: primaryColor }}>
                        {beneficioPct > 0 ? `${beneficioPct}%` : '0%'}
                      </td>
                      <td className="py-4 pl-3 text-right font-semibold text-gray-900">
                        {fmtCurrency(p.setup_value)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {grossOneTime > totalSetup && (
            <div className="flex justify-end mt-5">
              <div className="min-w-[300px] space-y-2 text-sm">
                <div className="flex justify-between gap-12 text-gray-500">
                  <span>Valor de Referência</span>
                  <span>{fmtCurrency(grossOneTime)}</span>
                </div>
                <div className="flex justify-between gap-12 font-medium" style={{ color: primaryColor }}>
                  <span>Benefício concedido</span>
                  <span>– {fmtCurrency(grossOneTime - totalSetup)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Resumo ─────────────────────────────────── */}
      <div
        className="rounded-3xl p-8 lg:p-10"
        style={{ backgroundColor: primaryLight }}
      >
        <div className={`grid gap-8 ${premiumGrid}`}>
          <div>
            <p className="text-[10px] uppercase tracking-[3px] mb-2 text-gray-500">Valor de Referência</p>
            <p className="text-base font-light text-gray-600">{fmtCurrency(totalGross)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[3px] mb-2 text-gray-500">Benefício Total</p>
            <p className="text-base font-medium" style={{ color: primaryColor }}>
              {totalBeneficio > 0 ? `– ${fmtCurrency(totalBeneficio)}` : '—'}
            </p>
          </div>
          {totalSetup > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[3px] mb-2 text-gray-500">Investimento Único</p>
              <p className={`font-semibold text-gray-900 ${heroValue}`}>{fmtCurrency(totalSetup)}</p>
            </div>
          )}
          {totalMonthly > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[3px] mb-2 text-gray-500">Investimento Mensal</p>
              <div className="flex items-baseline gap-1">
                <span className={`font-semibold text-gray-900 ${heroValue}`}>{fmtCurrency(totalMonthly)}</span>
                <span className="text-[10px] text-gray-500 font-light">/mês</span>
              </div>
            </div>
          )}
        </div>
        {totalBeneficio > 0 && (
          <div
            className="border-t pt-5 mt-6"
            style={{ borderColor: primaryMid }}
          >
            <p className="text-sm text-gray-600 leading-relaxed">
              ✓ Esta proposta contempla{' '}
              <strong className="font-semibold">{fmtCurrency(totalBeneficio)}</strong>
              {' '}em benefícios comerciais em relação ao valor de referência das soluções.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  if (isWeb) {
    return (
      <WebSection bg="#ffffff">
        <WebLabel text={block.title || BLOCK_LABELS['investimento']} color={primaryColor} />
        {investimentoContent}
      </WebSection>
    )
  }

  return (
    <section className="px-16 py-20 border-b border-gray-100">
      <p className="text-[10px] font-semibold text-[#1FE97C] uppercase tracking-[3px] mb-8">
        {block.title || BLOCK_LABELS['investimento']}
      </p>
      {investimentoContent}
    </section>
  )
}

// ─── BlockAssinatura ──────────────────────────────────────────────────────────

function BlockAssinatura({ block, signerData, primaryColor, variant = 'document' }: {
  block: ProposalBlock
  signerData: SignerData
  primaryColor: string
  variant?: Variant
}) {
  if (variant === 'web') {
    return (
      <WebSection bg="#f5f5f3">
        <WebLabel text={block.title || BLOCK_LABELS['assinatura']} color={primaryColor} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-20 max-w-2xl">
          <div>
            <div className="h-px bg-gray-300 mb-5" />
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Cliente</p>
            <p className="text-gray-400 text-sm">Nome / Cargo</p>
          </div>
          <div>
            <div className="h-px mb-5" style={{ backgroundColor: primaryColor, opacity: 0.4 }} />
            <p className="text-gray-900 font-medium text-sm">{signerData.name}</p>
            {signerData.job_title && <p className="text-gray-500 text-xs mt-0.5">{signerData.job_title}</p>}
            {signerData.email && <p className="text-gray-400 text-xs mt-0.5">{signerData.email}</p>}
            {signerData.phone && <p className="text-gray-400 text-xs mt-0.5">{signerData.phone}</p>}
          </div>
        </div>
      </WebSection>
    )
  }

  return (
    <section className="px-16 py-24">
      <p className="text-[10px] font-semibold text-[#1FE97C] uppercase tracking-[3px] mb-16">
        {block.title || BLOCK_LABELS['assinatura']}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-20 max-w-2xl">
        <div>
          <div className="h-px bg-gray-300 mb-4" />
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Cliente</p>
          <p className="text-gray-400 text-sm">Nome / Cargo</p>
        </div>
        <div>
          <div className="h-px bg-gray-300 mb-4" />
          <p className="text-gray-900 font-medium text-sm">{signerData.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">{signerData.job_title}</p>
          {signerData.email && <p className="text-gray-400 text-xs mt-0.5">{signerData.email}</p>}
          {signerData.phone && <p className="text-gray-400 text-xs mt-0.5">{signerData.phone}</p>}
        </div>
      </div>
    </section>
  )
}

// ─── Main renderer ─────────────────────────────────────────────────────────────

export default function ProposalPreview({
  proposal, blocks, signerData, companyName, primaryColor, coverBgUrl, coverVideoUrl, variant = 'document',
}: Props) {
  const activeBlocks = blocks.filter(b => b.enabled).sort((a, b) => a.sort_order - b.sort_order)
  const products = proposal.products || []

  const allBenefits = products.flatMap(p => p.snapshot.benefits || [])
  const allScope = products.flatMap(p => p.snapshot.scope || [])
  const allDifferentials = products.flatMap(p => p.snapshot.differentials || [])

  return (
    <div className="font-sans text-gray-900 antialiased">
      {activeBlocks.map(block => {
        const type = block.type as BlockType

        switch (type) {
          case 'cover':
            return <BlockCover key={block.id} proposal={proposal} companyName={companyName} coverBgUrl={coverBgUrl} coverVideoUrl={coverVideoUrl} primaryColor={primaryColor} variant={variant} />
          case 'cenario':
            return <BlockCenario key={block.id} block={block} proposal={proposal} primaryColor={primaryColor} variant={variant} />
          case 'objetivos':
            return <BlockObjetivos key={block.id} block={block} proposal={proposal} primaryColor={primaryColor} variant={variant} />
          case 'solucao':
            return <BlockSolucao key={block.id} block={block} proposal={proposal} primaryColor={primaryColor} variant={variant} />
          case 'beneficios':
            return <BlockList key={block.id} block={block} fallbackItems={allBenefits} primaryColor={primaryColor} variant={variant} webBg={hexToRgba(primaryColor, 0.05)} />
          case 'escopo':
            return <BlockList key={block.id} block={block} fallbackItems={allScope} primaryColor={primaryColor} variant={variant} webBg="#ffffff" />
          case 'diferenciais':
            return <BlockList key={block.id} block={block} fallbackItems={allDifferentials} primaryColor={primaryColor} variant={variant} webBg="#f5f5f3" />
          case 'faq':
            return <BlockFaq key={block.id} block={block} primaryColor={primaryColor} variant={variant} />
          case 'proximos_passos':
            return <BlockProxPassos key={block.id} block={block} primaryColor={primaryColor} variant={variant} />
          case 'sobre':
            return <BlockSobre key={block.id} block={block} primaryColor={primaryColor} variant={variant} />
          case 'investimento':
            return <BlockInvestimento key={block.id} block={block} proposal={proposal} primaryColor={primaryColor} variant={variant} />
          case 'assinatura':
            return <BlockAssinatura key={block.id} block={block} signerData={signerData} primaryColor={primaryColor} variant={variant} />
          default:
            return null
        }
      })}
    </div>
  )
}
