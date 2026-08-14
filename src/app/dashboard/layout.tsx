import Sidebar from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ToastProvider } from '@/components/ui/Toast'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
    supabase.from('company_settings').select('logo_url').limit(1).maybeSingle(),
  ])

  return (
    <ToastProvider>
      <div className="flex flex-1 overflow-hidden" style={{ background: 'var(--bg)' }}>
        <div className="flex-shrink-0 h-full overflow-hidden">
          <Sidebar
            userName={profile?.full_name || user.email}
            userRole={profile?.role}
            userId={user.id}
            logoUrl={settings?.logo_url}
          />
        </div>
        <main className="flex-1 h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
