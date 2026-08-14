'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-3 py-1.5 text-xs bg-brand-green text-brand-dark font-semibold rounded-lg hover:bg-brand-green-deep hover:text-white transition-colors"
    >
      Imprimir / PDF
    </button>
  )
}
