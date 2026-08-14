'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Props {
  companyName: string
  clientName: string
  pdfUrl: string
  backUrl?: string
}

export default function WebPreviewHeader({ companyName, clientName, pdfUrl, backUrl }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownloadPdf() {
    setLoading(true)
    try {
      const res = await fetch(pdfUrl)
      const { html } = await res.json()
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;'
      document.body.appendChild(iframe)
      iframe.srcdoc = html
      iframe.onload = () => {
        iframe.contentWindow?.print()
        setTimeout(() => document.body.removeChild(iframe), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const brand = (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-[#1FE97C]" />
      <span className="text-sm font-semibold text-gray-900">{companyName}</span>
    </div>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {backUrl ? (
            <Link href={backUrl} className="flex-shrink-0 hover:opacity-70 transition-opacity">
              {brand}
            </Link>
          ) : (
            <div className="flex-shrink-0">{brand}</div>
          )}
          {clientName && (
            <>
              <span className="text-gray-300 hidden sm:block select-none">·</span>
              <span className="text-sm text-gray-400 truncate hidden sm:block">{clientName}</span>
            </>
          )}
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={loading}
          className="flex-shrink-0 px-4 py-1.5 text-xs font-semibold text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
        >
          {loading ? 'Gerando...' : 'Baixar PDF'}
        </button>
      </div>
    </header>
  )
}
