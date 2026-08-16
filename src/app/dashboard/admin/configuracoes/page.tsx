import { Suspense } from 'react'
import { Settings } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-guard'
import { createClient } from '@/lib/supabase/server'
import CompanySettingsForm from '@/components/admin/CompanySettingsForm'
import RDIntegrationCard from '@/components/admin/RDIntegrationCard'
import RDIntegrationForm from '@/components/admin/RDIntegrationForm'
import { isRDConnected } from '@/lib/rdstation'
import type { CompanySettings } from '@/types/admin'
import PageHeader from '@/components/ui/PageHeader'

export default async function ConfiguracoesPage() {
  const { profile } = await requireAdmin()

  const supabase = createClient()
  const orgId = profile?.organization_id ?? null

  // SEMPRE filtrar por organização — sem isso o form lê/grava a linha de outra org
  const settingsQuery = orgId
    ? supabase.from('company_settings').select('*').eq('organization_id', orgId).limit(1).maybeSingle()
    : supabase.from('company_settings').select('*').is('organization_id', null).limit(1).maybeSingle()

  const [{ data: settings }, rdConnected] = await Promise.all([
    settingsQuery,
    orgId ? isRDConnected(orgId) : Promise.resolve(false),
  ])

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <PageHeader
        icon={Settings}
        iconBg="#6B7280"
        title="Configurações"
        subtitle="Dados da empresa, branding e padrões do PDF."
      />

      <CompanySettingsForm settings={settings as CompanySettings | null} organizationId={profile?.organization_id ?? null} />

      <div className="mt-10">
        <h2 className="font-sora font-semibold text-sm text-app-muted uppercase tracking-wider mb-4">Integrações</h2>
        <Suspense>
          <div className="space-y-4">
            <RDIntegrationCard isConnected={rdConnected} />
            {!rdConnected && <RDIntegrationForm isConnected={rdConnected} />}
          </div>
        </Suspense>
      </div>
    </div>
  )
}
