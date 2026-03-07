'use client'

import { logger } from '@/lib/logger'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ExternalLink, PlayCircle, Bookmark, Check, Star, Loader2 } from 'lucide-react'

import toast from 'react-hot-toast'

import { getMovieDetail, posterUrl, backdropUrl, profileUrl, BLUR_PLACEHOLDER } from '@/lib/tmdb'
import SOURCES, { getMovieEmbedUrl, isSourceBlocked } from '@/lib/sources'
import { searchSubtitles, getSubtitleDownloadUrl, loadSubtitleAsBlob } from '@/lib/subtitles'
import {
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isWatched,
    markAsWatched,
    removeFromWatched,
    getWatchProgress,
    saveWatchProgress
} from "@/lib/db"
import type { TMDBMovieDetail, TMDBCastMember } from '@/lib/tmdb'
import type { SubtitleResult } from '@/types/player'
import dynamic from 'next/dynamic'
import { FastAverageColor } from 'fast-average-color'
import { motion } from 'framer-motion'

const VideoPlayer = dynamic(() => import('@/components/player/VideoPlayer'), { ssr: false, loading: () => <div className="w-full aspect-video md:aspect-[16/9] flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 animate-spin text-purple-500" /></div> })
import PlayerControls from '@/components/player/PlayerControls'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import ScrollableRow from '@/components/ui/ScrollableRow'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import RatingPicker from '@/components/RatingPicker'

export default function WatchMoviePage({ params }: { params: { id: string } }) {
    const [movie, setMovie] = useState<TMDBMovieDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [fetchTimeout, setFetchTimeout] = useState(false)
    const [dominantColor, setDominantColor] = useState<{ r: number, g: number, b: number } | null>(null)

    useEffect(() => {
        if (movie?.backdrop_path) {
            const fac = new FastAverageColor();
            fac.getColorAsync(backdropUrl(movie.backdrop_path))
                .then(color => {
                    const [r, g, b] = color.value;
                    setDominantColor({ r, g, b });
                })
                .catch(e => logger.error("Fetch cover average color failed", e));
        }
    }, [movie?.backdrop_path]);

    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setFetchTimeout(true)
            }, 10000) // 10 saniye timeout
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

    // Progress modal
    const [showProgressModal, setShowProgressModal] = useState(false)

    // Interaction states
    const [inWatchlist, setInWatchlist] = useState(false)
    const [watched, setWatched] = useState(false)
    const [showRating, setShowRating] = useState(false)

    useEffect(() => {
        async function init() {
            setLoading(true)

            const data = await getMovieDetail(params.id)
            setMovie(data)

            if (data) {
                document.title = `${data.title} İzle — CineTrack`

                const wl = await isInWatchlist(params.id, "film")
                setInWatchlist(wl)

                const w = await isWatched(params.id, "film")
                setWatched(w)

                // OpenSubtitles API ile altyazıları çek
                setIsLoadingSubtitles(true)
                try {
                    const subs = await searchSubtitles({
                        tmdbId: params.id,
                        type: 'film',
                    })
                    setSubtitles(subs)
                } catch (error) {
                    logger.error('Altyazı yüklenirken hata', error)
                } finally {
                    setIsLoadingSubtitles(false)
                }

                const progress = await getWatchProgress(params.id, "film")

                // Sadece yarıda bırakılmışsa (>2 dk) bildirimi göster
                if (progress && progress.timeSpentSeconds && progress.timeSpentSeconds > 120) {
                    setShowProgressModal(true)
                }

                await saveWatchProgress({
                    tmdbId: params.id,
                    type: 'film',
                    title: data.title,
                    posterPath: posterUrl(data.poster_path),
                    backdropPath: data.backdrop_path ? posterUrl(data.backdrop_path) : undefined,
                    timeSpentSeconds: progress?.timeSpentSeconds || 0,
                    updatedAt: new Date().toISOString()
                })
            }
            setLoading(false)
        }

        init()
    }, [params.id])

    // Yarıda bırakma süresini takip et (10 saniyede bir kaydet)
    useEffect(() => {
        if (!movie) return;

        const interval = setInterval(async () => {
            const currentProgress = await getWatchProgress(params.id, "film");
            if (currentProgress) {
                await saveWatchProgress({
                    ...currentProgress,
                    timeSpentSeconds: (currentProgress.timeSpentSeconds || 0) + 10,
                    updatedAt: new Date().toISOString()
                });
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [movie, params.id]);

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
        // Sonraki engellenmenış kaynağı bul
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
        if (!movie) return;
        if (inWatchlist) {
            await removeFromWatchlist(params.id, "film");
            setInWatchlist(false);
            toast.success("Koleksiyondan çıkarıldı");
        } else {
            await addToWatchlist({
                id: params.id,
                type: "film",
                title: movie.title,
                posterPath: posterUrl(movie.poster_path),
                addedAt: new Date().toISOString(),
            });
            setInWatchlist(true);
            toast.success("Koleksiyona eklendi");
        }
    };

    const handleWatched = async () => {
        if (!movie) return;
        if (watched) {
            await removeFromWatched(params.id, "film");
            setWatched(false);
            toast.success("İzlenenlerden çıkarıldı");
        } else {
            await markAsWatched({
                id: params.id,
                type: "film",
                title: movie.title,
                posterPath: posterUrl(movie.poster_path),
                watchedAt: new Date().toISOString(),
            });
            setWatched(true);
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
                    <div className="w-48 h-5 ml-4 bg-raised rounded" />
                </header>
                <section className="w-full bg-black border-b border-border-dim">
                    <div className="w-full max-w-[1400px] mx-auto aspect-video md:aspect-[16/9] bg-raised/30" />
                </section>
                <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
                    <div className="w-2/3 flex flex-col gap-4">
                        <div className="w-3/4 h-8 bg-raised rounded" />
                        <div className="w-1/2 h-4 bg-raised rounded" />
                        <div className="w-full h-32 bg-raised rounded mt-4" />
                    </div>
                </section>
            </div>
        )
    }

    if (!movie || fetchTimeout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-white bg-bg-primary">
                <h1 className="text-2xl font-bold font-display">{fetchTimeout ? "Sunucu yanıt vermiyor." : "Film bulunamadı."}</h1>
                <p className="text-text-sec">Lütfen internet bağlantınızı kontrol edip sayfayı yenileyin.</p>
                <Link href="/">
                    <Button variant="primary">Ana Sayfaya Dön</Button>
                </Link>
            </div>
        )
    }

    const year = movie.release_date?.split("-")[0] || "—"
    const embedUrl = getMovieEmbedUrl(params.id, sourceIndex)
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

            {/* 1. MİNİMAL ÜST BAR */}
            <header className="relative z-50 w-full bg-transparent bg-gradient-to-b from-black/80 to-transparent h-20 flex items-center justify-between px-4 sm:px-6">
                <Link
                    href={`/film/${params.id}`}
                    className="flex items-center gap-3 text-text-sec hover:text-white transition-colors group max-w-[70%]"
                >
                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="font-medium truncate">{movie.title}</span>
                </Link>
                <Link
                    href={`/film/${params.id}`}
                    className="flex items-center gap-2 text-sm font-medium text-purple-500 hover:text-purple-500-light transition-colors"
                >
                    <span className="hidden sm:inline">Detay Sayfası</span>
                    <ExternalLink size={16} />
                </Link>
            </header>

            {/* 2. VIDEO PLAYER ALANI */}
            <section className="relative w-full flex justify-center px-0 sm:px-6 lg:px-8 mt-2 z-10">
                <div className="w-full max-w-7xl">
                    <VideoPlayer
                        embedUrl={embedUrl}
                        title={movie.title}
                        onError={handleError}
                        onLoad={() => { }}
                        subtitleUrl={subtitleBlobUrl}
                        allSourcesFailed={allSourcesFailed}
                        onAddToWatchlist={handleWatchlist}
                        inWatchlist={inWatchlist}
                        activeSourceId={activeSource.id}
                    />
                </div>
            </section>

            {/* 3. PLAYER CONTROLS */}
            <section className="relative w-full flex justify-center z-10">
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
                        type="film"
                        title={movie.title}
                        hasError={hasError}
                    />
                </div>
            </section>

            {/* 4. İÇERİK BİLGİSİ ALANI */}
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* SOL KOLON (2/3) */}
                    <div className="flex-1 lg:w-2/3 flex flex-col gap-6">
                        <div>
                            <h1 className="font-display text-[28px] font-bold text-white mb-3 leading-tight">
                                {movie.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <Badge variant="default" className="text-xs bg-raised">{year}</Badge>
                                <Badge variant="default" className="text-xs bg-raised">{formatRuntime(movie.runtime)}</Badge>
                                {movie.genres.slice(0, 3).map(g => (
                                    <Badge key={g.id} variant="purple" className="text-xs">{g.name}</Badge>
                                ))}
                            </div>
                        </div>

                        {movie.overview && (
                            <p className="text-text-sec text-base leading-relaxed">
                                {movie.overview}
                            </p>
                        )}

                        {/* Oyuncu Kadrosu */}
                        {movie.credits?.cast && movie.credits.cast.length > 0 && (
                            <div className="pt-4 border-t border-border-dim">
                                <h3 className="font-medium text-lg mb-4">Oyuncular</h3>
                                <ScrollableRow innerClassName="flex gap-4">
                                    {movie.credits.cast.slice(0, 15).map((actor: TMDBCastMember) => (
                                        <ActorCard key={actor.id} actor={actor} />
                                    ))}
                                </ScrollableRow>
                            </div>
                        )}
                    </div>

                    {/* SAĞ KOLON (1/3) */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">

                        {/* Şu An İzliyorsun Kartı */}
                        <Card className="border-purple-500/50 shadow-glow-sm p-5 flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                                    <PlayCircle size={28} />
                                </div>
                                <div>
                                    <p className="text-xs text-text-sec font-medium uppercase tracking-wider mb-1">Şu An İzliyorsun</p>
                                    <h3 className="font-display font-bold text-white leading-tight line-clamp-2">{movie.title}</h3>
                                    <p className="text-sm text-text-muted mt-1">{activeSource.name}</p>
                                </div>
                            </div>
                        </Card>

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
                                className={`w-full justify-start ${watched ? '!border-success !text-success bg-success/5' : ''}`}
                                icon={Check}
                                onClick={handleWatched}
                            >
                                {watched ? "İzlendi" : "İzlendi İşaretle"}
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
                                            id={params.id}
                                            type="film"
                                            title={movie.title}
                                            posterPath={posterUrl(movie.poster_path)}
                                            onRatingChange={() => setShowRating(false)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Benzer Filmler */}
                        {movie.similar?.results && movie.similar.results.length > 0 && (
                            <div className="mt-4">
                                <h3 className="font-medium text-lg mb-4">Benzer Filmler</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {movie.similar.results.slice(0, 4).map((m) => (
                                        <Link key={m.id} href={`/film/${m.id}`}>
                                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-raised border border-border-dim group hover:border-purple-500 transition-colors">
                                                {m.poster_path ? (
                                                    <Image
                                                        src={posterUrl(m.poster_path)}
                                                        alt={m.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        sizes="(max-width: 768px) 50vw, 150px"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-text-muted">
                                                        {m.title}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                </div>
            </section >

            {/* Progress Modal */}
            < Modal
                isOpen={showProgressModal}
                onClose={() => setShowProgressModal(false)
                }
                title="Kaldığın Yerden Devam Et"
            >
                <div className="flex flex-col gap-6">
                    <p className="text-text-sec leading-relaxed">
                        Bu filmi daha önce izlemeye başlamışsınız. Kaldığınız yerden devam edebilir veya baştan başlayabilirsiniz.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => setShowProgressModal(false)}
                        >
                            Baştan Başla
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setShowProgressModal(false)
                                toast.success("Kaldığınız yerden devam ediliyor", { duration: 3000 })
                            }}
                        >
                            Devam Et
                        </Button>
                    </div>
                </div>
            </Modal >

        </div >
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
