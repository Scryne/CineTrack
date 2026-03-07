import { type LucideIcon } from 'lucide-react'
import Button from './Button'
import Link from 'next/link'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: { label: string; href?: string; onClick?: () => void }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                <div className="relative w-16 h-16 rounded-2xl bg-raised border border-border-dim flex items-center justify-center shadow-lg">
                    <Icon size={28} className="text-purple-400" />
                </div>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">{title}</h3>
            <p className="text-[14px] text-text-sec max-w-sm leading-relaxed mb-8">{description}</p>
            {action && action.href && (
                <Link href={action.href}>
                    <Button variant="primary" size="md">{action.label}</Button>
                </Link>
            )}
            {action && action.onClick && !action.href && (
                <Button variant="primary" size="md" onClick={action.onClick}>{action.label}</Button>
            )}
        </div>
    )
}

export { EmptyState }
