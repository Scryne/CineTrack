'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, AlertCircle, Plus, Minus, WifiOff, Bookmark } from 'lucide-react'

interface SubtitleCue {
    startTime: number
    endTime: number
    text: string
}

interface VideoPlayerProps {
    embedUrl: string
    title: string
    onError: () => void
    onLoad: () => void
    subtitleUrl?: string | null
    allSourcesFailed?: boolean
    onAddToWatchlist?: () => void
    inWatchlist?: boolean
}

// Removed synchronous VTT parsing functions to use Web Worker from public/subtitlesWorker.js

export default function VideoPlayer({ embedUrl, title, onError, onLoad, subtitleUrl, allSourcesFailed, onAddToWatchlist, inWatchlist }: VideoPlayerProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [isOffline, setIsOffline] = useState(false)

    // Subtitle state
    const [cues, setCues] = useState<SubtitleCue[]>([])
    const [currentText, setCurrentText] = useState('')
    const [offset, setOffset] = useState(0)
    const timerRef = useRef(0)
    const animFrameRef = useRef<number | null>(null)
    const timerStartRef = useRef<number | null>(null)
    const cuesRef = useRef<SubtitleCue[]>([])
    const offsetRef = useRef(0)

    const iframeRef = useRef<HTMLIFrameElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isLoadingRef = useRef(true)

    const handleLoad = useCallback(() => {
        isLoadingRef.current = false
        setIsLoading(false)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        onLoad()
    }, [onLoad])

    const handleError = useCallback(() => {
        isLoadingRef.current = false
        setIsLoading(false)
        setHasError(true)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        onError()
    }, [onError])

    // Load timeout
    useEffect(() => {
        setIsLoading(true)
        setHasError(false)
        isLoadingRef.current = true

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            if (isLoadingRef.current) {
                handleError()
            }
        }, 8000)

        // Reset subtitle timer when embed URL changes
        timerRef.current = 0
        timerStartRef.current = null

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [embedUrl, handleError])

    // Fullscreen keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'f') {
                if (!document.fullscreenElement && containerRef.current) {
                    containerRef.current.requestFullscreen().catch((err) => {
                        console.error('Error attempting to enable fullscreen:', err)
                    })
                } else if (document.fullscreenElement) {
                    document.exitFullscreen().catch((err) => {
                        console.error('Error attempting to disable fullscreen:', err)
                    })
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Check online status
    useEffect(() => {
        setIsOffline(!navigator.onLine)
        const handleOnline = () => setIsOffline(false)
        const handleOffline = () => setIsOffline(true)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Load and parse VTT subtitle file
    useEffect(() => {
        if (!subtitleUrl) {
            setCues([])
            cuesRef.current = []
            setCurrentText('')
            return
        }

        let cancelled = false
        async function loadVTT() {
            try {
                const res = await fetch(subtitleUrl!)
                if (cancelled) return
                const text = await res.text()
                if (cancelled) return

                if (window.Worker) {
                    const worker = new Worker('/subtitlesWorker.js')
                    worker.postMessage({ vttText: text })
                    worker.onmessage = (e) => {
                        if (!cancelled) {
                            setCues(e.data.cues)
                            cuesRef.current = e.data.cues
                        }
                        worker.terminate()
                    }
                    worker.onerror = () => {
                        if (!cancelled) {
                            setCues([])
                            cuesRef.current = []
                        }
                        worker.terminate()
                    }
                } else {
                    if (!cancelled) {
                        setCues([])
                        cuesRef.current = []
                    }
                }
            } catch {
                if (!cancelled) {
                    setCues([])
                    cuesRef.current = []
                }
            }
        }

        loadVTT()
        return () => { cancelled = true }
    }, [subtitleUrl])

    // Keep offsetRef in sync
    useEffect(() => {
        offsetRef.current = offset
    }, [offset])

    // Subtitle timer loop using requestAnimationFrame
    useEffect(() => {
        if (cues.length === 0 || !subtitleUrl) {
            setCurrentText('')
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current)
                animFrameRef.current = null
            }
            return
        }

        // Start the timer from when the embed loaded
        if (timerStartRef.current === null) {
            timerStartRef.current = performance.now()
        }

        function tick() {
            if (timerStartRef.current === null) {
                animFrameRef.current = requestAnimationFrame(tick)
                return
            }

            const elapsed = (performance.now() - timerStartRef.current) / 1000
            const currentTime = elapsed + offsetRef.current
            const activeCues = cuesRef.current

            let found = ''
            for (const cue of activeCues) {
                if (currentTime >= cue.startTime && currentTime <= cue.endTime) {
                    found = cue.text
                    break
                }
            }

            setCurrentText(found)
            animFrameRef.current = requestAnimationFrame(tick)
        }

        animFrameRef.current = requestAnimationFrame(tick)

        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current)
                animFrameRef.current = null
            }
        }
    }, [cues, subtitleUrl])

    const adjustOffset = (delta: number) => {
        setOffset(prev => Math.round((prev + delta) * 10) / 10)
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-video md:aspect-[16/9] rounded-none sm:rounded-2xl overflow-hidden bg-black flex items-center justify-center group"
        >
            {isOffline && (
                <div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white text-center py-2 text-sm z-50 font-medium tracking-wide">
                    Ağ bağlantısı yok. Lütfen internet bağlantınızı kontrol edin.
                </div>
            )}

            {isLoading && !hasError && !allSourcesFailed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                </div>
            )}

            {hasError && !allSourcesFailed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 text-white gap-4">
                    <AlertCircle className="w-16 h-16 text-red-500" />
                    <p className="text-lg font-medium">Bu kaynak şu an çalışmıyor</p>
                    <button
                        onClick={() => onError()}
                        className="px-6 py-2 bg-purple focus:ring-4 focus:ring-purple/50 active:scale-95 hover:bg-purple-light transition-all rounded-lg font-medium"
                    >
                        Diğer Kaynağı Dene
                    </button>
                </div>
            )}

            {allSourcesFailed && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/95 z-20">
                    <div className="bg-bg-card border border-border shadow-2xl rounded-2xl p-8 flex flex-col items-center max-w-[90%] sm:max-w-sm text-center">
                        <WifiOff className="w-16 h-16 text-purple mb-4" />
                        <h3 className="text-xl font-bold font-display text-text-primary mb-2">Şu an hiçbir kaynak erişilebilir değil</h3>
                        <p className="text-text-secondary mb-6 text-sm">Lütfen daha sonra tekrar dene</p>
                        {onAddToWatchlist && (
                            <button
                                onClick={onAddToWatchlist}
                                className={`px-6 py-2 transition-colors rounded-lg font-medium flex items-center gap-2 ${inWatchlist ? 'bg-purple/20 text-purple border border-purple' : 'bg-purple text-white hover:bg-purple-light'}`}
                            >
                                <Bookmark size={18} />
                                {inWatchlist ? "Koleksiyonda" : "Koleksiyona Ekle"}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!allSourcesFailed && (
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen={true}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    scrolling="no"
                    frameBorder="0"
                    className="w-full h-full border-none"
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}

            {/* Subtitle Overlay */}
            {subtitleUrl && currentText && (
                <div
                    className="absolute inset-0 pointer-events-none flex items-end justify-center z-30"
                    style={{ paddingBottom: '15%' }}
                >
                    <div
                        className="text-center px-3 py-1 rounded-md max-w-[90%]"
                        style={{
                            background: 'rgba(0,0,0,0.75)',
                            padding: '4px 12px',
                        }}
                    >
                        {currentText.split('\n').map((line, i) => (
                            <p
                                key={i}
                                className="text-white leading-snug"
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 500,
                                }}
                            >
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Subtitle Offset Controls */}
            {subtitleUrl && (
                <div className="absolute bottom-2 right-2 z-40 flex items-center gap-1 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => adjustOffset(-0.5)}
                        className="flex items-center gap-0.5 px-2 py-1 rounded bg-black/70 text-white text-xs hover:bg-black/90 transition-colors"
                        title="Altyazıyı 0.5s geri al"
                    >
                        <Minus size={12} />
                        <span>0.5s</span>
                    </button>
                    <span className="px-2 py-1 rounded bg-black/70 text-white text-xs min-w-[50px] text-center">
                        {offset >= 0 ? '+' : ''}{offset.toFixed(1)}s
                    </span>
                    <button
                        onClick={() => adjustOffset(0.5)}
                        className="flex items-center gap-0.5 px-2 py-1 rounded bg-black/70 text-white text-xs hover:bg-black/90 transition-colors"
                        title="Altyazıyı 0.5s ileri al"
                    >
                        <Plus size={12} />
                        <span>0.5s</span>
                    </button>
                </div>
            )}
        </div>
    )
}
