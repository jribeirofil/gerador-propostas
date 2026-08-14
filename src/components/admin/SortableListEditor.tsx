'use client'
import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { ProductListItem, SimpleListType } from '@/types/admin'
import { SIMPLE_LIST_TABLES, SIMPLE_LIST_LABELS } from '@/types/admin'

interface Props {
  productId: string
  type: SimpleListType
  initialItems: ProductListItem[]
}

function SortableRow({ item, onEdit, onDelete }: {
  item: ProductListItem
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.title)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function save() {
    if (draft.trim() && draft !== item.title) onEdit(item.id, draft.trim())
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-overlay border border-overlay rounded-lg px-3 py-2"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab active:cursor-grabbing text-app-muted hover:text-app-text px-1"
        aria-label="Arrastar para reordenar"
      >
        ⠿
      </button>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(item.title); setEditing(false) } }}
          className="flex-1 bg-overlay-md border border-fay-green-deep rounded px-2 py-1 text-sm text-app-text focus:outline-none"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className="flex-1 text-sm text-app-text cursor-text"
        >
          {item.title}
        </span>
      )}

      <button
        type="button"
        onClick={() => setDeleteDialog(true)}
        className="text-xs text-app-muted hover:text-red-400 transition-colors px-1.5"
        aria-label="Remover"
      >
        ✕
      </button>

      <ConfirmDialog
        open={deleteDialog}
        title="Remover item?"
        description={`"${item.title}" será removido permanentemente.`}
        variant="danger"
        confirmText="Remover"
        onConfirm={() => { onDelete(item.id); setDeleteDialog(false) }}
        onCancel={() => setDeleteDialog(false)}
      />
    </div>
  )
}

export default function SortableListEditor({ productId, type, initialItems }: Props) {
  const [items, setItems] = useState<ProductListItem[]>(
    [...initialItems].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()
  const table = SIMPLE_LIST_TABLES[type]
  const labels = SIMPLE_LIST_LABELS[type]

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)

    // Persiste a nova ordem no banco
    await Promise.all(
      reordered.map((item, idx) =>
        supabase.from(table).update({ sort_order: idx }).eq('id', item.id)
      )
    )
  }

  async function handleAdd() {
    if (!newTitle.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from(table)
      .insert({ product_id: productId, title: newTitle.trim(), sort_order: items.length })
      .select()
      .single()

    if (!error && data) {
      setItems([...items, data as ProductListItem])
      setNewTitle('')
      showToast(`${labels.singular} adicionado.`)
    }
    setSaving(false)
  }

  async function handleEdit(id: string, title: string) {
    setItems(items.map(i => (i.id === id ? { ...i, title } : i)))
    await supabase.from(table).update({ title }).eq('id', id)
  }

  async function handleDelete(id: string) {
    setItems(items.filter(i => i.id !== id))
    await supabase.from(table).delete().eq('id', id)
    showToast(`${labels.singular} removido.`)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-app-text mb-3">{labels.plural}</h3>

      {items.length === 0 && (
        <p className="text-xs text-app-muted mb-3">Nenhum item ainda. Adicione o primeiro abaixo.</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-3">
            {items.map(item => (
              <SortableRow key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder={`Adicionar ${labels.singular.toLowerCase()}...`}
          className="flex-1 bg-overlay border border-overlay rounded px-3 py-2 text-sm text-app-text placeholder-fay-muted focus:outline-none focus:border-fay-green-deep transition-colors"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving || !newTitle.trim()}
          className="px-3 py-2 bg-overlay-md text-app-text rounded text-sm hover:bg-overlay-lg transition-colors disabled:opacity-40"
        >
          + Adicionar
        </button>
      </div>
    </div>
  )
}
