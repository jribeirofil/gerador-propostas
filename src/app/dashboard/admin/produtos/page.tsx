import { Package } from 'lucide-react'
import { Suspense } from 'react'
import { requireAdmin } from '@/lib/admin-guard'
import { createClient } from '@/lib/supabase/server'
import type { AdminProduct, Category } from '@/types/admin'
import ProductTable from '@/components/admin/ProductTable'
import CategoryManager from '@/components/admin/CategoryManager'
import ProductsTabs from '@/components/admin/ProductsTabs'
import PageHeader from '@/components/ui/PageHeader'

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  await requireAdmin()

  const activeTab = searchParams.tab === 'categorias' ? 'categorias' : 'produtos'
  const supabase = createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('product').select('*').order('sort_order', { ascending: true }),
    supabase.from('category').select('*').order('sort_order', { ascending: true }),
  ])

  const productList = (products || []) as AdminProduct[]
  const categoryList = (categories || []) as Category[]

  const productCounts = categoryList.reduce<Record<string, number>>((acc, c) => {
    acc[c.slug] = productList.filter(p => p.category === c.slug).length
    return acc
  }, {})

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <PageHeader
        icon={Package}
        iconBg="#3B82F6"
        title="Catálogo de produtos"
        subtitle="Gerencie produtos, categorias, benefícios, escopo e FAQ."
        action={activeTab === 'produtos'
          ? { label: 'Novo produto', href: '/dashboard/admin/produtos/novo' }
          : undefined}
      />

      <Suspense>
        <ProductsTabs active={activeTab} />
      </Suspense>

      {activeTab === 'produtos' && (
        <ProductTable
          products={productList}
          categories={categoryList}
        />
      )}

      {activeTab === 'categorias' && (
        <CategoryManager
          initialCategories={categoryList}
          productCounts={productCounts}
        />
      )}
    </div>
  )
}
