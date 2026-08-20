import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isStalled } from '@/lib/followup'
import ProposalTable from '@/components/proposal/ProposalTable'
import SetupChecklist, { type SetupStep } from '@/components/onboarding/SetupChecklist'
import PageHeader from '@/components/ui/PageHeader'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: raw } = await supabase
    .from('proposal')
    .select('id, title, code, status, opportunity_status, is_archived, has_pending_review, version, version_group, total_monthly, total_setup, validade_dias, sent_at, followup_days, public_token, updated_at, created_at, client:clients(empresa, contato, colaboradores, whatsapp)')
    .order('version_group', { ascending: true })
    .order('version', { ascending: false })

  // Dedup: keep highest version per version_group
  const seen = new Set<string>()
  const proposals = (raw || []).filter(p => {
    const key = (p.version_group as string) || p.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  proposals.sort((a, b) => {
    const da = a.updated_at ?? a.created_at ?? ''
    const db = b.updated_at ?? b.created_at ?? ''
    return db.localeCompare(da)
  })

  const active     = proposals.filter(p => !p.is_archived)
  const rascunhos  = active.filter(p => ['draft', 'generated'].includes(p.status as string)).length
  const ganhas     = active.filter(p => p.opportunity_status === 'won').length
  const perdidas   = active.filter(p => p.opportunity_status === 'lost').length
  const paradas    = active.filter(p => isStalled(p)).length
  const emAberto   = active.filter(p =>
    !['draft', 'generated'].includes(p.status as string) &&
    !['won', 'lost'].includes((p.opportunity_status as string) ?? '')
  ).length
  const decididas   = ganhas + perdidas
  const txConversao = decididas > 0 ? Math.round(ganhas / decididas * 100) : 0

  // ── Setup checklist ──────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, organization_id')
    .eq('id', user.id)
    .maybeSingle()

  const orgId = profile?.organization_id ?? null

  const [productsRes, settingsRes, teamRes] = await Promise.all([
    supabase.from('product').select('id').eq('organization_id', orgId).limit(1),
    supabase.from('company_settings').select('company_name, company_email, company_phone, logo_url').eq('organization_id', orgId).limit(1).maybeSingle(),
    supabase.from('profiles').select('id').eq('organization_id', orgId).limit(2),
  ])

  const steps: SetupStep[] = [
    {
      key: 'empresa',
      title: 'Dados da empresa',
      description: settingsRes.data?.company_name && settingsRes.data.company_name !== 'Minha Empresa'
        ? (settingsRes.data.company_name || '').trim()
        : 'Logo, contato e endereço',
      href: '/dashboard/admin/configuracoes',
      done: !!(settingsRes.data?.company_email || settingsRes.data?.company_phone || settingsRes.data?.logo_url),
      icon: 'empresa',
    },
    {
      key: 'catalogo',
      title: 'Catálogo',
      description: 'Categorias e produtos com preços',
      href: '/dashboard/admin/produtos',
      done: (productsRes.data?.length ?? 0) > 0,
      icon: 'catalogo',
    },
    {
      key: 'template',
      title: 'Template padrão',
      description: 'Blocos e conteúdo da proposta',
      href: '/dashboard/admin/conteudo',
      done: true,
      icon: 'template',
    },
    {
      key: 'equipe',
      title: 'Equipe',
      description: 'Convide seus vendedores e colaboradores',
      href: '/dashboard/admin/usuarios',
      done: (teamRes.data?.length ?? 0) > 1,
      icon: 'equipe',
    },
    {
      key: 'proposta',
      title: 'Primeira proposta',
      description: 'Crie e envie sua primeira proposta',
      href: '/dashboard/nova',
      done: proposals.length > 0,
      icon: 'proposta',
    },
  ]

  const stats = [
    { label: 'Rascunhos',  value: rascunhos,        desc: 'Nunca enviadas',       color: '#94A3B8' },
    { label: 'Em aberto',  value: emAberto,          desc: 'Aguardando resposta',  color: '#3B82F6' },
    { label: 'Paradas',    value: paradas,           desc: 'Sem resposta há +N dias', color: '#F59E0B' },
    { label: 'Ganhas',     value: ganhas,            desc: 'Negócios fechados',    color: '#6B7280' },
    { label: 'Perdidas',   value: perdidas,          desc: 'Oportunidades perdidas', color: '#EF4444' },
    { label: 'Conversão',  value: `${txConversao}%`, desc: 'Ganhas / decididas',   color: '#8B5CF6' },
  ]

  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <PageHeader
        icon={FileText}
        iconBg="#6B7280"
        title="Propostas"
        subtitle="Gerencie e acompanhe as propostas comerciais."
        action={{ label: 'Nova proposta', href: '/dashboard/nova' }}
      />

      <SetupChecklist organizationId={profile?.organization_id ?? null} steps={steps} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        {stats.map(s => (
          <div
            key={s.label}
            className="bg-app-surface rounded-2xl border border-app-border px-6 py-5 flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-app-muted">
                {s.label}
              </p>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            </div>
            <p className="font-sora font-bold text-4xl text-app-text leading-none tracking-tight">
              {s.value}
            </p>
            <p className="text-xs text-app-muted">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ProposalTable proposals={proposals as any} currentUserId={user.id} />
    </div>
  )
}
