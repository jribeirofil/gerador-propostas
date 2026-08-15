import { describe, it, expect } from 'vitest'
import { isStalled, daysStalled, buildWhatsAppNudgeUrl } from './followup'

const NOW = new Date('2026-08-15T12:00:00Z')

function proposal(overrides: Partial<Parameters<typeof isStalled>[0]> = {}) {
  return {
    status: 'sent',
    opportunity_status: 'open',
    sent_at: new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    followup_days: 3,
    ...overrides,
  }
}

describe('isStalled', () => {
  it('marca como parada quando enviada há mais de N dias sem decisão', () => {
    expect(isStalled(proposal(), NOW)).toBe(true)
  })

  it('não marca quando ainda dentro do prazo de follow-up', () => {
    const p = proposal({ sent_at: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() })
    expect(isStalled(p, NOW)).toBe(false)
  })

  it('não marca no limite exato (sent_at + N dias não é parada)', () => {
    const p = proposal({ sent_at: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() })
    expect(isStalled(p, NOW)).toBe(false)
  })

  it('não marca proposta ganha mesmo após o prazo', () => {
    const p = proposal({ opportunity_status: 'won' })
    expect(isStalled(p, NOW)).toBe(false)
  })

  it('não marca proposta perdida mesmo após o prazo', () => {
    const p = proposal({ opportunity_status: 'lost' })
    expect(isStalled(p, NOW)).toBe(false)
  })

  it('não marca rascunho (nunca enviado)', () => {
    const p = proposal({ status: 'draft' })
    expect(isStalled(p, NOW)).toBe(false)
  })

  it('não marca proposta gerada mas não enviada', () => {
    const p = proposal({ status: 'generated' })
    expect(isStalled(p, NOW)).toBe(false)
  })

  it('não marca sem sent_at (dado legado sem data de envio)', () => {
    const p = proposal({ sent_at: null })
    expect(isStalled(p, NOW)).toBe(false)
  })

  it('usa o default 3 dias quando followup_days é null', () => {
    const p = proposal({ followup_days: null, sent_at: new Date(NOW.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() })
    expect(isStalled(p, NOW)).toBe(true)
  })

  it('com followup_days null e 3 dias exatos não marca', () => {
    const p = proposal({ followup_days: null, sent_at: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() })
    expect(isStalled(p, NOW)).toBe(false)
  })

  it('não marca com sent_at no futuro', () => {
    const p = proposal({ sent_at: new Date(NOW.getTime() + 60 * 60 * 1000).toISOString() })
    expect(isStalled(p, NOW)).toBe(false)
  })

  it('não marca oportunidade sem decisão explícita (opportunity_status null)', () => {
    const p = proposal({ opportunity_status: null })
    expect(isStalled(p, NOW)).toBe(true)
  })
})

describe('daysStalled', () => {
  it('conta dias inteiros desde o envio', () => {
    const p = proposal({ sent_at: new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() })
    expect(daysStalled(p, NOW)).toBe(5)
  })

  it('arredonda para baixo (3 dias e 12h → 3)', () => {
    const p = proposal({ sent_at: new Date(NOW.getTime() - (3 * 24 + 12) * 60 * 60 * 1000).toISOString() })
    expect(daysStalled(p, NOW)).toBe(3)
  })

  it('retorna 0 sem sent_at', () => {
    expect(daysStalled(proposal({ sent_at: null }), NOW)).toBe(0)
  })

  it('retorna 0 com sent_at no futuro', () => {
    const p = proposal({ sent_at: new Date(NOW.getTime() + 60 * 60 * 1000).toISOString() })
    expect(daysStalled(p, NOW)).toBe(0)
  })

  it('retorna 0 para envio de hoje', () => {
    const p = proposal({ sent_at: new Date(NOW.getTime() - 60 * 60 * 1000).toISOString() })
    expect(daysStalled(p, NOW)).toBe(0)
  })
})

describe('buildWhatsAppNudgeUrl', () => {
  it('prefixa o código do país quando ausente (11 dígitos)', () => {
    expect(buildWhatsAppNudgeUrl('11987654321', 'oi')).toBe('https://wa.me/5511987654321?text=oi')
  })

  it('remove máscaras de formatação', () => {
    expect(buildWhatsAppNudgeUrl('(11) 98765-4321', 'oi')).toBe('https://wa.me/5511987654321?text=oi')
  })

  it('não duplica o código do país quando já presente', () => {
    expect(buildWhatsAppNudgeUrl('5511987654321', 'oi')).toBe('https://wa.me/5511987654321?text=oi')
  })

  it('codifica a mensagem na URL', () => {
    expect(buildWhatsAppNudgeUrl('11987654321', 'olá, tudo bem? https://x.com/p/abc'))
      .toBe('https://wa.me/5511987654321?text=ol%C3%A1%2C%20tudo%20bem%3F%20https%3A%2F%2Fx.com%2Fp%2Fabc')
  })
})
