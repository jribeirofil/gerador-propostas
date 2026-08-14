import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import Breadcrumb from '@/components/ui/Breadcrumb'
import TemplateEditor from '@/components/admin/TemplateEditor'

export default async function TemplateEditorPage({ params }: { params: { id: string } }) {
  const { profile } = await requireAdmin()
  const db = createAdminClient()
  const orgId = profile?.organization_id ?? null

  const [templateRes, blocksRes, productsRes, countRes] = await Promise.all([
    db.from('proposal_template').select('*').eq('id', params.id).eq('organization_id', orgId).single(),
    db.from('template_block').select('*').eq('template_id', params.id).order('sort_order'),
    db.from('product').select('id, name, slug').eq('active', true).eq('organization_id', orgId).order('sort_order'),
    db.from('proposal_template').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
  ])

  if (!templateRes.data) notFound()

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Templates', href: '/dashboard/admin/templates' },
          { label: templateRes.data.name },
        ]} className="mb-3" />
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-app-muted">Editando</span>
          <span className="text-app-muted text-sm">›</span>
          <h1 className="font-sora text-xl font-semibold text-app-text">{templateRes.data.name}</h1>
          {templateRes.data.is_default && (
            <span className="text-[11px] bg-brand-green/15 text-brand-green-deep px-2 py-0.5 rounded-full font-medium">
              Padrão
            </span>
          )}
        </div>
      </div>

      <TemplateEditor
        template={{
          id: templateRes.data.id,
          name: templateRes.data.name,
          description: templateRes.data.description,
          is_default: templateRes.data.is_default,
          product_slugs: templateRes.data.product_slugs,
          cover_image_url: templateRes.data.cover_image_url ?? null,
          cover_video_url: templateRes.data.cover_video_url ?? null,
        }}
        initialBlocks={blocksRes.data || []}
        allProducts={productsRes.data || []}
        totalTemplates={countRes.count ?? 1}
      />
    </div>
  )
}
