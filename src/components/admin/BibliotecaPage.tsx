'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, ImageIcon, Layers, LayoutTemplate, Pencil, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import {
  BLOCK_LABELS, LIBRARY_BLOCK_TYPES, SECTION_ORIGINS, ORIGIN_LABELS, ORIGIN_CLASSES, type BlockType,
} from '@/lib/blocks'
import type { Json } from '@/types/database.types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplateItem {
  id: string
  name: string
  description: string | null
  is_default: boolean
  product_slugs: string[]
  blockCount: number
  productNames: string[]
}

interface LibraryItem {
  id: string
  type: string
  title: string
  content: Json
  created_by: string | null
  created_at: string | null
}

interface Props {
  templates: TemplateItem[]
  libraryItems: LibraryItem[]
  userId: string
}

type MainTab = 'templates' | 'blocos' | 'midias'

// ─── Content source legend ────────────────────────────────────────────────────

const ORIGINS_LEGEND = [
  { key: 'proposta',  label: 'Proposta',  cls: 'bg-blue-500/10 text-blue-500' },
  { key: 'variavel',  label: 'Variável',  cls: 'bg-amber-500/10 text-amber-600' },
  { key: 'manual',    label: 'Manual',    cls: 'bg-app-surface2 text-app-muted border border-app-border' },
  { key: 'produto',   label: 'Produto',   cls: 'bg-purple-500/10 text-purple-500' },
  { key: 'empresa',   label: 'Empresa',   cls: 'bg-orange-500/10 text-orange-500' },
  { key: 'usuario',   label: 'Usuário',   cls: 'bg-teal-500/10 text-teal-600' },
] as const

// ─── Templates tab ────────────────────────────────────────────────────────────

function TemplatesTab({ templates }: { templates: TemplateItem[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-app-muted">
            Cada template define a estrutura e a estratégia de apresentação de uma proposta.
          </p>
        </div>
        <Link
          href="/dashboard/admin/templates/novo"
          className="flex items-center gap-1.5 h-9 px-4 bg-fay-green text-fay-dark text-sm font-semibold rounded-xl hover:bg-fay-green-deep hover:text-white transition-colors"
        >
          <Plus size={14} />
          Novo template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
            <LayoutTemplate size={22} className="text-purple-500" />
          </div>
          <p className="text-sm font-medium text-app-text mb-1">Nenhum template criado</p>
          <p className="text-xs text-app-muted mb-5">Templates definem a estratégia de apresentação das propostas.</p>
          <Link
            href="/dashboard/admin/templates/novo"
            className="h-8 px-4 bg-fay-green text-fay-dark text-sm font-semibold rounded-xl hover:bg-fay-green-deep hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={13} /> Criar primeiro template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {templates.map(t => (
            <div
              key={t.id}
              className="bg-app-surface border border-app-border rounded-2xl p-5 flex flex-col gap-4 hover:border-fay-green-deep/40 transition-colors group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-sora font-semibold text-base text-app-text truncate">{t.name}</h3>
                    {t.is_default && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-fay-green-deep bg-fay-green/15 px-2 py-0.5 rounded-full flex-shrink-0">
                        <Star size={9} fill="currentColor" /> Padrão
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-app-muted line-clamp-2">{t.description}</p>
                  )}
                </div>
              </div>

              {/* Section count */}
              <div className="flex items-center gap-4 text-xs text-app-muted">
                <span className="flex items-center gap-1.5">
                  <Layers size={12} />
                  {t.blockCount} {t.blockCount === 1 ? 'seção' : 'seções'}
                </span>
              </div>

              {/* Products */}
              {t.productNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {t.productNames.map(name => (
                    <span key={name} className="text-[11px] bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full font-medium">
                      {name}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto pt-2 border-t border-app-border flex items-center justify-end">
                <Link
                  href={`/dashboard/admin/templates/${t.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-app-muted hover:text-app-text transition-colors group-hover:text-fay-green-deep"
                >
                  <Pencil size={11} />
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Origin legend */}
      <div className="mt-8 pt-6 border-t border-app-border">
        <p className="text-[11px] font-semibold text-app-muted uppercase tracking-widest mb-3">Origens de conteúdo por seção</p>
        <div className="flex flex-wrap gap-2">
          {ORIGINS_LEGEND.map(o => (
            <span key={o.key} className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${o.cls}`}>
              {o.label}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-app-muted mt-3">
          Cada seção de um template recebe conteúdo de uma origem diferente.
          Edite um template para ver e configurar as origens de cada seção.
        </p>
      </div>
    </div>
  )
}

// ─── Library item form ────────────────────────────────────────────────────────

function contentPreview(item: LibraryItem): string {
  const c = item.content as Record<string, unknown>
  if (c.text) return (c.text as string).slice(0, 100)
  if (Array.isArray(c.items)) {
    const items = c.items as unknown[]
    if (items.length === 0) return '(sem itens)'
    const first = items[0]
    if (typeof first === 'string') return items.slice(0, 3).join(' · ')
    if (typeof first === 'object' && first && 'question' in first)
      return (first as { question: string }).question
  }
  return '—'
}

function NewBlockForm({
  type, userId, onCreated,
}: { type: BlockType; userId: string; onCreated: (item: LibraryItem) => void }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([])
  const [newListItem, setNewListItem] = useState('')
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  const isText = ['cenario', 'objetivos', 'sobre'].includes(type)
  const isList = ['proximos_passos', 'diferenciais', 'beneficios', 'escopo'].includes(type)
  const isFaq = type === 'faq'

  const inputCls = 'w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-fay-green-deep transition-colors'

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
      .select().single()
    setSaving(false)
    if (error || !data) { showToast('Erro ao salvar.', 'error'); return }
    onCreated(data as LibraryItem)
    setTitle(''); setText(''); setItems([]); setFaqItems([]); setNewListItem('')
    setOpen(false)
    showToast('Bloco criado na biblioteca.')
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-app-muted border border-app-border rounded-xl hover:text-app-text hover:border-fay-green-deep transition-colors"
      >
        <Plus size={12} /> Novo bloco
      </button>
    )
  }

  return (
    <div className="bg-app-surface border border-fay-green-deep/30 rounded-2xl p-5 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-app-muted uppercase tracking-widest">Novo bloco</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-app-muted hover:text-app-text">Cancelar</button>
      </div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título do bloco (ex: Próximos passos padrão)"
        className={inputCls}
      />
      {isText && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          placeholder="Texto do bloco..."
          className={`${inputCls} resize-none`}
        />
      )}
      {isList && (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                value={item}
                onChange={e => setItems(p => p.map((it, i) => i === idx ? e.target.value : it))}
                className={inputCls}
              />
              <button type="button" onClick={() => setItems(p => p.filter((_, i) => i !== idx))} className="text-app-muted hover:text-red-400 text-xs px-1">✕</button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={newListItem}
              onChange={e => setNewListItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newListItem.trim()) { setItems(p => [...p, newListItem.trim()]); setNewListItem('') } } }}
              placeholder="Adicionar item..."
              className={inputCls}
            />
            <button type="button" onClick={() => { if (newListItem.trim()) { setItems(p => [...p, newListItem.trim()]); setNewListItem('') } }}
              className="text-fay-green-deep text-xs font-medium px-2">+ Add</button>
          </div>
        </div>
      )}
      {isFaq && (
        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div key={idx} className="bg-app-surface2 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-app-muted">Pergunta {idx + 1}</span>
                <button type="button" onClick={() => setFaqItems(p => p.filter((_, i) => i !== idx))} className="text-app-muted hover:text-red-400 text-xs">Remover</button>
              </div>
              <input value={item.question} onChange={e => setFaqItems(p => p.map((it, i) => i === idx ? { ...it, question: e.target.value } : it))}
                placeholder="Pergunta" className={inputCls} />
              <textarea value={item.answer} onChange={e => setFaqItems(p => p.map((it, i) => i === idx ? { ...it, answer: e.target.value } : it))}
                placeholder="Resposta" rows={2} className={`${inputCls} resize-none`} />
            </div>
          ))}
          <button type="button" onClick={() => setFaqItems(p => [...p, { question: '', answer: '' }])}
            className="text-fay-green-deep text-xs font-medium">+ Adicionar pergunta</button>
        </div>
      )}
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving || !title.trim()}
          className="px-4 py-2 bg-fay-green text-fay-dark text-sm font-semibold rounded-xl hover:bg-fay-green-deep hover:text-white transition-colors disabled:opacity-50">
          {saving ? 'Salvando...' : 'Criar bloco'}
        </button>
      </div>
    </div>
  )
}

// ─── Blocos tab ───────────────────────────────────────────────────────────────

function BlocosTab({ initialItems, userId }: { initialItems: LibraryItem[]; userId: string }) {
  const [items, setItems] = useState<LibraryItem[]>(initialItems)
  const [activeType, setActiveType] = useState<BlockType>(LIBRARY_BLOCK_TYPES[0])
  const [deleteTarget, setDeleteTarget] = useState<LibraryItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  const typeItems = items.filter(it => it.type === activeType)
  const origin = SECTION_ORIGINS[activeType]

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('content_library').delete().eq('id', deleteTarget.id)
    if (error) { showToast('Erro ao excluir.', 'error') }
    else { setItems(p => p.filter(it => it.id !== deleteTarget.id)); showToast('Bloco excluído.') }
    setDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <div className="flex gap-6">
      {/* Left: type nav */}
      <div className="w-44 flex-shrink-0">
        <p className="text-[11px] font-semibold text-app-muted uppercase tracking-widest px-2 mb-2">Tipo de bloco</p>
        <div className="space-y-0.5">
          {LIBRARY_BLOCK_TYPES.map(type => {
            const count = items.filter(it => it.type === type).length
            const isActive = activeType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-fay-green/10 text-fay-green-deep font-medium'
                    : 'text-app-muted hover:text-app-text hover:bg-[var(--row-hover)]'
                }`}
              >
                <span>{BLOCK_LABELS[type]}</span>
                {count > 0 && (
                  <span className={`text-[11px] tabular-nums ${isActive ? 'text-fay-green-deep' : 'text-app-muted'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: items */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-app-text">{BLOCK_LABELS[activeType]}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ORIGIN_CLASSES[origin]}`}>
              {ORIGIN_LABELS[origin]}
            </span>
          </div>
          <NewBlockForm
            type={activeType}
            userId={userId}
            onCreated={item => setItems(p => [...p, item])}
          />
        </div>

        {typeItems.length === 0 ? (
          <div className="text-center py-12 text-sm text-app-muted border border-dashed border-app-border rounded-2xl">
            Nenhum bloco criado para {BLOCK_LABELS[activeType].toLowerCase()}.
          </div>
        ) : (
          <div className="space-y-2">
            {typeItems.map(item => (
              <div
                key={item.id}
                className="bg-app-surface border border-app-border rounded-xl px-4 py-3 flex items-start gap-3 hover:bg-[var(--row-hover)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-app-text">{item.title}</p>
                  <p className="text-xs text-app-muted mt-0.5 truncate">{contentPreview(item)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="text-app-muted hover:text-red-400 text-xs transition-colors flex-shrink-0 pt-0.5"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Excluir "${deleteTarget?.title}"?`}
        description="O bloco será removido da biblioteca. Propostas existentes não são afetadas."
        variant="danger"
        confirmText="Excluir"
        requireTyping="EXCLUIR"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── Mídias tab ───────────────────────────────────────────────────────────────

function MidiasTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-app-surface2 border border-app-border flex items-center justify-center mb-5">
        <ImageIcon size={24} className="text-app-muted" />
      </div>
      <p className="font-sora font-semibold text-base text-app-text mb-2">Mídias</p>
      <p className="text-sm text-app-muted max-w-xs">
        Imagens, vídeos e arquivos utilizados nas propostas. Em breve disponível.
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS: { id: MainTab; label: string; icon: React.ElementType }[] = [
  { id: 'templates', label: 'Templates',  icon: LayoutTemplate },
  { id: 'blocos',    label: 'Blocos',     icon: Layers },
  { id: 'midias',    label: 'Mídias',     icon: ImageIcon },
]

export default function BibliotecaPage({ templates, libraryItems, userId }: Props) {
  const [activeTab, setActiveTab] = useState<MainTab>('templates')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-app-border mb-8">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-fay-green-deep text-fay-green-deep'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'templates' && <TemplatesTab templates={templates} />}
      {activeTab === 'blocos'    && <BlocosTab initialItems={libraryItems} userId={userId} />}
      {activeTab === 'midias'    && <MidiasTab />}
    </div>
  )
}
