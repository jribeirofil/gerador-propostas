interface Props {
  src?: string | null
  srcDark?: string | null
  height?: number
  maxWidth?: number
  className?: string
}

export default function Logo({ src, srcDark, height = 36, maxWidth, className = '' }: Props) {
  const lightSrc = src || '/logo-light.svg'
  const darkSrc = srcDark || '/logo-dark.svg'
  const style = {
    height: `${height}px`,
    width: 'auto',
    maxWidth: maxWidth ? `${maxWidth}px` : undefined,
  }

  return (
    <div className={`flex-shrink-0 ${className}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={lightSrc}
        alt="Logo da empresa"
        className="block dark:hidden w-auto h-full object-contain select-none"
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={darkSrc}
        alt="Logo da empresa"
        className="hidden dark:block w-auto h-full object-contain select-none"
        style={{ filter: 'brightness(1.8) saturate(1.1)' }}
        draggable={false}
      />
    </div>
  )
}
