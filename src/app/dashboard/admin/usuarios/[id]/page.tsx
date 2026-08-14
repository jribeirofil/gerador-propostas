import { requireAdmin } from '@/lib/admin-guard'
import { createClient } from '@/lib/supabase/server'
import UserEditForm from '@/components/admin/UserEditForm'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { notFound } from 'next/navigation'
import type { AdminUser } from '@/types/admin'

export default async function UserEditPage({ params }: { params: { id: string } }) {
  const { user: currentUser } = await requireAdmin()
  const supabase = createClient()

  const { data } = await supabase.rpc('admin_list_users')
  const allUsers = (data as AdminUser[]) || []

  const user = allUsers.find(u => u.id === params.id)
  if (!user) notFound()

  const activeAdminCount = allUsers.filter(u => u.role === 'admin' && u.active).length
  const isLastAdmin = user.role === 'admin' && activeAdminCount <= 1
  const isSelf = user.id === currentUser.id

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: 'Usuários', href: '/dashboard/admin/usuarios' },
          { label: user.full_name || user.email || 'Usuário' },
        ]} className="mb-3" />
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-app-muted">Editando</span>
          <span className="text-app-muted text-sm">›</span>
          <h1 className="font-sora font-bold text-xl text-app-text">{user.full_name || user.email}</h1>
        </div>
        <p className="text-sm text-app-muted mt-1">{user.email}</p>
      </div>

      <UserEditForm
        user={user}
        isLastAdmin={isLastAdmin}
        isSelf={isSelf}
      />
    </div>
  )
}
