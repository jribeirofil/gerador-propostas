import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ wrapperClassName = '', children, ...props }, ref) => {
    return (
      <div className={`relative ${wrapperClassName}`}>
        <select
          ref={ref}
          {...props}
          className="w-full appearance-none bg-app-surface border border-app-border rounded-xl px-4 py-2.5 pr-9 text-sm text-app-text focus:outline-none focus:border-fay-green-deep transition-colors cursor-pointer"
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none"
        />
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
