'use client'
import { useState } from 'react'

const DECLINE_REASONS = [
  'Sem orçamento',
  'Não é prioridade agora',
  'Fechamos com outro fornecedor',
  'Solução não atende',
  'Outro',
]

type View =
  | 'idle'
  | 'approve-modal'
  | 'adjust-modal'
  | 'decline-modal'
  | 'done-approve'
  | 'done-adjust'
  | 'done-decline'

const MAX_NAME    = 100
const MAX_EMAIL   = 254
const MAX_CARGO   = 100
const MAX_COMMENT = 1000

const DECLINE_REASON_WHITELIST = new Set(DECLINE_REASONS)

interface Props {
  token: string
  opportunityStatus: string
  primaryColor?: string
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function darken(hex: string, percent: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const amt = Math.round((percent / 100) * 255)
  const chan = (value: number) => Math.max(0, value - amt).toString(16).padStart(2, '0')
  return `#${chan(parseInt(h.substring(0, 2), 16))}${chan(parseInt(h.substring(2, 4), 16))}${chan(parseInt(h.substring(4, 6), 16))}`
}

function isLight(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length !== 6) return true
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export default function ProposalDecision({ token, opportunityStatus, primaryColor = '#4F46E5' }: Props) {
  const brand = primaryColor || '#4F46E5'
  const brandVars = {
    '--brand': brand,
    '--brand-hover': darken(brand, 10),
    '--brand-text': isLight(brand) ? '#0f1318' : '#ffffff',
  } as React.CSSProperties
  const alreadyApproved = opportunityStatus === 'won'
  const alreadyDeclined = opportunityStatus === 'lost'

  const [view, setView]         = useState<View>('idle')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [cargo, setCargo]       = useState('')
  const [approveComment, setApproveComment] = useState('')
  const [adjustDesc, setAdjustDesc]         = useState('')
  const [declineReason, setDeclineReason]   = useState('')
  const [declineComment, setDeclineComment] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  function closeModal() {
    setError(null)
    setView('idle')
  }

  async function call(body: object) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/p/${token}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao registrar decisão')
      }
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    const ok = await call({
      type: 'approved',
      name: name.trim().slice(0, MAX_NAME),
      email: email.trim().slice(0, MAX_EMAIL),
      cargo: cargo.trim().slice(0, MAX_CARGO) || undefined,
      comment: approveComment.trim().slice(0, MAX_COMMENT) || undefined,
    })
    if (ok) setView('done-approve')
  }

  async function handleAdjust() {
    const desc = adjustDesc.trim().slice(0, MAX_COMMENT)
    if (!desc) return
    const ok = await call({
      type: 'adjustments',
      name: name.trim().slice(0, MAX_NAME),
      email: email.trim().slice(0, MAX_EMAIL),
      cargo: cargo.trim().slice(0, MAX_CARGO) || undefined,
      comment: desc,
    })
    if (ok) setView('done-adjust')
  }

  async function handleDecline() {
    if (!declineReason || !DECLINE_REASON_WHITELIST.has(declineReason)) return
    const comment = declineComment.trim().slice(0, MAX_COMMENT) || undefined
    const ok = await call({ type: 'declined', reason: declineReason, comment })
    if (ok) setView('done-decline')
  }

  const identValid = name.trim().length > 0 && isValidEmail(email.trim())

  if (alreadyApproved) {
    return (
      <div style={brandVars}>
        <DecisionSection>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: hexToRgba(brand, 0.2) }}>
              <span className="text-lg" style={{ color: darken(brand, 25) }}>✓</span>
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-1">Proposta aprovada</p>
            <p className="text-gray-500 text-sm">A decisão já foi registrada. Nossa equipe entrará em contato.</p>
          </div>
        </DecisionSection>
      </div>
    )
  }

  if (alreadyDeclined) {
    return (
      <div style={brandVars}>
        <DecisionSection>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Decisão registrada. Obrigado pelo retorno.</p>
          </div>
        </DecisionSection>
      </div>
    )
  }

  return (
    <div style={brandVars}>
      <DecisionSection>
        {view === 'idle' && (
          <div className="text-center max-w-lg mx-auto">
            <p className="text-gray-900 text-2xl font-light mb-3">Gostou da proposta?</p>
            <p className="text-gray-500 text-sm leading-relaxed mb-10">
              Estamos prontos para avançar ou esclarecer qualquer dúvida.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setView('approve-modal')}
                className="px-8 py-3 bg-[var(--brand)] text-[var(--brand-text)] text-sm font-semibold rounded-xl hover:bg-[var(--brand-hover)] transition-colors"
              >
                Aprovar proposta
              </button>
              <button
                onClick={() => setView('adjust-modal')}
                className="px-8 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Solicitar ajustes
              </button>
            </div>
            <button
              onClick={() => setView('decline-modal')}
              className="mt-7 text-xs text-gray-400 hover:text-gray-500 transition-colors underline underline-offset-2"
            >
              Não seguir neste momento
            </button>
          </div>
        )}

        {view === 'done-approve' && (
          <div className="text-center max-w-lg mx-auto">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: hexToRgba(brand, 0.2) }}>
              <span className="text-lg" style={{ color: darken(brand, 25) }}>✓</span>
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-2">Ótima notícia! Aprovação registrada.</p>
            <p className="text-gray-500 text-sm leading-relaxed">Nossa equipe entrará em contato para os próximos passos.</p>
          </div>
        )}

        {view === 'done-adjust' && (
          <div className="text-center max-w-lg mx-auto">
            <p className="text-gray-900 font-semibold text-lg mb-2">Solicitação enviada.</p>
            <p className="text-gray-500 text-sm leading-relaxed">Em breve nossa equipe entrará em contato.</p>
          </div>
        )}

        {view === 'done-decline' && (
          <div className="text-center max-w-lg mx-auto">
            <p className="text-gray-900 font-semibold text-lg mb-2">Entendido.</p>
            <p className="text-gray-500 text-sm leading-relaxed">Obrigado pelo retorno — é muito valioso para nós.</p>
          </div>
        )}
      </DecisionSection>

      {/* ── Approve modal ──────────────────────────────── */}
      {view === 'approve-modal' && (
        <Modal onClose={closeModal}>
          <p className="text-gray-900 font-semibold text-lg mb-1">Confirmar aprovação</p>
          <p className="text-gray-500 text-sm mb-6">Para confirmar, precisamos registrar sua identificação.</p>

          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value.slice(0, MAX_NAME))}
                  placeholder="Seu nome"
                  autoFocus
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                <input
                  type="text"
                  value={cargo}
                  onChange={e => setCargo(e.target.value.slice(0, MAX_CARGO))}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                E-mail <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value.slice(0, MAX_EMAIL))}
                placeholder="seu@email.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Comentário <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={approveComment}
                onChange={e => setApproveComment(e.target.value.slice(0, MAX_COMMENT))}
                rows={3}
                maxLength={MAX_COMMENT}
                placeholder="Ex: Aprovado. Vamos seguir."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleApprove}
              disabled={loading || !identValid}
              className="w-full py-3 bg-[var(--brand)] text-[var(--brand-text)] text-sm font-semibold rounded-xl hover:bg-[var(--brand-hover)] transition-colors disabled:opacity-40"
            >
              {loading ? 'Registrando...' : 'Confirmar aprovação'}
            </button>
            <button onClick={closeModal} disabled={loading} className={cancelClass}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* ── Adjust modal ───────────────────────────────── */}
      {view === 'adjust-modal' && (
        <Modal onClose={closeModal}>
          <p className="text-gray-900 font-semibold text-lg mb-1">Solicitar ajustes</p>
          <p className="text-gray-500 text-sm mb-6">Descreva o que você gostaria de ajustar.</p>

          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value.slice(0, MAX_NAME))}
                  placeholder="Seu nome"
                  autoFocus
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                <input
                  type="text"
                  value={cargo}
                  onChange={e => setCargo(e.target.value.slice(0, MAX_CARGO))}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                E-mail <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value.slice(0, MAX_EMAIL))}
                placeholder="seu@email.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Descrição dos ajustes <span className="text-red-400">*</span>
              </label>
              <textarea
                value={adjustDesc}
                onChange={e => setAdjustDesc(e.target.value.slice(0, MAX_COMMENT))}
                rows={4}
                maxLength={MAX_COMMENT}
                placeholder="Ex: Remover o Marketplace e parcelar a implantação."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAdjust}
              disabled={loading || !identValid || !adjustDesc.trim()}
              className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {loading ? 'Enviando...' : 'Enviar solicitação'}
            </button>
            <button onClick={closeModal} disabled={loading} className={cancelClass}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* ── Decline modal ──────────────────────────────── */}
      {view === 'decline-modal' && (
        <Modal onClose={closeModal}>
          <p className="text-gray-900 font-semibold text-lg mb-2">Tudo bem.</p>
          <p className="text-gray-500 text-sm mb-5">Gostaríamos de entender o motivo da decisão.</p>
          <div className="space-y-2 mb-5">
            {DECLINE_REASONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setDeclineReason(r)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-colors ${
                  declineReason === r
                    ? 'border-gray-400 bg-gray-50 text-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  declineReason === r ? 'border-gray-800' : 'border-gray-300'
                }`}>
                  {declineReason === r && <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />}
                </div>
                {r}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Gostaria de deixar algum comentário? <span className="font-normal">(opcional)</span>
            </label>
            <textarea
              value={declineComment}
              onChange={e => setDeclineComment(e.target.value.slice(0, MAX_COMMENT))}
              rows={3}
              maxLength={MAX_COMMENT}
              placeholder="Se quiser, deixe um comentário..."
              className={`${inputClass} resize-none`}
            />
          </div>
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
          <div className="flex flex-col gap-2 mt-5">
            <button
              onClick={handleDecline}
              disabled={loading || !declineReason}
              className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {loading ? 'Registrando...' : 'Confirmar'}
            </button>
            <button onClick={closeModal} disabled={loading} className={cancelClass}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const inputClass =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400'

const cancelClass =
  'w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors'

function DecisionSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-100 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-20 lg:py-28">
        {children}
      </div>
    </section>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
