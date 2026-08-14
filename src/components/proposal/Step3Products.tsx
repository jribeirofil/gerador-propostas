'use client'
import { useEffect, useState } from 'react'
import { Search, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCategoryClasses, type Category } from '@/types/admin'
import type { CatalogProduct } from '@/types/engine'
import type { UseFormWatch, UseFormSetValue } from 'react-hook-form'
import type { ProposalFormData } from './ProposalForm'

interface Props {
  watch: UseFormWatch<ProposalFormData>
  setValue: UseFormSetValue<ProposalFormData>
}

type CategoryFilter = 'all' | string

export default function Step3Products({ watch, setValue }: Props) {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const supabase = createClient()
  const selected: string[] = watch('product_ids') || []

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data, error }, { data: cats }] = await Promise.all([
        supabase
          .from('product')
          .select(`
            id, name, slug, description, active, sort_order, category,
            unit_label, calculation_type, billing_frequency, default_price_table_id,
            benefits:product_benefit(id, title, sort_order, active),
            scope:product_scope(id, title, sort_order, active),
            faq:product_faq(id, question, answer, sort_order, active),
            differentials:product_differential(id, title, sort_order, active)
          `)
          .eq('active', true)
          .order('sort_order', { ascending: true }),
        supabase.from('category').select('*').order('sort_order', { ascending: true }),
      ])

      if (error) { setError(error.message || 'Não foi possível carregar o catálogo.'); setLoading(false); return }

      const normalized = (data || []).map(p => ({
        ...p,
        benefits: (p.benefits || []).filter((b: { active: boolean }) => b.active),
        scope: (p.scope || []).filter((s: { active: boolean }) => s.active),
        faq: (p.faq || []).filter((f: { active: boolean }) => f.active),
        differentials: (p.differentials || []).filter((d: { active: boolean }) => d.active),
      })) as CatalogProduct[]

      setProducts(normalized)
      setCategories((cats || []) as Category[])
      setValue('catalog_products', normalized)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          className="w-full h-9 pl-8 pr-8 text-sm bg-app-surface border border-app-border rounded-xl text-app-text placeholder-app-muted focus:outline-none focus:border-fay-green-deep transition-colors"
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
              ? 'bg-fay-green-deep text-white border-fay-green-deep'
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
                    ? 'border-fay-green-deep/50 bg-fay-green/5'
                    : 'border-transparent hover:border-app-border hover:bg-overlay'
                }`}
              >
                <span className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-fay-green border-fay-green'
                    : 'border-app-border bg-transparent'
                }`}>
                  {isSelected && <Check size={10} className="text-fay-dark" strokeWidth={3} />}
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
