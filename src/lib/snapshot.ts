import type { CatalogProduct, ProductSnapshot } from '@/types/engine'

// Copia o conteúdo atual do produto para um objeto independente.
// A partir daqui, mudanças futuras no catálogo não afetam mais
// quem já recebeu esse snapshot dentro de uma proposta.
export function buildProductSnapshot(product: CatalogProduct): ProductSnapshot {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    unit_label: product.unit_label || 'unidades',
    benefits: [...product.benefits]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(b => b.title),
    scope: [...product.scope]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => s.title),
    faq: [...product.faq]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(f => ({ question: f.question, answer: f.answer })),
    differentials: [...product.differentials]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(d => d.title),
  }
}
