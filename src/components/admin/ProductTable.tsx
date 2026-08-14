'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Pencil, Trash2, Copy,
  ArrowUp, ArrowDown, ArrowUpDown,
  Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { getCategoryClasses, type AdminProduct, type Category } from '@/types/admin'

type SortKey = 'name' | 'category' | 'active' | 'created_at'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'inactive'
type CategoryFilter = 'all' | string

interface Props {
  products: AdminProduct[]
  categories: Category[]
}

const PAGE_SIZE = 15

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={12} className="text-app-muted/40" />
  return sortDir === 'asc'
    ? <ArrowUp size={12} className="text-fay-green-deep" />
    : <ArrowDown size={12} className="text-fay-green-deep" />
}

function SortTh({
  col, label, sortKey, sortDir, onSort, className = '',
}: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir
  onSort: (k: SortKey) => void; className?: string
}) {
  return (
    <th
      className={`px-5 py-3.5 text-left text-xs font-semibold text-app-muted tracking-wide cursor-pointer select-none hover:text-app-text transition-colors ${className}`}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  )
}

function ActionBtn({
  label, danger = false, disabled = false, onClick, children,
}: {
  label: string; danger?: boolean; disabled?: boolean
  onClick: (e: React.MouseEvent) => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
        danger
          ? 'text-app-muted hover:text-red-400 hover:bg-red-400/10'
          : 'text-app-muted hover:text-app-text hover:bg-[var(--row-hover)]'
      }`}
    >
      {children}
    </button>
  )
}

export default function ProductTable({ products: allProducts, categories }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const [products, setProducts] = useState(allProducts)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  const categoryCounts = categories.reduce<Record<string, number>>((acc, c) => {
    acc[c.slug] = products.filter(p => p.category === c.slug).length
    return acc
  }, {})
  const totalActive = products.filter(p => p.active).length

  const filtered = products
    .filter(p => {
      const q = search.toLowerCase()
      if (q) {
        const catLabel = p.category
          ? (categories.find(c => c.slug === p.category)?.name ?? '').toLowerCase()
          : ''
        const matches =
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false) ||
          catLabel.includes(q)
        if (!matches) return false
      }
      if (statusFilter === 'active' && !p.active) return false
      if (statusFilter === 'inactive' && p.active) return false
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name, 'pt-BR')
      else if (sortKey === 'category') cmp = (a.category || '').localeCompare(b.category || '')
      else if (sortKey === 'active') cmp = (b.active ? 1 : 0) - (a.active ? 1 : 0)
      else if (sortKey === 'created_at') cmp = (a.created_at || '').localeCompare(b.created_at || '')
      return sortDir === 'asc' ? cmp : -cmp
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  function handleSearch(v: string) { setSearch(v); setPage(1) }
  function handleCategoryFilter(v: CategoryFilter) { setCategoryFilter(v); setPage(1) }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('product').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    if (error) {
      showToast('Não foi possível excluir. O produto pode estar em uso em propostas.', 'error')
      setDeleteTarget(null)
      return
    }
    setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
    setDeleteTarget(null)
    showToast('Produto excluído.')
  }

  async function handleDuplicate(p: AdminProduct, e: React.MouseEvent) {
    e.stopPropagation()
    setDuplicating(p.id)
    const slug = p.slug + '-copia-' + Date.now().toString(36)
    const { data, error } = await supabase
      .from('product')
      .insert({
        name: 'Cópia de ' + p.name,
        slug,
        description: p.description,
        active: false,
        category: p.category,
        unit_label: p.unit_label,
        calculation_type: p.calculation_type,
        billing_frequency: p.billing_frequency,
        sort_order: p.sort_order + 1,
      })
      .select()
      .single()
    setDuplicating(null)
    if (error) { showToast('Não foi possível duplicar.', 'error'); return }
    router.push(`/dashboard/admin/produtos/${data.id}`)
  }

  const hasActiveFilters = search || statusFilter !== 'all' || categoryFilter !== 'all'

  return (
    <>
      {/* Category pills + summary */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          type="button"
          onClick={() => handleCategoryFilter('all')}
          className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium border transition-colors ${
            categoryFilter === 'all'
              ? 'bg-app-text text-app-bg border-app-text'
              : 'border-app-border text-app-muted hover:text-app-text hover:border-app-border'
          }`}
        >
          Todos
          <span className={`text-[11px] font-semibold tabular-nums ${categoryFilter === 'all' ? 'text-app-bg/70' : 'text-app-muted/60'}`}>
            {products.length}
          </span>
        </button>

        {categories.map(c => {
          const count = categoryCounts[c.slug] ?? 0
          const active = categoryFilter === c.slug
          const colorClasses = getCategoryClasses(c.color)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCategoryFilter(active ? 'all' : c.slug)}
              className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? `${colorClasses} border-current`
                  : 'border-app-border text-app-muted hover:text-app-text hover:border-app-border'
              }`}
            >
              {c.name}
              <span className={`text-[11px] font-semibold tabular-nums ${active ? 'opacity-70' : 'text-app-muted/60'}`}>
                {count}
              </span>
            </button>
          )
        })}

        <div className="ml-auto text-xs text-app-muted">
          {totalActive} ativo{totalActive !== 1 ? 's' : ''} · {products.length} total
        </div>
      </div>

      {/* Toolbar: search + status */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome, descrição ou categoria..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm bg-app-surface border border-app-border rounded-xl text-app-text placeholder-app-muted focus:outline-none focus:border-fay-green-deep hover:bg-[var(--row-hover)] hover:border-fay-green-deep/40 focus:bg-app-surface transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 h-9 px-1 bg-app-surface border border-app-border rounded-xl">
          {(['all', 'active', 'inactive'] as StatusFilter[]).map(v => {
            const label = v === 'all' ? 'Todos' : v === 'active' ? 'Ativos' : 'Inativos'
            return (
              <button
                key={v}
                type="button"
                onClick={() => { setStatusFilter(v); setPage(1) }}
                className={`px-3 h-7 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === v
                    ? 'bg-app-text text-app-bg'
                    : 'text-app-muted hover:text-app-text'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-app-surface rounded-2xl border border-app-border p-16 text-center shadow-sm">
          {!hasActiveFilters ? (
            <>
              <p className="text-sm font-semibold text-app-text mb-1.5">Nenhum produto cadastrado</p>
              <p className="text-xs text-app-muted">Crie o primeiro produto para começar.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-app-text mb-1.5">Nenhum resultado</p>
              <p className="text-xs text-app-muted mb-3">Tente ajustar a busca ou os filtros.</p>
              <button
                type="button"
                onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all') }}
                className="text-xs text-fay-green-deep hover:underline"
              >
                Limpar filtros
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="bg-app-surface rounded-2xl border border-app-border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app-border bg-overlay">
                  <SortTh col="name" label="Produto" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="pl-6" />
                  <SortTh col="category" label="Categoria" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh col="active" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh col="created_at" label="Criado em" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-5 py-3.5 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {paginated.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/dashboard/admin/produtos/${p.id}`)}
                    className="hover:bg-[var(--row-hover)] cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-[14px] text-app-text leading-tight">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-app-muted mt-0.5 line-clamp-1 max-w-sm">{p.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.category ? (() => {
                        const cat = categories.find(c => c.slug === p.category)
                        if (!cat) return <span className="text-xs text-app-muted/30">—</span>
                        return (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryClasses(cat.color)}`}>
                            {cat.name}
                          </span>
                        )
                      })() : (
                        <span className="text-xs text-app-muted/30">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.active
                          ? 'bg-fay-green/15 text-fay-green-deep'
                          : 'bg-app-border/60 text-app-muted'
                      }`}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-app-muted">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionBtn label="Editar" onClick={e => { e.stopPropagation(); router.push(`/dashboard/admin/produtos/${p.id}`) }}>
                          <Pencil size={14} />
                        </ActionBtn>
                        <ActionBtn label="Duplicar" disabled={duplicating === p.id} onClick={e => handleDuplicate(p, e)}>
                          <Copy size={14} />
                        </ActionBtn>
                        <ActionBtn danger label="Excluir" onClick={e => { e.stopPropagation(); setDeleteTarget(p) }}>
                          <Trash2 size={14} />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer: count + pagination */}
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-xs text-app-muted">
              {filtered.length === products.length
                ? `${products.length} produto${products.length !== 1 ? 's' : ''}`
                : `${filtered.length} de ${products.length} produto${products.length !== 1 ? 's' : ''}`
              }
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-xs text-app-muted bg-app-surface border border-app-border rounded-xl hover:bg-[var(--row-hover)] disabled:opacity-40 transition-colors"
                >
                  Anterior
                </button>
                <span className="text-xs text-app-muted tabular-nums">{safePage} / {totalPages}</span>
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-xs text-app-muted bg-app-surface border border-app-border rounded-xl hover:bg-[var(--row-hover)] disabled:opacity-40 transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Excluir "${deleteTarget?.name}"?`}
        description="Essa ação remove o produto permanentemente. Benefícios, escopo, FAQ e diferenciais também serão apagados."
        variant="danger"
        confirmText="Excluir produto"
        requireTyping="EXCLUIR"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </>
  )
}
