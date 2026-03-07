import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'purple' | 'success' | 'warning' | 'muted' | 'ghost'

const badgeVariants: Record<BadgeVariant, string> = {
    default: 'bg-subtle   border border-border-mid  text-text-sec',
    purple: 'bg-purple-950 border border-purple-800  text-purple-300',
    success: 'bg-ok/10    border border-ok/20       text-ok',
    warning: 'bg-warn/10  border border-warn/20     text-warn',
    muted: 'bg-overlay  border border-border-dim  text-text-muted',
    ghost: 'bg-white/[0.08]  border border-white/10    text-white/80',
}

interface BadgeProps {
    children: React.ReactNode
    variant?: BadgeVariant
    className?: string
}

export default function Badge({
    children,
    variant = 'default',
    className,
}: BadgeProps): React.ReactElement {
    return (
        <span className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5',
            'text-[11px] font-medium rounded-full leading-none',
            badgeVariants[variant], className,
        )}>
            {children}
        </span>
    )
}

export { Badge }
