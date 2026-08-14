'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Breadcrumb from '@/components/ui/Breadcrumb'

export default function NovoTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erro ao criar template.')
      setLoading(false)
      return
    }
    const template = await res.json()
    router.push(`/dashboard/admin/templates/${template.id}`)
  }

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Templates', href: '/dashboard/admin/templates' },
          { label: 'Novo template' },
        ]} className="mb-3" />
        <h1 className="font-sora text-xl font-semibold text-app-text">Novo template</h1>
        <p className="text-sm text-app-muted mt-0.5">
          Crie um template para padronizar a estrutura e os textos das propostas.
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-5">
        <div>
          <label className="text-xs font-medium text-app-muted block mb-1.5">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            className="w-full bg-overlay border border-overlay rounded-xl px-4 py-2.5 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-brand-green-deep transition-colors"
            placeholder="Ex: Canal de Denúncias, Marketplace RH..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-app-muted block mb-1.5">Descrição</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-overlay border border-overlay rounded-xl px-4 py-3 text-sm text-app-text placeholder-app-muted resize-none focus:outline-none focus:border-brand-green-deep transition-colors"
            placeholder="Quando usar este template? Para quais clientes?"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="px-5 py-2 bg-brand-green text-brand-dark text-sm font-semibold rounded-lg hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-40"
          >
            {loading ? 'Criando...' : 'Criar template'}
          </button>
          <Link
            href="/dashboard/admin/templates"
            className="px-4 py-2 text-sm text-app-muted hover:text-app-text transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
