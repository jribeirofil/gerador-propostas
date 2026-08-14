import { LayoutTemplate } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import TemplateList from '@/components/admin/TemplateList'
import PageHeader from '@/components/ui/PageHeader'

export default async function TemplatesPage() {
  const { profile } = await requireAdmin()
  const db = createAdminClient()
  const orgId = profile?.organization_id ?? null

  const [templatesRes, productsRes] = await Promise.all([
    db.from('proposal_template').select('*, blocks:template_block(id)').eq('organization_id', orgId).order('created_at'),
    db.from('product').select('name, slug').eq('active', true).eq('organization_id', orgId).order('sort_order'),
  ])

  const productMap: Record<string, string> = Object.fromEntries(
    (productsRes.data || []).map(p => [p.slug, p.name])
  )

  const templates = (templatesRes.data || []).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    is_default: t.is_default,
    product_slugs: t.product_slugs,
    blockCount: (t.blocks as { id: string }[]).length,
    productNames: t.product_slugs.map((s: string) => productMap[s]).filter(Boolean),
  }))

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <PageHeader
        icon={LayoutTemplate}
        iconBg="#8B5CF6"
        title="Templates"
        subtitle="Configure a estrutura e os textos padrão das propostas."
        action={{ label: 'Novo template', href: '/dashboard/admin/templates/novo' }}
      />

      <TemplateList initialTemplates={templates} />
    </div>
  )
}
