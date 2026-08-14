export interface CatalogBenefit {
  id: string
  title: string
  sort_order: number
}

export interface CatalogScope {
  id: string
  title: string
  sort_order: number
}

export interface CatalogFaq {
  id: string
  question: string
  answer: string
  sort_order: number
}

export interface CatalogDifferential {
  id: string
  title: string
  sort_order: number
}

export interface CatalogProduct {
  id: string
  name: string
  slug: string
  description: string | null
  active: boolean
  sort_order: number
  unit_label: string
  category: string | null
  calculation_type: string | null
  billing_frequency: string | null
  default_price_table_id: string | null
  benefits: CatalogBenefit[]
  scope: CatalogScope[]
  faq: CatalogFaq[]
  differentials: CatalogDifferential[]
}

// Faixa de preço de uma price_table, usada para calcular o unit_value
// automaticamente em produtos com calculation_type = 'per_employee'.
export interface PriceTableItem {
  id: string
  price_table_id: string
  minimum_quantity: number
  maximum_quantity: number | null
  unit_price: number
  sort_order: number
}

// O que fica congelado dentro de proposal_product.snapshot
export interface ProductSnapshot {
  name: string
  slug: string
  description: string | null
  unit_label?: string
  benefits: string[]
  scope: string[]
  faq: { question: string; answer: string }[]
  differentials: string[]
}

export type PricingType = 'monthly' | 'one_time' | 'per_employee' | 'per_project'

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  monthly: 'Mensal',
  per_employee: 'Por colaborador',
  one_time: 'Pagamento único',
  per_project: 'Por projeto',
}

export interface ProductPricing {
  product_id: string
  pricing_type: PricingType
  unit_value: number
  quantity: number
  discount_percent: number
  notes?: string
  manual_override?: boolean
  override_reason?: string
}

export interface ProposalProductDraft {
  product_id: string
  snapshot: ProductSnapshot
  quantity: number
  pricing_type: 'monthly' | 'one_time' | 'per_employee' | 'per_project'
  unit_value?: number
  monthly_value?: number
  setup_value?: number
  notes?: string
}

export type ProposalStatus = 'draft' | 'generated' | 'sent' | 'approved' | 'lost'

export interface ProposalListItem {
  id: string
  title: string
  status: ProposalStatus
  diagnosis: string | null
  total_monthly: number | null
  created_at: string
  client: {
    empresa: string
    contato: string
    colaboradores: number | null
  } | null
}
