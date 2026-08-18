import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBlocksFromTemplate } from '@/lib/blocks'
import { buildProposalBody } from '@/lib/pdf-template'
import { loadProposalDocument } from '@/lib/proposal-document'
import WebPreviewHeader from '@/components/proposal/WebPreviewHeader'
import AnalyticsTracker from '@/components/proposal/AnalyticsTracker'
import ProposalDecision from '@/components/proposal/ProposalDecision'
import ExpiredProposalView from '@/components/proposal/ExpiredProposalView'
import type { ProposalBlock } from '@/lib/blocks'

function computeExpiry(createdAt: string | null, validadeDias: number | null): Date | null {
  if (!createdAt || !validadeDias) return null
  const d = new Date(createdAt)
  d.setDate(d.getDate() + validadeDias)
  return d
}

export default async function PublicProposalPage({ params }: { params: { token: string } }) {
  const db = createAdminClient()

  const { data: proposal, error } = await db
    .from('proposal')
    .select('*, client:clients(*), products:proposal_product(*)')
    .eq('public_token', params.token)
    .single()

  if (error || !proposal) notFound()

  let blocks: ProposalBlock[] = []
  const { data: rawBlocks } = await db
    .from('proposal_block')
    .select('id, proposal_id, type, title, content_json, enabled, sort_order')
    .eq('proposal_id', proposal.id)
    .order('sort_order')

  blocks = (rawBlocks || []) as ProposalBlock[]

  if (blocks.length === 0) {
    await createBlocksFromTemplate(db, proposal.id, proposal.template_id)
  }

  const { doc, settings } = await loadProposalDocument(db, proposal)

  const companyName = settings?.company_name || 'Sua empresa'
  const primaryColor = settings?.primary_color || '#4F46E5'
  const clientName = (proposal.client as { empresa?: string } | null)?.empresa || ''
  const documentHtml = buildProposalBody(doc)

  const expiryDate = computeExpiry(proposal.created_at as string | null, proposal.validade_dias as number | null)
  const isExpired = expiryDate ? expiryDate < new Date() : false
  const opportunityStatus = (proposal.opportunity_status as string | null) || 'open'

  return (
    <>
      <AnalyticsTracker token={params.token} />
      <WebPreviewHeader
        companyName={companyName}
        clientName={clientName}
        pdfUrl={`/api/p/${params.token}/pdf`}
        primaryColor={primaryColor}
      />
      <main className="pt-14 bg-app-bg min-h-screen">
        <div className="max-w-[900px] mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div dangerouslySetInnerHTML={{ __html: documentHtml }} />
          </div>
          {isExpired ? (
            <ExpiredProposalView
              token={params.token}
              expiryDate={expiryDate!.toISOString()}
            />
          ) : (
            <ProposalDecision
              token={params.token}
              opportunityStatus={opportunityStatus}
              primaryColor={primaryColor}
            />
          )}
        </div>
      </main>
    </>
  )
}
