'use client'
import type { UseFormWatch } from 'react-hook-form'
import type { ProposalFormData } from './ProposalForm'
import type { CatalogProduct, ProductPricing } from '@/types/engine'
import { calculateLineItem, calculateProposalTotals } from '@/lib/pricing'

interface Props {
  watch: UseFormWatch<ProposalFormData>
}

function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function ProposalSummaryCard({ watch }: Props) {
  const productIds: string[] = watch('product_ids') || []
  const catalogProducts = (watch('catalog_products') || []) as CatalogProduct[]
  const pricing: ProductPricing[] = watch('product_pricing') || []
  const descontoPct: number = watch('desconto_pct') || 0

  const selectedProducts = catalogProducts.filter(p => productIds.includes(p.id))

  const lineItems = selectedProducts.map(product => {
    const p: ProductPricing = pricing.find(x => x.product_id === product.id) || {
      product_id: product.id,
      pricing_type: 'monthly',
      unit_value: 0,
      quantity: 1,
      discount_percent: 0,
    }
    return { product, calc: calculateLineItem(p), p }
  })

  const totals = calculateProposalTotals(lineItems.map(li => li.calc), descontoPct)

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl p-4 shadow-sm space-y-4">
      <p className="text-[10px] font-semibold text-app-muted uppercase tracking-wider">Resumo financeiro</p>

      {selectedProducts.length === 0 ? (
        <p className="text-xs text-app-muted text-center py-3">Nenhum produto selecionado ainda.</p>
      ) : (
        <>
          <div className="space-y-3">
            {lineItems.map(({ product, calc, p }) => (
              <div key={product.id}>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-app-text font-medium flex-1 min-w-0 truncate">{product.name}</p>
                  {p.manual_override && (
                    <span className="text-[9px] text-amber-400 flex-shrink-0">⚡</span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-[10px] text-app-muted">
                    {calc.quantity} {product.unit_label || 'unidades'} × {fmt(calc.unit_value)}
                    {p.discount_percent > 0 && (
                      <span className="text-brand-green-deep ml-1">− {p.discount_percent}%</span>
                    )}
                  </span>
                  <span className="text-xs text-app-text font-medium">
                    {fmt(calc.subtotal)}
                    <span className="text-[10px] text-app-muted font-normal ml-0.5">
                      {calc.is_recurring ? '/mês' : ' único'}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-app-border pt-3 space-y-2">
            {descontoPct > 0 && totals.general_discount_value > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-app-muted">Desconto geral ({descontoPct}%)</span>
                <span className="text-[10px] text-brand-green-deep">− {fmt(totals.general_discount_value)}</span>
              </div>
            )}

            {totals.total_monthly > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-app-muted">Total mensal</span>
                <span className="text-base font-bold text-brand-green-deep">{fmt(totals.total_monthly)}</span>
              </div>
            )}

            {totals.total_setup > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-app-muted">Valor único</span>
                <span className="text-sm font-semibold text-app-text">{fmt(totals.total_setup)}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
