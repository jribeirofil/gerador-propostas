import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBlocksFromTemplate } from '@/lib/blocks'
import ProposalPreview from '@/components/proposal/ProposalPreview'
import WebPreviewHeader from '@/components/proposal/WebPreviewHeader'
import type { ProposalBlock } from '@/lib/blocks'

export default async function PreviewWebPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()

  const [proposalRes, blocksRes, profileRes, settingsRes] = await Promise.all([
    db
      .from('proposal')
      .select('*, client:clients(*), products:proposal_product(*)')
      .eq('id', params.id)
      .single(),
    db
      .from('proposal_block')
      .select('id, proposal_id, type, title, content_json, enabled, sort_order')
      .eq('proposal_id', params.id)
      .order('sort_order'),
    db.from('profiles').select('full_name, job_title, phone').eq('id', user.id).single(),
    db.from('company_settings').select('company_name, primary_color, cover_bg_url, cover_video_url, company_site, company_email, company_phone, company_whatsapp').limit(1).maybeSingle(),
  ])

  if (!proposalRes.data) notFound()

  const proposal = proposalRes.data
  let blocks = (blocksRes.data || []) as ProposalBlock[]

  if (blocks.length === 0) {
    await createBlocksFromTemplate(db, params.id, proposal.template_id)
    const { data: newBlocks } = await db
      .from('proposal_block')
      .select('id, proposal_id, type, title, content_json, enabled, sort_order')
      .eq('proposal_id', params.id)
      .order('sort_order')
    blocks = (newBlocks || []) as ProposalBlock[]
  }

  // Always sort by the template's current block order
  const templateId = proposal.template_id
  if (templateId) {
    const { data: templateBlocks } = await db
      .from('template_block')
      .select('type, sort_order, enabled')
      .eq('template_id', templateId)
      .order('sort_order')

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
  }

  const [templateAssetsRes] = await Promise.all([
    templateId
      ? db.from('proposal_template').select('cover_image_url, cover_video_url').eq('id', templateId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const profile = profileRes.data
  const settings = settingsRes.data
  const templateAssets = templateAssetsRes.data

  const signerData = {
    name: profile?.full_name || user.email || '',
    job_title: profile?.job_title || '',
    email: user.email || '',
    phone: profile?.phone || '',
  }

  const companyName = settings?.company_name || 'Sua empresa'
  const primaryColor = settings?.primary_color || '#1FE97C'
  const coverBgUrl = templateAssets?.cover_image_url || settings?.cover_bg_url || null
  const coverVideoUrl = templateAssets?.cover_video_url || settings?.cover_video_url || null
  const clientName = proposal.client?.empresa || ''

  const companyContact = {
    site: settings?.company_site,
    email: settings?.company_email,
    phone: settings?.company_phone,
    whatsapp: settings?.company_whatsapp,
  }

  return (
    <>
      <WebPreviewHeader
        companyName={companyName}
        clientName={clientName}
        pdfUrl={`/api/proposals/${params.id}/pdf`}
        backUrl={`/dashboard/propostas/${params.id}`}
      />
      <main className="pt-14 bg-white min-h-screen">
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
      </main>
    </>
  )
}
