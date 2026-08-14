import { Tag } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-guard'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import CategoryManager from '@/components/admin/CategoryManager'
import type { Category } from '@/types/admin'

export default async function CategoriasPage() {
  await requireAdmin()
  const supabase = createClient()

  const { data } = await supabase
    .from('category')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <PageHeader
        icon={Tag}
        iconBg="#8B5CF6"
        title="Categorias"
        subtitle="Organize os produtos por categoria para facilitar a seleção nas propostas."
      />
      <CategoryManager initialCategories={(data || []) as Category[]} />
    </div>
  )
}
