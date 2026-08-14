'use client'
import { useEffect, useRef, useState } from 'react'
import { maskCurrency, numberToCurrency, parseCurrency } from '@/lib/masks'

interface Props {
  value: number
  onChange: (n: number) => void
  className?: string
  disabled?: boolean
  readOnly?: boolean
}

export default function CurrencyField({ value, onChange, className = '', disabled, readOnly }: Props) {
  const [display, setDisplay] = useState(() => numberToCurrency(value))
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current !== document.activeElement) {
      setDisplay(numberToCurrency(value))
    }
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCurrency(e.target.value)
    setDisplay(masked)
    onChange(parseCurrency(masked))
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      className={className}
      disabled={disabled}
      readOnly={readOnly}
    />
  )
}
