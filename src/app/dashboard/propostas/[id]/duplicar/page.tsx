import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Breadcrumb from '@/components/ui/Breadcrumb'
import ProposalForm from '@/components/proposal/ProposalForm'
import type { ProposalFormData } from '@/components/proposal/ProposalForm'
import type { PricingType } from '@/types/engine'

export default async function DuplicateProposalPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: proposal } = await supabase
    .from('proposal')
    .select('*, client:clients(*), products:proposal_product(*)')
    .eq('id', params.id)
    .single()

  if (!proposal) notFound()

  const client = proposal.client as Record<string, unknown> | null
  const products = (proposal.products as Record<string, unknown>[]) || []

  // For duplicate: keep products/pricing/conditions but blank client
  const initialData: Partial<ProposalFormData> = {
    product_ids: products
      .map(p => p.product_id as string)
      .filter(Boolean),

    product_pricing: products
      .filter(p => p.product_id)
      .map(p => ({
        product_id: p.product_id as string,
        pricing_type: ((p.pricing_type as string) || 'monthly') as PricingType,
        unit_value: (p.unit_value as number) || 0,
        quantity: (p.quantity as number) || 1,
        discount_percent: (p.discount_percent as number) || 0,
        notes: (p.notes as string) || '',
        manual_override: (p.manual_override as boolean) || false,
        override_reason: (p.override_reason as string) || '',
      })),

    desconto_pct: (proposal.discount_percent as number) || 0,
    validade_dias: (proposal.validade_dias as number) || 30,
    forma_pagamento: (proposal.forma_pagamento as string) ? (proposal.forma_pagamento as string).split(', ') : [],
    prazo_implantacao: (proposal.prazo_implantacao as string) || '',
  }

  const empresa = (client?.empresa as string) || 'proposta'

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Propostas', href: '/dashboard' },
          { label: empresa, href: `/dashboard/propostas/${params.id}` },
          { label: 'Duplicar' },
        ]} className="mb-3" />
        <h1 className="font-sora text-xl font-semibold text-app-text">
          Duplicar proposta
        </h1>
        <p className="text-sm text-app-muted mt-0.5">
          Preencha os dados do novo cliente. Produtos e condições vêm pré-preenchidos.
        </p>
      </div>

      <ProposalForm
        mode="duplicate"
        initialData={initialData}
        sourceProposalId={params.id}
      />
    </div>
  )
}
