'use client'
import { motion } from 'framer-motion'
import { type LucideIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'white'
type Size = 'xs' | 'sm' | 'md' | 'lg'

const variantStyles: Record<Variant, string> = {
    primary: 'bg-purple-500 text-white hover:bg-purple-400 shadow-glow-sm',
    secondary: 'bg-subtle border border-border-mid text-text-pri hover:bg-overlay hover:border-border-bright',
    ghost: 'text-text-sec hover:text-text-pri hover:bg-overlay',
    danger: 'border border-err/40 text-err hover:bg-err/10',
    white: 'bg-white text-black hover:bg-white/90',
}
const sizeStyles: Record<Size, string> = {
    xs: 'h-7  px-3  text-xs  gap-1.5 rounded-md',
    sm: 'h-9  px-4  text-sm  gap-2   rounded-lg',
    md: 'h-10 px-5  text-sm  gap-2   rounded-lg',
    lg: 'h-12 px-6  text-base gap-2.5 rounded-xl',
}

interface ButtonProps {
    children?: React.ReactNode
    variant?: Variant
    size?: Size
    icon?: LucideIcon
    iconRight?: LucideIcon
    loading?: boolean
    disabled?: boolean
    className?: string
    onClick?: () => void
    type?: 'button' | 'submit'
}

export default function Button({
    children, variant = 'secondary', size = 'md',
    icon: Icon, iconRight: IconRight,
    loading, disabled, className, onClick, type = 'button',
}: ButtonProps): React.ReactElement {
    const isDisabled = disabled || loading
    return (
        <motion.button
            type={type}
            whileTap={isDisabled ? {} : { scale: 0.96 }}
            disabled={isDisabled}
            onClick={onClick}
            className={cn(
                'inline-flex items-center justify-center font-body font-medium',
                'transition-all duration-200 ease-smooth select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                variantStyles[variant], sizeStyles[size], className,
            )}
        >
            {loading
                ? <Loader2 size={14} className="animate-spin" />
                : Icon && <Icon size={14} />}
            {children}
            {IconRight && !loading && <IconRight size={14} />}
        </motion.button>
    )
}

export { Button }
