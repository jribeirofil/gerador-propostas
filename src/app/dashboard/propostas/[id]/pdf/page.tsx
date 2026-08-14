'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface ProposalMeta {
  id: string
  status: string
  version: number
  version_group: string
  is_archived: boolean
  client: { empresa: string } | null
}

export default function PdfPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const [html, setHtml] = useState<string | null>(null)
  const [proposal, setProposal] = useState<ProposalMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    fetch(`/api/proposals/${id}/pdf`)
      .then(r => r.json())
      .then(data => {
        setHtml(data.html)
        setProposal(data.proposal ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  function downloadPdf() {
    const iframe = document.getElementById('pdf-frame') as HTMLIFrameElement
    iframe?.contentWindow?.print()
  }

  async function handleArchive() {
    if (!proposal) return
    setArchiving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('proposal')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq('id', proposal.id)

    if (error) {
      showToast('Não foi possível arquivar a proposta.', 'error')
      setArchiving(false)
      setArchiveOpen(false)
      return
    }

    await supabase.from('proposal_event').insert({
      proposal_id: proposal.id,
      event_type: 'archived',
      created_by: user?.id,
    })

    showToast('Proposta arquivada.')
    setArchiveOpen(false)
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-app-muted text-sm">
        Carregando proposta...
      </div>
    )
  }

  if (!html) {
    return (
      <div className="text-center py-16">
        <p className="text-app-muted mb-4">Proposta não encontrada.</p>
        <Link href="/dashboard" className="text-brand-green-deep text-sm hover:underline">Voltar ao dashboard</Link>
      </div>
    )
  }

  const empresa = proposal?.client?.empresa || 'Proposta'
  const version = proposal?.version ?? 1

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-sora text-xl font-semibold text-app-text">
            {empresa}
            {version > 1 && (
              <span className="ml-2 text-xs font-normal text-app-muted bg-overlay-md px-2 py-0.5 rounded-full">
                v{version}
              </span>
            )}
          </h1>
          <p className="text-sm text-app-muted mt-0.5">Prévia do documento PDF.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 text-sm text-app-muted border border-overlay rounded-lg hover:border-overlay-md hover:text-app-text transition-colors"
          >
            ← Dashboard
          </Link>
          <Link
            href={`/dashboard/propostas/${id}/preview`}
            className="px-3 py-1.5 text-sm text-app-muted border border-overlay rounded-lg hover:border-overlay-md hover:text-app-text transition-colors"
          >
            Prévia Web
          </Link>
          <Link
            href={`/dashboard/propostas/${id}/blocos`}
            className="px-3 py-1.5 text-sm text-app-muted border border-overlay rounded-lg hover:border-overlay-md hover:text-app-text transition-colors"
          >
            Conteúdo
          </Link>
          <Link
            href={`/dashboard/propostas/${id}/editar`}
            className="px-3 py-1.5 text-sm text-app-muted border border-overlay rounded-lg hover:border-overlay-md hover:text-app-text transition-colors"
          >
            Editar
          </Link>
          <Link
            href={`/dashboard/propostas/${id}/duplicar`}
            className="px-3 py-1.5 text-sm text-app-muted border border-overlay rounded-lg hover:border-overlay-md hover:text-app-text transition-colors"
          >
            Duplicar
          </Link>
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="px-3 py-1.5 text-sm text-app-muted border border-overlay rounded-lg hover:border-overlay-md hover:text-red-400 transition-colors"
          >
            Arquivar
          </button>
          <button
            onClick={downloadPdf}
            className="px-4 py-1.5 bg-brand-green text-brand-dark rounded-lg text-sm font-semibold hover:bg-brand-green-deep hover:text-white transition-colors"
          >
            Exportar PDF ↓
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
        <iframe
          id="pdf-frame"
          srcDoc={html}
          className="w-full border-0"
          style={{ height: '800px' }}
          title="Prévia da proposta"
        />
      </div>

      <p className="text-xs text-app-muted mt-4 text-center">
        No diálogo de impressão, selecione "Salvar como PDF" e desative cabeçalhos/rodapés para melhor resultado.
      </p>

      <ConfirmDialog
        open={archiveOpen}
        title={`Arquivar proposta de ${empresa}?`}
        description="A proposta será removida da listagem principal. Arquivadas não são excluídas permanentemente."
        variant="danger"
        confirmText="Arquivar"
        loading={archiving}
        onConfirm={handleArchive}
        onCancel={() => !archiving && setArchiveOpen(false)}
      />
    </div>
  )
}
