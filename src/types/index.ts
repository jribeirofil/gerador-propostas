export type ProposalStatus = 'rascunho' | 'enviada' | 'alteracoes_pendentes' | 'arquivada' | 'expirada'
export type OpportunityStatus = 'aberta' | 'ganha' | 'perdida'

export interface Client {
  id?: string
  empresa: string
  cnpj?: string
  contato: string
  cargo?: string
  email?: string
  whatsapp?: string
  colaboradores?: number
  segmento?: string
  created_at?: string
}

export interface ProposalItem {
  id?: string
  proposal_id?: string
  product_id: string
  product_name: string
  description?: string
  quantidade: number
  valor_unitario?: number
  valor_mensal?: number
  valor_setup?: number
  observacoes?: string
}

export interface Proposal {
  id?: string
  client_id?: string
  client?: Client

  // Diagnóstico
  dor_principal?: string
  contexto?: string
  objetivo?: string
  obs_internas?: string

  // Condições
  valor_total_mensal?: number
  valor_setup?: number
  desconto_pct?: number
  validade_dias: number
  forma_pagamento?: string
  prazo_implantacao?: string
  obs_comerciais?: string

  status: ProposalStatus
  items?: ProposalItem[]
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  name: string
  description: string
  icon: string
  default_price_label: string
}

export const PRODUCTS: Product[] = [
  {
    id: 'nr1',
    name: 'Plataforma NR-1',
    description: 'Sistema para mapeamento, gestão e acompanhamento de riscos psicossociais, com relatórios e planos de ação em conformidade com a NR-1.',
    icon: 'chart-bar',
    default_price_label: 'R$ 2,49/colaborador/mês',
  },
  {
    id: 'canal',
    name: 'Canal de Denúncias',
    description: 'Canal anônimo, adequado à LGPD, com dashboard de gestão em tempo real, relatórios auditáveis e estrutura para recebimento e tratamento de denúncias.',
    icon: 'shield',
    default_price_label: 'R$ 2,49–3,49/colaborador/mês',
  },
  {
    id: 'marketplace',
    name: 'Marketplace Gestão de Vida',
    description: 'Benefício corporativo de bem-estar que conecta colaboradores a uma rede multidisciplinar: psicólogos, nutricionistas, coaches, consultores financeiros e capelães.',
    icon: 'briefcase',
    default_price_label: 'PMPM — sob consulta',
  },
  {
    id: 'palestras',
    name: 'Palestras e Treinamentos',
    description: 'Programas educativos para lideranças e colaboradores sobre saúde mental, prevenção, cultura organizacional e riscos psicossociais.',
    icon: 'users',
    default_price_label: 'Sob consulta',
  },
  {
    id: 'ecossistema',
    name: 'Pacote Ecossistema',
    description: 'Combinação estratégica entre diagnóstico, prevenção, educação, canal de denúncia e intervenção humana qualificada.',
    icon: 'layout-grid',
    default_price_label: 'Personalizado',
  },
]

export const MOTIVACOES_SUGERIDAS = [
  'Adequação à NR-1',
  'Mapeamento de riscos psicossociais',
  'Plano de ação pós-mapeamento',
  'Canal de denúncias',
  'Saúde mental dos colaboradores',
  'Benefício de bem-estar',
  'Redução de afastamentos',
  'Retenção e clima organizacional',
]

/** @deprecated use MOTIVACOES_SUGERIDAS */
export const DORES_SUGERIDAS = MOTIVACOES_SUGERIDAS

export const SEGMENTOS = [
  'Indústria / Manufatura',
  'Logística / Transporte',
  'Agronegócio',
  'Construção Civil',
  'Varejo',
  'Saúde',
  'Tecnologia',
  'Educação',
  'Serviços',
  'Outro',
]
