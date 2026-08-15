'use client'

const STEPS = ['Cliente', 'Produtos', 'Preços', 'Condições', 'Resumo']

interface Props {
  current: number
  onStepClick?: (step: number) => void
}

export default function StepIndicator({ current, onStepClick }: Props) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        const clickable = !!onStepClick && n !== current
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => clickable && onStepClick?.(n)}
                disabled={!clickable}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-brand-green-deep text-white'
                    : active
                    ? 'bg-brand-green text-brand-dark'
                    : 'bg-overlay-md text-app-muted border border-overlay'
                } ${clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              >
                {done ? '✓' : n}
              </button>
              <span
                onClick={() => clickable && onStepClick?.(n)}
                className={`text-xs mt-1 whitespace-nowrap transition-colors ${
                  active ? 'text-app-text font-medium' : 'text-app-muted'
                } ${clickable ? 'cursor-pointer hover:text-app-text' : ''}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-5 ${done ? 'bg-brand-green-deep' : 'bg-overlay-md'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
