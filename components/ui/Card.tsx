'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
    children: React.ReactNode
    hover?: boolean
    glow?: boolean
    className?: string
    onClick?: () => void
}

export default function Card({ children, hover, glow, className, onClick }: CardProps): React.ReactElement {
    return (
        <motion.div
            onClick={onClick}
            whileHover={hover ? { y: -3 } : {}}
            transition={{ duration: 0.15 }}
            className={cn(
                'bg-raised border border-border-dim rounded-xl',
                'shadow-card transition-all duration-200',
                hover && 'cursor-pointer hover:shadow-card-up hover:border-purple-500/60',
                glow && 'shadow-glow',
                onClick && 'cursor-pointer',
                className,
            )}
        >
            {children}
        </motion.div>
    )
}

export { Card }
