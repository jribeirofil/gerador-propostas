'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { ROLE_LABELS } from '@/types/admin'
import { maskPhone } from '@/lib/masks'

interface Props {
  open: boolean
  onClose: () => void
}

const inputClass =
  'w-full bg-app-surface border border-app-border rounded px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-brand-green-deep transition-colors'
const labelClass = 'block text-xs font-medium text-app-muted mb-1.5'

export default function NewUserDialog({ open, onClose }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('seller')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    if (open) {
      setFullName(''); setEmail(''); setJobTitle(''); setPhone(''); setRole('seller')
      setError(null); setLoading(false)
      const t = setTimeout(() => nameRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, loading, onClose])

  async function handleCreate() {
    if (!email.trim()) { setError('E-mail é obrigatório.'); return }
    setError(null)
    setLoading(true)

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        email,
        job_title: jobTitle,
        phone,
        role,
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error || 'Não foi possível criar o usuário.')
      return
    }

    showToast(`Usuário criado. Um e-mail foi enviado para ${email} para definir a senha.`)
    onClose()
    router.refresh()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />

      <div className="relative w-full max-w-md bg-app-surface border border-overlay rounded-xl p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-app-text mb-5">Novo usuário</h3>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nome completo</label>
            <input
              ref={nameRef}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className={inputClass}
              placeholder="João da Silva"
              autoComplete="off"
            />
          </div>

          <div>
            <label className={labelClass}>E-mail <span className="text-red-400">*</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              className={inputClass}
              placeholder="joao@empresa.com.br"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cargo</label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                className={inputClass}
                placeholder="Gerente Comercial"
              />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input
                value={phone}
                onChange={e => setPhone(maskPhone(e.target.value))}
                className={inputClass}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Perfil de acesso</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    role === value
                      ? 'bg-brand-green/15 border-brand-green-deep text-brand-green-deep'
                      : 'border-app-border text-app-muted hover:text-app-text hover:border-brand-green-deep/40 bg-app-surface'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 mt-4">{error}</p>
        )}

        <p className="text-xs text-app-muted mt-4">
          Um e-mail será enviado ao usuário para definir a senha.
        </p>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-app-muted hover:text-app-text transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !email.trim()}
            className="px-4 py-2 text-sm font-semibold bg-brand-green text-brand-dark rounded-lg hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando...' : 'Criar usuário'}
          </button>
        </div>
      </div>
    </div>
  )
}
