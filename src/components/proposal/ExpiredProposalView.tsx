'use client'
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface Props {
  token: string
  expiryDate: string
}

export default function ExpiredProposalView({ token, expiryDate }: Props) {
  const [view, setView] = useState<'idle' | 'done'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Registra expired_opened uma vez por sessão
  useEffect(() => {
    const key = `exp_opened_${token}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch(`/api/p/${token}/update-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'view' }),
    }).catch(() => {})
  }, [token])

  async function handleRequest() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/p/${token}/update-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'request' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao enviar solicitação.')
      }
      setView('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  const expiryFormatted = new Date(expiryDate).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <section className="border-t border-gray-100 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-20">
        {view === 'done' ? (
          <div className="text-center max-w-lg mx-auto">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
              <Clock size={18} className="text-gray-500" />
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-2">Solicitação registrada.</p>
            <p className="text-gray-500 text-sm leading-relaxed">Nossa equipe entrará em contato em breve com uma proposta atualizada.</p>
          </div>
        ) : (
          <div className="text-center max-w-lg mx-auto">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Clock size={18} className="text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold text-xl mb-2">Esta proposta expirou.</p>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              A validade desta proposta encerrou em {expiryFormatted}. Os valores e condições podem ter mudado.
            </p>
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            <button
              onClick={handleRequest}
              disabled={loading}
              className="px-8 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Solicitar atualização'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
