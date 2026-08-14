import type { ProductPricing, PricingType } from '@/types/engine'

export interface LineItemCalculation {
  product_id: string
  pricing_type: PricingType
  unit_value: number
  quantity: number
  discount_percent: number
  gross: number          // valor bruto, antes do desconto do item
  discount_value: number // valor do desconto do item, em R$
  subtotal: number        // valor líquido do item (entra no mensal OU no setup)
  is_recurring: boolean   // true = soma no total mensal, false = soma no setup
}

export function calculateLineItem(pricing: ProductPricing): LineItemCalculation {
  const quantity = Math.max(pricing.quantity || 1, 1)
  const gross = pricing.unit_value * quantity
  const discount_value = gross * (pricing.discount_percent / 100)
  const subtotal = gross - discount_value
  const is_recurring = pricing.pricing_type === 'monthly' || pricing.pricing_type === 'per_employee'

  return {
    product_id: pricing.product_id,
    pricing_type: pricing.pricing_type,
    unit_value: pricing.unit_value,
    quantity,
    discount_percent: pricing.discount_percent,
    gross,
    discount_value,
    subtotal,
    is_recurring,
  }
}

export interface ProposalTotals {
  gross_monthly: number      // soma bruta dos itens recorrentes, antes de qualquer desconto
  items_discount_value: number // soma dos descontos individuais de cada item
  subtotal_monthly: number   // soma dos itens recorrentes, já com desconto de item, antes do desconto geral
  subtotal_setup: number     // soma dos itens não recorrentes (valor único/projeto)
  general_discount_value: number
  total_monthly: number      // subtotal_monthly - desconto geral
  total_setup: number
  total_amount: number       // total_monthly + total_setup (referência do primeiro mês)
}

export function calculateProposalTotals(
  lineItems: LineItemCalculation[],
  generalDiscountPercent: number
): ProposalTotals {
  const recurringItems = lineItems.filter(i => i.is_recurring)

  const gross_monthly = recurringItems.reduce((sum, i) => sum + i.gross, 0)
  const items_discount_value = recurringItems.reduce((sum, i) => sum + i.discount_value, 0)
  const subtotal_monthly = recurringItems.reduce((sum, i) => sum + i.subtotal, 0)

  const subtotal_setup = lineItems
    .filter(i => !i.is_recurring)
    .reduce((sum, i) => sum + i.subtotal, 0)

  const general_discount_value = subtotal_monthly * (generalDiscountPercent / 100)
  const total_monthly = subtotal_monthly - general_discount_value
  const total_setup = subtotal_setup

  return {
    gross_monthly,
    items_discount_value,
    subtotal_monthly,
    subtotal_setup,
    general_discount_value,
    total_monthly,
    total_setup,
    total_amount: total_monthly + total_setup,
  }
}
