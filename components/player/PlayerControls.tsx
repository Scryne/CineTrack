'use client'

import { useState, useRef, useEffect } from 'react'
import { MonitorPlay, Subtitles, Check, Loader2, AlertTriangle, ChevronDown } from 'lucide-react'
import { Source } from '@/types/player'
import type { SubtitleResult } from '@/types/player'
import { checkSourceAvailability, isSourceBlocked } from '@/lib/sources'

export interface PlayerControlsProps {
    sources: Source[]
    activeSourceIndex: number
    onSourceChange: (index: number) => void
    subtitles: SubtitleResult[]
    activeSubtitleId: number | null
    onSubtitleChange: (id: number | null) => void
    isLoadingSubtitles: boolean
    subtitleError?: string | null
    type: 'film' | 'dizi'
    title: string
    season?: number
    episode?: number
    episodeTitle?: string
    hasError?: boolean
}

export default function PlayerControls({
    sources,
    activeSourceIndex,
    onSourceChange,
    subtitles,
    activeSubtitleId,
    onSubtitleChange,
    isLoadingSubtitles,
    subtitleError,
    type,
    title,
    season,
    episode,
    episodeTitle,
    hasError,
}: PlayerControlsProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [availableSources, setAvailableSources] = useState<Record<string, boolean>>({})

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const checkSources = async () => {
            const results: Record<string, boolean> = {}
            for (const source of sources) {
                results[source.id] = await checkSourceAvailability(source.id)
            }
            setAvailableSources(results)
        }
        checkSources()
    }, [sources])

    const infoText = type === 'film'
        ? title
        : `${title} · Sezon ${season} · Bölüm ${episode}${episodeTitle ? ` · ${episodeTitle}` : ''}`;

    // Find the label for the active subtitle
    const activeSubLabel = (() => {
        if (activeSubtitleId === null) return 'Altyazı Yok'
        const found = subtitles.find(s => s.id === activeSubtitleId)
        return found ? found.languageName : 'Seçiliyor...'
    })()

    return (
        <div className="bg-raised/60 backdrop-blur-md border-t border-border-dim p-4 flex flex-col gap-4 w-full">
            {hasError && (
                <div className="w-full flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm">
                    <AlertTriangle size={18} />
                    <span>Bu kaynak yüklenemedi. Lütfen başka bir kaynak deneyin.</span>
                </div>
            )}

            {subtitleError && (
                <div className="w-full flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertTriangle size={18} />
                    <span>{subtitleError}</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row flex-wrap md:flex-nowrap items-start md:items-center gap-4 w-full">
                {/* KAYNAK SEÇİCİ */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 text-text-secondary select-none">
                        <MonitorPlay size={18} />
                        <span className="text-sm font-medium">Kaynak</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {sources.map((source, index) => {
                            const isAvailable = availableSources[source.id] !== false
                            const isBlocked = isSourceBlocked(source.id)
                            const isDisabled = !isAvailable || isBlocked
                            return (
                                <button
                                    key={source.id}
                                    onClick={() => onSourceChange(index)}
                                    disabled={isDisabled}
                                    className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeSourceIndex === index
                                        ? 'bg-purple-500 text-white shadow-glow-sm border border-purple-500/50'
                                        : 'bg-overlay/50 border border-border-dim text-white hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    {source.name}
                                    {isBlocked && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-bg-card" title="Bu kaynak geçici olarak engellendi" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* BİLGİ SATIRI */}
                <div className="flex-1 min-w-[150px] flex items-center md:px-4">
                    <span className="text-text-secondary text-sm truncate" title={infoText}>
                        {infoText}
                    </span>
                </div>

                {/* ALTYAZI SEÇİCİ */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-text-secondary select-none">
                        <Subtitles size={18} />
                        <span className="text-sm font-medium">Altyazı</span>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg border border-border hover:bg-bg-hover transition-colors text-sm text-text-primary min-w-[140px] justify-between"
                        >
                            <div className="flex items-center gap-2">
                                {isLoadingSubtitles && <Loader2 size={14} className="animate-spin text-purple-500" />}
                                <span>{activeSubLabel}</span>
                            </div>
                            <ChevronDown size={14} className="text-text-muted" />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-raised border border-border-dim rounded-2xl shadow-xl backdrop-blur-xl z-50 overflow-hidden">
                                <div className="max-h-60 overflow-y-auto py-1">
                                    <button
                                        onClick={() => {
                                            onSubtitleChange(null)
                                            setIsDropdownOpen(false)
                                        }}
                                        className="flex items-center justify-between w-full px-4 py-2 text-left text-sm font-medium text-white hover:bg-overlay transition-colors border-b border-border-dim/50"
                                    >
                                        <span>Altyazı Yok</span>
                                        {activeSubtitleId === null && <Check size={16} className="text-purple-500" />}
                                    </button>
                                    {subtitles.map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => {
                                                onSubtitleChange(sub.id)
                                                setIsDropdownOpen(false)
                                            }}
                                            className="flex items-center justify-between w-full px-4 py-2.5 text-left text-sm font-medium text-white hover:bg-overlay transition-colors border-b border-border-dim/50"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{sub.languageName}</span>
                                                <span className="text-xs text-text-muted">
                                                    {sub.downloadCount.toLocaleString()} indirme · ★ {sub.rating.toFixed(1)}
                                                </span>
                                            </div>
                                            {activeSubtitleId === sub.id && <Check size={16} className="text-purple-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
