// ── Category (DB-backed) ────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  color: string
  sort_order: number
  created_at: string
}

export const CATEGORY_COLOR_OPTIONS = [
  { value: 'blue',   label: 'Azul',    classes: 'bg-blue-500/15 text-blue-400',        dot: 'bg-blue-400'       },
  { value: 'green',  label: 'Verde',   classes: 'bg-brand-green/15 text-brand-green-deep', dot: 'bg-brand-green'      },
  { value: 'amber',  label: 'Âmbar',   classes: 'bg-amber-500/15 text-amber-400',      dot: 'bg-amber-400'      },
  { value: 'purple', label: 'Roxo',    classes: 'bg-purple-500/15 text-purple-400',    dot: 'bg-purple-400'     },
  { value: 'rose',   label: 'Rosa',    classes: 'bg-rose-500/15 text-rose-400',        dot: 'bg-rose-400'       },
  { value: 'cyan',   label: 'Ciano',   classes: 'bg-cyan-500/15 text-cyan-400',        dot: 'bg-cyan-400'       },
  { value: 'indigo', label: 'Índigo',  classes: 'bg-indigo-500/15 text-indigo-400',    dot: 'bg-indigo-400'     },
  { value: 'teal',   label: 'Teal',    classes: 'bg-teal-500/15 text-teal-400',        dot: 'bg-teal-400'       },
]

export function getCategoryClasses(color: string): string {
  return CATEGORY_COLOR_OPTIONS.find(c => c.value === color)?.classes ?? 'bg-app-surface2 text-app-muted'
}

// ── Legacy (kept for backwards compat during migration) ─────────────────────

/** @deprecated use Category from DB */
export type ProductCategory = string

/** @deprecated use categories prop loaded from DB */
export const PRODUCT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'compliance',   label: 'Compliance'   },
  { value: 'saude_mental', label: 'Saúde Mental' },
  { value: 'educacao',     label: 'Educação'      },
  { value: 'ecossistema',  label: 'Ecossistema'  },
]

/** @deprecated use getCategoryClasses(category.color) */
export const PRODUCT_CATEGORY_COLORS: Record<string, string> = {
  compliance:   'bg-blue-500/15 text-blue-400',
  saude_mental: 'bg-brand-green/15 text-brand-green-deep',
  educacao:     'bg-amber-500/15 text-amber-400',
  ecossistema:  'bg-purple-500/15 text-purple-400',
}

/** @deprecated use category.name */
export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  compliance:   'Compliance',
  saude_mental: 'Saúde Mental',
  educacao:     'Educação',
  ecossistema:  'Ecossistema',
}

export type CalculationType = 'per_employee' | 'fixed' | 'project' | 'custom'
export type BillingFrequency = 'monthly' | 'one_time' | 'annual'

export const CALCULATION_TYPE_LABELS: Record<CalculationType, string> = {
  per_employee: 'Por vida (quantidade × valor unitário)',
  fixed: 'Valor fixo',
  project: 'Por projeto (cotado caso a caso)',
  custom: 'Personalizado',
}

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  monthly: 'Mensal',
  one_time: 'Pagamento único',
  annual: 'Anual',
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  description: string | null
  active: boolean
  sort_order: number
  unit_label: string
  category: string | null
  calculation_type: CalculationType | null
  billing_frequency: BillingFrequency | null
  default_price_table_id: string | null
  created_at?: string
  updated_at?: string
}

export interface PriceTable {
  id: string
  product_id: string
  name: string
  description: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface PriceTableItem {
  id: string
  price_table_id: string
  minimum_quantity: number
  maximum_quantity: number | null
  unit_price: number
  sort_order: number
  active: boolean
}

export interface ProductListItem {
  id: string
  product_id: string
  title: string
  sort_order: number
  active: boolean
}

export interface ProductFaqItem {
  id: string
  product_id: string
  question: string
  answer: string
  sort_order: number
  active: boolean
}

export type ProductSubItem = ProductListItem | ProductFaqItem

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Gerente',
  seller: 'Vendedor',
  viewer: 'Visualização',
}

export const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-brand-green/15 text-brand-green-deep',
  manager: 'bg-blue-500/15 text-blue-400',
  seller: 'bg-white/10 text-brand-muted',
  viewer: 'bg-white/10 text-brand-muted',
}

export interface AdminUser {
  id: string
  full_name: string | null
  email: string
  role: string
  job_title: string | null
  phone: string | null
  active: boolean
  created_at: string | null
  last_sign_in_at?: string | null
  proposal_count?: number
}

export interface CompanySettings {
  id: string
  company_name: string
  company_site: string | null
  company_email: string | null
  company_phone: string | null
  company_whatsapp: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string | null
  ai_tone: string | null
  updated_at: string | null
}

// Tabelas filhas do produto que seguem o mesmo formato (title + sort_order)
export const SIMPLE_LIST_TABLES = {
  benefit: 'product_benefit',
  scope: 'product_scope',
  differential: 'product_differential',
} as const

export type SimpleListType = keyof typeof SIMPLE_LIST_TABLES

export const SIMPLE_LIST_LABELS: Record<SimpleListType, { singular: string; plural: string }> = {
  benefit: { singular: 'Benefício', plural: 'Benefícios' },
  scope: { singular: 'Item de escopo', plural: 'Escopo' },
  differential: { singular: 'Diferencial', plural: 'Diferenciais' },
}
