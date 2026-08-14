'use client'
import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BLOCK_LABELS, AI_BLOCK_TYPES, type BlockType, type ProposalBlock } from '@/lib/blocks'
import type { Json } from '@/types/database.types'

const EDITABLE_TYPES: BlockType[] = ['cenario', 'objetivos', 'diferenciais', 'proximos_passos', 'sobre']
const LIST_TYPES: BlockType[] = ['diferenciais', 'proximos_passos']

const SECTION_HINTS: Partial<Record<BlockType, string>> = {
  cenario:        'Descreva o contexto e o desafio atual da empresa.',
  objetivos:      'Quais resultados a solução vai entregar?',
  diferenciais:   'Um diferencial por linha.',
  proximos_passos:'Um passo por linha.',
  sobre:          'Apresentação da empresa para o cliente.',
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type AiOp = 'improve' | 'rewrite' | 'expand'

function getTextValue(block: ProposalBlock): string {
  const json = block.content_json as Record<string, unknown>
  if (typeof json?.text === 'string') return json.text
  if (Array.isArray(json?.items)) return (json.items as string[]).join('\n')
  return ''
}

function buildContentJson(type: BlockType, value: string): Json {
  if (LIST_TYPES.includes(type)) {
    return { items: value.split('\n').filter(s => s.trim()) } as unknown as Json
  }
  return { text: value } as unknown as Json
}

interface Props {
  proposalId: string
  initialBlocks: ProposalBlock[]
}

export default function WorkspaceContentEditor({ proposalId, initialBlocks }: Props) {
  const editableBlocks = initialBlocks.filter(b => EDITABLE_TYPES.includes(b.type as BlockType))

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(editableBlocks.map(b => [b.id, getTextValue(b)]))
  )
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>(
    Object.fromEntries(editableBlocks.map(b => [b.id, 'idle']))
  )
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [showAiMenu, setShowAiMenu] = useState<Record<string, boolean>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const supabase = createClient()

  const persist = useCallback(async (block: ProposalBlock, value: string) => {
    setSaveStatus(prev => ({ ...prev, [block.id]: 'saving' }))
    const { error } = await supabase
      .from('proposal_block')
      .update({ content_json: buildContentJson(block.type as BlockType, value) })
      .eq('id', block.id)
    if (error) {
      setSaveStatus(prev => ({ ...prev, [block.id]: 'error' }))
    } else {
      setSaveStatus(prev => ({ ...prev, [block.id]: 'saved' }))
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [block.id]: 'idle' })), 3000)
    }
  }, [supabase])

  function handleChange(block: ProposalBlock, value: string) {
    setValues(prev => ({ ...prev, [block.id]: value }))
    setSaveStatus(prev => ({ ...prev, [block.id]: 'idle' }))
    clearTimeout(timers.current[block.id])
    timers.current[block.id] = setTimeout(() => persist(block, value), 1500)
  }

  async function runAI(block: ProposalBlock, operation: AiOp) {
    const content = values[block.id]
    if (!content?.trim()) return
    setAiLoading(prev => ({ ...prev, [block.id]: true }))
    setShowAiMenu(prev => ({ ...prev, [block.id]: false }))
    try {
      const res = await fetch(`/api/proposals/${proposalId}/blocks/${block.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, content, blockType: block.type }),
      })
      const data = await res.json()
      if (data.result) handleChange(block, data.result)
    } catch {}
    setAiLoading(prev => ({ ...prev, [block.id]: false }))
  }

  if (editableBlocks.length === 0) {
    return <p className="text-sm text-app-muted">Nenhuma seção editável encontrada nesta proposta.</p>
  }

  return (
    <div className="space-y-4">
      {editableBlocks.map(block => {
        const type = block.type as BlockType
        const status = saveStatus[block.id]
        const isList = LIST_TYPES.includes(type)
        const hasAI = AI_BLOCK_TYPES.includes(type)
        const value = values[block.id] || ''
        const hint = SECTION_HINTS[type]

        return (
          <div
            key={block.id}
            className="rounded-2xl border border-app-border overflow-hidden bg-app-surface shadow-sm"
          >
            {/* Card header */}
            <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-app-text">{BLOCK_LABELS[type]}</h3>
                {hint && <p className="text-xs text-app-muted mt-1">{hint}</p>}
              </div>
              <span className={`text-[11px] shrink-0 mt-0.5 transition-opacity duration-200 ${
                status === 'idle' ? 'opacity-0' : 'opacity-100'
              } ${
                status === 'saving' ? 'text-app-muted' :
                status === 'saved'  ? 'text-fay-green-deep' :
                'text-red-400'
              }`}>
                {status === 'saving' ? 'Salvando...' :
                 status === 'saved'  ? 'Salvo ✓' :
                 status === 'error'  ? 'Erro' : ''}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-app-border" />

            {/* Textarea */}
            <textarea
              value={value}
              onChange={e => handleChange(block, e.target.value)}
              rows={isList ? 5 : 6}
              placeholder={isList ? 'Um item por linha...' : 'Escreva aqui...'}
              className="w-full bg-transparent px-5 py-4 text-sm text-app-text placeholder-app-muted resize-none focus:outline-none leading-relaxed block"
            />

            {/* Footer with AI */}
            {hasAI && (
              <div className="relative border-t border-app-border px-5 py-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowAiMenu(prev => ({ ...prev, [block.id]: !prev[block.id] }))}
                  disabled={aiLoading[block.id] || !value.trim()}
                  className="text-[11px] text-app-muted hover:text-fay-green-deep transition-colors disabled:opacity-30 flex items-center gap-1"
                >
                  {aiLoading[block.id] ? '✨ Processando...' : '✨ Melhorar com IA'}
                </button>

                {showAiMenu[block.id] && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAiMenu(prev => ({ ...prev, [block.id]: false }))}
                    />
                    <div className="absolute bottom-full right-5 mb-1.5 bg-app-surface border border-app-border rounded-xl overflow-hidden shadow-card-md z-20 min-w-[148px]">
                      {(['improve', 'rewrite', 'expand'] as AiOp[]).map(op => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => runAI(block, op)}
                          className="w-full text-left px-4 py-2.5 text-xs text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
                        >
                          {op === 'improve' ? 'Melhorar texto' :
                           op === 'rewrite' ? 'Reescrever' : 'Expandir'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
