'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CircleDollarSign, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import Breadcrumb from '@/components/ui/Breadcrumb'
import PageHeader from '@/components/ui/PageHeader'
import PriceTableEditor from '@/components/admin/PriceTableEditor'
import type { AdminProduct, PriceTable, PriceTableItem } from '@/types/admin'

export default function PriceTablesClient() {
  const { id } = useParams() as { id: string }
  const supabase = createClient()
  const { showToast } = useToast()

  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [tables, setTables] = useState<PriceTable[]>([])
  const [itemsByTable, setItemsByTable] = useState<Record<string, PriceTableItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [newTableName, setNewTableName] = useState('')
  const [creating, setCreating] = useState(false)

  async function loadData() {
    setLoading(true)
    const [{ data: prod }, { data: priceTables }] = await Promise.all([
      supabase.from('product').select('*').eq('id', id).single(),
      supabase.from('price_table').select('*').eq('product_id', id).order('created_at', { ascending: true }),
    ])

    setProduct(prod as AdminProduct)
    setTables((priceTables || []) as PriceTable[])

    if (priceTables && priceTables.length > 0) {
      const { data: items } = await supabase
        .from('price_table_item')
        .select('*')
        .in('price_table_id', priceTables.map(t => t.id))
        .order('sort_order', { ascending: true })

      const grouped: Record<string, PriceTableItem[]> = {}
      ;(items || []).forEach((item: PriceTableItem) => {
        if (!grouped[item.price_table_id]) grouped[item.price_table_id] = []
        grouped[item.price_table_id].push(item)
      })
      setItemsByTable(grouped)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [id])

  async function handleCreateTable() {
    if (!newTableName.trim()) return
    setCreating(true)
    const { data, error } = await supabase
      .from('price_table')
      .insert({ product_id: id, name: newTableName.trim(), active: true })
      .select()
      .single()

    if (!error && data) {
      setTables([...tables, data as PriceTable])
      setItemsByTable({ ...itemsByTable, [data.id]: [] })
      setNewTableName('')
      showToast('Tabela criada.')
    }
    setCreating(false)
  }

  async function handleSetDefault(priceTableId: string) {
    await supabase.from('product').update({ default_price_table_id: priceTableId }).eq('id', id)
    setProduct(prev => prev ? { ...prev, default_price_table_id: priceTableId } : prev)
    showToast('Tabela definida como padrão.')
  }

  async function handleDuplicate(table: PriceTable) {
    const { data: newTable, error } = await supabase
      .from('price_table')
      .insert({ product_id: id, name: `${table.name} (cópia)`, description: table.description, active: true })
      .select()
      .single()

    if (error || !newTable) return

    const originalItems = itemsByTable[table.id] || []
    if (originalItems.length > 0) {
      const { data: newItems } = await supabase
        .from('price_table_item')
        .insert(originalItems.map(item => ({
          price_table_id: newTable.id,
          minimum_quantity: item.minimum_quantity,
          maximum_quantity: item.maximum_quantity,
          unit_price: item.unit_price,
          sort_order: item.sort_order,
        })))
        .select()
      setItemsByTable(prev => ({ ...prev, [newTable.id]: (newItems || []) as PriceTableItem[] }))
    } else {
      setItemsByTable(prev => ({ ...prev, [newTable.id]: [] }))
    }

    setTables([...tables, newTable as PriceTable])
    showToast('Tabela duplicada.')
  }

  async function handleDeleteTable(priceTableId: string) {
    await supabase.from('price_table').delete().eq('id', priceTableId)
    setTables(tables.filter(t => t.id !== priceTableId))
    showToast('Tabela excluída.')
    if (product?.default_price_table_id === priceTableId) {
      setProduct(prev => prev ? { ...prev, default_price_table_id: null } : prev)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-full px-8 py-8 bg-app-bg flex items-center justify-center">
        <p className="text-sm text-app-muted">Carregando...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="w-full min-h-full px-8 py-8 bg-app-bg flex items-center justify-center">
        <p className="text-sm text-app-muted">Produto não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <Breadcrumb
        items={[
          { label: 'Produtos', href: '/dashboard/admin/produtos' },
          { label: product.name, href: `/dashboard/admin/produtos/${id}` },
          { label: 'Tabelas de preço' },
        ]}
        className="mb-4"
      />

      <PageHeader
        icon={CircleDollarSign}
        iconBg="#10B981"
        title="Tabelas de preço"
        subtitle={`Gerencie as faixas de preço por quantidade para ${product.name}.`}
      />

      <div className="space-y-4">
        {tables.length === 0 && (
          <div className="bg-app-surface border border-app-border rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm text-app-muted">Nenhuma tabela de preço criada ainda.</p>
            <p className="text-xs text-app-muted mt-1">Crie uma tabela abaixo para definir preços por faixa de quantidade.</p>
          </div>
        )}

        {tables.map(table => (
          <PriceTableEditor
            key={table.id}
            priceTable={table}
            initialItems={itemsByTable[table.id] || []}
            isDefault={product.default_price_table_id === table.id}
            onSetDefault={handleSetDefault}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteTable}
          />
        ))}

        {/* Nova tabela */}
        <div className="bg-app-surface border border-dashed border-app-border rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-app-muted mb-3">Nova tabela de preço</p>
          <div className="flex gap-2">
            <input
              value={newTableName}
              onChange={e => setNewTableName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateTable() }}
              placeholder="Ex: Promoção Julho, Parceiro Premium..."
              className="flex-1 bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-fay-green-deep transition-colors"
            />
            <button
              type="button"
              onClick={handleCreateTable}
              disabled={!newTableName.trim() || creating}
              className="flex items-center gap-1.5 px-4 py-2 bg-fay-green text-fay-dark rounded-xl text-sm font-semibold hover:bg-fay-green-deep hover:text-white transition-colors disabled:opacity-40"
            >
              <Plus size={14} />
              Criar tabela
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
