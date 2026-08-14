'use client'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { UseFormWatch, UseFormSetValue } from 'react-hook-form'
import type { ProposalFormData } from './ProposalForm'
import { createClient } from '@/lib/supabase/client'
import CurrencyField from '@/components/ui/CurrencyField'
import {
  PRICING_TYPE_LABELS,
  type PricingType,
  type ProductPricing,
  type CatalogProduct,
  type PriceTableItem,
} from '@/types/engine'

function fmtBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function singularize(label: string, qty: number): string {
  if (qty !== 1) return label
  if (label.endsWith('ões')) return label.slice(0, -3) + 'ão'
  if (label.endsWith('res')) return label.slice(0, -2)  // colaboradores → colaborador
  if (label.endsWith('s'))  return label.slice(0, -1)   // vidas → vida, unidades → unidade
  return label
}

interface Props {
  watch: UseFormWatch<ProposalFormData>
  setValue: UseFormSetValue<ProposalFormData>
}

const inputClass = 'w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-fay-green-deep transition-colors'
const readOnlyInputClass = 'w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-muted cursor-not-allowed opacity-60'
const labelClass = 'block text-xs font-medium text-app-muted mb-1.5'

function derivePricingType(product: CatalogProduct): PricingType {
  if (product.calculation_type === 'per_employee') return 'per_employee'
  if (product.calculation_type === 'project') return 'per_project'
  if (product.billing_frequency === 'one_time') return 'one_time'
  return 'monthly'
}

function pricingTypeDisplay(product: CatalogProduct): string {
  return PRICING_TYPE_LABELS[derivePricingType(product)]
}

function defaultQuantity(product: CatalogProduct, colaboradores: number): number {
  if (product.calculation_type === 'per_employee') return colaboradores || 1
  return 1
}

function findUnitPrice(items: PriceTableItem[], quantity: number): number | null {
  const match = items.find(
    item => quantity >= item.minimum_quantity && (item.maximum_quantity === null || quantity <= item.maximum_quantity)
  )
  return match ? match.unit_price : null
}

export default function Step4Pricing({ watch, setValue }: Props) {
  const productIds: string[] = watch('product_ids') || []
  const catalogProducts = watch('catalog_products') || []
  const pricing: ProductPricing[] = watch('product_pricing') || []
  const colaboradores = watch('colaboradores') || 0
  const supabase = createClient()

  const selectedProducts = catalogProducts.filter(p => productIds.includes(p.id))

  const [priceTables, setPriceTables] = useState<Record<string, PriceTableItem[]>>({})

  // Tracks which per_employee products have the manual override panel visible.
  // Initialized from existing pricing state so "voltar ao passo 4" restaura corretamente.
  const [overridePanelOpen, setOverridePanelOpen] = useState<Set<string>>(
    () => new Set((watch('product_pricing') || []).filter(p => p.manual_override).map(p => p.product_id))
  )

  const initializedIds = useRef<Set<string>>(new Set(pricing.map(p => p.product_id)))

  useEffect(() => {
    const toAdd = selectedProducts.filter(p => !initializedIds.current.has(p.id))
    if (toAdd.length === 0) return

    const newEntries: ProductPricing[] = toAdd.map(p => ({
      product_id: p.id,
      pricing_type: derivePricingType(p),
      unit_value: 0,
      quantity: defaultQuantity(p, colaboradores),
      discount_percent: 0,
    }))

    toAdd.forEach(p => initializedIds.current.add(p.id))

    const currentPricing = watch('product_pricing') || []
    setValue('product_pricing', [...currentPricing, ...newEntries])
  }, [selectedProducts.map(p => p.id).join(',')])

  useEffect(() => {
    const neededTableIds = Array.from(new Set(
      selectedProducts
        .filter(p => p.calculation_type === 'per_employee' && p.default_price_table_id)
        .map(p => p.default_price_table_id as string)
    )).filter(id => !priceTables[id])

    if (neededTableIds.length === 0) return

    async function loadPriceTables() {
      const { data, error } = await supabase
        .from('price_table_item')
        .select('id, price_table_id, minimum_quantity, maximum_quantity, unit_price, sort_order')
        .in('price_table_id', neededTableIds)
        .eq('active', true)
        .order('sort_order', { ascending: true })

      if (error || !data) return

      setPriceTables(prev => {
        const next = { ...prev }
        neededTableIds.forEach(id => { next[id] = [] })
        data.forEach(item => {
          next[item.price_table_id] = [...(next[item.price_table_id] || []), item]
        })
        return next
      })
    }

    loadPriceTables()
  }, [selectedProducts.map(p => p.default_price_table_id).join(',')])

  // Inclui o status de override na chave para que ao cancelar o override
  // (manual_override: false) o useEffect de recálculo seja re-disparado.
  const perEmployeeKey = pricing
    .filter(p => selectedProducts.find(sp => sp.id === p.product_id)?.calculation_type === 'per_employee')
    .map(p => `${p.product_id}:${p.quantity}:${p.manual_override ? '1' : '0'}`)
    .join('|')

  useEffect(() => {
    selectedProducts.forEach(product => {
      if (product.calculation_type !== 'per_employee') return
      const tableId = product.default_price_table_id
      if (!tableId) return
      const items = priceTables[tableId]
      if (!items) return

      const currentPricing = watch('product_pricing') || []
      const entry = currentPricing.find(p => p.product_id === product.id)
      if (!entry) return
      // Não sobrescreve o valor quando o vendedor ativou um override manual.
      if (entry.manual_override) return

      const qty = Math.max(entry.quantity || 1, 1)
      const newUnitValue = findUnitPrice(items, qty) ?? 0

      if (entry.unit_value !== newUnitValue) {
        const others = currentPricing.filter(p => p.product_id !== product.id)
        setValue('product_pricing', [...others, { ...entry, unit_value: newUnitValue }])
      }
    })
  }, [selectedProducts.map(p => p.id).join(','), perEmployeeKey, priceTables])

  function getPricing(productId: string): ProductPricing {
    const product = selectedProducts.find(p => p.id === productId)
    return (
      pricing.find(p => p.product_id === productId) || {
        product_id: productId,
        pricing_type: product ? derivePricingType(product) : ('monthly' as PricingType),
        unit_value: 0,
        quantity: product ? defaultQuantity(product, colaboradores) : 1,
        discount_percent: 0,
      }
    )
  }

  function updatePricing(productId: string, patch: Partial<ProductPricing>) {
    const currentPricing: ProductPricing[] = watch('product_pricing') || []
    const existing = currentPricing.find(p => p.product_id === productId) || getPricing(productId)
    const updated = { ...existing, ...patch }
    const others = currentPricing.filter(p => p.product_id !== productId)
    setValue('product_pricing', [...others, updated])
  }

  function openOverridePanel(productId: string) {
    setOverridePanelOpen(prev => new Set([...prev, productId]))
  }

  function cancelOverride(productId: string) {
    setOverridePanelOpen(prev => { const s = new Set(prev); s.delete(productId); return s })
    const product = selectedProducts.find(p => p.id === productId)
    const entry = getPricing(productId)
    let autoPrice = 0
    if (product?.calculation_type === 'per_employee' && product.default_price_table_id) {
      const items = priceTables[product.default_price_table_id]
      if (items) autoPrice = findUnitPrice(items, Math.max(entry.quantity || 1, 1)) ?? 0
    }
    updatePricing(productId, {
      manual_override: false,
      unit_value: autoPrice,
      override_reason: undefined,
      notes: undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-sora font-semibold text-base text-app-text">Precificação por produto</h2>
        <p className="text-xs text-app-muted mt-0.5">Defina a quantidade de cada produto. O valor é calculado automaticamente quando aplicável.</p>
      </div>

      {selectedProducts.length === 0 ? (
        <p className="text-sm text-app-muted py-4">Nenhum produto selecionado na etapa anterior.</p>
      ) : (
        <div className="space-y-3">
          {selectedProducts.map(product => {
            const p = getPricing(product.id)
            const isPerEmployee = product.calculation_type === 'per_employee'
            const tableId = product.default_price_table_id
            const tableItems = tableId ? priceTables[tableId] : undefined
            const tableMissing = isPerEmployee && !tableId
            const tableLoading = isPerEmployee && !!tableId && !tableItems
            const noMatch = isPerEmployee && !!tableItems && !p.manual_override &&
              findUnitPrice(tableItems, Math.max(p.quantity || 1, 1)) === null

            const gross = p.unit_value * Math.max(p.quantity || 1, 1)
            const discountValue = gross * ((p.discount_percent || 0) / 100)
            const netTotal = gross - discountValue
            const isOverrideOpen = overridePanelOpen.has(product.id)

            return (
              <div key={product.id} className="bg-app-surface2 border border-app-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-app-text">{product.name}</h3>
                  <button
                    type="button"
                    title="Remover produto da proposta"
                    onClick={() => setValue('product_ids', productIds.filter(id => id !== product.id))}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-app-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={labelClass}>Tipo de cobrança</label>
                    <div className={`${inputClass} flex items-center cursor-default`}>
                      {pricingTypeDisplay(product)}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Quantidade ({product.unit_label || 'unidades'})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={p.quantity || ''}
                      onChange={e => updatePricing(product.id, { quantity: parseInt(e.target.value) || 1 })}
                      className={inputClass}
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Valor unitário (R$)
                      {p.manual_override && (
                        <span className="ml-1.5 text-orange-500 font-normal">· especial</span>
                      )}
                    </label>
                    {isPerEmployee ? (
                      <CurrencyField
                        value={p.unit_value || 0}
                        onChange={() => {}}
                        readOnly
                        disabled
                        className={readOnlyInputClass}
                      />
                    ) : (
                      <CurrencyField
                        value={p.unit_value || 0}
                        onChange={v => updatePricing(product.id, { unit_value: v })}
                        className={inputClass}
                      />
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Desconto do item (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={p.discount_percent || ''}
                      onChange={e => updatePricing(product.id, { discount_percent: parseFloat(e.target.value) || 0 })}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                </div>

                {tableMissing && (
                  <p className="text-xs text-red-400 mt-2">
                    Este produto não tem uma tabela de preço padrão configurada. Defina uma em Administração → Produtos.
                  </p>
                )}

                {tableLoading && (
                  <p className="text-xs text-app-muted mt-2">Carregando tabela de preço...</p>
                )}

                {noMatch && (
                  <p className="text-xs text-red-400 mt-2">
                    Não há faixa de preço cadastrada para {p.quantity} vidas. Ajuste a tabela de preço ou a quantidade.
                  </p>
                )}

                {isPerEmployee && colaboradores > 0 && p.quantity !== colaboradores && !tableMissing && !noMatch && (
                  <p className="text-xs text-app-muted mt-2">
                    A empresa tem {colaboradores} vidas no total. Esta cobrança considera {p.quantity} pessoa{p.quantity !== 1 ? 's' : ''}.
                  </p>
                )}

                <p className="text-xs text-app-text mt-4 mb-1 font-medium">
                  {p.quantity || 1} {singularize(product.unit_label || 'unidades', p.quantity || 1)} × R$ {fmtBRL(p.unit_value)}
                  {p.discount_percent > 0 ? (
                    <>
                      {' '}= R$ {fmtBRL(gross)}
                      {' '}<span className="text-fay-green-deep">− {p.discount_percent}% = R$ {fmtBRL(netTotal)}</span>
                    </>
                  ) : (
                    <> = R$ {fmtBRL(netTotal)}</>
                  )}
                  {p.pricing_type === 'monthly' || p.pricing_type === 'per_employee' ? '/mês' : ''}
                </p>

                {/* Override manual — somente para produtos per_employee */}
                {isPerEmployee && !tableMissing && (
                  isOverrideOpen ? (
                    <div className="mt-3 border border-app-border bg-app-surface rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-orange-500">Valor especial</p>
                        <button
                          type="button"
                          onClick={() => cancelOverride(product.id)}
                          className="text-xs font-medium text-app-muted border border-app-border rounded-lg px-3 py-1.5 hover:bg-[var(--row-hover)] hover:text-app-text transition-colors"
                        >
                          Usar valor automático
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={labelClass}>Valor (R$/unidade)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={p.unit_value || ''}
                            onChange={e => updatePricing(product.id, {
                              unit_value: parseFloat(e.target.value) || 0,
                              manual_override: true,
                            })}
                            className={inputClass}
                            placeholder="0,00"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            Motivo da alteração <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={p.override_reason || ''}
                            onChange={e => updatePricing(product.id, {
                              override_reason: e.target.value,
                              manual_override: true,
                            })}
                            className={`${inputClass} ${!p.override_reason?.trim() ? 'border-red-400/50 focus:border-red-400' : ''}`}
                            placeholder="Ex: contrato de longo prazo"
                          />
                          {!p.override_reason?.trim() && (
                            <p className="text-[11px] text-red-400 mt-1">Campo obrigatório para valor especial.</p>
                          )}
                        </div>
                        <div>
                          <label className={labelClass}>Observação comercial</label>
                          <input
                            type="text"
                            value={p.notes || ''}
                            onChange={e => updatePricing(product.id, { notes: e.target.value })}
                            className={inputClass}
                            placeholder="Uso interno"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    p.manual_override ? (
                      <p className="mt-2 text-xs">
                        <span className="text-orange-500">⚡ Valor especial: R$ {fmtBRL(p.unit_value)}</span>
                        <button
                          type="button"
                          onClick={() => openOverridePanel(product.id)}
                          className="ml-2 text-app-muted hover:text-app-text transition-colors"
                        >
                          · Editar →
                        </button>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openOverridePanel(product.id)}
                        className="mt-2 text-xs text-app-muted hover:text-app-text transition-colors"
                      >
                        Alterar valor manualmente →
                      </button>
                    )
                  )
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
