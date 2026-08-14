import ProposalForm from '@/components/proposal/ProposalForm'
import Breadcrumb from '@/components/ui/Breadcrumb'

export default function NovaProposta() {
  return (
    <div className="w-full min-h-full px-8 py-8 bg-app-bg">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Propostas', href: '/dashboard' },
          { label: 'Nova proposta' },
        ]} className="mb-3" />
        <h1 className="font-sora text-xl font-semibold text-app-text">Nova proposta</h1>
        <p className="text-sm text-app-muted mt-0.5">Preencha os dados para gerar uma proposta comercial.</p>
      </div>
      <ProposalForm />
    </div>
  )
}
