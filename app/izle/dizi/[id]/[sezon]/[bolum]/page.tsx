'use client'

import { logger } from '@/lib/logger'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, ExternalLink, PlayCircle, Bookmark, Check, Star, Loader2, CheckCircle2, SkipForward, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

import { getSeriesDetail, getSeasonDetail, posterUrl, backdropUrl, profileUrl, BLUR_PLACEHOLDER } from '@/lib/tmdb'
import SOURCES, { getEpisodeEmbedUrl, isSourceBlocked } from '@/lib/sources'
import { searchSubtitles, getSubtitleDownloadUrl, loadSubtitleAsBlob } from '@/lib/subtitles'
import {
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isWatched,
    markAsWatched,
    removeFromWatched,
    isEpisodeWatched,
    markEpisodeWatched,
    getWatchedEpisodes,
    saveWatchProgress,
    getWatchProgress
} from "@/lib/db"
import type { TMDBSeriesDetail, TMDBSeasonDetail, TMDBEpisode, TMDBCastMember } from '@/lib/tmdb'
import type { SubtitleResult } from '@/types/player'
import dynamic from 'next/dynamic'
import { FastAverageColor } from 'fast-average-color'
import { motion } from 'framer-motion'

const VideoPlayer = dynamic(() => import('@/components/player/VideoPlayer'), { ssr: false, loading: () => <div className="w-full aspect-video md:aspect-[16/9] flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 animate-spin text-purple-500" /></div> })
import PlayerControls from '@/components/player/PlayerControls'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import RatingPicker from '@/components/RatingPicker'
import ScrollableRow from '@/components/ui/ScrollableRow'

export default function WatchEpisodePage({ params }: { params: { id: string, sezon: string, bolum: string } }) {
    const router = useRouter()
    const seriesId = params.id
    const seasonNumber = parseInt(params.sezon, 10)
    const episodeNumber = parseInt(params.bolum, 10)

    const [series, setSeries] = useState<TMDBSeriesDetail | null>(null)
    const [seasonData, setSeasonData] = useState<TMDBSeasonDetail | null>(null)
    const [currentEpisode, setCurrentEpisode] = useState<TMDBEpisode | null>(null)
    const [loading, setLoading] = useState(true)
    const [fetchTimeout, setFetchTimeout] = useState(false)
    const [showProgressModal, setShowProgressModal] = useState(false)
    const [dominantColor, setDominantColor] = useState<{ r: number, g: number, b: number } | null>(null)

    useEffect(() => {
        if (series?.backdrop_path) {
            const fac = new FastAverageColor();
            fac.getColorAsync(backdropUrl(series.backdrop_path))
                .then(color => {
                    const [r, g, b] = color.value;
                    setDominantColor({ r, g, b });
                })
                .catch(e => logger.error("Fetch cover average color failed", e));
        }
    }, [series?.backdrop_path]);

    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setFetchTimeout(true)
            }, 10000)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [loading])

    // Player States
    const [sourceIndex, setSourceIndex] = useState(0)
    const [subtitles, setSubtitles] = useState<SubtitleResult[]>([])
    const [activeSubtitleId, setActiveSubtitleId] = useState<number | null>(null)
    const [isLoadingSubtitles, setIsLoadingSubtitles] = useState(false)
    const [subtitleBlobUrl, setSubtitleBlobUrl] = useState<string | null>(null)
    const [subtitleError, setSubtitleError] = useState<string | null>(null)
    const [hasError, setHasError] = useState(false)
    const [allSourcesFailed, setAllSourcesFailed] = useState(false)

    // Interaction states
    const [inWatchlist, setInWatchlist] = useState(false)
    const [seriesWatched, setSeriesWatched] = useState(false)
    const [showRating, setShowRating] = useState(false)

    // UI States
    const [selectedSeason, setSelectedSeason] = useState(seasonNumber)
    const showNextEpisodeBtn = true
    const [countdown, setCountdown] = useState<number | null>(null)
    const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false)
    const seasonDropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node)) {
                setIsSeasonDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Auto complete tracking
    const autoCompleteTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Auto next logic
    const autoNextTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch data
    useEffect(() => {
        let isMounted = true;
        async function init() {
            setLoading(true)

            const seriesData = await getSeriesDetail(seriesId)
            if (!isMounted) return

            if (seriesData) {
                setSeries(seriesData)

                const sData = await getSeasonDetail(seriesId, seasonNumber)
                if (!isMounted) return

                if (sData) {
                    setSeasonData(sData)
                    const ep = sData.episodes.find(e => e.episode_number === episodeNumber)
                    setCurrentEpisode(ep || null)

                    if (ep) {
                        document.title = `${seriesData.name} S${seasonNumber}E${episodeNumber} İzle — CineTrack`
                    }
                }

                const inWL = await isInWatchlist(seriesId, "dizi");
                setInWatchlist(inWL);

                const isW = await isWatched(seriesId, "dizi");
                setSeriesWatched(isW);

                // OpenSubtitles API ile altyazıları çek
                setIsLoadingSubtitles(true)
                try {
                    const subs = await searchSubtitles({
                        tmdbId: seriesId,
                        type: 'dizi',
                        season: seasonNumber,
                        episode: episodeNumber,
                    })
                    if (isMounted) {
                        setSubtitles(subs)
                    }
                } catch (error) {
                    logger.error('Altyazı yüklenirken hata', error)
                } finally {
                    if (isMounted) setIsLoadingSubtitles(false)
                }

                const progress = await getWatchProgress(seriesId, "dizi");

                // Sadece yarıda bırakılmışsa (>2 dk) ve aynı bölümdeyse bildirimi göster
                if (progress && progress.timeSpentSeconds && progress.timeSpentSeconds > 120 && progress.season === seasonNumber && progress.episode === episodeNumber) {
                    setShowProgressModal(true)
                }

                const epListUrl = await getWatchedEpisodes(seriesId);

                await saveWatchProgress({
                    tmdbId: seriesId,
                    type: 'dizi',
                    title: seriesData.name,
                    posterPath: posterUrl(seriesData.poster_path),
                    backdropPath: seriesData.backdrop_path ? backdropUrl(seriesData.backdrop_path) : undefined,
                    season: seasonNumber,
                    episode: episodeNumber,
                    episodeTitle: sData?.episodes.find(e => e.episode_number === episodeNumber)?.name || `Bölüm ${episodeNumber}`,
                    totalEpisodes: seriesData.number_of_episodes,
                    watchedEpisodes: epListUrl.length,
                    timeSpentSeconds: progress?.season === seasonNumber && progress?.episode === episodeNumber ? progress.timeSpentSeconds : 0,
                    updatedAt: new Date().toISOString()
                })
            }
            setLoading(false)
        }

        init()

        return () => {
            isMounted = false;
        }
    }, [seriesId, seasonNumber, episodeNumber])

    // Yarıda bırakma süresini takip et (10 saniyede bir kaydet)
    useEffect(() => {
        if (!series) return;

        const interval = setInterval(async () => {
            if (document.hidden) return; // Don't track time when tab is backgrounded
            const currentProgress = await getWatchProgress(seriesId, "dizi");
            if (currentProgress && currentProgress.season === seasonNumber && currentProgress.episode === episodeNumber) {
                await saveWatchProgress({
                    ...currentProgress,
                    timeSpentSeconds: (currentProgress.timeSpentSeconds || 0) + 10,
                    updatedAt: new Date().toISOString()
                });
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [series, seriesId, seasonNumber, episodeNumber]);

    // Handle season change in dropdown
    useEffect(() => {
        let isMounted = true
        async function fetchNewSeason() {
            if (selectedSeason !== seasonNumber) {
                const sData = await getSeasonDetail(seriesId, selectedSeason)
                if (isMounted && sData) {
                    setSeasonData(sData)
                }
            }
        }
        if (series) {
            fetchNewSeason()
        }
        return () => { isMounted = false }
    }, [selectedSeason, seriesId, seasonNumber, series])

    // Auto complete tracking (5 mins)
    useEffect(() => {
        if (!loading && currentEpisode && series) {
            const epName = currentEpisode.name
            autoCompleteTimerRef.current = setTimeout(async () => {
                await markEpisodeWatched(seriesId, seasonNumber, episodeNumber)
                const epListUrl = await getWatchedEpisodes(seriesId);

                await saveWatchProgress({
                    tmdbId: seriesId,
                    type: 'dizi',
                    title: series.name,
                    posterPath: posterUrl(series.poster_path),
                    backdropPath: series.backdrop_path ? backdropUrl(series.backdrop_path) : undefined,
                    season: seasonNumber,
                    episode: episodeNumber,
                    episodeTitle: epName,
                    totalEpisodes: series.number_of_episodes,
                    watchedEpisodes: epListUrl.length,
                    updatedAt: new Date().toISOString()
                })
            }, 5 * 60 * 1000)
        }

        return () => {
            if (autoCompleteTimerRef.current) {
                clearTimeout(autoCompleteTimerRef.current)
            }
        }
    }, [loading, series, seriesId, seasonNumber, episodeNumber])

    // Next / Prev logic
    const getNextEpisodeInfo = useCallback(() => {
        if (!series || !seasonData) return null;

        const nextEpInSeason = seasonData.episodes.find(e => e.episode_number === episodeNumber + 1)
        if (nextEpInSeason) return { s: seasonNumber, e: episodeNumber + 1, name: nextEpInSeason.name }

        const nextSeasonNumber = seasonNumber + 1
        const nextSeason = series.seasons.find(s => s.season_number === nextSeasonNumber)
        if (nextSeason && nextSeason.episode_count > 0) {
            return { s: nextSeasonNumber, e: 1, name: "Bölüm 1" }
        }

        return null;
    }, [series, seasonData, seasonNumber, episodeNumber])

    const getPrevEpisodeInfo = useCallback(() => {
        if (!series || !seasonData) return null;

        if (episodeNumber > 1) {
            return { s: seasonNumber, e: episodeNumber - 1 }
        }

        if (seasonNumber > 1) {
            const prevSeasonInfo = series.seasons.find(s => s.season_number === seasonNumber - 1)
            if (prevSeasonInfo && prevSeasonInfo.episode_count > 0) {
                return { s: seasonNumber - 1, e: prevSeasonInfo.episode_count }
            }
        }

        return null;
    }, [series, seasonData, seasonNumber, episodeNumber])

    const nextInfo = getNextEpisodeInfo()
    const prevInfo = getPrevEpisodeInfo()
    const isSeriesCompleted = !nextInfo && series?.status === "Ended"

    const goToEpisode = useCallback((s: number, e: number) => {
        if (countdown !== null) {
            setCountdown(null)
            if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current)
            toast.dismiss('next-epi-toast')
        }
        router.push(`/izle/dizi/${seriesId}/${s}/${e}`)
    }, [countdown, router, seriesId])

    const handleNextEpisodeClick = useCallback(() => {
        if (!nextInfo) return;

        setCountdown(5)

        let timeLeft = 5
        autoNextTimerRef.current = setInterval(() => {
            timeLeft -= 1
            if (timeLeft <= 0) {
                if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current)
                goToEpisode(nextInfo.s, nextInfo.e)
                toast.dismiss('next-epi-toast')
            } else {
                setCountdown(timeLeft)
            }
        }, 1000)

        toast((t) => (
            <div className="flex flex-col gap-2">
                <span>Sonraki bölüme geçiliyor... ({timeLeft})</span>
                <div className="flex gap-2 justify-end mt-2">
                    <Button
                        variant="secondary"
                        className="py-1 px-3 text-xs"
                        onClick={() => {
                            if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current)
                            setCountdown(null)
                            toast.dismiss(t.id)
                        }}
                    >
                        İptal
                    </Button>
                    <Button
                        variant="primary"
                        className="py-1 px-3 text-xs"
                        onClick={() => {
                            if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current)
                            setCountdown(null)
                            toast.dismiss(t.id)
                            goToEpisode(nextInfo.s, nextInfo.e)
                        }}
                    >
                        Hemen Geç
                    </Button>
                </div>
            </div>
        ), { id: 'next-epi-toast', duration: 5500 })
    }, [nextInfo, goToEpisode])

    const cancelCountdown = useCallback(() => {
        if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current)
        setCountdown(null)
        toast.dismiss('next-epi-toast')
    }, [])

    // Touch swipe for next/prev
    const touchStartX = useRef<number | null>(null)
    const touchEndX = useRef<number | null>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return;
        const deltaX = touchStartX.current - touchEndX.current;
        if (deltaX > 80 && nextInfo) {
            // Swipe left -> next episode
            goToEpisode(nextInfo.s, nextInfo.e)
        } else if (deltaX < -80 && prevInfo) {
            // Swipe right -> prev episode
            goToEpisode(prevInfo.s, prevInfo.e)
        }
        touchStartX.current = null
        touchEndX.current = null
    }

    // Window message listener for video end events
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (typeof event.data === 'string' && (event.data.includes('ended') || event.data.includes('video_end'))) {
                handleNextEpisodeClick()
            } else if (event.data && typeof event.data === 'object' && (event.data.event === 'ended' || event.data.type === 'ended')) {
                handleNextEpisodeClick()
            }
        }

        window.addEventListener('message', handleMessage)

        return () => window.removeEventListener('message', handleMessage)
    }, [handleNextEpisodeClick])

    // Handle subtitle selection: download + load blob
    const handleSubtitleChange = async (id: number | null) => {
        setActiveSubtitleId(id)
        setSubtitleError(null)

        // Revoke previous blob URL
        if (subtitleBlobUrl) {
            URL.revokeObjectURL(subtitleBlobUrl)
            setSubtitleBlobUrl(null)
        }

        if (id === null) return

        const sub = subtitles.find(s => s.id === id)
        if (!sub || sub.files.length === 0) {
            setSubtitleError('Altyazı dosyası bulunamadı')
            return
        }

        setIsLoadingSubtitles(true)
        try {
            const downloadUrl = await getSubtitleDownloadUrl(sub.files[0].fileId)
            if (!downloadUrl) {
                setSubtitleError('Altyazı yüklenemedi')
                toast.error('Altyazı yüklenemedi')
                return
            }

            const blobUrl = await loadSubtitleAsBlob(downloadUrl)
            if (!blobUrl) {
                setSubtitleError('Altyazı yüklenemedi')
                toast.error('Altyazı yüklenemedi')
                return
            }

            setSubtitleBlobUrl(blobUrl)
        } catch {
            setSubtitleError('Altyazı yüklenemedi')
            toast.error('Altyazı yüklenemedi')
        } finally {
            setIsLoadingSubtitles(false)
        }
    }

    // Handlers
    const handleSourceChange = (index: number) => {
        setSourceIndex(index)
        setHasError(false)
    }

    const handleError = () => {
        setHasError(true)
        // Sonraki engellenmeış kaynağı bul
        let nextIndex = sourceIndex + 1
        while (nextIndex < SOURCES.length && isSourceBlocked(SOURCES[nextIndex].id)) {
            nextIndex++
        }

        if (nextIndex < SOURCES.length) {
            toast.loading(`${SOURCES[sourceIndex].name} yüklenemedi, ${SOURCES[nextIndex].name} deneniyor...`, { duration: 2000 })
            const target = nextIndex
            setTimeout(() => {
                setSourceIndex(target)
                setHasError(false)
            }, 2000)
        } else {
            setAllSourcesFailed(true)
            toast.error("Tüm kaynaklar denendi, video yüklenemedi.")
        }
    }

    const handleWatchlist = async () => {
        if (!series) return;
        if (inWatchlist) {
            await removeFromWatchlist(seriesId, "dizi");
            setInWatchlist(false);
            toast.success("Koleksiyondan çıkarıldı");
        } else {
            await addToWatchlist({
                id: seriesId,
                type: "dizi",
                title: series.name,
                posterPath: posterUrl(series.poster_path),
                addedAt: new Date().toISOString(),
            });
            setInWatchlist(true);
            toast.success("Koleksiyona eklendi");
        }
    };

    const handleWatched = async () => {
        if (!series) return;
        if (seriesWatched) {
            await removeFromWatched(seriesId, "dizi");
            setSeriesWatched(false);
            toast.success("İzlenenlerden çıkarıldı");
        } else {
            await markAsWatched({
                id: seriesId,
                type: "dizi",
                title: series.name,
                posterPath: posterUrl(series.poster_path),
                watchedAt: new Date().toISOString(),
            });
            setSeriesWatched(true);
            toast.success("İzlendi olarak işaretlendi");
        }
    };


    const formatRuntime = (minutes: number | null) => {
        if (!minutes) return "—";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
    };

    if (loading && !fetchTimeout) {
        return (
            <div className="min-h-screen bg-bg-primary text-white flex flex-col pb-20 animate-pulse">
                <header className="sticky top-0 z-50 w-full bg-bg-primary/80 border-b border-border-dim h-16 flex items-center px-4 sm:px-6">
                    <div className="w-8 h-8 rounded-full bg-raised" />
                    <div className="w-48 h-5 ml-4 bg-raised rounded hidden sm:block" />
                </header>
                <section className="w-full bg-black border-b border-border-dim">
                    <div className="w-full max-w-[1400px] mx-auto aspect-video md:aspect-[16/9] bg-raised/30" />
                </section>
                <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-2/3 flex flex-col gap-4">
                        <div className="w-3/4 h-8 bg-raised rounded" />
                        <div className="w-1/2 h-4 bg-raised rounded" />
                        <div className="w-full h-32 bg-raised rounded mt-4" />
                    </div>
                    <div className="w-full lg:w-1/3 flex flex-col gap-4">
                        <div className="w-full h-24 bg-raised rounded" />
                        <div className="w-full h-64 bg-raised rounded" />
                    </div>
                </section>
            </div>
        )
    }

    if (!series || !seasonData || fetchTimeout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-white bg-bg-primary">
                <h1 className="text-2xl font-bold font-display">{fetchTimeout ? "Sunucu yanıt vermiyor." : "Dizi bulunamadı."}</h1>
                <p className="text-text-sec">Lütfen internet bağlantınızı kontrol edip sayfayı yenileyin.</p>
                <Link href="/">
                    <Button variant="primary">Ana Sayfaya Dön</Button>
                </Link>
            </div>
        )
    }

    const year = series.first_air_date?.split("-")[0] || "—"
    const embedUrl = getEpisodeEmbedUrl(seriesId, seasonNumber, episodeNumber, sourceIndex)
    const activeSource = SOURCES[sourceIndex]

    return (
        <div className="min-h-screen bg-bg-primary text-white flex flex-col pb-20 relative">
            {dominantColor && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 pointer-events-none mix-blend-screen z-0"
                    style={{
                        background: `radial-gradient(circle at 50% 15%, rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.25) 0%, transparent 50%)`
                    }}
                />
            )}

            {/* PROGRESS MODAL */}
            {showProgressModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-raised border border-border-dim-dim rounded-2xl p-6 max-w-md w-full animate-fade-in text-center">
                        <h3 className="text-xl font-bold font-display text-white mb-2">Kaldığın Yerden Devam Et</h3>
                        <p className="text-text-sec text-sm mb-6">
                            Bu bölümü daha önce izlemeye başlamışsınız. Kaldığınız yerden devam edebilir veya baştan başlayabilirsiniz.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button variant="secondary" onClick={() => setShowProgressModal(false)}>Baştan Başla</Button>
                            <Button variant="primary" onClick={() => setShowProgressModal(false)}>Devam Et</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. MİNİMAL ÜST BAR */}
            <header className="relative z-50 w-full bg-transparent bg-gradient-to-b from-black/80 to-transparent h-20 flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/dizi/${seriesId}`}
                        className="flex items-center gap-3 text-text-sec hover:text-white transition-colors group"
                    >
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                            <ChevronLeft size={20} />
                        </div>
                    </Link>

                    {/* Önceki/Sonraki Butonları */}
                    <div className="flex items-center gap-1 ml-2">
                        <button
                            onClick={() => prevInfo && goToEpisode(prevInfo.s, prevInfo.e)}
                            disabled={!prevInfo}
                            className={`p-2 rounded-lg transition-colors ${prevInfo ? 'text-white hover:bg-bg-hover cursor-pointer' : 'text-text-muted cursor-not-allowed'}`}
                            title={prevInfo ? `S${prevInfo.s}E${prevInfo.e}` : 'Önceki Bölüm Yok'}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => nextInfo && goToEpisode(nextInfo.s, nextInfo.e)}
                            disabled={!nextInfo}
                            className={`p-2 rounded-lg transition-colors ${nextInfo ? 'text-white hover:bg-bg-hover cursor-pointer' : 'text-text-muted cursor-not-allowed'}`}
                            title={nextInfo ? `S${nextInfo.s}E${nextInfo.e}` : 'Sonraki Bölüm Yok'}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <span className="font-medium truncate hidden sm:block ml-2 max-w-[200px] md:max-w-md">
                        {series.name} - S{seasonNumber}E{episodeNumber}
                    </span>
                </div>

                <Link
                    href={`/dizi/${seriesId}`}
                    className="flex items-center gap-2 text-sm font-medium text-purple-500 hover:text-purple-500-light transition-colors"
                >
                    <span className="hidden sm:inline">Detay Sayfası</span>
                    <ExternalLink size={16} />
                </Link>
            </header>

            {/* 2. VIDEO PLAYER ALANI */}
            <section
                className="relative w-full flex justify-center px-0 sm:px-6 lg:px-8 mt-2 z-10 select-none touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-full max-w-7xl">
                    <VideoPlayer
                        embedUrl={embedUrl}
                        title={`${series.name} S${seasonNumber}E${episodeNumber}`}
                        onError={handleError}
                        onLoad={() => { }}
                        subtitleUrl={subtitleBlobUrl}
                        allSourcesFailed={allSourcesFailed}
                        onAddToWatchlist={handleWatchlist}
                        inWatchlist={inWatchlist}
                        activeSourceId={SOURCES[sourceIndex]?.id}
                    />
                </div>
            </section>

            {/* 3. PLAYER CONTROLS & AUTO NEXT */}
            <section className="relative w-full flex flex-col items-center z-10">
                <div className="w-full max-w-7xl px-0 sm:px-6 lg:px-8">
                    <PlayerControls
                        sources={SOURCES}
                        activeSourceIndex={sourceIndex}
                        onSourceChange={handleSourceChange}
                        subtitles={subtitles}
                        activeSubtitleId={activeSubtitleId}
                        onSubtitleChange={handleSubtitleChange}
                        isLoadingSubtitles={isLoadingSubtitles}
                        subtitleError={subtitleError}
                        type="dizi"
                        title={series.name}
                        season={seasonNumber}
                        episode={episodeNumber}
                        episodeTitle={currentEpisode?.name}
                        hasError={hasError}
                    />

                    {/* Auto Next Section */}
                    {showNextEpisodeBtn && (
                        <div className="w-full px-4 py-3 border-t border-border-dim flex justify-end items-center gap-4">
                            {countdown !== null ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-text-sec animate-pulse">Sonraki bölüme geçiliyor ({countdown})...</span>
                                    <Button variant="secondary" onClick={cancelCountdown} className="h-8 py-0 px-3 text-xs">İptal</Button>
                                    <Button variant="primary" onClick={() => goToEpisode(nextInfo!.s, nextInfo!.e)} className="h-8 py-0 px-3 text-xs disabled:opacity-50">Geç</Button>
                                </div>
                            ) : (
                                <>
                                    {nextInfo ? (
                                        <Button
                                            variant="primary"
                                            icon={SkipForward}
                                            onClick={handleNextEpisodeClick}
                                            className="h-9 px-4 text-sm"
                                        >
                                            Sonraki Bölüm: S{nextInfo.s}E{nextInfo.e}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            disabled
                                            className="h-9 px-4 text-sm opacity-50 cursor-not-allowed"
                                            icon={CheckCircle2}
                                        >
                                            {isSeriesCompleted ? "Dizi Bitti" : "Sezon Sonu"}
                                        </Button>
                                    )}
                                    {isSeriesCompleted && (
                                        <Button
                                            variant="secondary"
                                            className="h-9 px-4 text-sm text-rating border-rating/50 hover:bg-rating/10"
                                            icon={Star}
                                            onClick={() => setShowRating(true)}
                                        >
                                            Diziyi Puanla
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 4. İÇERİK BİLGİSİ ALANI */}
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 relative z-10">

                {/* SOL KOLON (2/3) */}
                <div className="flex-1 lg:w-2/3 flex flex-col gap-6 order-2 lg:order-1">
                    <div>
                        <h1 className="font-display text-[28px] font-bold text-white mb-3 leading-tight">
                            {series.name} - S{seasonNumber}E{episodeNumber}
                        </h1>
                        <h2 className="text-xl font-medium text-text-sec mb-3">
                            {currentEpisode?.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant="default" className="text-xs bg-raised">{year}</Badge>
                            <Badge variant="default" className="text-xs bg-raised">{formatRuntime(currentEpisode?.runtime || series.episode_run_time?.[0])}</Badge>
                            {series.genres.slice(0, 3).map(g => (
                                <Badge key={g.id} variant="purple" className="text-xs">{g.name}</Badge>
                            ))}
                        </div>
                    </div>

                    {currentEpisode?.overview ? (
                        <p className="text-text-sec text-base leading-relaxed">
                            {currentEpisode.overview}
                        </p>
                    ) : series.overview && (
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-text-muted uppercase tracking-wider">Dizi Özeti</span>
                            <p className="text-text-sec text-base leading-relaxed">
                                {series.overview}
                            </p>
                        </div>
                    )}

                    {/* Oyuncu Kadrosu */}
                    {series.credits?.cast && series.credits.cast.length > 0 && (
                        <div className="pt-4 border-t border-border-dim mt-4">
                            <h3 className="font-medium text-lg mb-4">Oyuncular</h3>
                            <ScrollableRow innerClassName="flex gap-4">
                                {series.credits.cast.slice(0, 15).map((actor: TMDBCastMember) => (
                                    <ActorCard key={actor.id} actor={actor} />
                                ))}
                            </ScrollableRow>
                        </div>
                    )}
                </div>

                {/* SAĞ KOLON (1/3) */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6 order-1 lg:order-2">

                    {/* Şu An İzliyorsun Kartı */}
                    <Card className="border-purple-500/50 shadow-glow-sm p-5 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                                <PlayCircle size={28} />
                            </div>
                            <div>
                                <p className="text-xs text-text-sec font-medium uppercase tracking-wider mb-1">Şu An İzliyorsun</p>
                                <h3 className="font-display font-bold text-white leading-tight line-clamp-2">{series.name}</h3>
                                <p className="text-sm text-text-muted mt-1">S{seasonNumber}E{episodeNumber} • {activeSource.name}</p>
                            </div>
                        </div>
                    </Card>

                    {/* BÖLÜM SEÇİCİ */}
                    <div className="flex flex-col border border-border-dim bg-raised rounded-2xl overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-border-dim bg-bg-primary/50">
                            {/* Season Select */}
                            <div className="relative" ref={seasonDropdownRef}>
                                <button
                                    onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-overlay/50 border border-border-dim hover:bg-overlay hover:border-border transition-all duration-200 text-sm font-medium text-white rounded-xl"
                                >
                                    <span>Sezon {selectedSeason}</span>
                                    <ChevronDown size={16} className={`text-text-muted transition-transform duration-200 ${isSeasonDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isSeasonDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 max-h-60 overflow-y-auto custom-scrollbar bg-raised border border-border-dim rounded-xl shadow-xl z-50 backdrop-blur-xl flex flex-col mt-2">
                                        {series.seasons.filter(s => s.season_number > 0).map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    setSelectedSeason(s.season_number)
                                                    setIsSeasonDropdownOpen(false)
                                                }}
                                                className={`flex items-center justify-between w-full px-4 py-3 text-left text-sm transition-colors border-b border-border-dim/50 last:border-0 ${selectedSeason === s.season_number ? 'bg-purple-500/10 text-purple-500 font-bold' : 'text-white hover:bg-overlay font-medium'}`}
                                            >
                                                <span>Sezon {s.season_number}</span>
                                                <span className="text-xs opacity-60">({s.episode_count} bölüm)</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
                            {seasonData?.episodes.map(ep => {
                                const isCurrent = ep.episode_number === episodeNumber && selectedSeason === seasonNumber
                                return (
                                    <EpisodeRow
                                        key={ep.id}
                                        ep={ep}
                                        seriesId={seriesId}
                                        selectedSeason={selectedSeason}
                                        isCurrent={isCurrent}
                                        goToEpisode={goToEpisode}
                                    />
                                )
                            })}
                        </div>
                    </div>

                    {/* Aksiyon Butonları */}
                    <div className="flex flex-col gap-3">
                        <Button
                            variant="secondary"
                            className={`w-full justify-start ${inWatchlist ? '!border-purple-500 !text-purple-500 bg-purple-500/5' : ''}`}
                            icon={Bookmark}
                            onClick={handleWatchlist}
                        >
                            {inWatchlist ? "Koleksiyonda" : "Koleksiyona Ekle"}
                        </Button>
                        <Button
                            variant="secondary"
                            className={`w-full justify-start ${seriesWatched ? '!border-success !text-success bg-success/5' : ''}`}
                            icon={Check}
                            onClick={handleWatched}
                        >
                            {seriesWatched ? "Dizi İzlendi" : "Diziyi İzlendi İşaretle"}
                        </Button>

                        <div className="relative">
                            <Button
                                variant="secondary"
                                className="w-full justify-start text-rating border-border-dim hover:border-rating/50 hover:bg-rating/5"
                                icon={Star}
                                onClick={() => setShowRating(!showRating)}
                            >
                                Puan Ver
                            </Button>
                            {showRating && (
                                <div className="absolute top-full mt-2 right-0 z-20 w-full sm:w-auto p-3 bg-raised border border-border-dim rounded-xl shadow-xl">
                                    <RatingPicker
                                        id={seriesId}
                                        type="dizi"
                                        title={series.name}
                                        posterPath={posterUrl(series.poster_path)}
                                        onRatingChange={() => setShowRating(false)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </section>

        </div>
    )
}

// ==========================================
// Alt Bileşen: ActorCard
// ==========================================
function ActorCard({ actor }: { actor: TMDBCastMember }) {
    const [imgError, setImgError] = useState(false);

    return (
        <Link href={`/oyuncu/${actor.id}`} className="group w-[80px] flex-shrink-0">
            <div className="relative w-[80px] h-[80px] rounded-full overflow-hidden bg-raised border-2 border-border-dim group-hover:border-purple-500 transition-colors mb-2">
                {actor.profile_path && !imgError ? (
                    <Image
                        src={profileUrl(actor.profile_path)}
                        alt={actor.name}
                        fill
                        className="object-cover text-transparent"
                        sizes="80px"
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-text-muted">Görsel Yok</span>
                    </div>
                )}
            </div>
            <p className="text-xs font-medium text-white text-center truncate group-hover:text-purple-500 transition-colors">
                {actor.name}
            </p>
        </Link>
    );
}

function EpisodeRow({
    ep,
    seriesId,
    selectedSeason,
    isCurrent,
    goToEpisode
}: {
    ep: TMDBEpisode;
    seriesId: string;
    selectedSeason: number;
    isCurrent: boolean;
    goToEpisode: (s: number, e: number) => void;
}) {
    const [watched, setWatched] = useState(false);

    useEffect(() => {
        async function fetchWatched() {
            setWatched(await isEpisodeWatched(seriesId, selectedSeason, ep.episode_number));
        }
        fetchWatched();
    }, [seriesId, selectedSeason, ep.episode_number]);

    return (
        <button
            onClick={() => goToEpisode(selectedSeason, ep.episode_number)}
            className={`flex items-center justify-between p-3 border-b border-border-dim/50 text-left transition-colors last:border-0
                ${isCurrent ? 'bg-bg-hover border-l-4 border-l-purple' : 'hover:bg-bg-hover border-l-4 border-l-transparent'}
                ${watched && !isCurrent ? 'text-text-muted' : 'text-white'}
            `}
        >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
                <span className="text-xs font-medium bg-bg px-1.5 py-0.5 rounded text-text-sec min-w-[40px] text-center">
                    S{selectedSeason}E{ep.episode_number}
                </span>
                <span className="text-sm truncate">
                    {ep.name || `Bölüm ${ep.episode_number}`}
                </span>
            </div>
            {watched && (
                <CheckCircle2 size={16} className="text-success ml-2 flex-shrink-0" />
            )}
        </button>
    );
}
