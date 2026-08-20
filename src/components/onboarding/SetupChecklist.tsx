'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  Rocket,
  Package,
  Users,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'

export interface SetupStep {
  key: string
  title: string
  description: string
  href: string
  done: boolean
  icon: 'empresa' | 'catalogo' | 'template' | 'equipe' | 'proposta'
}

interface Props {
  organizationId: string | null
  steps: SetupStep[]
}

export default function SetupChecklist({ organizationId, steps }: Props) {
  const { resolvedTheme } = useTheme()
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const storageKey = organizationId ? `setup-checklist-dismissed-${organizationId}` : null

  useEffect(() => {
    if (storageKey && localStorage.getItem(storageKey)) {
      setDismissed(true)
    }
  }, [storageKey])

  const doneCount = useMemo(() => steps.filter((s) => s.done).length, [steps])
  const progress = Math.round((doneCount / steps.length) * 100)

  if (dismissed) return null

  const iconMap = {
    empresa: Building2,
    catalogo: Package,
    template: ClipboardList,
    equipe: Users,
    proposta: Rocket,
  }

  return (
    <section
      className="mb-10 bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm"
      aria-label="Configuração inicial"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green/15 flex items-center justify-center flex-shrink-0">
            <Check className="text-brand-green-deep" size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-sora font-semibold text-base text-app-text">
              Configure sua conta
            </h2>
            <p className="text-xs text-app-muted">
              Complete o setup para começar a criar propostas
            </p>
          </div>
        </div>

        {storageKey && (
          <button
            onClick={() => {
              localStorage.setItem(storageKey, '1')
              setDismissed(true)
            }}
            title="Pular configuração"
            className="text-app-muted hover:text-app-text transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <X size={14} />
            Pular por agora
          </button>
        )}
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-app-muted mb-1.5">
          <span>
            {doneCount} de {steps.length} etapas concluídas
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-app-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-green rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {steps.map((step) => {
          const Icon = iconMap[step.icon]
          return (
            <li key={step.key}>
            {step.done ? (
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-brand-green/5 border border-brand-green/15">
                  <span className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
                    <Check size={14} strokeWidth={3} className="text-brand-dark" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-app-text flex items-center gap-2">
                      {step.title}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-green-deep bg-brand-green/20 px-1.5 py-0.5 rounded">
                        Pronto
                      </span>
                    </p>
                    <p className="text-xs text-app-muted truncate">{step.description}</p>
                  </div>
                  <Link href={step.href} className="text-app-muted hover:text-brand-green-deep transition-colors flex items-center gap-1 text-xs font-medium flex-shrink-0">
                    Revisar
                    <ArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <Link
                  href={step.href}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 border border-app-border hover:border-brand-green-deep/40 hover:bg-brand-green/5 transition-all"
                >
                  <span className="w-8 h-8 rounded-full border border-dashed border-app-border flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-app-muted group-hover:text-brand-green-deep transition-colors" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-app-text">{step.title}</p>
                    <p className="text-xs text-app-muted truncate">{step.description}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-app-muted group-hover:text-brand-green-deep transition-colors flex-shrink-0">
                    Configurar
                    <ArrowRight size={12} />
                  </span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}