import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type DecisionType = 'approved' | 'adjustments' | 'declined'

const ALLOWED_TYPES: DecisionType[] = ['approved', 'adjustments', 'declined']

const MAX_NAME    = 100
const MAX_EMAIL   = 254
const MAX_CARGO   = 100
const MAX_COMMENT = 1000

const ALLOWED_DECLINE_REASONS = new Set([
  'Sem orçamento',
  'Não é prioridade agora',
  'Fechamos com outro fornecedor',
  'Solução não atende',
  'Outro',
])

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= MAX_EMAIL
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const body = await req.json()
    const type    = body.type as string
    const comment = typeof body.comment === 'string' ? body.comment.slice(0, MAX_COMMENT) : undefined
    const reason  = typeof body.reason  === 'string' ? body.reason  : undefined
    const name    = typeof body.name    === 'string' ? body.name.trim().slice(0, MAX_NAME)   : undefined
    const email   = typeof body.email   === 'string' ? body.email.trim().slice(0, MAX_EMAIL) : undefined
    const cargo   = typeof body.cargo   === 'string' ? body.cargo.trim().slice(0, MAX_CARGO) : undefined

    if (!ALLOWED_TYPES.includes(type as DecisionType)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    // Aprovação e ajustes exigem identificação
    if (type === 'approved' || type === 'adjustments') {
      if (!name || name.length === 0) {
        return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
      }
      if (!email || !isValidEmail(email)) {
        return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
      }
    }

    // Recusa exige motivo da whitelist
    if (type === 'declined' && (!reason || !ALLOWED_DECLINE_REASONS.has(reason))) {
      return NextResponse.json({ error: 'Motivo inválido' }, { status: 400 })
    }

    const db = createAdminClient()

    const { data: proposal, error } = await db
      .from('proposal')
      .select('id, status, opportunity_status')
      .eq('public_token', params.token)
      .single()

    if (error || !proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
    }

    // Bloqueia re-decisão para oportunidades já fechadas (exceto ajustes)
    const oppStatus = proposal.opportunity_status as string | null
    if (type !== 'adjustments' && (oppStatus === 'won' || oppStatus === 'lost')) {
      return NextResponse.json({ error: 'Decisão já registrada' }, { status: 409 })
    }

    if (type === 'approved') {
      await db.from('proposal').update({ opportunity_status: 'won' }).eq('id', proposal.id)
      await db.from('proposal_event').insert({
        proposal_id: proposal.id,
        event_type: 'opportunity_won',
        metadata: {
          name,
          email,
          ...(cargo   ? { cargo }   : {}),
          ...(comment ? { comment } : {}),
        },
      })
    } else if (type === 'adjustments') {
      await db.from('proposal').update({ has_pending_review: true }).eq('id', proposal.id)
      await db.from('proposal_event').insert({
        proposal_id: proposal.id,
        event_type: 'adjustments_requested',
        metadata: {
          name,
          email,
          ...(cargo   ? { cargo }   : {}),
          comment: comment || '',
        },
      })
    } else if (type === 'declined') {
      await db.from('proposal').update({
        opportunity_status: 'lost',
        lost_reason: reason || null,
        lost_comment: comment || null,
      }).eq('id', proposal.id)
      await db.from('proposal_event').insert({
        proposal_id: proposal.id,
        event_type: 'opportunity_lost',
        metadata: {
          reason: reason || '',
          ...(comment ? { comment } : {}),
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
