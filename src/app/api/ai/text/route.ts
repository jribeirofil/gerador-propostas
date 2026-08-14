import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BLOCK_LABELS, type BlockType } from '@/lib/blocks'

const OPERATION_PROMPTS = {
  improve: 'Melhore o texto a seguir, tornando-o mais claro, profissional e convincente. Mantenha o idioma (português) e o tamanho aproximado. Retorne apenas o texto melhorado, sem explicações.',
  rewrite: 'Reescreva o texto a seguir com novas palavras e estrutura, mas preservando o mesmo significado. Retorne apenas o texto reescrito, sem explicações.',
  expand:  'Expanda o texto a seguir, adicionando mais detalhes, exemplos ou contexto relevante. Mantenha o idioma (português). Retorne apenas o texto expandido, sem explicações.',
} as const

type Operation = keyof typeof OPERATION_PROMPTS

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada.' }, { status: 500 })

  const { content, operation, blockType } = await req.json() as {
    content: string
    operation: Operation
    blockType?: BlockType
  }

  if (!content?.trim() || !operation || !OPERATION_PROMPTS[operation]) {
    return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data: settings } = await db.from('company_settings').select('ai_tone').limit(1).maybeSingle()
  const toneInstruction = settings?.ai_tone ? `\n\nInstrução de tom: ${settings.ai_tone}` : ''

  const blockLabel = blockType ? (BLOCK_LABELS[blockType] || blockType) : 'texto de proposta'

  const anthropic = new Anthropic({ apiKey })
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Você está ajudando a redigir o bloco "${blockLabel}" de uma proposta comercial B2B.${toneInstruction}\n\n${OPERATION_PROMPTS[operation]}\n\nTexto:\n${content}`,
      },
    ],
  })

  const result = response.content[0]
  if (result.type !== 'text') return NextResponse.json({ error: 'Resposta inesperada da IA.' }, { status: 500 })

  return NextResponse.json({ result: result.text.trim() })
}
