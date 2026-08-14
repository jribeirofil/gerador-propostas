import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-guard'
import { createClient } from '@/lib/supabase/server'
import Breadcrumb from '@/components/ui/Breadcrumb'
import ProductForm from '@/components/admin/ProductForm'
import SortableListEditor from '@/components/admin/SortableListEditor'
import SortableFaqEditor from '@/components/admin/SortableFaqEditor'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import type { AdminProduct, ProductListItem, ProductFaqItem, Category } from '@/types/admin'

export default async function EditarProdutoPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const supabase = createClient()

  const [
    { data: product }, { data: benefits }, { data: scope },
    { data: faq }, { data: differentials }, { data: categories },
  ] = await Promise.all([
    supabase.from('product').select('*').eq('id', params.id).single(),
    supabase.from('product_benefit').select('*').eq('product_id', params.id).order('sort_order'),
    supabase.from('product_scope').select('*').eq('product_id', params.id).order('sort_order'),
    supabase.from('product_faq').select('*').eq('product_id', params.id).order('sort_order'),
    supabase.from('product_differential').select('*').eq('product_id', params.id).order('sort_order'),
    supabase.from('category').select('*').order('sort_order', { ascending: true }),
  ])

  if (!product) notFound()

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: 'Produtos', href: '/dashboard/admin/produtos' },
          { label: (product as AdminProduct).name },
        ]} className="mb-3" />
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-app-muted">Editando</span>
          <span className="text-app-muted text-sm">›</span>
          <h1 className="font-sora text-xl font-semibold text-app-text">{(product as AdminProduct).name}</h1>
        </div>
      </div>

      <div className="space-y-5">
        <ProductForm product={product as AdminProduct} categories={(categories || []) as Category[]} />

        <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
          <SortableListEditor
            productId={params.id}
            type="benefit"
            initialItems={(benefits || []) as ProductListItem[]}
          />
        </div>

        <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
          <SortableListEditor
            productId={params.id}
            type="scope"
            initialItems={(scope || []) as ProductListItem[]}
          />
        </div>

        <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
          <SortableFaqEditor
            productId={params.id}
            initialItems={(faq || []) as ProductFaqItem[]}
          />
        </div>

        <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
          <SortableListEditor
            productId={params.id}
            type="differential"
            initialItems={(differentials || []) as ProductListItem[]}
          />
        </div>

        <DeleteProductButton productId={params.id} productName={(product as AdminProduct).name} />
      </div>
    </div>
  )
}
