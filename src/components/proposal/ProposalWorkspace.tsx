'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/ui/StatusBadge'
import OpportunityBadge from '@/components/ui/OpportunityBadge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ProposalPreview from '@/components/proposal/ProposalPreview'
import ProposalForm from '@/components/proposal/ProposalForm'
import type { ProposalFormData } from '@/components/proposal/ProposalForm'
import type { ProposalBlock } from '@/lib/blocks'
import type { PricingType, CatalogProduct } from '@/types/engine'
import { useToast } from '@/components/ui/Toast'
import { Pencil, Copy, Download, Share2, MoreHorizontal, ExternalLink, Archive, Eye, GitBranch, Clock, Send, FileText, CheckCircle2, ChevronDown, Trophy, X, type LucideIcon } from 'lucide-react'

type Tab = 'preview' | 'conteudo' | 'resumo' | 'historico'

const TABS: { id: Tab; label: string; href?: string }[] = [
  { id: 'resumo',    label: 'Resumo'       },
  { id: 'conteudo',  label: 'Proposta' },
  { id: 'preview',   label: 'Visualização' },
  { id: 'historico', label: 'Atividade'    },
]

function fmt(v: number | null | undefined) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const EVENT_LABELS: Record<string, string> = {
  created:               'Proposta criada',
  edited:                'Informações editadas',
  pdf_generated:         'PDF exportado',
  archived:              'Proposta arquivada',
  unarchived:            'Proposta restaurada',
  duplicated:            'Proposta duplicada a partir desta',
  sent:                  'Proposta enviada ao cliente',
  viewed:                'Cliente visualizou a proposta',
  accepted:              'Proposta aceita pelo cliente',
  proposal_approved:     'Cliente aprovou a proposta',
  adjustments_requested: 'Cliente solicitou ajustes',
  proposal_declined:     'Cliente decidiu não seguir neste momento',
  opportunity_won:       'Oportunidade marcada como ganha',
  opportunity_lost:      'Oportunidade marcada como perdida',
  opportunity_reopened:  'Oportunidade reaberta',
  expired_opened:        'Cliente abriu proposta expirada',
  update_requested:      'Cliente solicitou atualização da proposta',
}

const OPPORTUNITY_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Aberta',  color: 'text-blue-400'       },
  won:  { label: 'Ganha',   color: 'text-fay-green-deep' },
  lost: { label: 'Perdida', color: 'text-red-400'        },
}

const LOST_REASONS = [
  'Sem orçamento',
  'Fechou com concorrente',
  'Projeto cancelado',
  'Sem retorno',
  'Timing inadequado',
  'Decidiu fazer internamente',
  'Outro',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

interface TimelineItem {
  id: string
  label: string
  date: string
  kind: 'event' | 'version' | 'analytics'
  versionId?: string
  versionNum?: number
  isCurrent?: boolean
  metadata?: Record<string, string> | null
  eventType?: string
}

function getTimelineIcon(item: TimelineItem): { Icon: LucideIcon; color: string } {
  if (item.kind === 'analytics') return { Icon: Eye,          color: 'text-fay-green' }
  if (item.kind === 'version')   return { Icon: GitBranch,    color: 'text-blue-400'  }
  switch (item.eventType) {
    case 'viewed':                return { Icon: Eye,          color: 'text-fay-green'   }
    case 'pdf_generated':         return { Icon: Download,     color: 'text-app-muted'   }
    case 'sent':                  return { Icon: Send,         color: 'text-blue-400'    }
    case 'created':               return { Icon: FileText,     color: 'text-app-muted'   }
    case 'edited':                return { Icon: Pencil,       color: 'text-app-muted'   }
    case 'archived':
    case 'unarchived':            return { Icon: Archive,      color: 'text-app-muted'   }
    case 'proposal_approved':
    case 'accepted':
    case 'opportunity_won':       return { Icon: CheckCircle2, color: 'text-emerald-400' }
    case 'opportunity_lost':
    case 'proposal_declined':     return { Icon: X,            color: 'text-red-400'     }
    case 'expired_opened':
    case 'update_requested':      return { Icon: Clock,        color: 'text-amber-400'   }
    default:                      return { Icon: Clock,        color: 'text-app-muted'   }
  }
}

interface AnalyticsSummary {
  totalViews: number
  pdfDownloads: number
  firstViewedAt: string | null
  lastViewedAt: string | null
  avgReadTimeSeconds: number
}

interface Props {
  proposal: AnyRecord
  blocks: ProposalBlock[]
  events: AnyRecord[]
  versionHistory: AnyRecord[]
  signerData: { name: string; job_title: string; email: string; phone: string }
  companyName: string
  primaryColor: string
  analyticsSummary?: AnalyticsSummary | null
  analyticsTimeline?: Array<{ label: string; date: string }>
  catalogProducts?: CatalogProduct[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  return fmtDate(dateStr)
}

function formatReadTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  return `${Math.round(seconds / 60)}min`
}

export default function ProposalWorkspace({
  proposal,
  blocks,
  events,
  versionHistory,
  signerData,
  companyName,
  primaryColor,
  analyticsSummary,
  analyticsTimeline = [],
  catalogProducts = [],
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('resumo')
  const [menuOpen, setMenuOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const { showToast } = useToast()
  const menuRef = useRef<HTMLDivElement>(null)
  const versionRef = useRef<HTMLDivElement>(null)
  const oppMenuRef = useRef<HTMLDivElement>(null)
  const [versionOpen, setVersionOpen] = useState(false)
  const [oppMenuOpen, setOppMenuOpen] = useState(false)
  const [lostReasonOpen, setLostReasonOpen] = useState(false)
  const [lostReason, setLostReason] = useState(proposal.lost_reason as string || '')
  const [lostComment, setLostComment] = useState(proposal.lost_comment as string || '')
  const [opportunityStatus, setOpportunityStatus] = useState(proposal.opportunity_status as string || 'open')
  const [savingOpportunity, setSavingOpportunity] = useState(false)
  const supabase = createClient()

  const client = proposal.client as AnyRecord | null
  const products = (proposal.products as AnyRecord[]) || []
  const empresa = client?.empresa || 'Proposta'
  const totalMonthly = proposal.total_monthly as number | null
  const totalSetup = proposal.total_setup as number | null

  // initialData para o ProposalForm embutido na tab Proposta
  const _client = proposal.client as AnyRecord | null
  const _products = (proposal.products as AnyRecord[]) || []
  const formInitialData: Partial<ProposalFormData> = {
    empresa:       (_client?.empresa      as string) || '',
    cnpj:          (_client?.cnpj         as string) || '',
    contato:       (_client?.contato      as string) || '',
    cargo:         (_client?.cargo        as string) || '',
    email:         (_client?.email        as string) || '',
    whatsapp:      (_client?.whatsapp     as string) || '',
    colaboradores: (_client?.colaboradores as number) || undefined,
    segmento:      (_client?.segmento     as string) || '',
    motivacoes: (proposal.diagnosis as string)
      ? (proposal.diagnosis as string).split(', ').filter(Boolean)
      : [],
    product_ids: _products.map(p => p.product_id as string).filter(Boolean),
    product_pricing: _products.filter(p => p.product_id).map(p => ({
      product_id:       p.product_id       as string,
      pricing_type:     ((p.pricing_type   as string) || 'monthly') as PricingType,
      unit_value:       (p.unit_value      as number) || 0,
      quantity:         (p.quantity        as number) || 1,
      discount_percent: (p.discount_percent as number) || 0,
      notes:            (p.notes           as string) || '',
      manual_override:  (p.manual_override as boolean) || false,
      override_reason:  (p.override_reason as string) || '',
    })),
    desconto_pct:      (proposal.discount_percent as number) || 0,
    validade_dias:     (proposal.validade_dias    as number) || 30,
    forma_pagamento:   (proposal.forma_pagamento as string) ? (proposal.forma_pagamento as string).split(', ') : [],
    prazo_implantacao: (proposal.prazo_implantacao as string) || '',
    vigencia_contrato:  (proposal.vigencia_contrato as string) || '',
    notas_internas:     (proposal.commercial_notes as string) || '',
    catalog_products:   catalogProducts,
  }

  // Deriva estado de envio a partir dos eventos (sem campo extra no DB)
  const sentEvents = (events as AnyRecord[]).filter(e => e.event_type === 'sent')
  const hasBeenShared = sentEvents.length > 0
  const lastSentAt = sentEvents[0]?.created_at as string | undefined
  const hasPendingChanges = hasBeenShared &&
    !!proposal.updated_at &&
    !!lastSentAt &&
    new Date(proposal.updated_at as string) > new Date(lastSentAt)

  // Validade
  const expiryDate: Date | null = proposal.created_at && proposal.validade_dias
    ? (() => {
        const d = new Date(proposal.created_at as string)
        d.setDate(d.getDate() + (proposal.validade_dias as number))
        return d
      })()
    : null
  const isExpired = expiryDate ? expiryDate < new Date() : false

  // Revisão solicitada (adjustments_requested após o último envio)
  const lastAdjustEvent = (events as AnyRecord[]).find(e => e.event_type === 'adjustments_requested')
  const hasReviewRequest = !!lastAdjustEvent && (
    !lastSentAt || new Date(lastAdjustEvent.created_at as string) > new Date(lastSentAt)
  )

  // Atualização solicitada (update_requested após o último envio)
  const lastUpdateReqEvent = (events as AnyRecord[]).find(e => e.event_type === 'update_requested')
  const hasUpdateRequest = !!lastUpdateReqEvent && (
    !lastSentAt || new Date(lastUpdateReqEvent.created_at as string) > new Date(lastSentAt)
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (versionRef.current && !versionRef.current.contains(e.target as Node)) setVersionOpen(false)
      if (oppMenuRef.current && !oppMenuRef.current.contains(e.target as Node)) setOppMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSetOpportunity(status: string, reason?: string, comment?: string) {
    setSavingOpportunity(true)
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/opportunity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, lost_reason: reason, lost_comment: comment }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        showToast(error || 'Erro ao atualizar status.', 'error')
        return
      }
      setOpportunityStatus(status)
      if (reason) setLostReason(reason)
      if (comment !== undefined) setLostComment(comment)
      setLostReasonOpen(false)
      setOppMenuOpen(false)
      const TOASTS: Record<string, string> = {
        won:  'Oportunidade marcada como ganha.',
        lost: 'Oportunidade marcada como perdida.',
        open: 'Oportunidade reaberta.',
      }
      showToast(TOASTS[status] || 'Status atualizado.')
      router.refresh()
    } finally {
      setSavingOpportunity(false)
    }
  }

  async function handleDownloadPdf() {
    setPdfLoading(true)
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/pdf`)
      const { html } = await res.json()
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;'
      document.body.appendChild(iframe)
      iframe.srcdoc = html
      iframe.onload = () => {
        iframe.contentWindow?.print()
        setTimeout(() => document.body.removeChild(iframe), 2000)
      }
    } catch {}
    setPdfLoading(false)
  }

  async function handleShare() {
    setShareLoading(true)
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/share`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const { token } = await res.json()
      const url = `${window.location.origin}/p/${token}`
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link da proposta copiado.')
      }).catch(() => {
        showToast('Link gerado com sucesso.')
      })
    } catch {
      showToast('Erro ao gerar link. Tente novamente.', 'error')
    } finally {
      setShareLoading(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/publish`, { method: 'POST' })
      const { token, version, error } = await res.json()
      if (error) throw new Error(error)
      setPublishOpen(false)
      router.refresh()
      const url = `${window.location.origin}/p/${token}`
      navigator.clipboard.writeText(url).then(() => {
        showToast(`v${version} publicada — link copiado!`)
      }).catch(() => {
        showToast(`v${version} publicada com sucesso!`)
      })
    } catch {
      showToast('Erro ao publicar versão. Tente novamente.', 'error')
    } finally {
      setPublishing(false)
    }
  }

  async function handleArchive() {
    setArchiving(true)
    await supabase
      .from('proposal')
      .update({ is_archived: true, status: 'archived', archived_at: new Date().toISOString() })
      .eq('id', proposal.id)
    setArchiving(false)
    setArchiveOpen(false)
    router.push('/dashboard')
  }

  const timeline: TimelineItem[] = [
    ...events.map((e: AnyRecord) => ({
      id: `ev-${e.id}`,
      label: EVENT_LABELS[e.event_type] || e.event_type,
      date: e.created_at as string,
      kind: 'event' as const,
      metadata: (e.metadata as Record<string, string> | null) ?? null,
      eventType: e.event_type as string,
    })),
    // Only show v2+ — v1 creation is already covered by the 'created' event
    ...versionHistory
      .filter((v: AnyRecord) => (v.version as number) > 1)
      .map((v: AnyRecord) => ({
        id: `v-${v.id}`,
        label: `Nova versão criada (v${v.version})`,
        date: v.created_at as string,
        kind: 'version' as const,
        versionId: v.id as string,
        versionNum: v.version as number,
        isCurrent: v.id === proposal.id,
      })),
    ...analyticsTimeline.map((a, i) => ({
      id: `analytics-${i}`,
      label: a.label,
      date: a.date,
      kind: 'analytics' as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      {/* Premium header */}
      <div className="border-b border-app-border bg-app-surface sticky top-0 z-20">
        <div className="px-6 pt-4 pb-0">

          {/* Row 1: breadcrumb + actions */}
          <div className="flex items-start justify-between gap-4 mb-3">

            {/* Left: breadcrumb → entity info */}
            <div className="min-w-0 flex-1">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 mb-2">
                <Link
                  href="/dashboard"
                  className="text-xs text-app-muted hover:text-app-text transition-colors"
                >
                  Propostas
                </Link>
                <span className="text-app-muted/30 text-xs select-none mx-0.5">/</span>
                <span className="text-xs text-app-muted/60 truncate max-w-[280px]">{empresa}</span>
              </div>

              {/* Entity row */}
              <div className="flex items-center gap-2.5">
                <h1 className="text-[18px] font-bold text-app-text leading-none tracking-tight">
                  {empresa}
                </h1>
                {proposal.code && (
                  <span className="text-[11px] font-semibold font-mono text-app-muted/60 bg-overlay-md border border-app-border px-1.5 py-0.5 rounded">
                    #{String(proposal.code as number).padStart(3, '0')}
                  </span>
                )}
              </div>

              {/* Subtitle: resultado · versão · última enviada */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className={`text-[13px] font-semibold ${
                  opportunityStatus === 'won'  ? 'text-fay-green-deep' :
                  opportunityStatus === 'lost' ? 'text-red-400' :
                  'text-app-muted'
                }`}>
                  {OPPORTUNITY_CONFIG[opportunityStatus]?.label ?? 'Aberta'}
                </span>
                <span className="text-app-muted/30 select-none text-sm">·</span>
                <span className="text-[13px] text-app-muted font-medium">v{proposal.version as number}</span>
                {hasBeenShared && lastSentAt && (
                  <>
                    <span className="text-app-muted/30 select-none text-sm">·</span>
                    <span className="text-[12px] text-app-muted">
                      Última versão enviada em {fmtDateTime(lastSentAt)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: action toolbar */}
            <div className="flex items-center gap-1.5 shrink-0 pt-5">
              {/* Editar */}
              <Link
                href={`/dashboard/propostas/${proposal.id}/editar`}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-app-muted border border-app-border rounded-lg hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
              >
                <Pencil size={12} strokeWidth={2} />
                Editar
              </Link>

              {/* Duplicar */}
              <Link
                href={`/dashboard/propostas/${proposal.id}/duplicar`}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-app-muted border border-app-border rounded-lg hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
              >
                <Copy size={12} strokeWidth={2} />
                Duplicar
              </Link>

              {/* Separator */}
              <div className="w-px h-5 bg-app-border" />

              {/* Baixar PDF */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-app-muted border border-app-border rounded-lg hover:text-app-text hover:bg-[var(--row-hover)] transition-colors disabled:opacity-50"
              >
                <Download size={12} strokeWidth={2} />
                {pdfLoading ? 'Gerando...' : 'PDF'}
              </button>

              {/* Compartilhar — primary CTA (primeiro envio ou copiar link) */}
              <button
                type="button"
                onClick={handleShare}
                disabled={shareLoading}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold bg-fay-green text-fay-dark rounded-lg hover:bg-fay-green-deep hover:text-white transition-colors disabled:opacity-50"
              >
                <Share2 size={12} strokeWidth={2.5} />
                {shareLoading ? 'Gerando...' : hasBeenShared ? 'Copiar link' : 'Compartilhar'}
              </button>

              {/* Overflow — only archive + ver web */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(o => !o)}
                  className="w-8 h-8 flex items-center justify-center text-app-muted border border-app-border rounded-lg hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
                >
                  <MoreHorizontal size={15} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-app-surface border border-app-border rounded-xl overflow-hidden shadow-card-md z-30">
                    <a
                      href={`/dashboard/propostas/${proposal.id}/preview-web`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
                    >
                      <ExternalLink size={13} />
                      Ver proposta web
                    </a>
                    <div className="border-t border-app-border my-0.5" />
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setArchiveOpen(true) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                    >
                      <Archive size={13} />
                      Arquivar proposta
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: tabs flush to header border */}
          <div className="flex items-center gap-0">
            {TABS.map(tab => {
              const tabClass = `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-fay-green text-app-text'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`
              if (tab.href) {
                return (
                  <Link
                    key={tab.id}
                    href={`/dashboard/propostas/${proposal.id}/${tab.href}`}
                    className={tabClass}
                  >
                    {tab.label}
                  </Link>
                )
              }
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={tabClass}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Banner: revisão solicitada pelo cliente */}
      {hasReviewRequest && (
        <div className="border-b border-app-border bg-app-surface2 px-6 py-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-app-text">
              {lastAdjustEvent?.metadata?.name
                ? `${String(lastAdjustEvent.metadata.name)} solicitou revisão.`
                : 'Cliente solicitou revisão.'}
            </p>
            {lastAdjustEvent?.metadata?.name && (
              <p className="text-[11px] text-app-muted mt-0.5">
                {lastAdjustEvent.metadata.email}
                {lastAdjustEvent.metadata.cargo && ` · ${lastAdjustEvent.metadata.cargo}`}
              </p>
            )}
            {lastAdjustEvent?.metadata?.comment && (
              <p className="text-xs text-app-muted mt-0.5 italic line-clamp-2">
                &ldquo;{String(lastAdjustEvent.metadata.comment)}&rdquo;
              </p>
            )}
            <p className="text-[11px] text-app-muted mt-1">{fmtDateTime(lastAdjustEvent?.created_at as string)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('conteudo')}
              className="h-8 px-3 text-xs font-medium text-app-muted border border-app-border rounded-lg hover:bg-[var(--row-hover)] hover:text-app-text transition-colors"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              className="h-8 px-3 text-xs font-semibold border border-app-border text-app-text rounded-lg hover:bg-[var(--row-hover)] transition-colors"
            >
              Publicar v{(proposal.version as number) + 1}
            </button>
          </div>
        </div>
      )}

      {/* Banner: cliente solicitou atualização (proposta expirada) */}
      {hasUpdateRequest && (
        <div className="border-b border-app-border bg-app-surface2 px-6 py-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-app-text">Cliente solicitou atualização desta proposta expirada.</p>
            <p className="text-xs text-app-muted mt-0.5">
              Edite a proposta e publique uma nova versão para reenviar ao cliente.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('conteudo')}
              className="h-8 px-3 text-xs font-medium text-app-muted border border-app-border rounded-lg hover:bg-[var(--row-hover)] hover:text-app-text transition-colors"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              className="h-8 px-3 text-xs font-semibold border border-app-border text-app-text rounded-lg hover:bg-[var(--row-hover)] transition-colors"
            >
              Publicar v{(proposal.version as number) + 1}
            </button>
          </div>
        </div>
      )}

      {/* Banner: alterações não publicadas */}
      {hasPendingChanges && !hasReviewRequest && !hasUpdateRequest && (
        <div className="border-b border-app-border bg-app-surface2 px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-app-text">Existem alterações não publicadas.</p>
            <p className="text-xs text-app-muted mt-0.5">
              As mudanças feitas desde a versão v{proposal.version as number} ainda não foram compartilhadas com o cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPublishOpen(true)}
            className="shrink-0 h-8 px-4 text-xs font-semibold border border-app-border text-app-text rounded-lg hover:bg-[var(--row-hover)] transition-colors"
          >
            Publicar v{(proposal.version as number) + 1}
          </button>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1">
        {/* PREVIEW */}
        {activeTab === 'preview' && (
          <div className="flex flex-col">
            <div className="bg-white">
              <ProposalPreview
                proposal={proposal as Parameters<typeof ProposalPreview>[0]['proposal']}
                blocks={blocks}
                signerData={signerData}
                companyName={companyName}
                primaryColor={primaryColor}
              />
            </div>
          </div>
        )}

        {/* PROPOSTA — formulário de edição inline */}
        {activeTab === 'conteudo' && (
          <div className="px-6 py-6">
            <ProposalForm
              mode="edit"
              initialData={formInitialData}
              existingClientId={proposal.client_id as string}
              sourceProposalId={proposal.id as string}
            />
          </div>
        )}

        {/* RESUMO */}
        {activeTab === 'resumo' && (
          <div className="px-6 py-6">
            <div className="flex gap-6 items-start">

              {/* ── Coluna principal ── */}
              <div className="flex-1 min-w-0 space-y-5">

                {/* CLIENTE */}
                {client && (
                  <section>
                    <h2 className="text-[11px] font-semibold text-app-muted uppercase tracking-widest mb-3">Cliente</h2>
                    <div className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        {([
                          ['Empresa',       client?.empresa],
                          ['Contato',       client?.contato],
                          ['Cargo',         client?.cargo],
                          ['Segmento',      client?.segmento],
                          ['E-mail',        client?.email],
                          ['WhatsApp',      client?.whatsapp],
                          ['Vidas', client?.colaboradores],
                          ['CNPJ',          client?.cnpj],
                        ] as [string, unknown][]).filter(([, v]) => v).map(([label, value]) => (
                          <div key={label}>
                            <span className="text-[10px] font-semibold text-app-muted/60 uppercase tracking-wider block mb-1">{label}</span>
                            <span className="text-sm font-medium text-app-text">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* PRODUTOS */}
                {products.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <h2 className="text-[11px] font-semibold text-app-muted uppercase tracking-widest">Produtos</h2>
                      {products.length > 1 && (
                        <span className="text-[10px] font-medium text-app-muted border border-app-border bg-app-bg px-1.5 py-0.5 rounded-full">
                          {products.length}
                        </span>
                      )}
                    </div>
                    <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm overflow-hidden divide-y divide-app-border">
                      {products.map((p: AnyRecord) => {
                        const snap = p.snapshot as AnyRecord
                        return (
                          <div key={p.id} className="p-5 flex items-start justify-between gap-6">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-app-text leading-tight">{snap?.name || 'Produto'}</p>
                              {snap?.description && (
                                <p className="text-xs text-app-muted mt-1 line-clamp-2 leading-relaxed">{snap.description}</p>
                              )}
                              {p.quantity && (
                                <p className="text-xs text-app-muted mt-2">
                                  <span className="font-medium text-app-text">{p.quantity}</span>{' '}
                                  {snap?.unit_label || 'colaboradores'}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 text-right space-y-2.5">
                              {p.monthly_value > 0 && (
                                <div>
                                  <span className="text-[10px] font-semibold text-app-muted/60 uppercase tracking-wider block mb-0.5">Mensal</span>
                                  <span className="text-base font-bold text-fay-green">{fmt(p.monthly_value)}</span>
                                </div>
                              )}
                              {p.setup_value > 0 && (
                                <div>
                                  <span className="text-[10px] font-semibold text-app-muted/60 uppercase tracking-wider block mb-0.5">Valor único</span>
                                  <span className="text-base font-bold text-app-text">{fmt(p.setup_value)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* CONDIÇÕES COMERCIAIS */}
                <section>
                  <h2 className="text-[11px] font-semibold text-app-muted uppercase tracking-widest mb-3">Condições comerciais</h2>
                  <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-3 divide-x divide-app-border">
                      {([
                        ['Validade',            proposal.validade_dias ? `${proposal.validade_dias} dias` : null],
                        ['Pagamento',           proposal.forma_pagamento],
                        ['Prazo de implantação', proposal.prazo_implantacao],
                      ] as [string, string | null][]).map(([label, value]) => (
                        <div key={label} className="px-5 py-4">
                          <span className="text-[10px] font-semibold text-app-muted/60 uppercase tracking-wider block mb-1">{label}</span>
                          <span className={`text-sm font-medium ${value ? 'text-app-text' : 'text-app-muted'}`}>{value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* ATIVIDADE */}
                {timeline.length > 0 && (
                  <section>
                    <h2 className="text-[11px] font-semibold text-app-muted uppercase tracking-widest mb-3">Atividade</h2>
                    <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm overflow-hidden divide-y divide-app-border">
                      {timeline.slice(0, 6).map(item => {
                        const { Icon, color } = getTimelineIcon(item)
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                            <div className={`w-7 h-7 rounded-lg bg-app-bg border border-app-border flex items-center justify-center shrink-0`}>
                              <Icon size={12} className={color} />
                            </div>
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              {item.kind === 'version' && item.versionId && !item.isCurrent ? (
                                <Link
                                  href={`/dashboard/propostas/${item.versionId}`}
                                  className="text-sm text-app-muted hover:text-app-text transition-colors truncate"
                                >
                                  {item.label}
                                </Link>
                              ) : (
                                <span className={`text-sm truncate ${item.kind === 'analytics' ? 'text-fay-green-deep font-medium' : 'text-app-text'}`}>
                                  {item.label}
                                </span>
                              )}
                              {item.isCurrent && (
                                <span className="text-[10px] bg-fay-green/10 text-fay-green-deep px-1.5 py-0.5 rounded-full shrink-0">atual</span>
                              )}
                            </div>
                            <span className="text-[11px] text-app-muted shrink-0 tabular-nums">{fmtDateTime(item.date)}</span>
                          </div>
                        )
                      })}
                      {timeline.length > 6 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('historico')}
                          className="w-full px-5 py-3 text-xs text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors text-left"
                        >
                          Ver atividade completa ({timeline.length} eventos) →
                        </button>
                      )}
                    </div>
                  </section>
                )}

              </div>

              {/* ── Sidebar sticky ── */}
              <div className="w-72 xl:w-80 shrink-0 sticky top-[110px] space-y-5">

                {/* RESULTADO + PROPOSTA */}
                <section>
                  <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm overflow-hidden">

                    {/* RESULTADO */}
                    <div className="px-4 pt-4 pb-3 border-b border-app-border">
                      <p className="text-[10px] font-semibold text-app-muted uppercase tracking-widest mb-3">Resultado</p>
                      <div className="flex items-center justify-between" ref={oppMenuRef}>
                        <OpportunityBadge status={opportunityStatus} />
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOppMenuOpen(o => !o)}
                            disabled={savingOpportunity}
                            className="flex items-center gap-1 h-7 px-2 rounded-lg text-xs text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors disabled:opacity-50"
                          >
                            {savingOpportunity ? 'Salvando...' : 'Alterar'}
                            <ChevronDown size={11} />
                          </button>
                          {oppMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-44 bg-app-surface border border-app-border rounded-xl shadow-card-md z-30 overflow-hidden">
                              {[
                                { value: 'open', label: 'Aberta'  },
                                { value: 'won',  label: 'Ganha'   },
                                { value: 'lost', label: 'Perdida' },
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setOppMenuOpen(false)
                                    if (opt.value === 'lost') {
                                      setLostReasonOpen(true)
                                    } else {
                                      handleSetOpportunity(opt.value)
                                    }
                                  }}
                                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center gap-2 ${
                                    opportunityStatus === opt.value
                                      ? 'text-app-text font-semibold bg-[var(--row-hover)]'
                                      : 'text-app-muted hover:text-app-text hover:bg-[var(--row-hover)]'
                                  }`}
                                >
                                  {opportunityStatus === opt.value && <span className="w-1 h-1 rounded-full bg-fay-green-deep" />}
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {opportunityStatus === 'lost' && lostReason && (
                        <div className="mt-2.5 pt-2.5 border-t border-app-border">
                          <p className="text-[11px] text-app-muted">Motivo</p>
                          <p className="text-[12px] text-red-400 font-medium mt-0.5">{lostReason}</p>
                          {lostComment && (
                            <p className="text-[11px] text-app-muted mt-0.5 italic">{lostComment}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* PROPOSTA */}
                    <div className="px-4 py-3 space-y-2.5">
                      <p className="text-[10px] font-semibold text-app-muted uppercase tracking-widest mb-1">Proposta</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-app-muted">Versão atual</span>
                        <span className="text-xs font-semibold text-app-text">v{proposal.version}</span>
                      </div>
                      {hasBeenShared && lastSentAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-app-muted">Última enviada</span>
                          <span className="text-xs text-app-text">{fmtDate(lastSentAt)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-app-muted">Criada em</span>
                        <span className="text-xs text-app-text">{fmtDate(proposal.created_at)}</span>
                      </div>
                      {proposal.updated_at && proposal.updated_at !== proposal.created_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-app-muted">Atualizada</span>
                          <span className="text-xs text-app-text">{timeAgo(proposal.updated_at as string)}</span>
                        </div>
                      )}
                      {expiryDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-app-muted">Validade</span>
                          <span className={`text-xs font-medium ${isExpired ? 'text-red-400' : 'text-fay-green-deep'}`}>
                            {isExpired ? 'Expirada' : 'Vigente'}
                            <span className="text-app-muted font-normal ml-1">
                              ({expiryDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })})
                            </span>
                          </span>
                        </div>
                      )}
                      {analyticsSummary && analyticsSummary.totalViews > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-app-border">
                          <span className="text-xs text-app-muted">Visualizações</span>
                          <span className="text-xs font-semibold text-fay-green-deep">{analyticsSummary.totalViews}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </section>

                {/* RECEITA */}
                {(totalMonthly || (totalSetup != null && totalSetup > 0)) && (
                  <section>
                    <h2 className="text-[11px] font-semibold text-app-muted uppercase tracking-widest mb-3">Receita</h2>
                    <div className="bg-app-surface rounded-2xl p-4 shadow-sm space-y-4" style={{ border: '1.5px solid var(--fay-green)' }}>
                      {totalMonthly ? (
                        <div>
                          <span className="text-[10px] font-semibold text-app-muted/60 uppercase tracking-wider block mb-1.5">Recorrente mensal</span>
                          <span className="text-[26px] font-bold text-fay-green leading-none">{fmt(totalMonthly)}</span>
                        </div>
                      ) : null}
                      {totalSetup != null && totalSetup > 0 && (
                        <div className={totalMonthly ? 'pt-3 border-t border-app-border' : ''}>
                          <span className="text-[10px] font-semibold text-app-muted/60 uppercase tracking-wider block mb-1.5">Valor único</span>
                          <span className="text-xl font-bold text-app-text leading-none">{fmt(totalSetup)}</span>
                        </div>
                      )}
                      {proposal.discount_percent > 0 && (
                        <div className="flex items-center justify-between pt-2.5 border-t border-app-border">
                          <span className="text-xs text-app-muted">Desconto</span>
                          <span className="text-sm font-semibold text-amber-400">{proposal.discount_percent}%</span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* AÇÕES */}
                <section>
                  <h2 className="text-[11px] font-semibold text-app-muted uppercase tracking-widest mb-3">Ações</h2>
                  <div className="bg-app-surface border border-app-border rounded-2xl p-3 space-y-1.5">
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={shareLoading}
                      className="w-full inline-flex items-center justify-center gap-2 h-9 text-xs font-semibold bg-fay-green text-fay-dark rounded-xl hover:bg-fay-green-deep hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Share2 size={13} strokeWidth={2.5} />
                      {shareLoading ? 'Gerando link...' : 'Compartilhar link'}
                    </button>

                    <a
                      href={`/dashboard/propostas/${proposal.id}/preview-web`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 h-9 text-xs font-medium text-app-muted rounded-xl hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
                    >
                      <ExternalLink size={13} />
                      Visualizar na web
                    </a>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={pdfLoading}
                      className="w-full inline-flex items-center justify-center gap-2 h-9 text-xs font-medium text-app-muted rounded-xl hover:text-app-text hover:bg-[var(--row-hover)] transition-colors disabled:opacity-50"
                    >
                      <Download size={13} />
                      {pdfLoading ? 'Gerando PDF...' : 'Baixar PDF'}
                    </button>
                    <Link
                      href={`/dashboard/propostas/${proposal.id}/editar`}
                      className="w-full inline-flex items-center justify-center gap-2 h-9 text-xs font-medium text-app-muted rounded-xl hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
                    >
                      <Pencil size={13} />
                      Editar proposta
                    </Link>
                  </div>
                </section>

              </div>
            </div>
          </div>
        )}

        {/* HISTÓRICO */}
        {activeTab === 'historico' && (
          <div className="px-6 py-6 space-y-6">

            {/* Analytics summary */}
            {analyticsSummary ? (
              <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <p className="text-3xl font-bold text-app-text leading-none">{analyticsSummary.totalViews}</p>
                    <p className="text-xs text-app-muted mt-1.5">visualizações</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-app-text leading-none">{analyticsSummary.pdfDownloads}</p>
                    <p className="text-xs text-app-muted mt-1.5">downloads PDF</p>
                  </div>
                  {analyticsSummary.avgReadTimeSeconds > 0 && (
                    <div>
                      <p className="text-3xl font-bold text-app-text leading-none">{formatReadTime(analyticsSummary.avgReadTimeSeconds)}</p>
                      <p className="text-xs text-app-muted mt-1.5">tempo médio de leitura</p>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-app-border space-y-1">
                  {analyticsSummary.lastViewedAt && (
                    <p className="text-xs text-app-muted">
                      Última visualização <span className="text-app-text">{timeAgo(analyticsSummary.lastViewedAt)}</span>
                    </p>
                  )}
                  {analyticsSummary.firstViewedAt && (
                    <p className="text-xs text-app-muted">
                      Primeira visualização <span className="text-app-text">{fmtDateTime(analyticsSummary.firstViewedAt)}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
                <p className="text-sm font-medium text-app-text mb-1">Nenhuma visualização ainda</p>
                <p className="text-xs text-app-muted">Compartilhe o link da proposta para começar a acompanhar o engajamento do cliente.</p>
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={shareLoading}
                  className="mt-4 px-4 py-2 text-sm font-semibold bg-fay-green text-fay-dark rounded-lg hover:bg-fay-green-deep hover:text-white transition-colors disabled:opacity-50"
                >
                  {shareLoading ? 'Gerando...' : 'Compartilhar link'}
                </button>
              </div>
            )}

            {/* Timeline */}
            {timeline.length === 0 ? (
              <p className="text-sm text-app-muted">Nenhum evento registrado.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-3 bottom-3 w-px bg-app-border" />
                <div className="space-y-0">
                  {timeline.map(item => (
                    <div key={item.id} className="flex items-start gap-5 pl-10 relative py-4">
                      <div className={`absolute left-[9px] top-5 w-2 h-2 rounded-full ${
                        item.kind === 'analytics'
                          ? 'bg-fay-green/60 border-2 border-fay-green/30'
                          : 'bg-app-bg border-2 border-app-border'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.kind === 'version' && item.versionId && !item.isCurrent ? (
                            <Link
                              href={`/dashboard/propostas/${item.versionId}`}
                              className="text-sm text-app-muted hover:text-app-text transition-colors"
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <p className={`text-sm ${item.kind === 'analytics' ? 'text-fay-green-deep' : 'text-app-text'}`}>
                              {item.label}
                            </p>
                          )}
                          {item.isCurrent && (
                            <span className="text-[11px] bg-fay-green/15 text-fay-green-deep px-1.5 py-0.5 rounded-full">
                              atual
                            </span>
                          )}
                          {item.metadata?.reason && (
                            <span className="text-[10px] bg-app-surface border border-app-border text-app-muted px-2 py-0.5 rounded-full">
                              {item.metadata.reason}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-app-muted mt-0.5">{fmtDateTime(item.date)}</p>
                        {/* Identidade do cliente (aprovação / ajustes) */}
                        {(['opportunity_won', 'adjustments_requested'].includes(item.eventType || '') && item.metadata?.name) && (
                          <div className="mt-1.5 space-y-0.5">
                            <p className="text-xs text-app-text font-medium">
                              {item.metadata.name}
                              {item.metadata.cargo && <span className="font-normal text-app-muted"> · {item.metadata.cargo}</span>}
                            </p>
                            <p className="text-[11px] text-app-muted">{item.metadata.email}</p>
                          </div>
                        )}
                        {/* Sem identificação (recusa) */}
                        {item.eventType === 'opportunity_lost' && !item.metadata?.name && (
                          <p className="text-[11px] text-app-muted mt-1">Não identificado</p>
                        )}
                        {item.metadata?.comment && (
                          <p className="text-xs text-app-muted/70 mt-1.5 italic leading-relaxed">
                            &ldquo;{item.metadata.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={archiveOpen}
        title="Arquivar proposta"
        description={`Tem certeza que deseja arquivar a proposta para "${empresa}"? Ela não aparecerá na lista principal.`}
        variant="danger"
        confirmText="Arquivar"
        loading={archiving}
        onConfirm={handleArchive}
        onCancel={() => setArchiveOpen(false)}
      />

      {/* Modal: Motivo de perda */}
      {lostReasonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-app-surface border border-app-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-app-text">Motivo da perda</h2>
              <button
                type="button"
                onClick={() => setLostReasonOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-app-muted mb-4">Selecione o principal motivo pelo qual a oportunidade foi perdida.</p>
            <div className="space-y-1.5 mb-4">
              {LOST_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setLostReason(r)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                    lostReason === r
                      ? 'border-red-400/50 bg-red-400/10 text-red-400 font-medium'
                      : 'border-app-border text-app-muted hover:text-app-text hover:border-app-border hover:bg-[var(--row-hover)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {lostReason === 'Outro' && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-app-muted mb-1.5">Observação</label>
                <input
                  type="text"
                  value={lostComment}
                  onChange={e => setLostComment(e.target.value)}
                  placeholder="Descreva o motivo..."
                  className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-fay-green-deep transition-colors"
                  autoFocus
                />
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setLostReasonOpen(false)}
                className="flex-1 h-9 text-xs font-medium text-app-muted border border-app-border rounded-xl hover:bg-[var(--row-hover)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!lostReason || savingOpportunity}
                onClick={() => handleSetOpportunity('lost', lostReason, lostComment)}
                className="flex-1 h-9 text-xs font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-40"
              >
                {savingOpportunity ? 'Salvando...' : 'Marcar como perdida'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Publicar nova versão */}
      {publishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h2 className="text-base font-bold text-app-text mb-1">Publicar nova versão</h2>
            <p className="text-sm text-app-muted mb-5 leading-relaxed">
              O link do cliente será atualizado e registrará uma nova versão na atividade da proposta.
            </p>
            <div className="bg-app-bg border border-app-border rounded-xl p-4 mb-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-app-muted uppercase tracking-wider mb-1">Versão atual</p>
                <p className="text-xl font-bold text-app-muted">v{proposal.version as number}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-app-muted uppercase tracking-wider mb-1">Nova versão</p>
                <p className="text-xl font-bold text-fay-green">v{(proposal.version as number) + 1}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPublishOpen(false)}
                disabled={publishing}
                className="flex-1 h-9 text-xs font-medium text-app-muted border border-app-border rounded-xl hover:bg-[var(--row-hover)] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 h-9 text-xs font-semibold bg-fay-green text-fay-dark rounded-xl hover:bg-fay-green-deep hover:text-white transition-colors disabled:opacity-50"
              >
                {publishing ? 'Publicando...' : `Publicar v${(proposal.version as number) + 1}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
