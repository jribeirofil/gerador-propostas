'use client'

import { useState } from 'react'
import { Trash2, Lock } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface Props {
  isConnected: boolean
  onConnected?: () => void
}

export default function RDIntegrationForm({ isConnected, onConnected }: Props) {
  const { showToast } = useToast()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(!isConnected)

  async function handleConnect() {
    if (!token.trim()) {
      showToast('Token é obrigatório.', 'error')
      return
    }

    setLoading(true)
    const res = await fetch('/api/integrations/rd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim() }),
    })

    setLoading(false)

    if (res.ok) {
      showToast('RD Station conectado com sucesso!')
      setToken('')
      setShowForm(false)
      onConnected?.()
    } else {
      const { error } = await res.json()
      showToast(error || 'Erro ao conectar RD Station.', 'error')
    }
  }

  async function handleDisconnect() {
    if (!confirm('Desconectar RD Station?')) return

    setLoading(true)
    const res = await fetch('/api/integrations/rd', { method: 'DELETE' })
    setLoading(false)

    if (res.ok) {
      showToast('RD Station desconectado.')
      setShowForm(true)
      onConnected?.()
    } else {
      const { error } = await res.json()
      showToast(error || 'Erro ao desconectar RD Station.', 'error')
    }
  }

  if (!showForm && isConnected) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm text-emerald-600">✓ Conectado e ativo</p>
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          Desconectar
        </button>
      </div>
    )
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-app-text mb-2">
          Token de API do RD Station
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Cole seu token de API aqui..."
              disabled={loading}
              className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-brand-green-deep disabled:opacity-50"
            />
            <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
          </div>
        </div>
        <p className="text-xs text-app-muted mt-2">
          🔒 Seu token é criptografado e armazenado com segurança
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleConnect}
          disabled={loading || !token.trim()}
          className="px-4 py-2 bg-brand-green text-brand-dark font-medium text-sm rounded-lg hover:bg-brand-green-deep disabled:opacity-50 transition-colors"
        >
          {loading ? 'Conectando...' : 'Conectar'}
        </button>
        {showForm && (
          <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 bg-app-bg border border-app-border text-app-text font-medium text-sm rounded-lg hover:bg-overlay transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
