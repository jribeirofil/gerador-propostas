import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Action {
  label: string
  href: string
}

interface Props {
  icon: LucideIcon
  iconBg?: string
  title: string
  subtitle?: string
  action?: Action
}

export default function PageHeader({
  icon: Icon,
  iconBg = '#1FE97C',
  title,
  subtitle,
  action,
}: Props) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: iconBg }}
        >
          <Icon size={22} strokeWidth={1.75} className="text-white" />
        </div>
        <div>
          <h1 className="font-sora font-bold text-[22px] leading-tight text-app-text">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-app-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-fay-green text-fay-dark rounded-lg text-sm font-semibold hover:bg-fay-green-deep hover:text-white transition-colors shadow-sm"
        >
          <Plus size={15} strokeWidth={2.5} />
          {action.label}
        </Link>
      )}
    </div>
  )
}
