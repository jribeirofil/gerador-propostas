import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgIdForUser } from '@/lib/org'
import { BLOCK_LABELS, type BlockType } from '@/lib/blocks'

const OPERATION_PROMPTS = {
  improve: 'Melhore o texto a seguir, tornando-o mais claro, profissional e convincente. Mantenha o idioma (português) e o tamanho aproximado. Retorne apenas o texto melhorado, sem explicações.',
  rewrite: 'Reescreva o texto a seguir com novas palavras e estrutura, mas preservando o mesmo significado. Retorne apenas o texto reescrito, sem explicações.',
  expand: 'Expanda o texto a seguir, adicionando mais detalhes, exemplos ou contexto relevante. Mantenha o idioma (português). Retorne apenas o texto expandido, sem explicações.',
} as const

type Operation = keyof typeof OPERATION_PROMPTS

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const orgId = await getOrgIdForUser(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada.' }, { status: 500 })

  const body = await req.json()
  const { operation, content, blockType } = body as {
    operation: Operation
    content: string
    blockType: BlockType
  }

  if (!operation || !content || !OPERATION_PROMPTS[operation]) {
    return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
  }

  const db = createAdminClient()

  const [blockRes, settingsRes, proposalRes] = await Promise.all([
    db.from('proposal_block').select('id').eq('id', params.blockId).eq('proposal_id', params.id).single(),
    db.from('company_settings').select('ai_tone').eq('organization_id', orgId).limit(1).maybeSingle(),
    db.from('proposal').select('id').eq('id', params.id).eq('organization_id', orgId).maybeSingle(),
  ])

  if (!blockRes.data || !proposalRes.data) return NextResponse.json({ error: 'Bloco não encontrado.' }, { status: 404 })

  const aiTone = settingsRes.data?.ai_tone

  const anthropic = new Anthropic({ apiKey })
  const blockLabel = BLOCK_LABELS[blockType] || blockType

  const toneInstruction = aiTone
    ? `\n\nInstrução de tom: ${aiTone}`
    : ''

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
  if (result.type !== 'text') {
    return NextResponse.json({ error: 'Resposta inesperada da IA.' }, { status: 500 })
  }

  return NextResponse.json({ result: result.text.trim() })
}
