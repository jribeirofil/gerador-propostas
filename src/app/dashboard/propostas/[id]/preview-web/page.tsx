import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionOrgId } from '@/lib/org'
import { createBlocksFromTemplate } from '@/lib/blocks'
import { buildProposalBody } from '@/lib/pdf-template'
import { loadProposalDocument } from '@/lib/proposal-document'
import WebPreviewHeader from '@/components/proposal/WebPreviewHeader'
import type { ProposalBlock } from '@/lib/blocks'

export default async function PreviewWebPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getSessionOrgId()
  if (!orgId) notFound()

  const db = createAdminClient()

  const [proposalRes, blocksRes] = await Promise.all([
    db
      .from('proposal')
      .select('*, client:clients(*), products:proposal_product(*)')
      .eq('id', params.id)
      .eq('organization_id', orgId)
      .single(),
    db
      .from('proposal_block')
      .select('id, proposal_id, type, title, content_json, enabled, sort_order')
      .eq('proposal_id', params.id)
      .order('sort_order'),
  ])

  if (!proposalRes.data) notFound()

  const proposal = proposalRes.data
  let blocks = (blocksRes.data || []) as ProposalBlock[]

  if (blocks.length === 0) {
    await createBlocksFromTemplate(db, params.id, proposal.template_id)
  }

  const { doc, settings } = await loadProposalDocument(db, proposal)

  const companyName = settings?.company_name || 'Sua empresa'
  const primaryColor = settings?.primary_color || '#4F46E5'
  const clientName = proposal.client?.empresa || ''
  const documentHtml = buildProposalBody(doc)

  return (
    <>
      <WebPreviewHeader
        companyName={companyName}
        clientName={clientName}
        pdfUrl={`/api/proposals/${params.id}/pdf`}
        backUrl={`/dashboard/propostas/${params.id}`}
        primaryColor={primaryColor}
      />
      <main className="pt-14 bg-app-bg min-h-screen">
        <div className="max-w-[900px] mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div dangerouslySetInnerHTML={{ __html: documentHtml }} />
          </div>
        </div>
      </main>
    </>
  )
}
