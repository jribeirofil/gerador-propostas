import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBlocksFromTemplate } from '@/lib/blocks'
import ProposalPreview from '@/components/proposal/ProposalPreview'
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

  const orgId = proposal.organization_id as string | null

  let blocks: ProposalBlock[] = []
  const { data: rawBlocks } = await db
    .from('proposal_block')
    .select('id, proposal_id, type, title, content_json, enabled, sort_order')
    .eq('proposal_id', proposal.id)
    .order('sort_order')

  blocks = (rawBlocks || []) as ProposalBlock[]

  if (blocks.length === 0) {
    await createBlocksFromTemplate(db, proposal.id, proposal.template_id)
    const { data: newBlocks } = await db
      .from('proposal_block')
      .select('id, proposal_id, type, title, content_json, enabled, sort_order')
      .eq('proposal_id', proposal.id)
      .order('sort_order')
    blocks = (newBlocks || []) as ProposalBlock[]
  }

  const [profileRes, settingsRes, templateRes, templateBlocksRes] = await Promise.all([
    proposal.created_by
      ? db.from('profiles').select('full_name, job_title, phone, email').eq('id', proposal.created_by).single()
      : Promise.resolve({ data: null }),
    db.from('company_settings').select('company_name, primary_color, cover_bg_url, cover_video_url, company_site, company_email, company_phone, company_whatsapp').eq('organization_id', orgId).limit(1).maybeSingle(),
    proposal.template_id
      ? db.from('proposal_template').select('cover_image_url, cover_video_url').eq('id', proposal.template_id).eq('organization_id', orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    proposal.template_id
      ? db.from('template_block').select('type, sort_order, enabled').eq('template_id', proposal.template_id).order('sort_order')
      : Promise.resolve({ data: null }),
  ])

  const profile = profileRes.data
  const settings = settingsRes.data
  const templateAssets = templateRes.data
  const templateBlocks = templateBlocksRes.data

  // Sort proposal blocks by the template's current order
  if (templateBlocks && templateBlocks.length > 0) {
    const templateOrder: Record<string, number> = Object.fromEntries(
      templateBlocks.map(b => [b.type, b.sort_order])
    )
    const templateEnabled: Record<string, boolean> = Object.fromEntries(
      templateBlocks.map(b => [b.type, b.enabled])
    )
    blocks = blocks
      .filter(b => templateEnabled[b.type] !== false)
      .sort((a, b) => (templateOrder[a.type] ?? 99) - (templateOrder[b.type] ?? 99))
  }

  const signerData = {
    name: profile?.full_name || '',
    job_title: profile?.job_title || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  }

  const companyName = settings?.company_name || 'Sua empresa'
  const primaryColor = settings?.primary_color || '#1FE97C'
  // Template assets take priority over global settings
  const coverBgUrl = templateAssets?.cover_image_url || settings?.cover_bg_url || null
  const coverVideoUrl = templateAssets?.cover_video_url || settings?.cover_video_url || null
  const clientName = (proposal.client as { empresa?: string } | null)?.empresa || ''

  const companyContact = {
    site: settings?.company_site,
    email: settings?.company_email,
    phone: settings?.company_phone,
    whatsapp: settings?.company_whatsapp,
  }

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
      />
      <main className="pt-14">
        <ProposalPreview
          variant="web"
          proposal={proposal}
          blocks={blocks}
          signerData={signerData}
          companyName={companyName}
          primaryColor={primaryColor}
          coverBgUrl={coverBgUrl}
          coverVideoUrl={coverVideoUrl}
          companyContact={companyContact}
        />
        {isExpired ? (
          <ExpiredProposalView
            token={params.token}
            expiryDate={expiryDate!.toISOString()}
          />
        ) : (
          <ProposalDecision
            token={params.token}
            opportunityStatus={opportunityStatus}
          />
        )}
      </main>
    </>
  )
}
