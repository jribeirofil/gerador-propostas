'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  BLOCK_LABELS, REQUIRED_BLOCKS, DEFAULT_BLOCK_ORDER, type BlockType,
} from '@/lib/blocks'
import type { Json } from '@/types/database.types'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'

type EditorTab = 'geral' | 'estrutura' | 'conteudo'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type AiOp = 'improve' | 'rewrite' | 'expand'

const CONTENT_TYPES: BlockType[] = ['proximos_passos']
const LIST_TYPES: BlockType[] = ['proximos_passos']

const CONTENT_HINTS: Partial<Record<BlockType, string>> = {
  proximos_passos: 'Um passo por linha. Esses são os passos padrão após a aprovação.',
}

interface StructureBlock {
  type: BlockType
  sort_order: number
  enabled: boolean
}

interface TemplateData {
  id: string
  name: string
  description: string | null
  is_default: boolean
  product_slugs: string[]
  cover_image_url: string | null
  cover_video_url: string | null
}

interface ProductOption {
  id: string
  name: string
  slug: string
}

interface ContentBlockData {
  type: BlockType
  value: string
}

interface Props {
  template: TemplateData
  initialBlocks: Array<{ type: string; sort_order: number; enabled: boolean; default_content: Json }>
  allProducts: ProductOption[]
  organizationId?: string | null
  totalTemplates: number
}

// --- Sortable block item for Estrutura tab ---
function SortableBlockItem({
  block,
  onToggle,
}: {
  block: StructureBlock
  onToggle: (type: BlockType) => void
}) {
  const isRequired = REQUIRED_BLOCKS.includes(block.type)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.type })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-app-surface border border-app-border rounded-xl px-4 py-3"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="text-app-muted hover:text-app-text cursor-grab active:cursor-grabbing transition-colors touch-none"
        {...attributes}
        {...listeners}
      >
        ☰
      </button>

      {/* Block name */}
      <span className={`flex-1 text-sm ${block.enabled ? 'text-app-text' : 'text-app-muted'}`}>
        {BLOCK_LABELS[block.type]}
      </span>

      {/* Required badge or toggle */}
      {isRequired ? (
        <span className="text-[11px] text-app-muted bg-app-surface border border-app-border px-2 py-0.5 rounded-full">
          Obrigatório
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onToggle(block.type)}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            block.enabled ? 'bg-brand-green' : 'bg-overlay-md'
          }`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            block.enabled ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </button>
      )}
    </div>
  )
}

// --- Content card for Conteúdo padrão tab ---
function ContentCard({
  templateId,
  block,
}: {
  templateId: string
  block: ContentBlockData
}) {
  const isList = LIST_TYPES.includes(block.type)
  const [value, setValue] = useState(block.value)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiMenu, setShowAiMenu] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const persist = useCallback(async (val: string) => {
    setStatus('saving')
    const default_content = isList
      ? { items: val.split('\n').filter(s => s.trim()) }
      : { text: val }

    const res = await fetch(`/api/templates/${templateId}/blocks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: block.type, default_content }),
    })
    setStatus(res.ok ? 'saved' : 'error')
    if (res.ok) setTimeout(() => setStatus('idle'), 3000)
  }, [templateId, block.type, isList])

  function handleChange(val: string) {
    setValue(val)
    setStatus('idle')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => persist(val), 1500)
  }

  async function runAI(operation: AiOp) {
    if (!value.trim()) return
    setAiLoading(true)
    setShowAiMenu(false)
    const res = await fetch('/api/ai/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: value, operation, blockType: block.type }),
    })
    if (res.ok) {
      const { result } = await res.json()
      if (result) handleChange(result)
    }
    setAiLoading(false)
  }

  return (
    <div className="rounded-2xl border border-app-border overflow-hidden bg-app-surface shadow-sm">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-app-text">{BLOCK_LABELS[block.type]}</h3>
          {CONTENT_HINTS[block.type] && (
            <p className="text-xs text-app-muted mt-1">{CONTENT_HINTS[block.type]}</p>
          )}
        </div>
        <span className={`text-[11px] shrink-0 mt-0.5 transition-opacity ${
          status === 'idle' ? 'opacity-0' : 'opacity-100'
        } ${
          status === 'saving' ? 'text-app-muted' :
          status === 'saved'  ? 'text-brand-green-deep' : 'text-red-400'
        }`}>
          {status === 'saving' ? 'Salvando...' : status === 'saved' ? 'Salvo ✓' : status === 'error' ? 'Erro' : ''}
        </span>
      </div>

      <div className="border-t border-app-border" />

      <textarea
        value={value}
        onChange={e => handleChange(e.target.value)}
        rows={isList ? 6 : 5}
        placeholder={isList ? 'Um passo por linha...' : 'Texto padrão para este bloco...'}
        className="w-full bg-transparent px-5 py-4 text-sm text-app-text placeholder-app-muted resize-none focus:outline-none leading-relaxed block"
      />

      <div className="relative border-t border-app-border px-5 py-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowAiMenu(v => !v)}
          disabled={aiLoading || !value.trim()}
          className="text-[11px] text-app-muted hover:text-brand-green-deep transition-colors disabled:opacity-30"
        >
          {aiLoading ? '✨ Processando...' : '✨ Melhorar com IA'}
        </button>
        {showAiMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowAiMenu(false)} />
            <div className="absolute bottom-full right-5 mb-1.5 bg-app-surface border border-app-border rounded-xl overflow-hidden shadow-card-md z-20 min-w-[148px]">
              {(['improve', 'rewrite', 'expand'] as AiOp[]).map(op => (
                <button
                  key={op}
                  type="button"
                  onClick={() => runAI(op)}
                  className="w-full text-left px-4 py-2.5 text-xs text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
                >
                  {op === 'improve' ? 'Melhorar texto' : op === 'rewrite' ? 'Reescrever' : 'Expandir'}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// --- Main TemplateEditor ---
export default function TemplateEditor({ template, initialBlocks, allProducts, totalTemplates, organizationId }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<EditorTab>('geral')

  // Geral tab state
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description || '')
  const [isDefault, setIsDefault] = useState(template.is_default)
  const [productSlugs, setProductSlugs] = useState<string[]>(template.product_slugs)
  const [generalSaving, setGeneralSaving] = useState(false)
  const [showDefaultConfirm, setShowDefaultConfirm] = useState(false)

  // Cover assets state
  const [coverImageUrl, setCoverImageUrl] = useState(template.cover_image_url || '')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [coverVideoUrl, setCoverVideoUrl] = useState(template.cover_video_url || '')
  const [uploadingVideo, setUploadingVideo] = useState(false)

  // Styles state
  const [defaultFont, setDefaultFont] = useState(template.default_font || 'Inter')
  const [baseFontSize, setBaseFontSize] = useState(template.base_font_size || 13)
  const [customCss, setCustomCss] = useState(template.custom_css || '')

  const isOnlyTemplate = totalTemplates <= 1
  // Needs confirmation when setting as default and another template currently holds it
  const willReplaceDefault = isDefault && !template.is_default && totalTemplates > 1

  // Estrutura tab state
  const buildStructure = (src: typeof initialBlocks): StructureBlock[] => {
    const fromSource = src
      .filter(b => DEFAULT_BLOCK_ORDER.includes(b.type as BlockType))
      .map(b => ({
        type: b.type as BlockType,
        sort_order: b.sort_order,
        enabled: b.enabled,
      }))
    // Ensure all structure block types are present
    const existing = new Set(fromSource.map(b => b.type))
    const missing = DEFAULT_BLOCK_ORDER.filter(t => !existing.has(t)).map((t, i) => ({
      type: t,
      sort_order: fromSource.length + i,
      enabled: true,
    }))
    return [...fromSource, ...missing].sort((a, b) => a.sort_order - b.sort_order)
  }

  const [blocks, setBlocks] = useState<StructureBlock[]>(() => buildStructure(initialBlocks))
  const [structureSaving, setStructureSaving] = useState(false)

  // Conteúdo padrão: only text-editable types
  const contentBlocks: ContentBlockData[] = CONTENT_TYPES
    .map(type => {
      const found = initialBlocks.find(b => b.type === type)
      const json = found?.default_content as Record<string, unknown> | null
      let value = ''
      if (json) {
        if (typeof json.text === 'string') value = json.text
        else if (Array.isArray(json.items)) value = (json.items as string[]).join('\n')
      }
      return { type, value }
    })

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setBlocks(prev => {
      const oldIdx = prev.findIndex(b => b.type === active.id)
      const newIdx = prev.findIndex(b => b.type === over.id)
      return arrayMove(prev, oldIdx, newIdx).map((b, i) => ({ ...b, sort_order: i }))
    })
  }

  function toggleBlock(type: BlockType) {
    if (REQUIRED_BLOCKS.includes(type)) return
    setBlocks(prev => prev.map(b => b.type === type ? { ...b, enabled: !b.enabled } : b))
  }

  async function patchCoverAsset(field: 'cover_image_url' | 'cover_video_url', url: string | null) {
    await fetch(`/api/templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: url }),
    })
  }

  async function handleCoverImageUpload(file: File) {
    setUploadingImage(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const prefix = organizationId ? `${organizationId}/` : ''
    const path = `${prefix}templates/${template.id}/cover-image.${ext}`
    const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { showToast('Erro ao enviar imagem.', 'error'); setUploadingImage(false); return }
    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)
    const url = publicUrl + '?v=' + Date.now()
    setCoverImageUrl(url)
    await patchCoverAsset('cover_image_url', url)
    showToast('Imagem de capa salva.')
    setUploadingImage(false)
  }

  async function handleCoverVideoUpload(file: File) {
    setUploadingVideo(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    const prefix = organizationId ? `${organizationId}/` : ''
    const path = `${prefix}templates/${template.id}/cover-video.${ext}`
    const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { showToast('Erro ao enviar vídeo.', 'error'); setUploadingVideo(false); return }
    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)
    const url = publicUrl + '?v=' + Date.now()
    setCoverVideoUrl(url)
    await patchCoverAsset('cover_video_url', url)
    showToast('Vídeo de capa salvo.')
    setUploadingVideo(false)
  }

  async function removeCoverImage() {
    setCoverImageUrl('')
    await patchCoverAsset('cover_image_url', null)
  }

  async function removeCoverVideo() {
    setCoverVideoUrl('')
    await patchCoverAsset('cover_video_url', null)
  }

  async function doSave() {
    setGeneralSaving(true)
    setShowDefaultConfirm(false)
    const res = await fetch(`/api/templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        is_default: isDefault,
        product_slugs: productSlugs,
        default_font: defaultFont || null,
        base_font_size: baseFontSize || null,
        custom_css: customCss || null,
      }),
    })
    setGeneralSaving(false)
    if (res.ok) {
      showToast('Template salvo.')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      showToast(data.error || 'Erro ao salvar template.', 'error')
    }
  }

  function saveGeneral() {
    if (!name.trim()) return
    if (willReplaceDefault) {
      setShowDefaultConfirm(true)
      return
    }
    doSave()
  }

  async function saveStructure() {
    setStructureSaving(true)
    const res = await fetch(`/api/templates/${template.id}/blocks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks: blocks.map((b, i) => ({ type: b.type, sort_order: i, enabled: b.enabled })) }),
    })
    setStructureSaving(false)
    if (res.ok) {
      showToast('Estrutura salva.')
    } else {
      showToast('Erro ao salvar estrutura.', 'error')
    }
  }

  function toggleProductSlug(slug: string) {
    setProductSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const TABS: { id: EditorTab; label: string }[] = [
    { id: 'geral', label: 'Geral' },
    { id: 'estrutura', label: 'Estrutura' },
    { id: 'conteudo', label: 'Conteúdo padrão' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-app-border mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand-green-deep text-app-text'
                : 'border-transparent text-app-muted hover:text-app-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* GERAL */}
      {activeTab === 'geral' && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-app-muted block mb-1.5">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-2.5 text-sm text-app-text placeholder-brand-muted focus:outline-none focus:border-brand-green-deep transition-colors"
              placeholder="Nome do template"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-app-muted block mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder-brand-muted resize-none focus:outline-none focus:border-brand-green-deep transition-colors"
              placeholder="Descreva quando usar este template..."
            />
          </div>

          <div className="flex items-center justify-between bg-app-surface border border-app-border rounded-xl px-4 py-3">
            <div>
              <p className={`text-sm font-medium ${isOnlyTemplate ? 'text-app-text/50' : 'text-app-text'}`}>Template padrão</p>
              <p className="text-xs text-app-muted mt-0.5">
                {isOnlyTemplate
                  ? 'Único template disponível — deve permanecer como padrão'
                  : 'Usado quando nenhum template específico é selecionado'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => !isOnlyTemplate && setIsDefault(v => !v)}
              disabled={isOnlyTemplate}
              title={isOnlyTemplate ? 'Único template disponível — não pode ser removido do padrão' : undefined}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                isDefault ? 'bg-brand-green' : 'bg-overlay-md'
              } ${isOnlyTemplate ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isDefault ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          {allProducts.length > 0 && (
            <div>
              <label className="text-xs font-medium text-app-muted block mb-1.5">Produtos relacionados</label>
              <div className="bg-app-surface border border-app-border rounded-xl divide-y divide-app-border">
                {allProducts.map(p => (
                  <label
                    key={p.slug}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--row-hover)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={productSlugs.includes(p.slug)}
                      onChange={() => toggleProductSlug(p.slug)}
                      className="w-4 h-4 rounded accent-brand-green"
                    />
                    <span className="text-sm text-app-text">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Cover assets */}
          <div className="space-y-4 pt-2">
            <p className="text-xs font-medium text-app-muted">Visual da capa</p>

            {/* Image */}
            <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-app-text">Imagem de fundo</p>
                  <p className="text-xs text-app-muted mt-0.5">PNG ou JPG · 1920×1080px recomendado</p>
                </div>
                {coverImageUrl && (
                  <div className="w-20 h-12 rounded-lg border border-app-border overflow-hidden bg-app-surface2 flex-shrink-0">
                    <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <label className={`flex items-center gap-3 h-10 px-4 border border-dashed rounded-xl cursor-pointer transition-colors ${
                uploadingImage ? 'opacity-50 pointer-events-none border-app-border' : 'border-app-border hover:border-brand-green-deep/60 hover:bg-brand-green/5'
              }`}>
                <Upload size={13} className="text-app-muted flex-shrink-0" />
                <span className="text-sm text-app-muted flex-1">
                  {uploadingImage ? 'Enviando...' : coverImageUrl ? 'Substituir imagem' : 'Clique para escolher'}
                </span>
                <span className="text-xs text-app-muted/50">PNG, JPG, WebP</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  disabled={uploadingImage}
                  onChange={e => { if (e.target.files?.[0]) handleCoverImageUpload(e.target.files[0]) }} />
              </label>
              {coverImageUrl && !uploadingImage && (
                <button type="button" onClick={removeCoverImage}
                  className="flex items-center gap-1 text-xs text-app-muted hover:text-red-400 transition-colors">
                  <X size={11} /> Remover imagem
                </button>
              )}
            </div>

            {/* Video */}
            <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-app-text">Vídeo de fundo</p>
                  <p className="text-xs text-app-muted mt-0.5">MP4 ou WebM · mudo · até 8 MB · tem prioridade sobre a imagem</p>
                </div>
                {coverVideoUrl && (
                  <div className="w-20 h-12 rounded-lg border border-app-border overflow-hidden bg-app-surface2 flex-shrink-0">
                    <video src={coverVideoUrl} className="w-full h-full object-cover" muted playsInline />
                  </div>
                )}
              </div>
              <label className={`flex items-center gap-3 h-10 px-4 border border-dashed rounded-xl cursor-pointer transition-colors ${
                uploadingVideo ? 'opacity-50 pointer-events-none border-app-border' : 'border-app-border hover:border-brand-green-deep/60 hover:bg-brand-green/5'
              }`}>
                <Upload size={13} className="text-app-muted flex-shrink-0" />
                <span className="text-sm text-app-muted flex-1">
                  {uploadingVideo ? 'Enviando...' : coverVideoUrl ? 'Substituir vídeo' : 'Clique para escolher'}
                </span>
                <span className="text-xs text-app-muted/50">MP4, WebM</span>
                <input type="file" accept="video/mp4,video/webm" className="hidden"
                  disabled={uploadingVideo}
                  onChange={e => { if (e.target.files?.[0]) handleCoverVideoUpload(e.target.files[0]) }} />
              </label>
              {coverVideoUrl && !uploadingVideo && (
                <button type="button" onClick={removeCoverVideo}
                  className="flex items-center gap-1 text-xs text-app-muted hover:text-red-400 transition-colors">
                  <X size={11} /> Remover vídeo
                </button>
              )}
            </div>
          </div>

          {/* Estilos customizados */}
          <div className="space-y-4 pt-6">
            <p className="text-xs font-medium text-app-muted">Estilos customizados</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1.5">Fonte padrão</label>
                <select
                  value={defaultFont}
                  onChange={e => setDefaultFont(e.target.value)}
                  className="w-full bg-app-surface border border-app-border rounded px-3 py-2 text-sm text-app-text focus:outline-none focus:border-brand-green-deep transition-colors"
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier">Courier</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1.5">Tamanho base (px)</label>
                <input
                  type="number"
                  value={baseFontSize}
                  onChange={e => setBaseFontSize(parseInt(e.target.value) || 13)}
                  className="w-full bg-app-surface border border-app-border rounded px-3 py-2 text-sm text-app-text focus:outline-none focus:border-brand-green-deep transition-colors"
                  min="10"
                  max="20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-app-muted mb-1.5">CSS customizado (avançado)</label>
              <textarea
                value={customCss}
                onChange={e => setCustomCss(e.target.value)}
                rows={4}
                className="w-full bg-app-surface border border-app-border rounded px-3 py-2 text-sm text-app-text font-mono focus:outline-none focus:border-brand-green-deep transition-colors resize-y"
                placeholder="Ex: .proposal-body h1 { font-weight: bold; }"
              />
              <p className="text-xs text-app-muted mt-1">Sobrescreve os estilos padrão. Use seletores CSS.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={saveGeneral}
              disabled={!name.trim() || generalSaving}
              className="px-5 py-2 bg-brand-green text-brand-dark text-sm font-semibold rounded-lg hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-40"
            >
              {generalSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* ESTRUTURA */}
      {activeTab === 'estrutura' && (
        <div>
          <p className="text-xs text-app-muted mb-5">
            Arraste para reordenar. Use o toggle para ativar ou desativar blocos. Blocos obrigatórios não podem ser removidos.
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.type)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {blocks.map(block => (
                  <SortableBlockItem key={block.type} block={block} onToggle={toggleBlock} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={saveStructure}
              disabled={structureSaving}
              className="px-5 py-2 bg-brand-green text-brand-dark text-sm font-semibold rounded-lg hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-40"
            >
              {structureSaving ? 'Salvando...' : 'Salvar estrutura'}
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO PADRÃO */}
      {activeTab === 'conteudo' && (
        <div>
          <p className="text-xs text-app-muted mb-6">
            Configure os textos padrão. Eles serão usados ao criar novas propostas com este template. Salvo automaticamente.
          </p>
          <div className="space-y-4">
            {contentBlocks.map(block => (
              <ContentCard key={block.type} templateId={template.id} block={block} />
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDefaultConfirm}
        title="Substituir template padrão?"
        description="Já existe um template definido como padrão. Ao confirmar, este passará a ser o padrão e o anterior perderá essa marcação."
        confirmText="Confirmar"
        loading={generalSaving}
        onConfirm={doSave}
        onCancel={() => setShowDefaultConfirm(false)}
      />
    </div>
  )
}
