import { Users } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-guard'
import { createClient } from '@/lib/supabase/server'
import UserList from '@/components/admin/UserList'
import type { AdminUser } from '@/types/admin'
import PageHeader from '@/components/ui/PageHeader'

export default async function UsuariosPage() {
  const { user } = await requireAdmin()
  const supabase = createClient()

  const { data: users, error } = await supabase.rpc('admin_list_users')

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <PageHeader
        icon={Users}
        iconBg="#F59E0B"
        title="Usuários"
        subtitle="Gerencie os usuários do sistema e seus perfis de acesso."
      />

      {error ? (
        <div className="bg-app-surface border border-app-border rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm text-red-400">Não foi possível carregar os usuários.</p>
          <p className="text-xs text-app-muted mt-1">Verifique se o SQL da Fase O.2 foi executado no Supabase.</p>
        </div>
      ) : (
        <UserList
          users={(users as AdminUser[]) || []}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}
