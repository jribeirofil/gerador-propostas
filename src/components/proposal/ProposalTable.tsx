'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, X, ChevronLeft, ChevronRight, ChevronDown, Check, ArrowUp, ArrowDown, ArrowUpDown, Pencil, Archive, Copy, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface ProposalRow {
  id: string
  title: string
  code: number | null
  status: string
  opportunity_status: string | null
  is_archived: boolean | null
  has_pending_review: boolean | null
  version: number | null
  version_group: string | null
  total_monthly: number | null
  total_setup: number | null
  validade_dias: number | null
  updated_at: string | null
  created_at: string | null
  client: {
    empresa: string
    contato: string
    colaboradores: number | null
  } | null
}

interface Props {
  proposals: ProposalRow[]
  currentUserId?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isExpired(p: ProposalRow): boolean {
  if (!['sent', 'generated', 'approved', 'lost'].includes(p.status)) return false
  if (!p.created_at || !p.validade_dias) return false
  const exp = new Date(p.created_at)
  exp.setDate(exp.getDate() + p.validade_dias)
  return exp < new Date()
}

type OppResult = 'open' | 'won' | 'lost' | null

function getOppResult(p: ProposalRow): OppResult {
  if (['draft', 'generated'].includes(p.status)) return null
  if (p.opportunity_status === 'won')  return 'won'
  if (p.opportunity_status === 'lost') return 'lost'
  return 'open'
}

function getProposalLabel(p: ProposalRow): string {
  const v = p.version ?? 1
  if (['archived', 'arquivada'].includes(p.status)) return 'Arquivada'
  if (['draft', 'generated'].includes(p.status)) return 'Rascunho'
  return `v${v} enviada`
}

const OPP_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  open: { label: 'Em aberto', dot: 'bg-blue-400',      text: 'text-blue-500 dark:text-blue-400' },
  won:  { label: 'Ganha',     dot: 'bg-emerald-400',   text: 'text-emerald-600 dark:text-emerald-400' },
  lost: { label: 'Perdida',   dot: 'bg-red-400',       text: 'text-red-500 dark:text-red-400' },
}

function OppChip({ result }: { result: OppResult }) {
  if (!result) return <span className="text-sm text-app-muted">—</span>
  const { label, dot, text } = OPP_CONFIG[result]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  )
}

// ── Filter components ───────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const selected = options.find(o => o.value === value) ?? options[0]
  const isFiltered = value !== 'all'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors shadow-sm whitespace-nowrap ${
          isFiltered
            ? 'bg-fay-green/10 border-fay-green-deep/30 text-fay-green-deep'
            : 'bg-app-surface border-app-border text-app-muted hover:bg-[var(--row-hover)] hover:border-fay-green-deep/30'
        }`}
      >
        {selected.label}
        <ChevronDown size={12} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-app-surface border border-app-border rounded-xl shadow-card-md overflow-hidden z-20">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                o.value === value
                  ? 'text-fay-green-deep bg-[var(--row-hover)]'
                  : 'text-app-text hover:bg-[var(--row-hover)]'
              }`}
            >
              <span className="w-3.5 flex-shrink-0">
                {o.value === value && <Check size={13} className="text-fay-green-deep" />}
              </span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const PROPOSAL_STATE_OPTIONS = [
  { value: 'all',      label: 'Proposta' },
  { value: 'draft',    label: 'Rascunho' },
  { value: 'sent',     label: 'Enviada' },
  { value: 'archived', label: 'Arquivada' },
]

const VALIDITY_OPTIONS = [
  { value: 'all',     label: 'Validade' },
  { value: 'active',  label: 'Vigente' },
  { value: 'expired', label: 'Expirada' },
]

// ── Action buttons ──────────────────────────────────────────────────────────

function ActionBtn({
  title, icon: Icon, onClick, href, danger,
}: {
  title: string
  icon: React.ElementType
  onClick?: (e: React.MouseEvent) => void
  href?: string
  danger?: boolean
}) {
  const cls = `inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
    danger
      ? 'text-app-muted hover:text-red-400 hover:bg-red-400/10'
      : 'text-app-muted hover:text-app-text'
  }`
  if (href) {
    return (
      <Link href={href} title={title} className={cls} onClick={onClick}>
        <Icon size={15} strokeWidth={1.75} />
      </Link>
    )
  }
  return (
    <button type="button" title={title} className={cls} onClick={onClick}>
      <Icon size={15} strokeWidth={1.75} />
    </button>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

type SortKey = 'empresa' | 'resultado' | 'proposta' | 'monthly' | 'setup' | 'date'
type SortDir = 'asc' | 'desc'

const OPP_TABS = [
  { value: 'all',  label: 'Todos' },
  { value: 'open', label: 'Em aberto' },
  { value: 'won',  label: 'Ganhas' },
  { value: 'lost', label: 'Perdidas' },
]

function fmtCurrency(value?: number | null): string {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return format(new Date(iso), 'dd/MM/yy', { locale: ptBR })
}

export default function ProposalTable({ proposals: initial, currentUserId }: Props) {
  const [proposals, setProposals] = useState(initial)
  const [archiveTarget, setArchiveTarget] = useState<ProposalRow | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [search, setSearch] = useState('')
  const [oppFilter, setOppFilter] = useState('all')
  const [proposalFilter, setProposalFilter] = useState('all')
  const [validityFilter, setValidityFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => { setPage(0) }, [search, oppFilter, proposalFilter, validityFilter])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-app-muted/40 group-hover:text-app-muted transition-colors" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-fay-green-deep" />
      : <ArrowDown size={12} className="text-fay-green-deep" />
  }

  function SortTh({ col, label, className }: { col: SortKey; label: string; className?: string }) {
    const active = sortKey === col
    return (
      <th className={className}>
        <button
          type="button"
          onClick={() => handleSort(col)}
          className={`group flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-colors ${
            active ? 'text-fay-green-deep' : 'text-app-muted hover:text-app-text'
          }`}
        >
          {label}
          <SortIcon col={col} />
        </button>
      </th>
    )
  }

  async function handleArchive() {
    if (!archiveTarget) return
    setArchiving(true)

    const { error } = await supabase
      .from('proposal')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq('id', archiveTarget.id)

    if (error) {
      showToast('Não foi possível arquivar a proposta.', 'error')
      setArchiving(false)
      setArchiveTarget(null)
      return
    }

    await supabase.from('proposal_event').insert({
      proposal_id: archiveTarget.id,
      event_type: 'archived',
      created_by: currentUserId,
    })

    setProposals(prev => prev.filter(p => p.id !== archiveTarget.id))
    setArchiveTarget(null)
    showToast('Proposta arquivada.')
    router.refresh()
    setArchiving(false)
  }

  const filtered = proposals.filter(p => {
    const empresa  = p.client?.empresa?.toLowerCase() || ''
    const contato  = p.client?.contato?.toLowerCase() || ''
    const archived = p.is_archived === true || ['archived', 'arquivada'].includes(p.status)
    const codeStr  = p.code ? String(p.code) : ''

    if (search) {
      const q = search.toLowerCase().replace(/^#/, '')
      const matchesCode    = codeStr.includes(q)
      const matchesEmpresa = empresa.includes(q)
      const matchesContato = contato.includes(q)
      if (!matchesCode && !matchesEmpresa && !matchesContato) return false
    }

    // Arquivadas só aparecem quando o filtro "Arquivada" está ativo
    if (proposalFilter === 'archived') {
      if (!archived) return false
    } else {
      if (archived) return false
    }

    // Filtro principal: resultado da oportunidade
    if (oppFilter !== 'all') {
      const opp = p.opportunity_status || 'open'
      if (oppFilter === 'open' && opp !== 'open') return false
      if (oppFilter === 'won'  && opp !== 'won')  return false
      if (oppFilter === 'lost' && opp !== 'lost') return false
    }

    // Filtro secundário: estado da proposta (exceto arquivada, tratado acima)
    if (proposalFilter !== 'all' && proposalFilter !== 'archived') {
      if (proposalFilter === 'draft' && !['draft', 'generated'].includes(p.status)) return false
      if (proposalFilter === 'sent'  && !['sent', 'approved', 'lost'].includes(p.status)) return false
    }

    // Filtro secundário: validade
    if (validityFilter !== 'all') {
      const expired = isExpired(p)
      if (validityFilter === 'active'  && expired) return false
      if (validityFilter === 'expired' && !expired) return false
    }

    return true
  })

  const sorted = sortKey ? [...filtered].sort((a, b) => {
    let va: string | number = ''
    let vb: string | number = ''
    if (sortKey === 'empresa')    { va = a.client?.empresa?.toLowerCase() || ''; vb = b.client?.empresa?.toLowerCase() || '' }
    else if (sortKey === 'proposta')  { va = getProposalLabel(a); vb = getProposalLabel(b) }
    else if (sortKey === 'resultado') {
      const order = { won: 0, open: 1, lost: 2 }
      va = order[getOppResult(a) ?? 'open'] ?? 1
      vb = order[getOppResult(b) ?? 'open'] ?? 1
    }
    else if (sortKey === 'monthly') { va = a.total_monthly || 0; vb = b.total_monthly || 0 }
    else if (sortKey === 'setup')   { va = a.total_setup   || 0; vb = b.total_setup   || 0 }
    else if (sortKey === 'date')    { va = a.updated_at || a.created_at || ''; vb = b.updated_at || b.created_at || '' }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  }) : filtered

  const PAGE_SIZE   = 10
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (proposals.length === 0) {
    return (
      <div className="bg-app-surface rounded-2xl border border-app-border p-16 text-center shadow-sm">
        <div className="w-14 h-14 rounded-xl bg-overlay-md flex items-center justify-center mx-auto mb-5">
          <Building2 size={24} className="text-app-muted" />
        </div>
        <p className="text-sm font-semibold text-app-text mb-1.5">Nenhuma proposta ainda</p>
        <p className="text-xs text-app-muted mb-6">Crie sua primeira proposta para começar.</p>
        <Link
          href="/dashboard/nova"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-fay-green text-fay-dark rounded-lg text-sm font-semibold hover:bg-fay-green-deep hover:text-white transition-colors"
        >
          + Criar proposta
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* ── Busca ── */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por empresa, contato ou #código..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-app-surface border border-app-border rounded-full pl-11 pr-10 py-3 text-sm text-app-text placeholder-app-muted hover:bg-[var(--row-hover)] hover:border-fay-green-deep/40 focus:outline-none focus:bg-app-surface focus:border-fay-green-deep transition-colors shadow-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-app-muted hover:text-app-text transition-colors rounded-full hover:bg-[var(--row-hover)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Filtros: tabs + secundários na mesma linha ── */}
      <div className="flex items-center gap-1.5 mb-4">
        {OPP_TABS.map(tab => {
          const active = oppFilter === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setOppFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active
                  ? 'bg-fay-green/15 text-fay-green-deep border border-fay-green-deep/20'
                  : 'text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
        <div className="w-px h-4 bg-app-border mx-1" />
        <FilterSelect value={proposalFilter} onChange={setProposalFilter} options={PROPOSAL_STATE_OPTIONS} />
        <FilterSelect value={validityFilter} onChange={setValidityFilter} options={VALIDITY_OPTIONS} />
        <span className="ml-auto text-xs text-app-muted">
          {filtered.length} {filtered.length === 1 ? 'proposta' : 'propostas'}
        </span>
      </div>

      {/* ── Tabela ── */}
      <div className="bg-app-surface rounded-2xl border border-app-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-app-border bg-overlay">
              <th className="text-left pl-6 pr-3 py-3.5 w-16 text-xs font-semibold text-app-muted tracking-wide">#</th>
              <SortTh col="empresa"    label="Cliente"    className="text-left px-4 py-3.5" />
              <SortTh col="resultado"  label="Resultado"  className="text-left px-5 py-3.5" />
              <SortTh col="proposta"   label="Proposta"   className="text-left px-5 py-3.5" />
              <SortTh col="monthly"    label="Mensal"     className="text-left px-5 py-3.5" />
              <SortTh col="setup"      label="Único"      className="text-left px-5 py-3.5" />
              <SortTh col="date"       label="Atualizado" className="text-left px-5 py-3.5" />
              <th className="px-5 py-3.5 w-32 text-xs font-semibold text-app-muted text-left tracking-wide">Opções</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-app-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-sm text-app-muted">
                  Nenhuma proposta encontrada para os filtros aplicados.
                </td>
              </tr>
            ) : (
              paginated.map(p => {
                const version        = p.version ?? 1
                const opp            = getOppResult(p)
                const expired        = isExpired(p)
                const archived       = p.is_archived === true || ['archived', 'arquivada'].includes(p.status)
                const pendingReview  = p.has_pending_review === true

                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/dashboard/propostas/${p.id}`)}
                    className="hover:bg-[var(--row-hover)] transition-colors cursor-pointer group"
                  >
                    {/* Código — borda âmbar quando há revisão pendente */}
                    <td className={`pl-6 pr-3 py-5 border-l-2 transition-colors ${
                      pendingReview ? 'border-amber-400' : 'border-transparent'
                    }`}>
                      <span className="text-sm font-mono font-medium text-app-muted">
                        {p.code ? `#${String(p.code).padStart(3, '0')}` : '—'}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          archived ? 'bg-app-muted/10' : 'bg-fay-green/10'
                        }`}>
                          <Building2 size={16} className={archived ? 'text-app-muted' : 'text-fay-green-deep'} strokeWidth={1.75} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[14px] text-app-text leading-tight">
                              {p.client?.empresa || '—'}
                            </p>
                          </div>
                          <p className="text-xs text-app-muted mt-0.5">
                            {p.client?.contato}
                            {p.client?.colaboradores ? ` · ${p.client.colaboradores} vidas` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Resultado */}
                    <td className="px-5 py-5">
                      <OppChip result={opp} />
                    </td>

                    {/* Proposta */}
                    <td className="px-5 py-5">
                      <p className="text-sm text-app-text">{getProposalLabel(p)}</p>
                      {expired && (
                        <p className="text-[11px] text-red-400 font-medium mt-0.5">Expirada</p>
                      )}
                    </td>

                    {/* Mensal */}
                    <td className="px-5 py-5 text-app-text text-sm">
                      {fmtCurrency(p.total_monthly)}
                      {p.total_monthly ? <span className="text-app-muted text-xs">/mês</span> : ''}
                    </td>

                    {/* Único */}
                    <td className="px-5 py-5 text-app-text text-sm">
                      {fmtCurrency(p.total_setup)}
                    </td>

                    {/* Data */}
                    <td className="px-5 py-5 text-app-muted text-sm">
                      {fmtDate(p.updated_at ?? p.created_at)}
                    </td>

                    {/* Ações inline */}
                    <td
                      className="px-5 py-5 text-right"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-0.5">
                        <ActionBtn
                          title="Editar"
                          icon={Pencil}
                          href={`/dashboard/propostas/${p.id}/editar`}
                        />
                        <ActionBtn
                          title="Duplicar"
                          icon={Copy}
                          href={`/dashboard/propostas/${p.id}/duplicar`}
                        />
                        <ActionBtn
                          title="Arquivar"
                          icon={Archive}
                          danger
                          onClick={() => setArchiveTarget(p)}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginação ── */}
      <div className="flex items-center justify-between mt-5 px-1">
        <span className="text-sm text-app-muted">
          Página {page + 1} de {totalPages} · {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-app-muted border border-app-border bg-app-surface hover:bg-overlay hover:text-app-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronLeft size={14} />
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-app-muted border border-app-border bg-app-surface hover:bg-overlay hover:text-app-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Próxima
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!archiveTarget}
        title={`Arquivar proposta de ${archiveTarget?.client?.empresa || archiveTarget?.title}?`}
        description="A proposta será removida da listagem principal. Não é uma exclusão permanente."
        variant="danger"
        confirmText="Arquivar"
        loading={archiving}
        onConfirm={handleArchive}
        onCancel={() => !archiving && setArchiveTarget(null)}
      />
    </>
  )
}
