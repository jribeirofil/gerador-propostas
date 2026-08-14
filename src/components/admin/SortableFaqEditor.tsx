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
import type { ProductFaqItem } from '@/types/admin'

interface Props {
  productId: string
  initialItems: ProductFaqItem[]
}

function SortableFaqRow({ item, onEdit, onDelete }: {
  item: ProductFaqItem
  onEdit: (id: string, question: string, answer: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [editing, setEditing] = useState(false)
  const [q, setQ] = useState(item.question)
  const [a, setA] = useState(item.answer)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function save() {
    if (q.trim() && a.trim() && (q !== item.question || a !== item.answer)) {
      onEdit(item.id, q.trim(), a.trim())
    }
    setEditing(false)
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-overlay border border-overlay rounded-lg px-3 py-2.5">
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="cursor-grab active:cursor-grabbing text-app-muted hover:text-app-text px-1 mt-0.5"
          aria-label="Arrastar para reordenar"
        >
          ⠿
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Pergunta"
                className="w-full bg-overlay-md border border-brand-green-deep rounded px-2 py-1 text-sm text-app-text focus:outline-none"
              />
              <textarea
                value={a}
                onChange={e => setA(e.target.value)}
                placeholder="Resposta"
                className="w-full bg-overlay-md border border-brand-green-deep rounded px-2 py-1 text-sm text-app-text focus:outline-none resize-y min-h-16"
              />
              <div className="flex gap-2">
                <button type="button" onClick={save} className="text-xs px-2.5 py-1 bg-brand-green text-brand-dark rounded font-medium">Salvar</button>
                <button type="button" onClick={() => { setQ(item.question); setA(item.answer); setEditing(false) }} className="text-xs px-2.5 py-1 text-app-muted hover:text-app-text">Cancelar</button>
              </div>
            </div>
          ) : (
            <div onClick={() => setEditing(true)} className="cursor-text">
              <p className="text-sm font-medium text-app-text">{item.question}</p>
              <p className="text-xs text-app-muted mt-1 leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>

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
          title="Remover pergunta?"
          description={`"${item.question}" será removida permanentemente.`}
          variant="danger"
          confirmText="Remover"
          onConfirm={() => { onDelete(item.id); setDeleteDialog(false) }}
          onCancel={() => setDeleteDialog(false)}
        />
      </div>
    </div>
  )
}

export default function SortableFaqEditor({ productId, initialItems }: Props) {
  const [items, setItems] = useState<ProductFaqItem[]>(
    [...initialItems].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)

    await Promise.all(
      reordered.map((item, idx) =>
        supabase.from('product_faq').update({ sort_order: idx }).eq('id', item.id)
      )
    )
  }

  async function handleAdd() {
    if (!newQ.trim() || !newA.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('product_faq')
      .insert({ product_id: productId, question: newQ.trim(), answer: newA.trim(), sort_order: items.length })
      .select()
      .single()

    if (!error && data) {
      setItems([...items, data as ProductFaqItem])
      setNewQ('')
      setNewA('')
      setAdding(false)
      showToast('Pergunta adicionada.')
    }
    setSaving(false)
  }

  async function handleEdit(id: string, question: string, answer: string) {
    setItems(items.map(i => (i.id === id ? { ...i, question, answer } : i)))
    await supabase.from('product_faq').update({ question, answer }).eq('id', id)
  }

  async function handleDelete(id: string) {
    setItems(items.filter(i => i.id !== id))
    await supabase.from('product_faq').delete().eq('id', id)
    showToast('Pergunta removida.')
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-app-text mb-3">FAQ</h3>

      {items.length === 0 && !adding && (
        <p className="text-xs text-app-muted mb-3">Nenhuma pergunta ainda. Adicione a primeira abaixo.</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-3">
            {items.map(item => (
              <SortableFaqRow key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {adding ? (
        <div className="bg-overlay border border-brand-green-deep rounded-lg px-3 py-2.5 space-y-2">
          <input
            autoFocus
            value={newQ}
            onChange={e => setNewQ(e.target.value)}
            placeholder="Pergunta"
            className="w-full bg-overlay-md border border-overlay rounded px-2 py-1.5 text-sm text-app-text placeholder-brand-muted focus:outline-none focus:border-brand-green-deep"
          />
          <textarea
            value={newA}
            onChange={e => setNewA(e.target.value)}
            placeholder="Resposta"
            className="w-full bg-overlay-md border border-overlay rounded px-2 py-1.5 text-sm text-app-text placeholder-brand-muted focus:outline-none focus:border-brand-green-deep resize-y min-h-16"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="text-xs px-3 py-1.5 bg-brand-green text-brand-dark rounded font-semibold disabled:opacity-50"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewQ(''); setNewA('') }}
              className="text-xs px-3 py-1.5 text-app-muted hover:text-app-text"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full px-3 py-2 bg-overlay border border-dashed border-overlay text-app-muted hover:text-app-text hover:border-overlay-md rounded-lg text-sm transition-colors"
        >
          + Adicionar pergunta
        </button>
      )}
    </div>
  )
}
