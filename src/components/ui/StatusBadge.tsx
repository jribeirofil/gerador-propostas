import type { ProposalStatus } from '@/types'

const MAP: Record<string, { label: string; className: string }> = {
  // valores DB (inglês)
  draft:            { label: 'Rascunho',            className: 'bg-overlay-md text-app-muted' },
  sent:             { label: 'Enviada',              className: 'bg-blue-500/20 text-blue-500 dark:text-blue-400' },
  archived:         { label: 'Arquivada',            className: 'bg-overlay text-app-muted/60' },
  // computados
  rascunho:         { label: 'Rascunho',            className: 'bg-overlay-md text-app-muted' },
  enviada:          { label: 'Enviada',              className: 'bg-blue-500/20 text-blue-500 dark:text-blue-400' },
  alteracoes_pendentes: { label: 'Alt. pendentes',  className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  arquivada:        { label: 'Arquivada',            className: 'bg-overlay text-app-muted/60' },
  expirada:         { label: 'Expirada',             className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  // legado (compatibilidade de migração)
  gerada:           { label: 'Rascunho',            className: 'bg-overlay-md text-app-muted' },
  aprovada:         { label: 'Enviada',              className: 'bg-blue-500/20 text-blue-500 dark:text-blue-400' },
  perdida:          { label: 'Enviada',              className: 'bg-blue-500/20 text-blue-500 dark:text-blue-400' },
  generated:        { label: 'Rascunho',            className: 'bg-overlay-md text-app-muted' },
  approved:         { label: 'Enviada',              className: 'bg-blue-500/20 text-blue-500 dark:text-blue-400' },
  lost:             { label: 'Enviada',              className: 'bg-blue-500/20 text-blue-500 dark:text-blue-400' },
}

export default function StatusBadge({ status }: { status: string }) {
  const cfg = MAP[status] ?? MAP.rascunho
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
