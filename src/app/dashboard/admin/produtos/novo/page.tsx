import { requireAdmin } from '@/lib/admin-guard'
import { createClient } from '@/lib/supabase/server'
import Breadcrumb from '@/components/ui/Breadcrumb'
import ProductForm from '@/components/admin/ProductForm'
import type { Category } from '@/types/admin'

export default async function NovoProdutoPage() {
  await requireAdmin()
  const supabase = createClient()
  const { data: categories } = await supabase
    .from('category').select('*').order('sort_order', { ascending: true })

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: 'Produtos', href: '/dashboard/admin/produtos' },
          { label: 'Novo produto' },
        ]} className="mb-3" />
        <h1 className="font-sora text-xl font-semibold text-app-text">Novo produto</h1>
        <p className="text-sm text-app-muted mt-0.5">Depois de criar, você poderá adicionar benefícios, escopo, FAQ e diferenciais.</p>
      </div>

      <ProductForm categories={(categories || []) as Category[]} />
    </div>
  )
}
