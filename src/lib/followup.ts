export interface FollowupProposal {
  status: string | null
  opportunity_status: string | null
  sent_at: string | null
  followup_days: number | null
}

const DEFAULT_FOLLOWUP_DAYS = 3

export const DECIDED_STATUSES = ['won', 'lost'] as const

/**
 * Uma proposta está "parada" quando foi enviada (status 'sent'), passou o
 * prazo de follow-up (sent_at + followup_days) e ainda não houve decisão.
 */
export function isStalled(p: FollowupProposal, now: Date = new Date()): boolean {
  if (p.status !== 'sent') return false
  if (!p.sent_at) return false
  if (p.opportunity_status && DECIDED_STATUSES.includes(p.opportunity_status as typeof DECIDED_STATUSES[number])) {
    return false
  }
  return daysStalled(p, now) > (p.followup_days ?? DEFAULT_FOLLOWUP_DAYS)
}

/**
 * Quantos dias (inteiros) a proposta está parada desde o envio.
 * 0 se sem sent_at ou se ainda não passou 1 dia.
 */
export function daysStalled(p: FollowupProposal, now: Date = new Date()): number {
  if (!p.sent_at) return 0
  const sent = new Date(p.sent_at)
  const ms = now.getTime() - sent.getTime()
  if (ms <= 0) return 0
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

/** Link wa.me com mensagem pronta para o nudge de follow-up. */
export function buildWhatsAppNudgeUrl(
  phone: string,
  message: string
): string {
  const digits = phone.replace(/\D/g, '')
  const withCountry = digits.length === 11 || digits.length === 10 ? `55${digits}` : digits
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`
}
