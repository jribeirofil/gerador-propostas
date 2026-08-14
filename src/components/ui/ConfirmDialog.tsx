'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  open: boolean
  title: string
  description?: string
  error?: string | null
  variant?: 'default' | 'danger'
  confirmText?: string
  cancelText?: string
  requireTyping?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  error,
  variant = 'default',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  requireTyping,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTyped('')
      if (requireTyping) {
        const t = setTimeout(() => inputRef.current?.focus(), 50)
        return () => clearTimeout(t)
      }
    }
  }, [open, requireTyping])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, loading, onCancel])

  if (!open) return null

  const canConfirm = !requireTyping || typed === requireTyping

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />

      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-md border border-black/8 rounded-xl p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>

        {description && (
          <p className="text-sm text-gray-900/70 leading-relaxed mb-4">{description}</p>
        )}

        {error && (
          <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 leading-snug">{error}</p>
          </div>
        )}

        {requireTyping && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">
              Digite{' '}
              <strong className="text-gray-900 font-mono tracking-wider">{requireTyping}</strong>
              {' '}para confirmar
            </p>
            <input
              ref={inputRef}
              value={typed}
              onChange={e => setTyped(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && canConfirm && !loading) onConfirm()
              }}
              className="w-full bg-overlay border border-app-border rounded px-3 py-2 text-sm text-app-text font-mono placeholder-app-muted focus:outline-none focus:border-brand-green-deep transition-colors"
              placeholder={requireTyping}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              variant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-brand-green text-brand-dark hover:bg-brand-green-deep hover:text-white'
            }`}
          >
            {loading ? 'Aguarde...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
