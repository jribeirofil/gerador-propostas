'use client'
import { useEffect, useState } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import type { ProposalFormData } from './ProposalForm'
import { calculateLineItem, calculateProposalTotals } from '@/lib/pricing'
import { PRICING_TYPE_LABELS } from '@/types/engine'
import { createClient } from '@/lib/supabase/client'

interface Template {
  id: string
  name: string
  is_default: boolean
}

interface Props {
  data: ProposalFormData
  setValue: UseFormSetValue<ProposalFormData>
}

function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const labelClass = 'block text-xs font-medium text-app-muted mb-1.5'
const sectionClass = 'bg-app-surface border border-app-border rounded-xl p-5'

export default function Step6Review({ data, setValue }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('proposal_template')
      .select('id, name, is_default')
      .order('name')
      .then(({ data }) => setTemplates((data as Template[]) || []))
  }, [])

  const catalogProducts = data.catalog_products || []
  const selectedProducts = catalogProducts.filter(p => (data.product_ids || []).includes(p.id))
  const pricing = data.product_pricing || []
  const colaboradores = data.colaboradores || 0
  const lineItems = selectedProducts.map(product => {
    const p = pricing.find(x => x.product_id === product.id) || {
      product_id: product.id,
      pricing_type: 'monthly' as const,
      unit_value: 0,
      quantity: 1,
      discount_percent: 0,
    }
    return { product, calc: calculateLineItem(p) }
  })

  const totals = calculateProposalTotals(
    lineItems.map(li => li.calc),
    data.desconto_pct || 0
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-sora font-semibold text-base text-app-text">Revisão da proposta</h2>
        <p className="text-xs text-app-muted mt-0.5">Confira os dados antes de gerar. A proposta só é salva ao clicar em "Gerar proposta".</p>
      </div>

      {/* Cliente + Condições */}
      <div className="grid grid-cols-2 gap-4">
        <div className={sectionClass}>
          <h3 className="text-[11px] font-semibold text-app-muted uppercase tracking-widest mb-3">Cliente</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-app-muted">Empresa</dt>
              <dd className="text-app-text font-medium text-right">{data.empresa || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-app-muted">Contato</dt>
              <dd className="text-app-text text-right">{data.contato || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-app-muted">Vidas</dt>
              <dd className="text-app-text text-right">{colaboradores || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className={sectionClass}>
          <h3 className="text-[11px] font-semibold text-app-muted uppercase tracking-widest mb-3">Condições</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-app-muted">Desconto geral</dt>
              <dd className="text-app-text text-right">{data.desconto_pct ? `${data.desconto_pct}%` : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-app-muted">Validade</dt>
              <dd className="text-app-text text-right">{data.validade_dias || 30} dias</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-app-muted">Pagamento</dt>
              <dd className="text-app-text text-right">{(data.forma_pagamento || []).join(', ') || '—'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Tabela comercial */}
      <div className={`${sectionClass} p-0 overflow-hidden`}>
        <h3 className="text-[11px] font-semibold text-app-muted uppercase tracking-widest px-5 pt-4 pb-3 border-b border-app-border">Produtos</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-app-border bg-app-surface2">
              <th className="text-left px-5 py-2.5 font-medium text-app-muted">Produto</th>
              <th className="text-center px-3 py-2.5 font-medium text-app-muted">Qtd</th>
              <th className="text-left px-3 py-2.5 font-medium text-app-muted">Cobrança</th>
              <th className="text-right px-3 py-2.5 font-medium text-app-muted">Unitário</th>
              <th className="text-right px-3 py-2.5 font-medium text-app-muted">Desconto</th>
              <th className="text-right px-5 py-2.5 font-medium text-app-muted">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-app-muted">Nenhum produto selecionado.</td></tr>
            ) : lineItems.map(({ product, calc }) => (
              <tr key={product.id} className="border-b border-app-border last:border-none">
                <td className="px-5 py-3 text-app-text font-medium">{product.name}</td>
                <td className="px-3 py-3 text-center text-app-muted">{calc.quantity}</td>
                <td className="px-3 py-3 text-app-muted">{PRICING_TYPE_LABELS[calc.pricing_type]}</td>
                <td className="px-3 py-3 text-right text-app-text">{fmt(calc.unit_value)}</td>
                <td className="px-3 py-3 text-right text-app-muted">{calc.discount_percent > 0 ? `${calc.discount_percent}%` : '—'}</td>
                <td className="px-5 py-3 text-right text-app-text font-medium">{fmt(calc.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          {lineItems.length > 0 && (
            <tfoot className="border-t border-app-border">
              {totals.items_discount_value > 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-2 text-right text-app-muted">Descontos por item</td>
                  <td className="px-5 py-2 text-right text-red-400">− {fmt(totals.items_discount_value)}</td>
                </tr>
              )}
              {totals.general_discount_value > 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-2 text-right text-app-muted">Desconto geral ({data.desconto_pct}%)</td>
                  <td className="px-5 py-2 text-right text-red-400">− {fmt(totals.general_discount_value)}</td>
                </tr>
              )}
              {totals.subtotal_setup > 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-2 text-right text-app-muted">Valor único</td>
                  <td className="px-5 py-2 text-right text-app-text">{fmt(totals.subtotal_setup)}</td>
                </tr>
              )}
              <tr className="bg-fay-green/5">
                <td colSpan={5} className="px-5 py-3 text-right text-app-text font-semibold">Total mensal</td>
                <td className="px-5 py-3 text-right text-fay-green-deep font-bold text-sm">{fmt(totals.total_monthly)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Template */}
      <div className={sectionClass}>
        <h3 className="text-[11px] font-semibold text-app-muted uppercase tracking-widest mb-3">Template da proposta</h3>
        <p className="text-xs text-app-muted mb-3">Define a estrutura e os blocos de conteúdo que serão gerados. Se não selecionar, o sistema escolhe automaticamente pelo produto.</p>
        <div>
          <label className={labelClass}>Template</label>
          <select
            value={data.template_id || ''}
            onChange={e => setValue('template_id', e.target.value || undefined)}
            className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-text focus:outline-none focus:border-fay-green-deep transition-colors"
          >
            <option value="">Automático (baseado nos produtos)</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}{t.is_default ? ' · Padrão' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

    </div>
  )
}
