'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-3 py-1.5 text-xs bg-fay-green text-fay-dark font-semibold rounded-lg hover:bg-fay-green-deep hover:text-white transition-colors"
    >
      Imprimir / PDF
    </button>
  )
}
