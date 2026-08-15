import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProposalForm from '@/components/proposal/ProposalForm'
import Breadcrumb from '@/components/ui/Breadcrumb'
import type { ProposalFormData } from '@/components/proposal/ProposalForm'
import type { PricingType } from '@/types/engine'

export default async function EditProposalPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: proposal } = await supabase
    .from('proposal')
    .select('*, client:clients(*), products:proposal_product(*)')
    .eq('id', params.id)
    .single()

  if (!proposal || proposal.is_archived) notFound()

  const client = proposal.client as Record<string, unknown> | null
  const products = (proposal.products as Record<string, unknown>[]) || []

  const initialData: Partial<ProposalFormData> = {
    empresa: (client?.empresa as string) || '',
    cnpj: (client?.cnpj as string) || '',
    contato: (client?.contato as string) || '',
    cargo: (client?.cargo as string) || '',
    email: (client?.email as string) || '',
    whatsapp: (client?.whatsapp as string) || '',
    colaboradores: (client?.colaboradores as number) || undefined,
    segmento: (client?.segmento as string) || '',

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
    commercial_conditions: (proposal.commercial_conditions as string) || '',
  }

  const empresa = (client?.empresa as string) || 'proposta'

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Propostas', href: '/dashboard' },
          { label: empresa, href: `/dashboard/propostas/${params.id}` },
          { label: 'Editar' },
        ]} className="mb-3" />
        <h1 className="font-sora text-xl font-semibold text-app-text">
          Editar proposta
        </h1>
        <p className="text-sm text-app-muted mt-0.5">
          As alterações são salvas diretamente na proposta. Use &ldquo;Publicar nova versão&rdquo; para enviar ao cliente.
        </p>
      </div>

      <ProposalForm
        mode="edit"
        initialData={initialData}
        existingClientId={proposal.client_id as string}
        sourceProposalId={params.id}
      />
    </div>
  )
}
