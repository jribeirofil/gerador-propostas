'use client'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Star, Power, Trash2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CurrencyField from '@/components/ui/CurrencyField'
import type { PriceTable, PriceTableItem } from '@/types/admin'

interface Props {
  priceTable: PriceTable
  initialItems: PriceTableItem[]
  isDefault: boolean
  onSetDefault: (priceTableId: string) => void
  onDuplicate: (priceTable: PriceTable) => void
  onDelete: (priceTableId: string) => void
}

const inputClass = 'w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-brand-green-deep transition-colors'

function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function PriceTableEditor({ priceTable, initialItems, isDefault, onSetDefault, onDuplicate, onDelete }: Props) {
  const [items, setItems] = useState<PriceTableItem[]>(
    [...initialItems].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [active, setActive] = useState(priceTable.active)
  const [deleteTableDialog, setDeleteTableDialog] = useState(false)
  const [deletingTable, setDeletingTable] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const supabase = createClient()
  const { showToast } = useToast()

  async function toggleActive() {
    const next = !active
    setActive(next)
    await supabase.from('price_table').update({ active: next }).eq('id', priceTable.id)
    showToast(next ? 'Tabela ativada.' : 'Tabela desativada.')
  }

  async function addItem() {
    const lastItem = items[items.length - 1]
    const newMin = lastItem ? (lastItem.maximum_quantity ?? lastItem.minimum_quantity) + 1 : 1

    const { data, error } = await supabase
      .from('price_table_item')
      .insert({ price_table_id: priceTable.id, minimum_quantity: newMin, maximum_quantity: null, unit_price: 0, sort_order: items.length })
      .select()
      .single()

    if (!error && data) setItems([...items, data as PriceTableItem])
  }

  async function updateItem(id: string, patch: Partial<PriceTableItem>) {
    setItems(items.map(i => (i.id === id ? { ...i, ...patch } : i)))
    await supabase.from('price_table_item').update(patch).eq('id', id)
  }

  async function deleteItem(id: string) {
    setDeleteItemId(null)
    setItems(items.filter(i => i.id !== id))
    await supabase.from('price_table_item').delete().eq('id', id)
    showToast('Faixa removida.')
  }

  async function handleDeleteTable() {
    setDeletingTable(true)
    await onDelete(priceTable.id)
    setDeletingTable(false)
    setDeleteTableDialog(false)
  }

  return (
    <>
      <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-app-border">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-app-muted hover:text-app-text transition-colors"
          >
            {expanded
              ? <ChevronDown size={15} />
              : <ChevronRight size={15} />
            }
          </button>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <span className="text-sm font-medium text-app-text">{priceTable.name}</span>
            {isDefault && (
              <span className="text-[11px] bg-brand-green/15 text-brand-green-deep px-2 py-0.5 rounded-full font-medium">
                Padrão
              </span>
            )}
            {!active && (
              <span className="text-[11px] bg-app-surface2 text-app-muted px-2 py-0.5 rounded-full">
                Inativa
              </span>
            )}
          </button>

          <div className="flex items-center gap-0.5">
            {!isDefault && (
              <button
                type="button"
                onClick={() => onSetDefault(priceTable.id)}
                title="Tornar padrão"
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
              >
                <Star size={13} />
                <span>Padrão</span>
              </button>
            )}
            <button
              type="button"
              onClick={toggleActive}
              title={active ? 'Desativar' : 'Ativar'}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
            >
              <Power size={13} />
              <span>{active ? 'Desativar' : 'Ativar'}</span>
            </button>
            <button
              type="button"
              onClick={() => onDuplicate(priceTable)}
              title="Duplicar tabela"
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
            >
              <Copy size={13} />
              <span>Duplicar</span>
            </button>
            <button
              type="button"
              onClick={() => setDeleteTableDialog(true)}
              title="Excluir tabela"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-app-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Body */}
        {expanded && (
          <div className="p-5">
            {priceTable.description && (
              <p className="text-xs text-app-muted mb-4">{priceTable.description}</p>
            )}

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-3 text-[11px] font-semibold text-app-muted uppercase tracking-wide px-1 mb-2">
              <div className="col-span-3">De (vidas)</div>
              <div className="col-span-3">Até (vidas)</div>
              <div className="col-span-4">Valor unitário</div>
              <div className="col-span-2" />
            </div>

            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                  <input
                    type="number"
                    min="1"
                    value={item.minimum_quantity}
                    onChange={e => updateItem(item.id, { minimum_quantity: parseInt(e.target.value) || 1 })}
                    className={`${inputClass} col-span-3`}
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.maximum_quantity ?? ''}
                    onChange={e => updateItem(item.id, { maximum_quantity: e.target.value ? parseInt(e.target.value) : null })}
                    className={`${inputClass} col-span-3`}
                    placeholder="Sem teto"
                  />
                  <CurrencyField
                    value={item.unit_price}
                    onChange={v => updateItem(item.id, { unit_price: v })}
                    className={`${inputClass} col-span-4`}
                  />
                  <button
                    type="button"
                    onClick={() => setDeleteItemId(item.id)}
                    className="col-span-2 text-xs text-app-muted hover:text-red-400 transition-colors text-right"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-3 flex items-center gap-1.5 text-xs text-app-muted hover:text-app-text border border-dashed border-app-border hover:border-brand-green-deep/50 rounded-xl px-3 py-2 transition-colors w-full justify-center"
            >
              <Plus size={12} />
              Adicionar faixa
            </button>

            {items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-app-border">
                <p className="text-[11px] font-semibold text-app-muted uppercase tracking-wide mb-2">Pré-visualização</p>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => (
                    <span
                      key={item.id}
                      className="text-xs bg-app-surface2 text-app-muted px-2.5 py-1 rounded-lg border border-app-border"
                    >
                      {item.minimum_quantity}{item.maximum_quantity ? `–${item.maximum_quantity}` : '+'} vidas · {fmt(item.unit_price)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTableDialog}
        title={`Excluir tabela "${priceTable.name}"?`}
        description="Todas as faixas de preço desta tabela serão removidas permanentemente."
        variant="danger"
        confirmText="Excluir tabela"
        requireTyping="EXCLUIR"
        loading={deletingTable}
        onConfirm={handleDeleteTable}
        onCancel={() => !deletingTable && setDeleteTableDialog(false)}
      />

      <ConfirmDialog
        open={!!deleteItemId}
        title="Remover faixa de preço?"
        description="Esta faixa será removida da tabela."
        variant="danger"
        confirmText="Remover"
        onConfirm={() => deleteItemId && deleteItem(deleteItemId)}
        onCancel={() => setDeleteItemId(null)}
      />
    </>
  )
}
