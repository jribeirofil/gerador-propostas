import type { SupabaseClient } from '@supabase/supabase-js'
import type { Json } from '@/types/database.types'

export type BlockType =
  | 'cover' | 'cenario' | 'objetivos' | 'solucao' | 'beneficios'
  | 'escopo' | 'diferenciais' | 'faq' | 'proximos_passos' | 'sobre'
  | 'investimento' | 'assinatura'

export const REQUIRED_BLOCKS: readonly BlockType[] = ['cover', 'solucao', 'investimento', 'assinatura']

export const BLOCK_LABELS: Record<BlockType, string> = {
  cover: 'Capa',
  cenario: 'Cenário',
  objetivos: 'Objetivos',
  solucao: 'Solução',
  beneficios: 'Benefícios',
  escopo: 'Escopo',
  diferenciais: 'Diferenciais',
  faq: 'FAQ',
  proximos_passos: 'Próximos Passos',
  sobre: 'Sobre a empresa',
  investimento: 'Investimento',
  assinatura: 'Assinatura',
}

export type SectionOrigin = 'proposta' | 'variavel' | 'manual' | 'produto' | 'empresa' | 'usuario'

export const SECTION_ORIGINS: Record<BlockType, SectionOrigin> = {
  cover:           'proposta',
  cenario:         'variavel',
  objetivos:       'manual',
  solucao:         'manual',
  beneficios:      'produto',
  escopo:          'produto',
  diferenciais:    'produto',
  faq:             'produto',
  proximos_passos: 'manual',
  sobre:           'empresa',
  investimento:    'proposta',
  assinatura:      'usuario',
}

export const LIBRARY_BLOCK_TYPES: BlockType[] = ['diferenciais', 'faq', 'proximos_passos']
export const AI_BLOCK_TYPES: BlockType[] = ['diferenciais', 'proximos_passos']
export const PRODUCT_DERIVED_BLOCKS: BlockType[] = ['beneficios', 'escopo', 'diferenciais', 'faq']
export const AUTO_RENDER_BLOCKS: BlockType[] = ['cover', 'solucao', 'investimento', 'assinatura']

export const DEFAULT_BLOCK_ORDER: BlockType[] = [
  'cover', 'solucao', 'beneficios', 'escopo',
  'diferenciais', 'faq', 'proximos_passos', 'investimento', 'assinatura',
]

export interface ProposalBlock {
  id: string
  proposal_id: string
  type: BlockType
  title: string | null
  content_json: Json
  enabled: boolean
  sort_order: number
}

export interface TextContent { text: string }
export interface ListContent { items: string[] }
export interface FaqItem { question: string; answer: string }
export interface FaqContent { items: FaqItem[] }

export interface ProductBlockContent {
  beneficios: string[]
  escopo: string[]
  diferenciais: string[]
  faq: FaqItem[]
}

function fallbackContent(type: BlockType, productContent?: ProductBlockContent): Json {
  switch (type) {
    case 'proximos_passos':
      return { items: [] } as unknown as Json
    case 'beneficios':
      return { items: productContent?.beneficios || [] } as unknown as Json
    case 'escopo':
      return { items: productContent?.escopo || [] } as unknown as Json
    case 'diferenciais':
      return { items: productContent?.diferenciais || [] } as unknown as Json
    case 'faq':
      return { items: productContent?.faq || [] } as unknown as Json
    default:
      return {} as unknown as Json
  }
}

/**
 * Resolves which template to use based on selected product slugs.
 * Priority: single match → default → first available → null
 */
export async function resolveTemplate(
  supabase: SupabaseClient,
  productSlugs: string[]
): Promise<string | null> {
  const { data: templates } = await supabase
    .from('proposal_template')
    .select('id, is_default, product_slugs')

  if (!templates || templates.length === 0) return null

  const candidates = productSlugs.length > 0
    ? templates.filter(t =>
        Array.isArray(t.product_slugs) &&
        t.product_slugs.some((s: string) => productSlugs.includes(s))
      )
    : []

  if (candidates.length === 1) return candidates[0].id

  // Multiple matches or no matches → default template
  const defaultTpl = templates.find(t => t.is_default)
  return defaultTpl?.id ?? templates[0]?.id ?? null
}

export async function createBlocksFromTemplate(
  supabase: SupabaseClient,
  proposalId: string,
  templateId: string | null,
  productContent?: ProductBlockContent
): Promise<void> {
  let templateBlocks: {
    type: string
    sort_order: number
    enabled: boolean
    title: string | null
    default_content: Json
  }[] = []

  if (templateId) {
    const { data } = await supabase
      .from('template_block')
      .select('type, sort_order, enabled, title, default_content')
      .eq('template_id', templateId)
      .order('sort_order')
    templateBlocks = data || []
  }

  if (templateBlocks.length === 0) {
    templateBlocks = DEFAULT_BLOCK_ORDER.map((type, idx) => ({
      type,
      sort_order: idx,
      enabled: true,
      title: BLOCK_LABELS[type],
      default_content: fallbackContent(type, productContent),
    }))
  } else if (productContent) {
    // Merge product content into template defaults for product-derived blocks
    templateBlocks = templateBlocks.map(b => {
      const type = b.type as BlockType
      if (!PRODUCT_DERIVED_BLOCKS.includes(type)) return b
      const pc = fallbackContent(type, productContent)
      const templateItems = (b.default_content as unknown as ListContent | FaqContent)?.items || []
      const productItems = (pc as unknown as ListContent | FaqContent)?.items || []
      // Merge: template items first, then product items (dedup for strings)
      const merged =
        type === 'faq'
          ? [...(templateItems as FaqItem[]), ...(productItems as FaqItem[])]
          : [
              ...(templateItems as string[]),
              ...(productItems as string[]).filter(pi => !(templateItems as string[]).includes(pi)),
            ]
      return { ...b, default_content: { items: merged } as unknown as Json }
    })
  }

  const { error } = await supabase.from('proposal_block').insert(
    templateBlocks.map(b => ({
      proposal_id: proposalId,
      type: b.type,
      sort_order: b.sort_order,
      enabled: b.enabled,
      title: b.title ?? BLOCK_LABELS[b.type as BlockType] ?? b.type,
      content_json: b.default_content,
    }))
  )
  if (error) throw new Error(`createBlocksFromTemplate: ${error.message} (${error.code})`)
}

export async function copyBlocksFromProposal(
  supabase: SupabaseClient,
  targetProposalId: string,
  sourceProposalId: string
): Promise<void> {
  const { data: blocks } = await supabase
    .from('proposal_block')
    .select('type, sort_order, enabled, title, content_json')
    .eq('proposal_id', sourceProposalId)
    .order('sort_order')

  if (!blocks || blocks.length === 0) {
    await createBlocksFromTemplate(supabase, targetProposalId, null)
    return
  }

  await supabase.from('proposal_block').insert(
    blocks.map(b => ({
      proposal_id: targetProposalId,
      type: b.type,
      sort_order: b.sort_order,
      enabled: b.enabled,
      title: b.title,
      content_json: b.content_json,
    }))
  )
}
