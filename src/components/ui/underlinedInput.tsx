import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const UnderlinedInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full border-0 border-b border-slate-200 bg-transparent text-foreground font-normal text-[14px] outline-none focus:border-blue-500 focus:ring-0 transition-colors overflow-hidden text-ellipsis whitespace-nowrap",
          className
        )}
        {...props}
      />
    )
  }
)
export { UnderlinedInput }
UnderlinedInput.displayName = 'UnderlinedInput'