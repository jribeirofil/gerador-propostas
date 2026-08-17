'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { formatCNPJ } from '@/lib/cnpj'
import { useToast } from '@/components/ui/Toast'

export default function CriarEmpresaPage() {
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  function handleCNPJChange(value: string) {
    const clean = value.replace(/\D/g, '')
    const limited = clean.slice(0, 14)
    setCnpj(formatCNPJ(limited))
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!companyName.trim()) {
      setError('Nome da empresa é obrigatório.')
      return
    }
    if (!cnpj.trim()) {
      setError('CNPJ é obrigatório.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          cnpj,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar empresa.')
        setLoading(false)
        return
      }

      showToast('Empresa criada com sucesso!')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Error creating company:', err)
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[400px]">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-green/15 flex items-center justify-center mb-4">
            <AlertCircle className="text-brand-green-deep" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-app-text mb-2">
            Complete seu setup
          </h1>
          <p className="text-sm text-app-muted">
            Sua conta foi criada com sucesso, mas precisa de uma empresa vinculada para continuar usando o sistema.
          </p>
        </div>

        <form onSubmit={handleCreateCompany} className="space-y-5 bg-app-surface border border-app-border rounded-2xl p-6">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1.5">
              Nome da empresa *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Ex: Acme Corporation"
              className="w-full bg-white dark:bg-slate-800 border border-app-border dark:border-slate-700 rounded px-3 py-2 text-sm text-app-text dark:text-white placeholder-app-muted dark:placeholder-slate-400 focus:outline-none focus:border-brand-green-deep dark:focus:border-brand-green transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-app-muted mb-1.5">
              CNPJ *
            </label>
            <input
              type="text"
              value={cnpj}
              onChange={e => handleCNPJChange(e.target.value)}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className="w-full bg-white dark:bg-slate-800 border border-app-border dark:border-slate-700 rounded px-3 py-2 text-sm text-app-text dark:text-white placeholder-app-muted dark:placeholder-slate-400 focus:outline-none focus:border-brand-green-deep dark:focus:border-brand-green transition-colors font-mono"
            />
            <p className="text-xs text-app-muted mt-1">
              CNPJ é usado para evitar duplicações no sistema.
            </p>
          </div>

          {error && (
            <div className="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-brand-green text-brand-dark rounded-lg text-sm font-semibold hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando empresa...' : 'Criar empresa e continuar'}
          </button>
        </form>

        <p className="text-xs text-app-muted text-center mt-6">
          Depois você pode alterar esses dados em <span className="font-medium">Admin &gt; Configurações</span>
        </p>
      </div>
    </div>
  )
}
