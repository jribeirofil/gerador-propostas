'use client'
import { useEffect } from 'react'
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import type { ProposalFormData } from './ProposalForm'
import Select from '@/components/ui/Select'
import { createClient } from '@/lib/supabase/client'

interface Props {
  register: UseFormRegister<ProposalFormData>
  watch: UseFormWatch<ProposalFormData>
  setValue: UseFormSetValue<ProposalFormData>
}

const PAYMENT_OPTIONS = [
  'Boleto bancário',
  'Pix',
  'Transferência bancária',
  'Cartão de crédito',
]

const inputClass = 'w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-brand-green-deep transition-colors'
const labelClass = 'block text-xs font-medium text-app-muted mb-1.5'

export default function Step5Conditions({ register, watch, setValue }: Props) {
  const selected: string[] = watch('forma_pagamento') || []
  const currentConditions: string = watch('commercial_conditions') || ''

  function toggle(option: string) {
    setValue(
      'forma_pagamento',
      selected.includes(option) ? selected.filter(s => s !== option) : [...selected, option]
    )
  }

  // Pré-preenche as condições comerciais: condições do produto selecionado (se houver
  // um único produto com condições) → senão a condição global da organização.
  useEffect(() => {
    if (currentConditions.trim()) return

    const catalogProducts = (watch('catalog_products') || []) as {
      id: string
      commercial_conditions?: string | null
    }[]
    const selectedProducts = catalogProducts.filter(p =>
      (watch('product_ids') || []).includes(p.id)
    )
    const productConditions = selectedProducts
      .map(p => p.commercial_conditions?.trim())
      .filter((c): c is string => !!c)

    const fromProduct =
      productConditions.length === 1 ? productConditions[0] : null

    const supabase = createClient()
    supabase
      .from('company_settings')
      .select('pdf_default_conditions')
      .maybeSingle()
      .then(({ data }) => {
        const global = data?.pdf_default_conditions?.trim() || ''
        const fallback = fromProduct || global || ''
        if (fallback) setValue('commercial_conditions', fallback)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sora font-semibold text-base text-app-text">Condições comerciais</h2>
        <p className="text-xs text-app-muted mt-0.5">Os valores por produto já foram definidos. Aqui você ajusta as condições gerais.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Desconto geral sobre o mensal (%)</label>
          <input {...register('desconto_pct', { valueAsNumber: true })} type="number" min="0" max="100" className={inputClass} placeholder="Ex: 10" />
        </div>

        <div>
          <label className={labelClass}>Validade da proposta (dias)</label>
          <input {...register('validade_dias', { valueAsNumber: true })} type="number" className={inputClass} placeholder="30" defaultValue={30} />
        </div>

        <div>
          <label className={labelClass}>Vigência contratual</label>
          <Select {...register('vigencia_contrato')}>
            <option value="">Selecione</option>
            <option value="12 meses">12 meses</option>
            <option value="24 meses">24 meses</option>
            <option value="36 meses">36 meses</option>
            <option value="48 meses">48 meses</option>
          </Select>
        </div>

        <div>
          <label className={labelClass}>Prazo de implantação</label>
          <Select {...register('prazo_implantacao')}>
            <option value="">Selecione</option>
            <option>24 horas</option>
            <option>3 dias úteis</option>
            <option>5 dias úteis</option>
            <option>2 semanas</option>
            <option>20 dias</option>
            <option>30 dias</option>
            <option>45 dias</option>
          </Select>
        </div>
      </div>

      {/* Forma de pagamento — múltipla escolha */}
      <div>
        <label className={labelClass}>Forma de pagamento</label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map(opt => {
            const isActive = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={`h-8 px-3.5 rounded-full text-xs font-medium border transition-colors ${
                  isActive
                    ? 'bg-brand-green-deep text-white border-brand-green-deep'
                    : 'border-app-border text-app-muted hover:text-app-text hover:border-app-text/30'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {/* Condições comerciais do documento — texto livre, pré-preenchido */}
      <div>
        <label className={labelClass}>Condições comerciais do documento</label>
        <p className="text-[11px] text-app-muted mb-2">Uma condição por linha. Aparecem no documento da proposta.</p>
        <textarea
          {...register('commercial_conditions')}
          rows={5}
          placeholder={'Benefícios comerciais já aplicados nos valores acima\nSem taxa de setup\nValores sujeitos à quantidade de vidas contratadas'}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      {/* Observações internas */}
      <div className="border-t border-app-border pt-5">
        <label className={labelClass}>Observações internas</label>
        <p className="text-[11px] text-app-muted mb-2">Visível apenas para o vendedor. Não aparece no documento da proposta.</p>
        <textarea
          {...register('notas_internas')}
          rows={3}
          placeholder="Ex: cliente pediu desconto adicional caso feche em 5 dias, próxima reunião quinta às 14h..."
          className={`${inputClass} resize-none leading-relaxed`}
        />
      </div>
    </div>
  )
}
