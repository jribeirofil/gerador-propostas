import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionOrgId } from '@/lib/org'
import { createBlocksFromTemplate } from '@/lib/blocks'
import ProposalWorkspace from '@/components/proposal/ProposalWorkspace'
import type { ProposalBlock } from '@/lib/blocks'

export default async function ProposalWorkspacePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getSessionOrgId()
  if (!orgId) notFound()

  const db = createAdminClient()

  const [proposalRes, blocksRes, eventsRes, profileRes, settingsRes, analyticsRes, catalogRes] = await Promise.all([
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
    db
      .from('proposal_event')
      .select('id, event_type, created_at, created_by, metadata')
      .eq('proposal_id', params.id)
      .order('created_at', { ascending: false }),
    db.from('profiles').select('full_name, job_title, phone').eq('id', user.id).single(),
    db.from('company_settings').select('company_name, logo_url, primary_color, secondary_color, company_site, company_email, company_phone, company_whatsapp').eq('organization_id', orgId).limit(1).maybeSingle(),
    db
      .from('proposal_analytics')
      .select('event_type, session_id, created_at')
      .eq('proposal_id', params.id)
      .order('created_at', { ascending: true }),
    db
      .from('product')
      .select(`
        id, name, slug, description, active, sort_order, category,
        unit_label, calculation_type, billing_frequency, default_price_table_id,
        benefits:product_benefit(id, title, sort_order, active),
        scope:product_scope(id, title, sort_order, active),
        faq:product_faq(id, question, answer, sort_order, active),
        differentials:product_differential(id, title, sort_order, active)
      `)
      .eq('active', true)
      .eq('organization_id', orgId)
      .order('sort_order', { ascending: true }),
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

  // Fetch all versions in the same version_group for the Histórico tab
  let versionQuery = db
    .from('proposal')
    .select('id, version, status, created_at, title')
    .eq('organization_id', orgId)
  versionQuery = proposal.version_group
    ? versionQuery.eq('version_group', proposal.version_group)
    : versionQuery.is('version_group', null)
  const { data: versionHistory } = await versionQuery.order('version', { ascending: false })

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
      .select('cover_image_url, cover_video_url, default_font, base_font_size, heading_size, heading_color, heading_bold, text_color, text_line_height, background_color, accent_color, custom_css')
      .eq('id', templateIdToUse)
      .eq('organization_id', orgId)
      .maybeSingle()
    templateCover = data
  }
  const coverBgUrl = templateCover?.cover_image_url || null
  const coverVideoUrl = templateCover?.cover_video_url || null
  const defaultFont = templateCover?.default_font || null
  const baseFontSize = templateCover?.base_font_size || null
  const headingSize = templateCover?.heading_size || null
  const headingColor = templateCover?.heading_color || null
  const headingBold = templateCover?.heading_bold ?? undefined
  const textColor = templateCover?.text_color || null
  const textLineHeight = templateCover?.text_line_height || null
  const backgroundColor = templateCover?.background_color || null
  const accentColor = templateCover?.accent_color || null
  const customCss = templateCover?.custom_css || null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catalogProducts = (catalogRes.data || []).map((p: any) => ({
    ...p,
    benefits:      (p.benefits      || []).filter((b: { active: boolean }) => b.active),
    scope:         (p.scope         || []).filter((s: { active: boolean }) => s.active),
    faq:           (p.faq           || []).filter((f: { active: boolean }) => f.active),
    differentials: (p.differentials || []).filter((d: { active: boolean }) => d.active),
  }))

  const signerData = {
    name: profile?.full_name || user.email || '',
    job_title: profile?.job_title || '',
    email: user.email || '',
    phone: profile?.phone || '',
  }

  // Compute analytics summary (graceful if table doesn't exist yet)
  const analyticsRows = analyticsRes.error ? [] : (analyticsRes.data || [])
  const openedRows = analyticsRows.filter(r => r.event_type === 'opened')
  const heartbeatRows = analyticsRows.filter(r => r.event_type === 'heartbeat')
  const pdfRows = analyticsRows.filter(r => r.event_type === 'pdf_downloaded')

  const uniqueSessions = new Set(openedRows.map(r => r.session_id).filter(Boolean))
  const totalViews = uniqueSessions.size || openedRows.length

  const hbPerSession: Record<string, number> = {}
  heartbeatRows.forEach(r => {
    if (r.session_id) hbPerSession[r.session_id] = (hbPerSession[r.session_id] || 0) + 1
  })
  const sessionTimes = Object.values(hbPerSession)
  const avgReadTimeSeconds = sessionTimes.length > 0
    ? Math.round(sessionTimes.reduce((a, b) => a + b, 0) * 30 / sessionTimes.length)
    : 0

  const analyticsSummary = (totalViews > 0 || pdfRows.length > 0) ? {
    totalViews,
    pdfDownloads: pdfRows.length,
    firstViewedAt: openedRows[0]?.created_at ?? null,
    lastViewedAt: openedRows[openedRows.length - 1]?.created_at ?? null,
    avgReadTimeSeconds,
  } : null

  const analyticsTimeline = [
    ...(openedRows.length > 0 ? [{ label: 'Proposta visualizada pelo cliente', date: openedRows[0].created_at ?? '' }] : []),
    ...pdfRows.map(r => ({ label: 'Cliente baixou o PDF', date: r.created_at ?? '' })),
    ...(openedRows.length > 1 ? [{
      label: `Última interação do cliente${totalViews > 1 ? ` · ${totalViews} visualizações` : ''}`,
      date: openedRows[openedRows.length - 1].created_at ?? '',
    }] : []),
  ]

  return (
    <ProposalWorkspace
      proposal={proposal}
      blocks={blocks}
      events={eventsRes.data || []}
      versionHistory={versionHistory || []}
      signerData={signerData}
      companyName={settings?.company_name || 'Sua empresa'}
      primaryColor={settings?.primary_color || '#4F46E5'}
      secondaryColor={settings?.secondary_color || null}
      coverBgUrl={coverBgUrl}
      coverVideoUrl={coverVideoUrl}
      companyContact={{
        site: settings?.company_site,
        email: settings?.company_email,
        phone: settings?.company_phone,
        whatsapp: settings?.company_whatsapp,
      }}
      defaultFont={defaultFont}
      baseFontSize={baseFontSize}
      headingSize={headingSize}
      headingColor={headingColor}
      headingBold={headingBold}
      textColor={textColor}
      textLineHeight={textLineHeight}
      backgroundColor={backgroundColor}
      accentColor={accentColor}
      customCss={customCss}
      analyticsSummary={analyticsSummary}
      analyticsTimeline={analyticsTimeline}
      catalogProducts={catalogProducts}
    />
  )
}
