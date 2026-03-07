'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Bookmark, BookmarkCheck, Check, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { posterUrl } from '@/lib/tmdb'

interface ContentCardProps {
    id: string
    type: 'film' | 'dizi'
    title: string
    year?: string | number
    posterPath: string | null
    rating?: number
    inWatchlist: boolean
    isWatched: boolean
    onWatchlistToggle: () => void
    onWatchedToggle: () => void
    onClick: () => void
    width?: number
}

export default function ContentCard({
    title, year, posterPath, rating,
    inWatchlist, isWatched,
    onWatchlistToggle, onWatchedToggle, onClick,
    width = 160,
}: ContentCardProps): React.ReactElement {
    return (
        <motion.div
            whileHover="hover"
            className="poster-card group flex-shrink-0"
            style={{ width }}
            onClick={onClick}
        >
            {/* Poster */}
            <div className="w-full h-full overflow-hidden rounded-lg">
                {posterPath ? (
                    <motion.div
                        variants={{ hover: { scale: 1.06 } }}
                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        className="w-full h-full"
                    >
                        <Image
                            src={posterUrl(posterPath)}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes={`${width}px`}
                        />
                    </motion.div>
                ) : (
                    <div className="w-full h-full bg-raised flex items-center justify-center">
                        <span className="text-text-dim text-4xl font-display tracking-widest">
                            {title.charAt(0)}
                        </span>
                    </div>
                )}
            </div>

            {/* Rating badge — always visible */}
            {rating != null && rating > 0 && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md">
                    <Star size={10} className="text-warn fill-warn" />
                    <span className="text-[11px] font-mono text-warn">{rating.toFixed(1)}</span>
                </div>
            )}

            {/* Hover overlay */}
            <motion.div
                variants={{
                    hover: { opacity: 1 },
                    initial: { opacity: 0 },
                }}
                initial="initial"
                className="absolute inset-0 rounded-lg"
                style={{
                    background: 'linear-gradient(to top, rgba(8,8,8,.97) 0%, rgba(8,8,8,.7) 45%, rgba(8,8,8,.1) 100%)',
                }}
            />

            {/* Hover content */}
            <motion.div
                variants={{
                    hover: { opacity: 1, y: 0 },
                    initial: { opacity: 0, y: 8 },
                }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none"
            >
                <p className="text-[13px] font-semibold text-white line-clamp-2 mb-0.5" title={title}>{title}</p>
                {year && <p className="text-[11px] text-text-sec mb-2">{typeof year === 'number' ? year : year}</p>}

                {/* Action buttons */}
                <div
                    className="flex items-center justify-between pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={onWatchlistToggle}
                        className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                            inWatchlist
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/10 text-white/70 hover:bg-purple-500/80 hover:text-white backdrop-blur-sm',
                        )}
                    >
                        {inWatchlist
                            ? <BookmarkCheck size={13} />
                            : <Bookmark size={13} />}
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={onWatchedToggle}
                        className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                            isWatched
                                ? 'bg-ok text-white'
                                : 'bg-white/10 text-white/70 hover:bg-ok/80 hover:text-white backdrop-blur-sm',
                        )}
                    >
                        {isWatched
                            ? <CheckCircle2 size={13} />
                            : <Check size={13} />}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}

export { ContentCard }
