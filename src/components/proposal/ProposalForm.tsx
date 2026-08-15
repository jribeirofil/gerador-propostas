'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import StepIndicator from '@/components/ui/StepIndicator'
import Step1Client from './Step1Client'
import Step3Products from './Step3Products'
import Step4Pricing from './Step4Pricing'
import Step5Conditions from './Step5Conditions'
import Step6Review from './Step6Review'
import ProposalSummaryCard from './ProposalSummaryCard'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buildProductSnapshot } from '@/lib/snapshot'
import { calculateLineItem, calculateProposalTotals } from '@/lib/pricing'
import { createBlocksFromTemplate, copyBlocksFromProposal, resolveTemplate } from '@/lib/blocks'
import type { CatalogProduct, ProductPricing } from '@/types/engine'
import type { Category } from '@/types/admin'

export interface ProposalFormData {
  // Client
  empresa: string
  cnpj?: string
  contato: string
  cargo?: string
  email?: string
  whatsapp?: string
  colaboradores?: number
  segmento?: string

  // Products
  product_ids: string[]
  catalog_products?: CatalogProduct[]

  // Pricing (per product)
  product_pricing?: ProductPricing[]

  // Conditions
  desconto_pct?: number
  validade_dias: number
  forma_pagamento?: string[]
  prazo_implantacao?: string
  commercial_conditions?: string

  // Contract conditions
  vigencia_contrato?: string
  notas_internas?: string

  // Template
  template_id?: string

  // RD Station origin (internal, invisible to user)
  rd_lead_id?: string
  client_origem?: 'manual' | 'rd_station'
}

export type ProposalFormMode = 'new' | 'edit' | 'duplicate'

interface ProposalFormProps {
  mode?: ProposalFormMode
  initialData?: Partial<ProposalFormData>
  existingClientId?: string
  sourceProposalId?: string
}

const TOTAL_STEPS = 5

export default function ProposalForm({
  mode = 'new',
  initialData,
  existingClientId,
  sourceProposalId,
}: ProposalFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogCategories, setCatalogCategories] = useState<Category[]>([])
  const draftDataRef = useRef<Record<string, unknown> | null>(null)
  const autosaveReady = useRef(false)
  const router = useRouter()
  const supabase = createClient()

  const draftKey =
    mode === 'edit'
      ? `brand:draft:edit:${sourceProposalId}`
      : mode === 'duplicate'
        ? `brand:draft:dup:${sourceProposalId}`
        : 'brand:draft:new'

  const defaultVals: Partial<ProposalFormData> = {
    product_ids: [],
    product_pricing: [],
    validade_dias: 30,
    ...initialData,
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors },
  } = useForm<ProposalFormData>({ defaultValues: defaultVals })

  // Computed reactively every render — safe to read in async handlers via ref
  const watchedPricing = watch('product_pricing')
  const invalidOverrideRef = useRef(false)
  invalidOverrideRef.current = (watchedPricing || []).some(
    (p: ProductPricing) => p.manual_override === true && !p.override_reason?.trim()
  )

  function applyDraft(parsed: Record<string, unknown>) {
    const currentCatalog = getValues('catalog_products')
    const { catalog_products: _, _savedAt: __, ...rest } = parsed
    if (rest.product_pricing) {
      rest.product_pricing = (rest.product_pricing as ProductPricing[]).map(p =>
        p.manual_override && !p.override_reason?.trim()
          ? { ...p, manual_override: false, unit_value: 0 }
          : p
      )
    }
    reset({ ...defaultVals, ...rest } as ProposalFormData)
    if (currentCatalog?.length) setValue('catalog_products', currentCatalog)
  }

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey)
      if (!saved) { autosaveReady.current = true; return }
      const parsed = JSON.parse(saved)
      const age = Date.now() - (parsed._savedAt || 0)
      if (age > 4 * 60 * 60 * 1000) {
        localStorage.removeItem(draftKey)
        autosaveReady.current = true
        return
      }
      if (mode === 'new') {
        draftDataRef.current = parsed
        setShowDraftModal(true)
        // autosave stays blocked until user decides
      } else {
        applyDraft(parsed)
        autosaveReady.current = true
      }
    } catch {
      localStorage.removeItem(draftKey)
      autosaveReady.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Carrega o catálogo uma única vez no form, para que as etapas de Preços,
  // Condições e Resumo funcionem mesmo navegando direto pelos títulos (sem
  // precisar montar a etapa de Produtos antes).
  useEffect(() => {
    async function loadCatalog() {
      setCatalogLoading(true)
      const [{ data, error }, { data: cats }] = await Promise.all([
        supabase
          .from('product')
          .select(`
            id, name, slug, description, active, sort_order, category,
            unit_label, calculation_type, billing_frequency, default_price_table_id, commercial_conditions,
            benefits:product_benefit(id, title, sort_order, active),
            scope:product_scope(id, title, sort_order, active),
            faq:product_faq(id, question, answer, sort_order, active),
            differentials:product_differential(id, title, sort_order, active)
          `)
          .eq('active', true)
          .order('sort_order', { ascending: true }),
        supabase.from('category').select('*').order('sort_order', { ascending: true }),
      ])

      if (error) {
        setCatalogError(error.message || 'Não foi possível carregar o catálogo.')
        setCatalogLoading(false)
        return
      }

      const normalized = (data || []).map(p => ({
        ...p,
        benefits: (p.benefits || []).filter((b: { active: boolean }) => b.active),
        scope: (p.scope || []).filter((s: { active: boolean }) => s.active),
        faq: (p.faq || []).filter((f: { active: boolean }) => f.active),
        differentials: (p.differentials || []).filter((d: { active: boolean }) => d.active),
      })) as CatalogProduct[]

      setValue('catalog_products', normalized)
      setCatalogCategories((cats || []) as Category[])
      setCatalogLoading(false)
    }
    loadCatalog()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autosave on each step change — skips until draft decision is made
  useEffect(() => {
    if (!autosaveReady.current) return
    try {
      const { catalog_products: _, ...toSave } = getValues()
      localStorage.setItem(draftKey, JSON.stringify({ ...toSave, _savedAt: Date.now() }))
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function clearDraft() {
    try { localStorage.removeItem(draftKey) } catch {}
  }

  async function nextStep() {
    setSubmitError(null)
    let valid = true
    if (step === 1) valid = await trigger(['empresa', 'contato'])
    if (step === 2) valid = (getValues('product_ids') || []).length > 0
    if (step === 3 && invalidOverrideRef.current) {
      setSubmitError('Preencha o motivo da alteração para todos os valores especiais antes de continuar.')
      return
    }
    if (valid) setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  function prevStep() {
    setStep(s => Math.max(s - 1, 1))
  }

  function buildProposalProducts(
    proposalId: string,
    data: ProposalFormData,
    userId: string | undefined
  ) {
    const catalogProducts = data.catalog_products || []
    const selectedProducts = catalogProducts.filter(p => data.product_ids.includes(p.id))
    const pricing = data.product_pricing || []

    const lineItems = selectedProducts.map(product => {
      const p = pricing.find(x => x.product_id === product.id) || {
        product_id: product.id,
        pricing_type: 'monthly' as const,
        unit_value: 0,
        quantity: 1,
        discount_percent: 0,
      }
      return { product, calc: calculateLineItem(p), pricing: p }
    })

    const totals = calculateProposalTotals(
      lineItems.map(li => li.calc),
      data.desconto_pct || 0
    )

    const items = lineItems.map(({ product, calc, pricing: p }, idx) => ({
      proposal_id: proposalId,
      product_id: product.id,
      quantity: calc.quantity,
      pricing_type: p.pricing_type,
      unit_value: p.unit_value,
      monthly_value: calc.is_recurring ? calc.subtotal : 0,
      setup_value: !calc.is_recurring ? calc.subtotal : 0,
      discount_percent: p.discount_percent,
      discount_value: calc.discount_value,
      subtotal: calc.subtotal,
      snapshot: buildProductSnapshot(product),
      sort_order: idx,
      notes: p.notes || null,
      manual_override: p.manual_override || false,
      override_reason: p.override_reason || null,
    }))

    return { items, totals, lineItems }
  }

  function buildProposalFields(data: ProposalFormData, totals: ReturnType<typeof calculateProposalTotals>, lineItems: { calc: ReturnType<typeof calculateLineItem> }[]) {
    return {
      status: 'generated' as const,
      discount_percent: data.desconto_pct || 0,
      discount_value: totals.general_discount_value,
      total_setup: totals.total_setup,
      total_monthly: totals.total_monthly,
      total_amount: totals.total_amount,
      validade_dias: data.validade_dias || 30,
      forma_pagamento: (data.forma_pagamento || []).join(', ') || null,
      prazo_implantacao: data.prazo_implantacao || null,
      commercial_conditions: data.commercial_conditions?.trim() || null,
      vigencia_contrato: data.vigencia_contrato || null,
      commercial_notes: data.notas_internas || null,
      updated_at: new Date().toISOString(),
    }
  }

  async function submitNew(data: ProposalFormData, userId: string | undefined) {
    const fromRD = data.client_origem === 'rd_station'
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        empresa: data.empresa,
        cnpj: data.cnpj || null,
        contato: data.contato,
        cargo: data.cargo || null,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        colaboradores: data.colaboradores || null,
        segmento: data.segmento || null,
        created_by: userId,
        rd_lead_id: fromRD ? (data.rd_lead_id || null) : null,
        origem: fromRD ? 'rd_station' : 'manual',
        updated_from_rd_at: fromRD ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (clientError) throw clientError

    // Use manually selected template, or auto-resolve by product slugs
    const selectedProducts = (data.catalog_products || []).filter(p => data.product_ids.includes(p.id))
    const productSlugs = selectedProducts.map(p => p.slug)
    const resolvedTemplateId = data.template_id || await resolveTemplate(supabase, productSlugs)

    const tempId = 'temp'
    const { totals, lineItems } = buildProposalProducts(tempId, data, userId)

    const { data: proposal, error: proposalError } = await supabase
      .from('proposal')
      .insert({
        client_id: client.id,
        title: `Proposta — ${data.empresa}`,
        created_by: userId,
        template_id: resolvedTemplateId,
        ...buildProposalFields(data, totals, lineItems),
      })
      .select()
      .single()

    if (proposalError) throw proposalError

    const { items } = buildProposalProducts(proposal.id, data, userId)
    if (items.length > 0) {
      const { error } = await supabase.from('proposal_product').insert(items)
      if (error) throw error
    }

    await supabase.from('proposal_event').insert({
      proposal_id: proposal.id,
      event_type: 'created',
      created_by: userId,
    })

    await createBlocksFromTemplate(supabase, proposal.id, resolvedTemplateId, {
      beneficios: selectedProducts.flatMap(p => p.benefits.map(b => b.title)),
      escopo: selectedProducts.flatMap(p => p.scope.map(s => s.title)),
      diferenciais: selectedProducts.flatMap(p => p.differentials.map(d => d.title)),
      faq: selectedProducts.flatMap(p => p.faq.map(f => ({ question: f.question, answer: f.answer }))),
    })

    clearDraft()
    router.push(`/dashboard/propostas/${proposal.id}`)
  }

  async function submitEdit(data: ProposalFormData, userId: string | undefined) {
    if (!existingClientId || !sourceProposalId) throw new Error('Dados de edição inválidos.')

    // 1. Atualiza o cliente
    await supabase.from('clients').update({
      empresa: data.empresa,
      cnpj: data.cnpj || null,
      contato: data.contato,
      cargo: data.cargo || null,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      colaboradores: data.colaboradores || null,
      segmento: data.segmento || null,
    }).eq('id', existingClientId)

    // 2. Calcula totais
    const tempId = 'temp'
    const { totals, lineItems } = buildProposalProducts(tempId, data, userId)

    // 3. Atualiza a proposta no lugar (sem criar nova versão)
    const { status: _status, ...proposalFields } = buildProposalFields(data, totals, lineItems)
    const { error: proposalError } = await supabase
      .from('proposal')
      .update({
        title: `Proposta — ${data.empresa}`,
        ...proposalFields,
      })
      .eq('id', sourceProposalId)

    if (proposalError) throw proposalError

    // 4. Substitui os produtos
    await supabase.from('proposal_product').delete().eq('proposal_id', sourceProposalId)
    const { items } = buildProposalProducts(sourceProposalId, data, userId)
    if (items.length > 0) {
      const { error } = await supabase.from('proposal_product').insert(items)
      if (error) throw error
    }

    // 5. Registra evento de edição
    await supabase.from('proposal_event').insert({
      proposal_id: sourceProposalId,
      event_type: 'edited',
      created_by: userId,
    })

    clearDraft()
    router.push(`/dashboard/propostas/${sourceProposalId}`)
  }

  async function submitDuplicate(data: ProposalFormData, userId: string | undefined) {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        empresa: data.empresa,
        cnpj: data.cnpj || null,
        contato: data.contato,
        cargo: data.cargo || null,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        colaboradores: data.colaboradores || null,
        segmento: data.segmento || null,
        created_by: userId,
      })
      .select()
      .single()

    if (clientError) throw clientError

    const tempId = 'temp'
    const { totals, lineItems } = buildProposalProducts(tempId, data, userId)

    const { data: proposal, error: proposalError } = await supabase
      .from('proposal')
      .insert({
        client_id: client.id,
        title: `Proposta — ${data.empresa}`,
        created_by: userId,
        ...buildProposalFields(data, totals, lineItems),
      })
      .select()
      .single()

    if (proposalError) throw proposalError

    const { items } = buildProposalProducts(proposal.id, data, userId)
    if (items.length > 0) {
      const { error } = await supabase.from('proposal_product').insert(items)
      if (error) throw error
    }

    await supabase.from('proposal_event').insert([
      { proposal_id: proposal.id, event_type: 'created', created_by: userId },
      ...(sourceProposalId
        ? [{ proposal_id: sourceProposalId, event_type: 'duplicated', created_by: userId }]
        : []),
    ])

    if (sourceProposalId) {
      await copyBlocksFromProposal(supabase, proposal.id, sourceProposalId)
    } else {
      await createBlocksFromTemplate(supabase, proposal.id, data.template_id || null)
    }

    clearDraft()
    router.push(`/dashboard/propostas/${proposal.id}`)
  }

  async function onSubmit(data: ProposalFormData) {
    if (step !== TOTAL_STEPS) return
    setLoading(true)
    setSubmitError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (mode === 'edit') await submitEdit(data, user?.id)
      else if (mode === 'duplicate') await submitDuplicate(data, user?.id)
      else await submitNew(data, user?.id)
    } catch (err) {
      console.error(err)
      setSubmitError('Não foi possível salvar a proposta. Tente novamente.')
      setLoading(false)
    }
  }

  function handleCancel() {
    if (step === 1) {
      if (mode === 'new') clearDraft()
      const back =
        mode === 'new'
          ? '/dashboard'
          : `/dashboard/propostas/${sourceProposalId}`
      router.push(back)
    } else {
      prevStep()
    }
  }

  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && step !== TOTAL_STEPS) {
      e.preventDefault()
    }
  }

  const showSummary = step >= 3
  const showProductSidebar = step === 2
  const hasSidebar = showSummary || showProductSidebar

  const selectedIds: string[] = watch('product_ids') || []
  const catalogProducts: CatalogProduct[] = watch('catalog_products') || []
  const selectedProducts = catalogProducts.filter(p => selectedIds.includes(p.id))

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown}>
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-5">
            <div>
              <p className="font-sora font-semibold text-base text-app-text mb-1">Rascunho encontrado</p>
              <p className="text-sm text-app-muted">Você tem uma proposta em andamento. Deseja continuar de onde parou ou começar do zero?</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (draftDataRef.current) applyDraft(draftDataRef.current)
                  autosaveReady.current = true
                  setShowDraftModal(false)
                }}
                className="w-full py-2.5 bg-brand-green text-brand-dark rounded-xl text-sm font-semibold hover:bg-brand-green-deep hover:text-white transition-colors"
              >
                Continuar rascunho
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDraft()
                  autosaveReady.current = true
                  setShowDraftModal(false)
                }}
                className="w-full py-2.5 text-sm text-app-muted border border-app-border rounded-xl hover:bg-[var(--row-hover)] hover:text-app-text transition-colors"
              >
                Começar do zero
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <StepIndicator current={step} onStepClick={mode !== 'new' ? setStep : undefined} />
      </div>

      <div className={hasSidebar ? 'flex gap-6 items-start' : ''}>
        <div className={hasSidebar ? 'flex-1 min-w-0' : ''}>
          <div key={step} className="bg-app-surface border border-app-border rounded-2xl p-6 mb-6 shadow-sm animate-in fade-in duration-300">
            {step === 1 && <Step1Client register={register} errors={errors} setValue={setValue} />}
            {step === 2 && (
              <Step3Products
                watch={watch}
                setValue={setValue}
                products={watch('catalog_products') || []}
                categories={catalogCategories}
                loading={catalogLoading}
                error={catalogError}
              />
            )}
            {step === 3 && <Step4Pricing watch={watch} setValue={setValue} />}
            {step === 4 && <Step5Conditions register={register} watch={watch} setValue={setValue} />}
            {step === 5 && <Step6Review data={getValues()} control={control} setValue={setValue} />}
          </div>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-red-400 text-center">{submitError}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-app-muted border border-app-border rounded-lg hover:border-app-border hover:bg-[var(--row-hover)] hover:text-app-text transition-colors"
            >
              {step === 1 ? 'Cancelar' : 'Voltar'}
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2 bg-brand-green text-brand-dark rounded-lg text-sm font-semibold hover:bg-brand-green-deep hover:text-white transition-colors"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit(onSubmit)}
                className="px-5 py-2 bg-brand-green text-brand-dark rounded-lg text-sm font-semibold hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-50"
              >
                {loading
                  ? 'Salvando...'
                  : mode === 'edit'
                    ? 'Salvar alterações'
                    : 'Gerar proposta'}
              </button>
            )}
          </div>
        </div>

        {showProductSidebar && (
          <div className="w-56 flex-shrink-0 sticky top-8">
            <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-app-border">
                <p className="text-xs font-semibold text-app-text">
                  {selectedIds.length === 0
                    ? 'Nenhuma solução'
                    : `${selectedIds.length} ${selectedIds.length !== 1 ? 'soluções' : 'solução'}`}
                </p>
                <p className="text-[11px] text-app-muted mt-0.5">
                  selecionada{selectedIds.length !== 1 ? 's' : ''}
                </p>
              </div>
              {selectedProducts.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-app-muted/60">Selecione ao menos<br />uma solução</p>
                </div>
              ) : (
                <ul className="divide-y divide-app-border">
                  {selectedProducts.map(p => (
                    <li key={p.id} className="flex items-center gap-2 px-3 py-2.5">
                      <span className="flex-1 min-w-0 text-xs text-app-text font-medium leading-tight line-clamp-2">
                        {p.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setValue('product_ids', selectedIds.filter(id => id !== p.id))}
                        title="Remover"
                        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-app-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {showSummary && (
          <div className="w-60 flex-shrink-0 sticky top-8">
            <ProposalSummaryCard watch={watch} />
          </div>
        )}
      </div>
    </form>
  )
}
