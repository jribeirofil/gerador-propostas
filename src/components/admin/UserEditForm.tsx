'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { ROLE_LABELS, type AdminUser } from '@/types/admin'
import Select from '@/components/ui/Select'
import { maskPhone } from '@/lib/masks'

interface Props {
  user: AdminUser
  isLastAdmin: boolean
  isSelf: boolean
}

const inputClass = 'w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-text placeholder-brand-muted focus:outline-none focus:border-brand-green-deep transition-colors'
const readOnlyClass = 'w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm text-app-muted cursor-not-allowed opacity-60'
const labelClass = 'block text-xs font-medium text-app-muted mb-1.5'

const AVATAR_COLORS = [
  'bg-brand-green/20 text-brand-green-deep',
  'bg-blue-500/20 text-blue-400',
  'bg-violet-500/20 text-violet-400',
  'bg-amber-500/20 text-amber-400',
  'bg-rose-500/20 text-rose-400',
  'bg-cyan-500/20 text-cyan-400',
]

function avatarColor(id: string): string {
  const n = Array.from(id).reduce((s, c) => s + c.charCodeAt(0), 0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].substring(0, 2).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
}

export default function UserEditForm({ user, isLastAdmin, isSelf }: Props) {
  const [fullName, setFullName] = useState(user.full_name || '')
  const [jobTitle, setJobTitle] = useState(user.job_title || '')
  const [phone, setPhone] = useState(maskPhone(user.phone || ''))
  const [role, setRole] = useState(user.role)

  const [saving, setSaving] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (isLastAdmin && role !== 'admin') {
      setError('Não é possível remover o perfil Admin do único administrador ativo do sistema.')
      return
    }

    setSaving(true)

    const { error: saveError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        job_title: jobTitle.trim() || null,
        phone: phone.trim() || null,
        role,
      })
      .eq('id', user.id)

    setSaving(false)

    if (saveError) {
      setError('Não foi possível salvar. Tente novamente.')
      return
    }

    showToast('Usuário atualizado.')
    router.refresh()
  }

  async function handleSendReset() {
    setSendingReset(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/dashboard`,
    })
    setSendingReset(false)

    if (resetError) {
      showToast('Não foi possível enviar o e-mail. Tente novamente.', 'error')
    } else {
      showToast(`E-mail de redefinição enviado para ${user.email}.`)
    }
  }

  const initials = getInitials(fullName || user.full_name, user.email)
  const color = avatarColor(user.id)

  return (
    <div className="space-y-4">
      {/* Avatar + identidade */}
      <div className="flex items-center gap-4 bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${color}`}>
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-app-text">{fullName || user.email}</p>
          <p className="text-xs text-app-muted mt-0.5">{user.email}</p>
          {user.last_sign_in_at !== undefined && (
            <p className="text-[10px] text-app-muted/60 mt-0.5">
              {user.last_sign_in_at
                ? `Último acesso: ${new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')}`
                : 'Nunca acessou'}
            </p>
          )}
        </div>
      </div>

      {/* Formulário principal */}
      <form onSubmit={handleSave} className="bg-app-surface border border-app-border rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <label className={labelClass}>E-mail</label>
          <input value={user.email} readOnly className={readOnlyClass} />
          <p className="text-xs text-app-muted mt-1">E-mail gerenciado pelo Supabase Auth.</p>
        </div>

        <div>
          <label className={labelClass}>Nome completo</label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className={inputClass}
            placeholder="João da Silva"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Cargo</label>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              className={inputClass}
              placeholder="Diretor Comercial"
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
          {isSelf && isLastAdmin ? (
            <>
              <input value={ROLE_LABELS[role] || role} readOnly className={readOnlyClass} />
              <p className="text-xs text-app-muted mt-1">
                Você é o único admin ativo — não é possível alterar seu próprio perfil.
              </p>
            </>
          ) : (
            <>
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
              {isLastAdmin && role !== 'admin' && (
                <p className="text-xs text-red-400 mt-1">
                  Este é o único admin ativo. Alterar o perfil bloqueará o acesso administrativo.
                </p>
              )}
            </>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-brand-green text-brand-dark rounded-lg text-sm font-semibold hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>

      {/* Segurança */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
        <p className="text-sm font-medium text-app-text mb-1">Segurança</p>
        <p className="text-xs text-app-muted mb-4">
          Envia um e-mail para <strong className="text-app-text/70">{user.email}</strong> com
          um link para redefinir a senha.
        </p>
        <button
          type="button"
          onClick={handleSendReset}
          disabled={sendingReset}
          className="px-4 py-2 text-sm border border-app-border text-app-muted rounded-lg hover:text-app-text hover:border-app-border hover:bg-[var(--row-hover)] transition-colors disabled:opacity-50"
        >
          {sendingReset ? 'Enviando...' : 'Enviar e-mail de redefinição de senha'}
        </button>
      </div>
    </div>
  )
}
