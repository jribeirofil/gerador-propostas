'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { ClientSearchResult } from '@/app/api/clients/search/route'

interface Props {
  onSelect: (client: ClientSearchResult) => void
}

export default function ClientSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClientSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ClientSearchResult | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results || [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(client: ClientSearchResult) {
    setSelected(client)
    setOpen(false)
    setQuery('')
    onSelect(client)
  }

  function handleReset() {
    setSelected(null)
    setQuery('')
    setResults([])
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between bg-app-surface border border-app-border rounded-lg px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-app-text truncate">{selected.empresa || selected.contato}</span>
            <SourceBadge source={selected.source} />
          </div>
          {selected.empresa && selected.contato && (
            <p className="text-xs text-app-muted truncate mt-0.5">{selected.contato}{selected.email ? ` · ${selected.email}` : ''}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="ml-3 flex-shrink-0 text-xs text-app-muted hover:text-app-text transition-colors"
        >
          Alterar
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Digite empresa, nome ou e-mail..."
          className="w-full bg-app-surface border border-app-border rounded px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-fay-green-deep transition-colors pl-8 pr-8"
          autoComplete="off"
        />
        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-overlay-md border-t-fay-green rounded-full animate-spin" />
          </div>
        ) : query.length > 0 && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-app-surface border border-overlay rounded-xl overflow-hidden shadow-2xl">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-overlay transition-colors text-left border-b border-overlay last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-app-text font-medium truncate">{r.empresa || r.contato}</span>
                  <SourceBadge source={r.source} />
                </div>
                {r.empresa && r.contato && (
                  <p className="text-xs text-app-muted truncate mt-0.5">{r.contato}</p>
                )}
                {r.email && <p className="text-xs text-app-muted/60 truncate">{r.email}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-app-surface border border-overlay rounded-xl px-4 py-3 shadow-2xl">
          <p className="text-xs text-app-muted">Nenhum cliente encontrado. Preencha os campos abaixo.</p>
        </div>
      )}
    </div>
  )
}

function SourceBadge({ source }: { source: 'local' | 'rd_station' }) {
  if (source === 'rd_station') {
    return (
      <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">
        RD Station
      </span>
    )
  }
  return (
    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-fay-green/15 text-fay-green-deep font-medium">
      Local
    </span>
  )
}
