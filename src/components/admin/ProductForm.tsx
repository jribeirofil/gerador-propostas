'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/slugify'
import { useToast } from '@/components/ui/Toast'
import {
  CALCULATION_TYPE_LABELS, BILLING_FREQUENCY_LABELS, getCategoryClasses,
  type AdminProduct, type CalculationType, type BillingFrequency, type PriceTable, type Category,
} from '@/types/admin'
import Select from '@/components/ui/Select'

interface Props {
  product?: AdminProduct
  categories?: Category[]
}

const inputClass = 'w-full bg-app-surface border border-app-border rounded-xl px-3 py-2.5 text-sm text-app-text placeholder-brand-muted focus:outline-none focus:border-brand-green-deep transition-colors'
const labelClass = 'block text-xs font-medium text-app-muted mb-1.5'

export default function ProductForm({ product, categories = [] }: Props) {
  const isEditing = !!product
  const [name, setName] = useState(product?.name || '')
  const [category, setCategory] = useState<string>(product?.category || '')
  const [description, setDescription] = useState(product?.description || '')
  const [active, setActive] = useState(product?.active ?? true)
  const [calculationType, setCalculationType] = useState<CalculationType | ''>(product?.calculation_type || '')
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency | ''>(product?.billing_frequency || '')
  const [unitLabel, setUnitLabel] = useState(product?.unit_label || 'unidades')
  const [defaultPriceTableId, setDefaultPriceTableId] = useState(product?.default_price_table_id || '')
  const [priceTables, setPriceTables] = useState<PriceTable[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const needsPriceTable = calculationType === 'per_employee'

  useEffect(() => {
    if (!product?.id) return
    supabase
      .from('price_table')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setPriceTables(data || []))
  }, [product?.id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('O nome do produto é obrigatório.')
      return
    }
    if (!category) {
      setError('A categoria é obrigatória.')
      return
    }

    setSaving(true)

    const payload = {
      name: name.trim(),
      category: category || null,
      description: description.trim() || null,
      active,
      unit_label: unitLabel.trim() || 'unidades',
      calculation_type: calculationType || null,
      billing_frequency: billingFrequency || null,
      default_price_table_id: needsPriceTable ? (defaultPriceTableId || null) : null,
    }

    if (isEditing) {
      const { error } = await supabase
        .from('product')
        .update(payload)
        .eq('id', product.id)

      setSaving(false)
      if (error) {
        setError('Não foi possível salvar. Tente novamente.')
        return
      }
      showToast('Produto atualizado.')
      router.refresh()
    } else {
      const slug = slugify(name)
      const { data, error } = await supabase
        .from('product')
        .insert({ ...payload, slug })
        .select()
        .single()

      setSaving(false)
      if (error) {
        setError(error.message.includes('duplicate') ? 'Já existe um produto com esse nome.' : 'Não foi possível criar. Tente novamente.')
        return
      }
      showToast('Produto criado.')
      router.push(`/dashboard/admin/produtos/${data.id}`)
    }
  }

  return (
    <form onSubmit={handleSave} className="bg-app-surface border border-app-border rounded-2xl p-6 space-y-4 shadow-sm">
      <div>
        <label className={labelClass}>Nome do produto *</label>
        <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Ex: Plataforma NR-1" />
      </div>

      <div>
        <label className={labelClass}>Categoria *</label>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => {
            const isSelected = category === c.slug
            const colorClasses = getCategoryClasses(c.color)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(isSelected ? '' : c.slug)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  isSelected
                    ? `${colorClasses} border-current`
                    : 'border-app-border text-app-muted hover:text-app-text hover:border-brand-green-deep/40 bg-app-surface'
                }`}
              >
                {c.name}
              </button>
            )
          })}
          {categories.length === 0 && (
            <p className="text-xs text-app-muted py-1">Nenhuma categoria cadastrada.</p>
          )}
        </div>
      </div>

      <div>
        <label className={labelClass}>Descrição</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className={`${inputClass} resize-y min-h-24`}
          placeholder="Descrição que aparece na proposta comercial"
        />
      </div>

      <div>
        <label className={labelClass}>Unidade de medida <span className="font-normal text-app-muted/70">(no plural — ex: vidas, encontros, projetos)</span></label>
        <input
          value={unitLabel}
          onChange={e => setUnitLabel(e.target.value)}
          className={inputClass}
          placeholder="unidades"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 accent-brand-green" />
        <span className="text-sm text-app-text">Produto ativo (visível para seleção em propostas)</span>
      </label>

      <div className="border-t border-app-border pt-4">
        <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-3">Precificação</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Tipo de cálculo</label>
            <Select value={calculationType} onChange={e => setCalculationType(e.target.value as CalculationType)}>
              <option value="">Selecione</option>
              {Object.entries(CALCULATION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className={labelClass}>Periodicidade</label>
            <Select value={billingFrequency} onChange={e => setBillingFrequency(e.target.value as BillingFrequency)}>
              <option value="">Selecione</option>
              {Object.entries(BILLING_FREQUENCY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
        </div>

        {needsPriceTable && (
          <div className="mt-3">
            <label className={labelClass}>Tabela de preço padrão</label>
            {!isEditing ? (
              <p className="text-xs text-app-muted bg-app-surface border border-app-border rounded-xl px-3 py-2.5">
                Salve o produto primeiro para poder criar tabelas de preço.
              </p>
            ) : priceTables.length === 0 ? (
              <div className="text-xs text-app-muted bg-app-surface border border-app-border rounded-xl px-3 py-2.5 flex items-center justify-between">
                <span>Nenhuma tabela de preço criada ainda.</span>
                <Link href={`/dashboard/admin/produtos/${product.id}/tabelas-de-preco`} className="text-brand-green-deep hover:underline whitespace-nowrap ml-2">
                  Criar tabela →
                </Link>
              </div>
            ) : (
              <Select value={defaultPriceTableId} onChange={e => setDefaultPriceTableId(e.target.value)}>
                <option value="">Selecione</option>
                {priceTables.map(pt => (
                  <option key={pt.id} value={pt.id}>{pt.name}{!pt.active ? ' (inativa)' : ''}</option>
                ))}
              </Select>
            )}
            {isEditing && (
              <Link
                href={`/dashboard/admin/produtos/${product.id}/tabelas-de-preco`}
                className="inline-block mt-2 text-xs text-app-muted hover:text-app-text border border-app-border px-2.5 py-1 rounded hover:bg-[var(--row-hover)] transition-colors"
              >
                Gerenciar tabelas de preço
              </Link>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-brand-green text-brand-dark rounded-lg text-sm font-semibold hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar produto'}
        </button>
      </div>
    </form>
  )
}
