'use client'
import { useState } from 'react'
import { Search, Check, X } from 'lucide-react'
import { getCategoryClasses, type Category } from '@/types/admin'
import type { CatalogProduct } from '@/types/engine'
import type { UseFormWatch, UseFormSetValue } from 'react-hook-form'
import type { ProposalFormData } from './ProposalForm'

interface Props {
  watch: UseFormWatch<ProposalFormData>
  setValue: UseFormSetValue<ProposalFormData>
  products: CatalogProduct[]
  categories: Category[]
  loading: boolean
  error: string | null
}

type CategoryFilter = 'all' | string

export default function Step3Products({ watch, setValue, products, categories, loading, error }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const selected: string[] = watch('product_ids') || []

  function toggle(id: string) {
    setValue(
      'product_ids',
      selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]
    )
  }

  const filtered = products.filter(p => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const catLabel = p.category
        ? (categories.find(c => c.slug === p.category)?.name ?? '').toLowerCase()
        : ''
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        catLabel.includes(q)
      )
    }
    return true
  })

  const counts = categories.reduce<Record<string, number>>((acc, c) => {
    acc[c.slug] = products.filter(p => p.category === c.slug).length
    return acc
  }, {})

  if (loading) return (
    <div className="py-12 text-center text-sm text-app-muted">Carregando catálogo...</div>
  )
  if (error) return (
    <div className="py-12 text-center text-sm text-red-400">{error}</div>
  )
  if (products.length === 0) return (
    <div className="py-12 text-center text-sm text-app-muted">
      Nenhum produto ativo. Cadastre em Administração → Catálogo de produtos.
    </div>
  )

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-sora font-semibold text-base text-app-text">Produtos</h2>
        <p className="text-xs text-app-muted mt-0.5">Quais soluções fazem sentido para este cliente?</p>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-8 pr-8 text-sm bg-app-surface border border-app-border rounded-xl text-app-text placeholder-app-muted focus:outline-none focus:border-brand-green-deep transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors ${
            categoryFilter === 'all'
              ? 'bg-brand-green-deep text-white border-brand-green-deep'
              : 'border-app-border text-app-muted hover:text-app-text'
          }`}
        >
          Todos · {products.length}
        </button>
        {categories.filter(c => (counts[c.slug] ?? 0) > 0).map(c => {
          const isActive = categoryFilter === c.slug
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(isActive ? 'all' : c.slug)}
              className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? `${getCategoryClasses(c.color)} border-current`
                  : 'border-app-border text-app-muted hover:text-app-text'
              }`}
            >
              {c.name} · {counts[c.slug]}
            </button>
          )
        })}
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-app-muted text-center py-8">Nenhum resultado.</p>
      ) : (
        <div className="space-y-1">
          {filtered.map(prod => {
            const isSelected = selected.includes(prod.id)
            const cat = prod.category ? categories.find(c => c.slug === prod.category) : null
            const catColor = cat ? getCategoryClasses(cat.color) : ''
            const catLabel = cat?.name ?? null

            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => toggle(prod.id)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${
                  isSelected
                    ? 'border-brand-green-deep/50 bg-brand-green/5'
                    : 'border-transparent hover:border-app-border hover:bg-overlay'
                }`}
              >
                <span className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-brand-green border-brand-green-deep'
                    : 'border-app-border bg-transparent'
                }`}>
                  {isSelected && <Check size={10} className="text-brand-dark" strokeWidth={3} />}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-app-text">{prod.name}</span>
                  </div>
                  {prod.description && (
                    <p className="text-xs text-app-muted mt-0.5 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-app-muted mt-5">Selecione pelo menos uma solução para continuar.</p>
      )}
    </div>
  )
}
