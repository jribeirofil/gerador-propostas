'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const TABS = [
  { key: 'produtos',    label: 'Produtos' },
  { key: 'categorias',  label: 'Categorias' },
]

export default function ProductsTabs({ active }: { active: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'produtos') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    router.push(`/dashboard/admin/produtos?${params.toString()}`)
  }

  return (
    <div
      className="flex items-center gap-1 mb-6 border-b"
      style={{ borderColor: 'var(--app-border, #e5e7eb)' }}
    >
      {TABS.map(tab => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => navigate(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'text-app-text'
                : 'text-app-muted hover:text-app-text'
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-fay-green-deep rounded-t-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
