import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 ${className}`}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && (
              <span className="text-app-muted/30 text-xs select-none">/</span>
            )}
            {!isLast && item.href ? (
              <Link
                href={item.href}
                className="text-xs text-app-muted hover:text-app-text transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`text-xs ${isLast ? 'text-app-text font-medium' : 'text-app-muted'}`}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
