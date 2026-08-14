'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { ROLE_LABELS, ROLE_COLORS, type AdminUser } from '@/types/admin'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import NewUserDialog from './NewUserDialog'

interface Props {
  users: AdminUser[]
  currentUserId: string
}

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

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  const months = Math.floor(days / 30)
  if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`
  return `há ${Math.floor(months / 12)} anos`
}

export default function UserList({ users: initial, currentUserId }: Props) {
  const [users, setUsers] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null)
  const [newUserOpen, setNewUserOpen] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const activeAdminCount = users.filter(u => u.role === 'admin' && u.active).length

  async function toggleActive(user: AdminUser) {
    setLoading(user.id)
    const { error } = await supabase
      .from('profiles')
      .update({ active: !user.active })
      .eq('id', user.id)
    setLoading(null)
    setDeactivateTarget(null)
    if (error) { showToast('Não foi possível atualizar o status.', 'error'); return }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !user.active } : u))
    showToast(user.active ? 'Usuário desativado.' : 'Usuário ativado.')
    router.refresh()
  }

  function canToggle(user: AdminUser): { allowed: boolean; reason?: string } {
    if (user.id === currentUserId) return { allowed: false, reason: 'Você não pode alterar seu próprio status.' }
    if (user.role === 'admin' && user.active && activeAdminCount <= 1) return { allowed: false, reason: 'Não é possível desativar o único admin ativo.' }
    return { allowed: true }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-app-muted">{users.length} {users.length === 1 ? 'usuário' : 'usuários'}</p>
        <button
          type="button"
          onClick={() => setNewUserOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-green text-brand-dark rounded-lg text-sm font-semibold hover:bg-brand-green-deep hover:text-white transition-colors"
        >
          + Novo usuário
        </button>
      </div>

      {users.length === 0 ? (
        <div className="bg-app-surface rounded-2xl border border-app-border p-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-app-text mb-1.5">Nenhum usuário encontrado.</p>
          <button type="button" onClick={() => setNewUserOpen(true)} className="text-sm text-brand-green-deep hover:underline mt-2">
            Criar o primeiro usuário →
          </button>
        </div>
      ) : (
        <div className="bg-app-surface rounded-2xl border border-app-border overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-app-border bg-overlay">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-app-muted tracking-wide">Usuário</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-app-muted tracking-wide">E-mail</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-app-muted tracking-wide">Perfil</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-app-muted tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-app-muted tracking-wide">Atividade</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-app-muted tracking-wide">Propostas</th>
                <th className="px-5 py-3.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {users.map(user => {
                const { allowed, reason } = canToggle(user)
                const isLoading = loading === user.id
                const initials = getInitials(user.full_name, user.email)
                const color = avatarColor(user.id)

                return (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/dashboard/admin/usuarios/${user.id}`)}
                    className="hover:bg-[var(--row-hover)] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0 ${color}`}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-app-text leading-tight">
                            {user.full_name || <span className="text-app-muted italic font-normal">Sem nome</span>}
                            {user.id === currentUserId && (
                              <span className="ml-1.5 text-[10px] text-app-muted font-normal">(você)</span>
                            )}
                          </p>
                          {user.job_title && <p className="text-xs text-app-muted mt-0.5">{user.job_title}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-app-muted">{user.email}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role] || 'bg-overlay-md text-app-muted'}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>

                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => user.active ? setDeactivateTarget(user) : toggleActive(user)}
                        disabled={!allowed || isLoading}
                        title={reason}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                          !allowed ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-75 cursor-pointer'
                        } ${user.active ? 'text-brand-green-deep' : 'text-app-muted'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user.active ? 'bg-brand-green' : 'bg-app-border'}`} />
                        {isLoading ? '...' : user.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-xs text-app-muted">{fmtDate(user.created_at)}</p>
                      {user.last_sign_in_at !== undefined && (
                        <p className="text-[10px] text-app-muted/60 mt-0.5">
                          {user.last_sign_in_at ? `Acesso ${fmtRelative(user.last_sign_in_at)}` : 'Nunca acessou'}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {user.proposal_count !== undefined ? (
                        <span className={`text-sm font-medium ${user.proposal_count > 0 ? 'text-app-text' : 'text-app-muted'}`}>
                          {user.proposal_count}
                        </span>
                      ) : (
                        <span className="text-app-muted text-xs">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-xs text-app-muted/40">→</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title={`Desativar ${deactivateTarget?.full_name || deactivateTarget?.email}?`}
        description="O usuário perderá o acesso ao sistema até ser reativado."
        variant="danger"
        confirmText="Desativar"
        loading={loading === deactivateTarget?.id}
        onConfirm={() => deactivateTarget && toggleActive(deactivateTarget)}
        onCancel={() => setDeactivateTarget(null)}
      />

      <NewUserDialog open={newUserOpen} onClose={() => setNewUserOpen(false)} />
    </>
  )
}
