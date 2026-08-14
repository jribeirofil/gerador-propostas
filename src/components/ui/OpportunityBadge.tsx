const MAP: Record<string, { label: string; className: string; dot: string }> = {
  open:   { label: 'Aberta',  className: 'bg-blue-500/15 text-blue-500 dark:text-blue-400',     dot: 'bg-blue-400' },
  won:    { label: 'Ganha',   className: 'bg-brand-green/20 text-brand-green-deep',                  dot: 'bg-brand-green-deep' },
  lost:   { label: 'Perdida', className: 'bg-red-500/15 text-red-500 dark:text-red-400',         dot: 'bg-red-400' },
}

export default function OpportunityBadge({ status }: { status: string }) {
  const cfg = MAP[status] ?? MAP.open
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
