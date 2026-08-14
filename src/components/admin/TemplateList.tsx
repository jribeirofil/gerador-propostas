'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface TemplateRow {
  id: string
  name: string
  description: string | null
  is_default: boolean
  product_slugs: string[]
  blockCount: number
  productNames: string[]
}

interface Props {
  initialTemplates: TemplateRow[]
}

export default function TemplateList({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [deleteTarget, setDeleteTarget] = useState<TemplateRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!openMenuId) return
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openMenuId])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    const res = await fetch(`/api/templates/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id))
      setDeleteTarget(null)
    } else {
      const data = await res.json().catch(() => ({}))
      setDeleteError(data.error || 'Erro ao excluir template.')
    }
    setDeleting(false)
  }

  async function handleDuplicate(template: TemplateRow) {
    setDuplicating(template.id)
    setOpenMenuId(null)
    const res = await fetch(`/api/templates/${template.id}`, { method: 'POST' })
    if (res.ok) {
      const { id } = await res.json()
      router.push(`/dashboard/admin/templates/${id}`)
    }
    setDuplicating(null)
  }

  if (templates.length === 0) {
    return (
      <div className="bg-app-surface rounded-2xl border border-app-border p-16 text-center shadow-sm">
        <p className="text-sm font-semibold text-app-text mb-1.5">Nenhum template criado ainda.</p>
        <p className="text-xs text-app-muted">Crie um template para padronizar a estrutura das propostas.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => {
          const isMenuOpen = openMenuId === t.id
          return (
            <div
              key={t.id}
              onClick={() => router.push(`/dashboard/admin/templates/${t.id}`)}
              className="bg-app-surface border border-app-border rounded-2xl p-5 flex items-start justify-between gap-4 hover:bg-[var(--row-hover)] transition-colors cursor-pointer shadow-sm"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-app-text truncate">{t.name}</h3>
                  {t.is_default && (
                    <span className="shrink-0 text-[11px] bg-brand-green/15 text-brand-green-deep px-2 py-0.5 rounded-full font-medium">
                      Padrão
                    </span>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-app-muted mb-2 line-clamp-2">{t.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-app-muted">
                  <span>{t.blockCount} blocos</span>
                  {t.productNames.length > 0 && (
                    <span className="truncate max-w-xs">
                      {t.productNames.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="relative shrink-0" ref={isMenuOpen ? menuRef : undefined} onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setOpenMenuId(isMenuOpen ? null : t.id)}
                  className="w-8 h-8 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] rounded-lg transition-colors text-base"
                >
                  ⋯
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-app-surface border border-app-border rounded-xl overflow-hidden shadow-card-md z-30">
                    <button
                      type="button"
                      onClick={() => { setOpenMenuId(null); router.push(`/dashboard/admin/templates/${t.id}`) }}
                      className="w-full flex px-4 py-2.5 text-sm text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(t)}
                      disabled={duplicating === t.id}
                      className="w-full flex px-4 py-2.5 text-sm text-app-muted hover:text-app-text hover:bg-[var(--row-hover)] transition-colors disabled:opacity-50"
                    >
                      {duplicating === t.id ? 'Duplicando...' : 'Duplicar'}
                    </button>
                    <div className="border-t border-app-border my-0.5" />
                    <button
                      type="button"
                      onClick={() => { setOpenMenuId(null); setDeleteTarget(t) }}
                      className="w-full flex px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-[var(--row-hover)] transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Excluir "${deleteTarget?.name}"?`}
        description="Esta ação remove o template permanentemente. As propostas existentes não serão afetadas."
        error={deleteError}
        variant="danger"
        confirmText="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { if (!deleting) { setDeleteTarget(null); setDeleteError(null) } }}
      />
    </>
  )
}
