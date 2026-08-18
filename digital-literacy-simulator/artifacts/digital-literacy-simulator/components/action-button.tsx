import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'lg' | 'md'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:brightness-110 shadow-sm',
  secondary:
    'bg-secondary text-secondary-foreground hover:brightness-105 border-2 border-border',
  ghost: 'bg-transparent text-foreground hover:bg-secondary',
}

const sizeClasses: Record<Size, string> = {
  // Comfortably above the 44px minimum touch target
  lg: 'min-h-[60px] px-8 text-xl gap-3',
  md: 'min-h-[52px] px-6 text-lg gap-2',
}

export function ActionButton({
  className,
  variant = 'primary',
  size = 'lg',
  asChild = false,
  ...props
}: ActionButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center rounded-2xl font-bold leading-none',
        'transition-[filter,background-color,transform] duration-150 active:scale-[.98]',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
