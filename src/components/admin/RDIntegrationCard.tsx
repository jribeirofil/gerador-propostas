'use client'

interface Props {
  isConnected: boolean
}

export default function RDIntegrationCard({ isConnected }: Props) {
  return (
    <div className="bg-overlay border border-overlay rounded-xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="font-sora font-semibold text-sm text-app-text">RD Station CRM</span>
            {isConnected ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Conectado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-app-muted font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-app-border" />
                Não conectado
              </span>
            )}
          </div>
          <p className="text-xs text-app-muted">
            {isConnected
              ? 'Busca de leads ativa na criação de propostas.'
              : 'Adicione RD_CRM_TOKEN ao .env.local para ativar a busca de leads.'}
          </p>
        </div>
      </div>
    </div>
  )
}
