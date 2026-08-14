import { BookOpen } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import BibliotecaPage from '@/components/admin/BibliotecaPage'
import PageHeader from '@/components/ui/PageHeader'

export default async function ContentLibraryPage() {
  const { user, profile } = await requireAdmin()
  const db = createAdminClient()
  const orgId = profile?.organization_id ?? null

  const [itemsRes, templatesRes, productsRes] = await Promise.all([
    db.from('content_library').select('*').eq('organization_id', orgId).order('type').order('title'),
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
    productNames: (t.product_slugs as string[]).map((s: string) => productMap[s]).filter(Boolean),
  }))

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <PageHeader
        icon={BookOpen}
        iconBg="#8B5CF6"
        title="Biblioteca"
        subtitle="Templates, blocos de conteúdo e mídias reutilizáveis nas propostas."
      />
      <BibliotecaPage
        templates={templates}
        libraryItems={itemsRes.data || []}
        userId={user.id}
      />
    </div>
  )
}
