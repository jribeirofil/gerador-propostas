import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionOrgId } from '@/lib/org'
import { createBlocksFromTemplate } from '@/lib/blocks'
import BlockEditor from '@/components/proposal/BlockEditor'
import type { ProposalBlock } from '@/lib/blocks'

export default async function BlocosPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getSessionOrgId()
  if (!orgId) notFound()

  const db = createAdminClient()

  const [proposalRes, blocksRes, profileRes] = await Promise.all([
    db
      .from('proposal')
      .select('id, title, template_id, client:clients(empresa), products:proposal_product(snapshot)')
      .eq('id', params.id)
      .eq('organization_id', orgId)
      .single(),
    db
      .from('proposal_block')
      .select('id, proposal_id, type, title, content_json, enabled, sort_order')
      .eq('proposal_id', params.id)
      .order('sort_order'),
    db
      .from('profiles')
      .select('full_name, job_title, phone')
      .eq('id', user.id)
      .single(),
  ])

  if (!proposalRes.data) notFound()

  const proposal = proposalRes.data
  let blocks = (blocksRes.data || []) as ProposalBlock[]

  // Se a proposta ainda não tem blocos, inicializa a partir do template
  if (blocks.length === 0) {
    await createBlocksFromTemplate(db, params.id, proposal.template_id)
    const { data: newBlocks } = await db
      .from('proposal_block')
      .select('id, proposal_id, type, title, content_json, enabled, sort_order')
      .eq('proposal_id', params.id)
      .order('sort_order')
    blocks = (newBlocks || []) as ProposalBlock[]
  }

  const empresa = (proposal.client as unknown as { empresa: string } | null)?.empresa || 'Proposta'
  const profile = profileRes.data || null

  const signerData = {
    name: profile?.full_name || user.email || '',
    job_title: profile?.job_title || '',
    email: user.email || '',
    phone: profile?.phone || '',
  }

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: 'Propostas', href: '/dashboard' },
          { label: empresa, href: `/dashboard/propostas/${params.id}` },
          { label: 'Conteúdo' },
        ]} className="mb-3" />
        <h1 className="font-sora text-xl font-semibold text-app-text">
          Conteúdo — {empresa}
        </h1>
        <p className="text-sm text-app-muted mt-0.5">
          Ative, reordene e edite os blocos desta proposta.
        </p>
      </div>

      <BlockEditor
        proposalId={params.id}
        initialBlocks={blocks}
        signerData={signerData}
      />
    </div>
  )
}
