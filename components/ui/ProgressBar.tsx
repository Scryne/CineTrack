'use client'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
    value: number
    color?: 'purple' | 'success'
    size?: 'xs' | 'sm' | 'md'
    showLabel?: boolean
    className?: string
    animated?: boolean
}

const sizeMap: Record<string, string> = { xs: 'h-[2px]', sm: 'h-[3px]', md: 'h-1.5' }
const colorMap: Record<string, string> = {
    purple: 'bg-purple-500',
    success: 'bg-ok',
}

export default function ProgressBar({
    value, color = 'purple', size = 'sm',
    showLabel, className, animated = true,
}: ProgressBarProps): React.ReactElement {
    const barRef = useRef<HTMLDivElement>(null)
    const clamped = Math.max(0, Math.min(100, value))

    useEffect(() => {
        if (!barRef.current || !animated) return
        barRef.current.style.width = '0%'
        const t = setTimeout(() => {
            if (barRef.current) barRef.current.style.width = `${clamped}%`
        }, 50)
        return () => clearTimeout(t)
    }, [clamped, animated])

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className={cn('flex-1 bg-white/[0.08] rounded-full overflow-hidden', sizeMap[size])}>
                <div
                    ref={barRef}
                    style={animated ? { width: 0, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' } : { width: `${clamped}%` }}
                    className={cn('h-full rounded-full', colorMap[color])}
                />
            </div>
            {showLabel && (
                <span className="text-[11px] text-text-muted tabular-nums">
                    {clamped}%
                </span>
            )}
        </div>
    )
}

export { ProgressBar }
