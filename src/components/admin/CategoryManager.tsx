'use client'
import { useState } from 'react'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { CATEGORY_COLOR_OPTIONS, type Category } from '@/types/admin'

interface Props {
  initialCategories: Category[]
  productCounts?: Record<string, number>
}

const labelClass = 'block text-xs font-medium text-app-muted mb-1.5'
const inputClass = 'w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-text focus:outline-none focus:border-fay-green-deep transition-colors'

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {CATEGORY_COLOR_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          title={opt.label}
          onClick={() => onChange(opt.value)}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${opt.dot} ${
            value === opt.value ? 'ring-2 ring-offset-2 ring-app-border scale-110' : ''
          }`}
        >
          {value === opt.value && <Check size={11} className="text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}

function CategoryBadge({ category }: { category: Category }) {
  const colorOpt = CATEGORY_COLOR_OPTIONS.find(c => c.value === category.color)
  const classes = colorOpt?.classes ?? 'bg-app-surface2 text-app-muted'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${classes}`}>
      {category.name}
    </span>
  )
}

export default function CategoryManager({ initialCategories, productCounts = {} }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('blue')

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { showToast } = useToast()

  function startCreate() {
    setEditingId(null)
    setEditName('')
    setEditColor('blue')
    setIsCreating(true)
  }

  function startEdit(cat: Category) {
    setIsCreating(false)
    setEditName(cat.name)
    setEditColor(cat.color)
    setEditingId(cat.id)
  }

  function cancelEdit() {
    setEditingId(null)
    setIsCreating(false)
  }

  async function handleCreate() {
    if (!editName.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { showToast(data.error || 'Erro ao criar.', 'error'); return }
    setCategories(prev => [...prev, data as Category])
    setIsCreating(false)
    showToast('Categoria criada.')
  }

  async function handleUpdate() {
    if (!editingId || !editName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/admin/categories/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { showToast(data.error || 'Erro ao salvar.', 'error'); return }
    setCategories(prev => prev.map(c => c.id === editingId ? data as Category : c))
    setEditingId(null)
    showToast('Categoria atualizada.')
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (!res.ok) {
      showToast('Não foi possível excluir esta categoria.', 'error')
      return
    }
    setCategories(prev => prev.filter(c => c.id !== id))
    showToast('Categoria excluída.')
  }

  return (
    <div className="space-y-4">
      {/* Create form */}
      {isCreating && (
        <div className="bg-app-surface2 border border-app-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-app-text mb-4">Nova categoria</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Nome *</label>
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') cancelEdit() }}
                placeholder="Ex: Bem-estar"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cor</label>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!editName.trim() || saving}
              className="px-4 py-2 bg-fay-green text-fay-dark text-sm font-semibold rounded-lg hover:bg-fay-green-deep hover:text-white transition-colors disabled:opacity-40"
            >
              {saving ? 'Salvando...' : 'Criar categoria'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-3 py-2 text-sm text-app-muted hover:text-app-text transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Category list */}
      {categories.length === 0 && !isCreating ? (
        <div className="bg-app-surface border border-app-border rounded-2xl p-12 text-center shadow-sm">
          <p className="text-sm text-app-muted">Nenhuma categoria criada ainda.</p>
        </div>
      ) : (
        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">
          <ul className="divide-y divide-app-border">
            {categories.map(cat => (
              <li key={cat.id}>
                {editingId === cat.id ? (
                  /* Inline edit form */
                  <div className="px-5 py-4 bg-app-surface2">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className={labelClass}>Nome *</label>
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') cancelEdit() }}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Cor</label>
                        <ColorPicker value={editColor} onChange={setEditColor} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleUpdate}
                        disabled={!editName.trim() || saving}
                        className="px-4 py-1.5 bg-fay-green text-fay-dark text-sm font-semibold rounded-lg hover:bg-fay-green-deep hover:text-white transition-colors disabled:opacity-40"
                      >
                        {saving ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-sm text-app-muted hover:text-app-text transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal row */
                  <div className="flex items-center gap-4 px-5 py-3.5 group hover:bg-[var(--row-hover)] transition-colors">
                    <CategoryBadge category={cat} />
                    <span className="flex-1 text-sm text-app-text font-medium">{cat.name}</span>
                    <span className="text-xs text-app-muted tabular-nums">
                      {productCounts[cat.slug] ?? 0} produto{(productCounts[cat.slug] ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => startEdit(cat)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="Excluir"
                        disabled={deletingId === cat.id}
                        onClick={() => handleDelete(cat.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-app-muted hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                      >
                        {deletingId === cat.id ? <X size={14} /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add button */}
      {!isCreating && (
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm text-app-muted border border-dashed border-app-border rounded-xl hover:text-app-text hover:border-fay-green-deep/50 transition-colors"
        >
          <Plus size={14} />
          Nova categoria
        </button>
      )}
    </div>
  )
}
