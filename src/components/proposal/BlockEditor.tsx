'use client'
import { useState, useCallback, useEffect } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import {
  REQUIRED_BLOCKS, BLOCK_LABELS, AUTO_RENDER_BLOCKS, AI_BLOCK_TYPES, LIBRARY_BLOCK_TYPES,
  type ProposalBlock, type BlockType, type FaqItem,
} from '@/lib/blocks'
import type { Json } from '@/types/database.types'

interface LibraryItem {
  id: string
  type: string
  title: string
  content: Json
}

interface SignerData {
  name: string
  job_title: string
  email: string
  phone: string
}

interface Props {
  proposalId: string
  initialBlocks: ProposalBlock[]
  signerData: SignerData
}

// ─── Content editor sub-components ───────────────────────────────────────────

function TextEditor({
  block, onSave, saving,
}: {
  block: ProposalBlock
  onSave: (id: string, content: Json) => Promise<void>
  saving: boolean
}) {
  const content = block.content_json as { text?: string }
  const [text, setText] = useState(content.text || '')

  useEffect(() => {
    setText((block.content_json as { text?: string }).text || '')
  }, [block.content_json])
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiMenu, setShowAiMenu] = useState(false)
  const proposalId = block.proposal_id
  const isAI = AI_BLOCK_TYPES.includes(block.type as BlockType)

  async function runAI(operation: 'improve' | 'rewrite' | 'expand') {
    if (!text.trim()) return
    setAiLoading(true)
    setShowAiMenu(false)
    try {
      const res = await fetch(`/api/proposals/${proposalId}/blocks/${block.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, content: text, blockType: block.type }),
      })
      const data = await res.json()
      if (data.result) setText(data.result)
    } catch {}
    setAiLoading(false)
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={5}
        className="w-full bg-overlay border border-overlay rounded-lg px-3 py-2.5 text-sm text-app-text placeholder-brand-muted resize-none focus:outline-none focus:border-brand-green-deep transition-colors"
        placeholder={`Texto do bloco ${BLOCK_LABELS[block.type]}...`}
      />
      <div className="flex items-center justify-between">
        {isAI ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAiMenu(v => !v)}
              disabled={aiLoading || !text.trim()}
              className="text-xs text-brand-green-deep hover:underline disabled:opacity-40"
            >
              {aiLoading ? '✨ Processando...' : '✨ IA'}
            </button>
            {showAiMenu && (
              <div className="absolute bottom-full left-0 mb-1 bg-app-surface border border-overlay rounded-lg overflow-hidden shadow-xl z-10 w-36">
                {(['improve', 'rewrite', 'expand'] as const).map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => runAI(op)}
                    className="w-full text-left px-3 py-2 text-xs text-app-muted hover:text-app-text hover:bg-overlay transition-colors"
                  >
                    {op === 'improve' ? 'Melhorar texto' : op === 'rewrite' ? 'Reescrever' : 'Expandir'}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : <span />}
        <button
          type="button"
          onClick={() => onSave(block.id, { text } as unknown as Json)}
          disabled={saving}
          className="px-3 py-1.5 bg-brand-green text-brand-dark text-xs font-semibold rounded-lg hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function ListEditor({
  block, onSave, saving,
}: {
  block: ProposalBlock
  onSave: (id: string, content: Json) => Promise<void>
  saving: boolean
}) {
  const content = block.content_json as { items?: string[] }
  const [items, setItems] = useState<string[]>(content.items || [])
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    setItems((block.content_json as { items?: string[] }).items || [])
  }, [block.content_json])

  function addItem() {
    if (!newItem.trim()) return
    setItems(prev => [...prev, newItem.trim()])
    setNewItem('')
  }

  return (
    <div className="mt-3 space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            value={item}
            onChange={e => setItems(prev => prev.map((it, i) => i === idx ? e.target.value : it))}
            className="flex-1 bg-overlay border border-overlay rounded-lg px-2.5 py-1.5 text-sm text-app-text focus:outline-none focus:border-brand-green-deep transition-colors"
          />
          <button
            type="button"
            onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
            className="text-app-muted hover:text-red-400 text-xs transition-colors px-1"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
          placeholder="Adicionar item..."
          className="flex-1 bg-overlay border border-overlay rounded-lg px-2.5 py-1.5 text-sm text-app-text placeholder-brand-muted focus:outline-none focus:border-brand-green-deep transition-colors"
        />
        <button
          type="button"
          onClick={addItem}
          className="text-brand-green-deep text-xs font-medium hover:underline"
        >
          + Adicionar
        </button>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSave(block.id, { items } as unknown as Json)}
          disabled={saving}
          className="px-3 py-1.5 bg-brand-green text-brand-dark text-xs font-semibold rounded-lg hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function FaqEditor({
  block, onSave, saving,
}: {
  block: ProposalBlock
  onSave: (id: string, content: Json) => Promise<void>
  saving: boolean
}) {
  const content = block.content_json as { items?: FaqItem[] }
  const [items, setItems] = useState<FaqItem[]>(content.items || [])

  useEffect(() => {
    setItems((block.content_json as { items?: FaqItem[] }).items || [])
  }, [block.content_json])

  return (
    <div className="mt-3 space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="bg-overlay rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-app-muted font-medium">Pergunta {idx + 1}</span>
            <button
              type="button"
              onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
              className="text-app-muted hover:text-red-400 text-xs transition-colors"
            >
              Remover
            </button>
          </div>
          <input
            value={item.question}
            onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, question: e.target.value } : it))}
            placeholder="Pergunta"
            className="w-full bg-overlay border border-overlay rounded px-2.5 py-1.5 text-sm text-app-text focus:outline-none focus:border-brand-green-deep transition-colors"
          />
          <textarea
            value={item.answer}
            onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, answer: e.target.value } : it))}
            placeholder="Resposta"
            rows={2}
            className="w-full bg-overlay border border-overlay rounded px-2.5 py-1.5 text-sm text-app-text resize-none focus:outline-none focus:border-brand-green-deep transition-colors"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems(prev => [...prev, { question: '', answer: '' }])}
        className="text-brand-green-deep text-xs font-medium hover:underline"
      >
        + Adicionar pergunta
      </button>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSave(block.id, { items } as unknown as Json)}
          disabled={saving}
          className="px-3 py-1.5 bg-brand-green text-brand-dark text-xs font-semibold rounded-lg hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function ContentEditor({
  block, onSave, saving,
}: {
  block: ProposalBlock
  onSave: (id: string, content: Json) => Promise<void>
  saving: boolean
}) {
  const type = block.type as BlockType
  if (AUTO_RENDER_BLOCKS.includes(type)) {
    return (
      <div className="mt-3 px-3 py-2.5 bg-overlay rounded-lg text-xs text-app-muted">
        Este bloco é gerado automaticamente a partir dos dados da proposta.
      </div>
    )
  }
  if (type === 'faq') return <FaqEditor block={block} onSave={onSave} saving={saving} />
  if (['proximos_passos', 'beneficios', 'escopo', 'diferenciais'].includes(type)) {
    return <ListEditor block={block} onSave={onSave} saving={saving} />
  }
  return <TextEditor block={block} onSave={onSave} saving={saving} />
}

// ─── Sortable row ─────────────────────────────────────────────────────────────

function BlockRow({
  block, expanded, onToggleExpand, onToggleEnabled, onSave, onOpenLibrary, saving,
}: {
  block: ProposalBlock
  expanded: boolean
  onToggleExpand: (id: string) => void
  onToggleEnabled: (id: string) => void
  onSave: (id: string, content: Json) => Promise<void>
  onOpenLibrary: (blockId: string, type: BlockType) => void
  saving: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const type = block.type as BlockType
  const isRequired = REQUIRED_BLOCKS.includes(type)
  const isAuto = AUTO_RENDER_BLOCKS.includes(type)
  const hasAI = AI_BLOCK_TYPES.includes(type)
  const hasLibrary = LIBRARY_BLOCK_TYPES.includes(type)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-overlay border border-overlay rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-app-muted hover:text-app-text cursor-grab active:cursor-grabbing transition-colors flex-shrink-0"
          tabIndex={-1}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
            <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
            <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
          </svg>
        </button>

        {/* Label */}
        <span className="flex-1 text-sm font-medium text-app-text">
          {block.title || BLOCK_LABELS[type]}
        </span>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {isRequired && (
            <span className="text-[10px] text-app-muted bg-overlay px-1.5 py-0.5 rounded">obrigatório</span>
          )}
          {isAuto && (
            <span className="text-[10px] text-app-muted bg-overlay px-1.5 py-0.5 rounded">auto</span>
          )}
          {hasAI && (
            <span className="text-[10px] text-brand-green-deep bg-brand-green/10 px-1.5 py-0.5 rounded">✨ IA</span>
          )}
        </div>

        {/* Toggle enable */}
        <button
          type="button"
          onClick={() => onToggleEnabled(block.id)}
          disabled={isRequired}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            block.enabled ? 'bg-brand-green' : 'bg-overlay-md'
          } ${isRequired ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              block.enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>

        {/* Expand/collapse */}
        <button
          type="button"
          onClick={() => onToggleExpand(block.id)}
          className="text-app-muted hover:text-app-text text-xs transition-colors ml-1"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-overlay">
          {hasLibrary && (
            <button
              type="button"
              onClick={() => onOpenLibrary(block.id, type)}
              className="mt-3 text-xs text-app-muted hover:text-brand-green-deep transition-colors"
            >
              📚 Buscar da biblioteca
            </button>
          )}
          <ContentEditor block={block} onSave={onSave} saving={saving} />
        </div>
      )}
    </div>
  )
}

// ─── Library picker modal ─────────────────────────────────────────────────────

function LibraryPickerModal({
  type, onPick, onClose,
}: {
  type: BlockType
  onPick: (content: Json) => void
  onClose: () => void
}) {
  const [items, setItems] = useState<LibraryItem[] | null>(null)
  const supabase = createClient()

  useState(() => {
    supabase
      .from('content_library')
      .select('id, type, title, content')
      .eq('type', type)
      .order('title')
      .then(({ data }) => setItems(data || []))
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-app-surface border border-overlay rounded-xl p-6 shadow-2xl max-h-[70vh] flex flex-col">
        <h3 className="text-sm font-semibold text-app-text mb-4">Biblioteca — {BLOCK_LABELS[type]}</h3>
        <div className="flex-1 overflow-y-auto space-y-2">
          {items === null && <p className="text-xs text-app-muted text-center py-4">Carregando...</p>}
          {items?.length === 0 && (
            <p className="text-xs text-app-muted text-center py-4">
              Nenhum item na biblioteca para este tipo.{' '}
              <a href="/dashboard/admin/conteudo" className="text-brand-green-deep hover:underline">Criar itens</a>
            </p>
          )}
          {items?.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => { onPick(item.content); onClose() }}
              className="w-full text-left bg-overlay hover:bg-overlay-md border border-overlay rounded-lg p-3 transition-colors"
            >
              <p className="text-sm text-app-text font-medium">{item.title}</p>
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-4 text-xs text-app-muted hover:text-app-text transition-colors self-end">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export default function BlockEditor({ proposalId, initialBlocks, signerData }: Props) {
  const [blocks, setBlocks] = useState<ProposalBlock[]>(initialBlocks)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [libraryPicker, setLibraryPicker] = useState<{ blockId: string; type: BlockType } | null>(null)

  const supabase = createClient()
  const { showToast } = useToast()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = blocks.findIndex(b => b.id === active.id)
    const newIndex = blocks.findIndex(b => b.id === over.id)
    const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, sort_order: i }))
    setBlocks(newBlocks)

    await Promise.all(
      newBlocks.map(b =>
        supabase.from('proposal_block').update({ sort_order: b.sort_order }).eq('id', b.id)
      )
    )
  }

  async function handleToggleEnabled(blockId: string) {
    const block = blocks.find(b => b.id === blockId)
    if (!block || REQUIRED_BLOCKS.includes(block.type as BlockType)) return
    const newEnabled = !block.enabled
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, enabled: newEnabled } : b))
    await supabase.from('proposal_block').update({ enabled: newEnabled }).eq('id', blockId)
    showToast(newEnabled ? 'Bloco ativado.' : 'Bloco desativado.')
  }

  const handleSave = useCallback(async (blockId: string, content: Json) => {
    setSavingIds(prev => new Set([...prev, blockId]))
    const { error } = await supabase
      .from('proposal_block')
      .update({ content_json: content })
      .eq('id', blockId)
    setSavingIds(prev => { const s = new Set(prev); s.delete(blockId); return s })
    if (error) showToast('Erro ao salvar bloco.', 'error')
    else {
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content_json: content } : b))
      showToast('Bloco salvo.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  const activeCount = blocks.filter(b => b.enabled).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-app-muted">{activeCount} de {blocks.length} blocos ativos</p>
        <a
          href={`/dashboard/propostas/${proposalId}/preview`}
          className="text-xs text-brand-green-deep hover:underline"
        >
          Prévia web →
        </a>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {blocks.map(block => (
              <BlockRow
                key={block.id}
                block={block}
                expanded={expandedId === block.id}
                onToggleExpand={toggleExpand}
                onToggleEnabled={handleToggleEnabled}
                onSave={handleSave}
                onOpenLibrary={(id, type) => setLibraryPicker({ blockId: id, type })}
                saving={savingIds.has(block.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {libraryPicker && (
        <LibraryPickerModal
          type={libraryPicker.type}
          onPick={content => handleSave(libraryPicker.blockId, content)}
          onClose={() => setLibraryPicker(null)}
        />
      )}

      {/* Assinatura preview */}
      <div className="mt-6 bg-overlay border border-overlay rounded-xl p-4">
        <p className="text-xs text-app-muted mb-3 uppercase tracking-wider">Assinatura (dados do usuário logado)</p>
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <span className="text-app-muted">Nome</span>
          <span className="text-app-text">{signerData.name || '—'}</span>
          <span className="text-app-muted">Cargo</span>
          <span className="text-app-text">{signerData.job_title || '—'}</span>
          <span className="text-app-muted">E-mail</span>
          <span className="text-app-text">{signerData.email || '—'}</span>
          <span className="text-app-muted">Telefone</span>
          <span className="text-app-text">{signerData.phone || '—'}</span>
        </div>
        <p className="text-xs text-app-muted mt-2">
          Para atualizar, vá em <a href="/dashboard/admin/usuarios" className="text-brand-green-deep hover:underline">Administração → Usuários</a>.
        </p>
      </div>
    </div>
  )
}
