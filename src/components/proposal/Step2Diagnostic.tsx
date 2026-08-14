'use client'
import { useState, useEffect } from 'react'
import { Sparkles, X, Plus } from 'lucide-react'
import { MOTIVACOES_SUGERIDAS } from '@/types'
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { ProposalFormData } from './ProposalForm'

interface Props {
  setValue: UseFormSetValue<ProposalFormData>
  watch: UseFormWatch<ProposalFormData>
}

const CUSTOM_KEY = 'brand:motivacoes:custom'

export default function Step2Diagnostic({ setValue, watch }: Props) {
  const motivacoes = watch('motivacoes') || []

  // Local state for textarea so the AI button re-renders reliably
  const [contextoValue, setContextoValue] = useState(() => watch('contexto') || '')

  // Custom tags persisted in localStorage
  const [customSaved, setCustomSaved] = useState<string[]>([])
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_KEY)
      if (stored) setCustomSaved(JSON.parse(stored))
    } catch {}
  }, [])

  const [customInput, setCustomInput] = useState('')
  const [addingCustom, setAddingCustom] = useState(false)
  const [improving, setImproving] = useState(false)

  function handleContextoChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContextoValue(e.target.value)
    setValue('contexto', e.target.value)
  }

  function toggleMotivacao(label: string) {
    const next = motivacoes.includes(label)
      ? motivacoes.filter(m => m !== label)
      : [...motivacoes, label]
    setValue('motivacoes', next)
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (!trimmed) return
    // Add to selection
    if (!motivacoes.includes(trimmed)) {
      setValue('motivacoes', [...motivacoes, trimmed])
    }
    // Persist in localStorage if new
    if (!customSaved.includes(trimmed)) {
      const updated = [...customSaved, trimmed]
      setCustomSaved(updated)
      try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(updated)) } catch {}
    }
    setCustomInput('')
    setAddingCustom(false)
  }

  function removeFromSaved(label: string) {
    const updated = customSaved.filter(m => m !== label)
    setCustomSaved(updated)
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(updated)) } catch {}
    // Also deselect if currently selected
    setValue('motivacoes', motivacoes.filter(m => m !== label))
  }

  async function handleImprove() {
    if (!contextoValue.trim() || improving) return
    setImproving(true)
    try {
      const res = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contextoValue, operation: 'improve' }),
      })
      if (!res.ok) throw new Error()
      const { result } = await res.json()
      setContextoValue(result)
      setValue('contexto', result)
    } catch {
      // silent — original text unchanged
    } finally {
      setImproving(false)
    }
  }

  const allChips = [
    ...MOTIVACOES_SUGERIDAS.map(m => ({ label: m, isCustom: false })),
    ...customSaved.map(m => ({ label: m, isCustom: true })),
  ]

  return (
    <div className="space-y-8">
      <h2 className="font-sora font-semibold text-base text-app-text">Diagnóstico comercial</h2>

      {/* O que motivou essa oportunidade */}
      <div>
        <p className="text-xs font-semibold text-app-muted uppercase tracking-widest mb-4">
          O que motivou essa oportunidade?
        </p>
        <div className="flex flex-wrap gap-2">
          {allChips.map(({ label, isCustom }) => {
            const selected = motivacoes.includes(label)
            return (
              <span key={label} className="relative group/chip">
                <button
                  type="button"
                  onClick={() => toggleMotivacao(label)}
                  className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                    selected
                      ? 'bg-brand-green/15 border-brand-green-deep text-brand-green-deep font-medium'
                      : 'border-app-border text-app-muted hover:text-app-text hover:border-brand-green-deep/40'
                  } ${isCustom ? 'pr-7' : ''}`}
                >
                  {label}
                </button>
                {isCustom && (
                  <button
                    type="button"
                    onClick={() => removeFromSaved(label)}
                    title="Remover"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-app-muted hover:text-red-400 transition-colors opacity-0 group-hover/chip:opacity-100"
                  >
                    <X size={11} />
                  </button>
                )}
              </span>
            )
          })}

          {/* Adicionar outra */}
          {addingCustom ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addCustom() }
                  if (e.key === 'Escape') { setAddingCustom(false); setCustomInput('') }
                }}
                placeholder="Nome da motivação"
                className="text-sm px-3.5 py-1.5 rounded-full border border-brand-green-deep bg-overlay text-app-text placeholder-app-muted focus:outline-none w-48"
              />
              <button
                type="button"
                onClick={addCustom}
                className="text-sm px-3.5 py-1.5 rounded-full bg-brand-green text-brand-dark font-medium hover:bg-brand-green-deep hover:text-white transition-colors"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => { setAddingCustom(false); setCustomInput('') }}
                className="text-app-muted hover:text-app-text transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingCustom(true)}
              className="flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-full border border-dashed border-app-border text-app-muted hover:border-brand-green-deep/40 hover:text-app-text transition-colors"
            >
              <Plus size={13} />
              Adicionar outra
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-app-border" />

      {/* Contexto da oportunidade */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-app-muted uppercase tracking-widest">
            Contexto da oportunidade
          </p>
          {contextoValue.trim() && (
            <button
              type="button"
              onClick={handleImprove}
              disabled={improving}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-app-border text-app-muted hover:text-brand-green-deep hover:border-brand-green-deep/50 transition-colors disabled:opacity-40"
            >
              <Sparkles size={12} />
              {improving ? 'Melhorando...' : 'Melhorar redação'}
            </button>
          )}
        </div>
        <textarea
          value={contextoValue}
          onChange={handleContextoChange}
          rows={4}
          className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder-app-muted resize-y focus:outline-none focus:border-brand-green-deep transition-colors"
          placeholder="Descreva rapidamente o contexto, situação ou necessidade do cliente."
        />
        <p className="text-xs text-app-muted mt-2">Opcional. A IA só reescreve o que você escreveu, sem inventar informações.</p>
      </div>
    </div>
  )
}
