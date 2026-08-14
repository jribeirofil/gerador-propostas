'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { BLOCK_LABELS, LIBRARY_BLOCK_TYPES, type BlockType } from '@/lib/blocks'
import type { Json } from '@/types/database.types'

interface LibraryItem {
  id: string
  type: string
  title: string
  content: Json
  created_by: string | null
  created_at: string | null
}

interface Props {
  initialItems: LibraryItem[]
  userId: string
}

const TAB_TYPES = LIBRARY_BLOCK_TYPES

function contentPreview(item: LibraryItem): string {
  const content = item.content as Record<string, unknown>
  if (content.text) return (content.text as string).slice(0, 80)
  if (Array.isArray(content.items)) {
    const items = content.items as unknown[]
    if (items.length === 0) return '(sem itens)'
    const first = items[0]
    if (typeof first === 'string') return items.slice(0, 2).join(' · ')
    if (typeof first === 'object' && first && 'question' in first) {
      return (first as { question: string }).question
    }
  }
  return '—'
}

function NewItemForm({
  type, userId, onCreated,
}: {
  type: BlockType
  userId: string
  onCreated: (item: LibraryItem) => void
}) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([])
  const [newListItem, setNewListItem] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  const isText = ['cenario', 'objetivos', 'sobre'].includes(type)
  const isList = ['proximos_passos', 'diferenciais', 'beneficios', 'escopo'].includes(type)
  const isFaq = type === 'faq'

  function buildContent(): Json {
    if (isText) return { text } as unknown as Json
    if (isFaq) return { items: faqItems } as unknown as Json
    return { items } as unknown as Json
  }

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('content_library')
      .insert({ type, title: title.trim(), content: buildContent(), created_by: userId })
      .select()
      .single()
    setSaving(false)
    if (error || !data) { showToast('Erro ao salvar.', 'error'); return }
    onCreated(data as LibraryItem)
    setTitle(''); setText(''); setItems([]); setFaqItems([]); setNewListItem('')
    showToast('Item criado na biblioteca.')
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl p-5 space-y-3 mb-6 shadow-sm">
      <p className="text-xs text-app-muted font-medium uppercase tracking-wider">Novo item</p>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título (ex: Cenário padrão canal de denúncias)"
        className="w-full bg-overlay border border-overlay rounded-lg px-3 py-2 text-sm text-app-text placeholder-fay-muted focus:outline-none focus:border-fay-green-deep transition-colors"
      />
      {isText && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          placeholder="Texto do bloco..."
          className="w-full bg-overlay border border-overlay rounded-lg px-3 py-2 text-sm text-app-text placeholder-fay-muted resize-none focus:outline-none focus:border-fay-green-deep transition-colors"
        />
      )}
      {isList && (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input value={item} onChange={e => setItems(prev => prev.map((it, i) => i === idx ? e.target.value : it))}
                className="flex-1 bg-overlay border border-overlay rounded-lg px-2.5 py-1.5 text-sm text-app-text focus:outline-none focus:border-fay-green-deep" />
              <button type="button" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                className="text-app-muted hover:text-red-400 text-xs">✕</button>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={newListItem} onChange={e => setNewListItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newListItem.trim()) { setItems(p => [...p, newListItem.trim()]); setNewListItem('') } } }}
              placeholder="Adicionar item..."
              className="flex-1 bg-overlay border border-overlay rounded-lg px-2.5 py-1.5 text-sm text-app-text placeholder-fay-muted focus:outline-none focus:border-fay-green-deep" />
            <button type="button" onClick={() => { if (newListItem.trim()) { setItems(p => [...p, newListItem.trim()]); setNewListItem('') } }}
              className="text-fay-green-deep text-xs">+ Add</button>
          </div>
        </div>
      )}
      {isFaq && (
        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div key={idx} className="bg-overlay rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-app-muted">Pergunta {idx + 1}</span>
                <button type="button" onClick={() => setFaqItems(p => p.filter((_, i) => i !== idx))}
                  className="text-app-muted hover:text-red-400 text-xs">Remover</button>
              </div>
              <input value={item.question} onChange={e => setFaqItems(p => p.map((it, i) => i === idx ? { ...it, question: e.target.value } : it))}
                placeholder="Pergunta" className="w-full bg-overlay border border-overlay rounded px-2.5 py-1.5 text-sm text-app-text focus:outline-none" />
              <textarea value={item.answer} onChange={e => setFaqItems(p => p.map((it, i) => i === idx ? { ...it, answer: e.target.value } : it))}
                placeholder="Resposta" rows={2} className="w-full bg-overlay border border-overlay rounded px-2.5 py-1.5 text-sm text-app-text resize-none focus:outline-none" />
            </div>
          ))}
          <button type="button" onClick={() => setFaqItems(p => [...p, { question: '', answer: '' }])}
            className="text-fay-green-deep text-xs">+ Adicionar pergunta</button>
        </div>
      )}
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving || !title.trim()}
          className="px-4 py-2 bg-fay-green text-fay-dark text-sm font-semibold rounded-lg hover:bg-fay-green-deep hover:text-white transition-colors disabled:opacity-50">
          {saving ? 'Salvando...' : 'Criar item'}
        </button>
      </div>
    </div>
  )
}

export default function ContentLibraryManager({ initialItems, userId }: Props) {
  const [items, setItems] = useState<LibraryItem[]>(initialItems)
  const [activeTab, setActiveTab] = useState<BlockType>('cenario')
  const [deleteTarget, setDeleteTarget] = useState<LibraryItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  const tabItems = items.filter(it => it.type === activeTab)

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('content_library').delete().eq('id', deleteTarget.id)
    if (error) { showToast('Erro ao excluir.', 'error') }
    else {
      setItems(prev => prev.filter(it => it.id !== deleteTarget.id))
      showToast('Item excluído.')
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 flex-wrap mb-6">
        {TAB_TYPES.map(type => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveTab(type)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              activeTab === type
                ? 'bg-fay-green text-fay-dark font-semibold'
                : 'bg-overlay text-app-muted hover:text-app-text'
            }`}
          >
            {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>

      <NewItemForm type={activeTab} userId={userId} onCreated={item => setItems(prev => [...prev, item])} />

      {/* Items list */}
      {tabItems.length === 0 ? (
        <p className="text-sm text-app-muted text-center py-8">Nenhum item criado para este tipo.</p>
      ) : (
        <div className="space-y-3">
          {tabItems.map(item => (
            <div key={item.id} className="bg-app-surface border border-app-border rounded-xl p-4 shadow-sm hover:bg-[var(--row-hover)] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-app-text">{item.title}</p>
                  <p className="text-xs text-app-muted mt-1 truncate">{contentPreview(item)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="text-app-muted hover:text-red-400 text-xs transition-colors flex-shrink-0"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Excluir "${deleteTarget?.title}"?`}
        description="O item será removido da biblioteca. Propostas existentes não são afetadas."
        variant="danger"
        confirmText="Excluir"
        requireTyping="EXCLUIR"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </>
  )
}
