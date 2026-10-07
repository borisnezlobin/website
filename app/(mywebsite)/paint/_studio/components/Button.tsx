import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'quiet' | 'ghost'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[rgb(var(--paint-ink))] text-[rgb(var(--paint-surface))] hover:bg-[rgb(var(--paint-ink)/0.85)] [box-shadow:var(--paint-shadow-raised)]',
  quiet: 'bg-[rgb(var(--paint-raised))] text-[rgb(var(--paint-ink))] hover:bg-[rgb(var(--paint-hover))] [box-shadow:var(--paint-shadow-raised)]',
  ghost: 'bg-transparent text-[rgb(var(--paint-ink-muted))] hover:bg-[rgb(var(--paint-raised))] hover:text-[rgb(var(--paint-ink))]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
  iconOnly?: boolean
}

export function Button({ variant = 'quiet', icon, iconOnly = false, className = '', children, type = 'button', ...rest }: ButtonProps) {
  const shape = iconOnly ? 'size-10 justify-center' : 'h-10 px-4 gap-2'
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center rounded-[var(--radius-control)] text-sm font-semibold whitespace-nowrap transition-[background-color,color,scale] duration-150 ease-[var(--ease-out-soft)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 ${shape} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
    </button>
  )
}
