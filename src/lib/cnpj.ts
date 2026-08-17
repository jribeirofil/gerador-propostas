// Validar CNPJ (algoritmo módulo 11)
// Em dev (NEXT_PUBLIC_VALIDATE_CNPJ=false), apenas verifica formato
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false

  // Remove caracteres não-numéricos
  const clean = cnpj.replace(/\D/g, '')

  // CNPJ deve ter 14 dígitos
  if (clean.length !== 14) return false

  // Em dev, apenas validar formato (não algoritmo)
  if (process.env.NEXT_PUBLIC_VALIDATE_CNPJ === 'false') {
    return true
  }

  // Rejeita sequências repetidas (11111111111111, etc)
  if (/^(\d)\1{13}$/.test(clean)) return false

  // Valida primeiro dígito verificador
  let sum = 0
  let multiplier = 5
  for (let i = 0; i < 8; i++) {
    sum += parseInt(clean[i]) * multiplier
    multiplier = multiplier === 2 ? 9 : multiplier - 1
  }

  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder

  if (parseInt(clean[8]) !== digit1) return false

  // Valida segundo dígito verificador
  sum = 0
  multiplier = 6
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i]) * multiplier
    multiplier = multiplier === 2 ? 9 : multiplier - 1
  }

  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder

  if (parseInt(clean[9]) !== digit2) return false

  return true
}

// Formatar CNPJ para exibição: 12.345.678/0001-90
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '')
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// Limpar CNPJ (remover formatação)
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}
