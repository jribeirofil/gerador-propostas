export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function maskCNPJ(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length === 0) return ''
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function maskCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

// Auto-cents: user types digits, value shifts left (R$ 0,01 → R$ 0,12 → R$ 1,23)
export function maskCurrency(v: string): string {
  const digits = v.replace(/\D/g, '').replace(/^0+/, '') || '0'
  const cents = parseInt(digits)
  const reals = Math.floor(cents / 100)
  const rem = cents % 100
  const realsStr = reals.toLocaleString('pt-BR')
  return `R$ ${realsStr},${String(rem).padStart(2, '0')}`
}

export function parseCurrency(v: string): number {
  const digits = v.replace(/\D/g, '')
  return digits ? parseInt(digits) / 100 : 0
}

export function numberToCurrency(n: number): string {
  if (!n) return 'R$ 0,00'
  const cents = Math.round(n * 100)
  const reals = Math.floor(cents / 100)
  const rem = cents % 100
  return `R$ ${reals.toLocaleString('pt-BR')},${String(rem).padStart(2, '0')}`
}
