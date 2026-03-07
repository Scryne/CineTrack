import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
    title: string
    subtitle?: string
    href?: string
    icon?: LucideIcon
    className?: string
}

export default function SectionHeader({ title, subtitle, href, icon: Icon, className }: SectionHeaderProps): React.ReactElement {
    return (
        <div className={cn('flex items-start justify-between', className)}>
            <div className="flex items-center gap-3">
                <div className="section-line" />
                <div>
                    <div className="flex items-center gap-2">
                        {Icon && <Icon size={15} className="text-purple-400" />}
                        <h2 className="text-[18px] font-semibold text-text-pri tracking-tight">
                            {title}
                        </h2>
                    </div>
                    {subtitle && (
                        <p className="text-[13px] text-text-muted mt-0.5 ml-0">{subtitle}</p>
                    )}
                </div>
            </div>
            {href && (
                <Link
                    href={href}
                    className="flex items-center gap-1 text-[13px] text-purple-400 hover:text-purple-300 transition-colors mt-1 flex-shrink-0"
                >
                    Tümünü Gör
                    <ArrowRight size={13} />
                </Link>
            )}
        </div>
    )
}

export { SectionHeader }
