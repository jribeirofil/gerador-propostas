import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionOrgId } from '@/lib/org'
import { createBlocksFromTemplate } from '@/lib/blocks'
import ProposalPreview from '@/components/proposal/ProposalPreview'
import PrintButton from './PrintButton'
import type { ProposalBlock } from '@/lib/blocks'


export default async function PreviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getSessionOrgId()
  if (!orgId) notFound()

  const db = createAdminClient()

  const [proposalRes, blocksRes, profileRes, settingsRes] = await Promise.all([
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
    db.from('profiles').select('full_name, job_title, phone').eq('id', user.id).single(),
    db.from('company_settings').select('company_name, logo_url, primary_color, secondary_color, company_site, company_email, company_phone, company_whatsapp').eq('organization_id', orgId).limit(1).maybeSingle(),
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

  const profile = profileRes.data
  const settings = settingsRes.data

  // Capa vem do template (fallback para template padrão se proposta antiga não tem template_id)
  let templateCover = null
  const templateIdToUse = proposal.template_id ||
    (await db
      .from('proposal_template')
      .select('id')
      .eq('is_default', true)
      .eq('organization_id', orgId)
      .limit(1)
      .maybeSingle()
    ).data?.id

  if (templateIdToUse) {
    const { data } = await db
      .from('proposal_template')
      .select('cover_image_url, cover_video_url')
      .eq('id', templateIdToUse)
      .eq('organization_id', orgId)
      .maybeSingle()
    templateCover = data
  }
  const coverBgUrl = templateCover?.cover_image_url || null
  const coverVideoUrl = templateCover?.cover_video_url || null

  const signerData = {
    name: profile?.full_name || user.email || '',
    job_title: profile?.job_title || '',
    email: user.email || '',
    phone: profile?.phone || '',
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Toolbar — only visible in dashboard context */}
      <div className="sticky top-0 z-10 bg-app-bg border-b border-overlay px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/propostas/${params.id}`}
            className="text-xs text-app-muted hover:text-app-text transition-colors"
          >
            ← Voltar
          </Link>
          <span className="text-app-subtle">|</span>
          <span className="text-xs text-app-muted">Prévia Web</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/propostas/${params.id}/blocos`}
            className="px-3 py-1.5 text-xs text-app-muted border border-overlay rounded-lg hover:border-overlay-md hover:text-app-text transition-colors"
          >
            Editar conteúdo
          </Link>
          <PrintButton />
        </div>
      </div>

      <ProposalPreview
        proposal={proposal as unknown as Parameters<typeof ProposalPreview>[0]['proposal']}
        blocks={blocks}
        signerData={signerData}
        companyName={settings?.company_name || 'Sua empresa'}
        primaryColor={settings?.primary_color || '#1FE97C'}
        secondaryColor={settings?.secondary_color || null}
        coverBgUrl={coverBgUrl}
        coverVideoUrl={coverVideoUrl}
        companyContact={{
          site: settings?.company_site,
          email: settings?.company_email,
          phone: settings?.company_phone,
          whatsapp: settings?.company_whatsapp,
        }}
      />
    </div>
  )
}
