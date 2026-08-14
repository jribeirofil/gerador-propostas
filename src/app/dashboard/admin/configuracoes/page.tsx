import { Suspense } from 'react'
import { Settings } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-guard'
import { createClient } from '@/lib/supabase/server'
import CompanySettingsForm from '@/components/admin/CompanySettingsForm'
import RDIntegrationCard from '@/components/admin/RDIntegrationCard'
import { isRDConnected } from '@/lib/rdstation'
import type { CompanySettings } from '@/types/admin'
import PageHeader from '@/components/ui/PageHeader'

export default async function ConfiguracoesPage() {
  await requireAdmin()

  const supabase = createClient()
  const [{ data: settings }, rdConnected] = await Promise.all([
    supabase.from('company_settings').select('*').limit(1).maybeSingle(),
    isRDConnected(),
  ])

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <PageHeader
        icon={Settings}
        iconBg="#6B7280"
        title="Configurações"
        subtitle="Dados da empresa, branding e padrões do PDF."
      />

      <CompanySettingsForm settings={settings as CompanySettings | null} />

      <div className="mt-10">
        <h2 className="font-sora font-semibold text-sm text-app-muted uppercase tracking-wider mb-4">Integrações</h2>
        <Suspense>
          <RDIntegrationCard isConnected={rdConnected} />
        </Suspense>
      </div>
    </div>
  )
}
