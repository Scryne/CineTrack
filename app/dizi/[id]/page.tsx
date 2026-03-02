"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Star,
    Bookmark,
    BookmarkCheck,
    Check,
    Clapperboard,
    Award,
    User,
    Loader2,
    Tv,
    CheckCircle2,
    Play,
    PlayCircle,
    MonitorPlay,
    ExternalLink,
} from "lucide-react";
import { getSeriesDetail, getSeriesExternalIds, getWatchProviders, posterUrl, backdropUrl, profileUrl, BLUR_PLACEHOLDER } from "@/lib/tmdb";
import { getRatings } from "@/lib/omdb";
import {
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    markAsWatched,
    removeFromWatched,
    isWatched,
    getWatchedEpisodes,
    markAllEpisodesWatched,
    removeAllEpisodesWatched,
    getWatchProgress,
} from "@/lib/storage";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import RatingPicker from "@/components/RatingPicker";
import ScrollableRow from "@/components/ui/ScrollableRow";
import type { TMDBSeriesDetail, TMDBCastMember, TMDBVideo, TMDBSeasonSummary } from "@/lib/tmdb";
import type { TMDBWatchProviders } from "@/lib/tmdb";
import type { OMDBRatings } from "@/lib/omdb";
import type { WatchProgress } from "@/types/player";

// Durum etiketleri
const STATUS_MAP: Record<string, { label: string; variant: "purple" | "success" | "muted" }> = {
    "Returning Series": { label: "Devam Ediyor", variant: "purple" },
    "In Production": { label: "Devam Ediyor", variant: "purple" },
    Ended: { label: "Tamamlandı", variant: "success" },
    Canceled: { label: "İptal", variant: "muted" },
    Pilot: { label: "Pilot", variant: "muted" },
};

export default function SeriesDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const router = useRouter();
    const [series, setSeries] = useState<TMDBSeriesDetail | null>(null);
    const [ratings, setRatings] = useState<OMDBRatings | null>(null);
    const [loading, setLoading] = useState(true);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [watched, setWatched] = useState(false);
    const [watchedEpCount, setWatchedEpCount] = useState(0);
    const [progress, setProgress] = useState<WatchProgress | null>(null);
    const [providers, setProviders] = useState<TMDBWatchProviders | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const data = await getSeriesDetail(params.id);
            setSeries(data);

            if (data) {
                document.title = `${data.name} - CineTrack`;
            }

            if (data) {
                const externalIds = await getSeriesExternalIds(params.id);
                if (externalIds?.imdb_id) {
                    const omdbData = await getRatings(externalIds.imdb_id);
                    setRatings(omdbData);
                }

                setInWatchlist(isInWatchlist(params.id, "dizi"));
                setWatched(isWatched(params.id, "dizi"));
                const eps = getWatchedEpisodes(params.id);
                setWatchedEpCount(eps.length);

                // WatchProgress kontrolü
                const wp = getWatchProgress(params.id, "dizi");
                setProgress(wp);

                // Watch Providers
                const wpData = await getWatchProviders(params.id, "dizi");
                setProviders(wpData);
            }

            setLoading(false);
        }
        loadData();
    }, [params.id]);

    const handleWatchlist = () => {
        if (!series) return;
        if (inWatchlist) {
            removeFromWatchlist(params.id, "dizi");
            setInWatchlist(false);
        } else {
            addToWatchlist({
                id: params.id,
                type: "dizi",
                title: series.name,
                posterPath: posterUrl(series.poster_path),
                addedAt: new Date().toISOString(),
            });
            setInWatchlist(true);
        }
    };

    const handleWatched = () => {
        if (!series) return;
        if (watched) {
            removeFromWatched(params.id, "dizi");
            removeAllEpisodesWatched(params.id);
            setWatched(false);
            setWatchedEpCount(0);
        } else {
            markAsWatched({
                id: params.id,
                type: "dizi",
                title: series.name,
                posterPath: posterUrl(series.poster_path),
                watchedAt: new Date().toISOString(),
            });
            // Tüm bölümleri izlendi olarak işaretle
            const seasonData = series.seasons
                .filter((s) => s.season_number > 0)
                .map((s) => ({ seasonNumber: s.season_number, episodeCount: s.episode_count }));
            markAllEpisodesWatched(params.id, seasonData);
            setWatched(true);
            setWatchedEpCount(series.number_of_episodes || 0);
        }
    };

    const trailer = series?.videos?.results?.find(
        (v: TMDBVideo) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
    );

    // --- Loading ---
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-purple" />
            </div>
        );
    }

    // --- Not found ---
    if (!series) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="font-display text-2xl font-bold mb-2 text-text-primary">Dizi Bulunamadı</h1>
                <p className="text-text-secondary mb-6">Bu dizi bilgilerine ulaşılamıyor.</p>
                <Link href="/">
                    <Button variant="primary">Ana Sayfaya Dön</Button>
                </Link>
            </div>
        );
    }

    const year = series.first_air_date?.split("-")[0] || "—";
    const totalEpisodes = series.number_of_episodes || 0;
    const progressPercent = totalEpisodes > 0 ? Math.min(Math.round((watchedEpCount / totalEpisodes) * 100), 100) : 0;
    const statusInfo = STATUS_MAP[series.status] || { label: series.status, variant: "muted" as const };

    // Rating cards
    const ratingCards = [
        {
            source: "TMDB",
            value: series.vote_average?.toFixed(1),
            icon: Star,
            color: "text-rating",
            show: !!series.vote_average,
        },
        {
            source: "IMDb",
            value: ratings?.imdbRating,
            icon: Star,
            color: "text-rating",
            show: !!ratings?.imdbRating && ratings.imdbRating !== "N/A",
        },
        {
            source: "Rotten Tomatoes",
            value: ratings?.rottenTomatoes,
            icon: Clapperboard,
            color: "text-red-400",
            show: !!ratings?.rottenTomatoes && ratings.rottenTomatoes !== "N/A",
        },
        {
            source: "Metacritic",
            value: ratings?.metacritic,
            icon: Award,
            color: "text-green-400",
            show: !!ratings?.metacritic && ratings.metacritic !== "N/A",
        },
    ].filter((r) => r.show);

    // İzleme linki hesapla
    const watchLink = progress
        ? `/izle/dizi/${params.id}/${progress.season}/${progress.episode}`
        : `/izle/dizi/${params.id}/1/1`;

    const hasProviders = providers && (providers.flatrate?.length || providers.rent?.length || providers.buy?.length);

    return (
        <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            {/* ==========================================
          1. HERO - BACKDROP
         ========================================== */}
            <section className="relative" style={{ height: "70vh" }}>
                {series.backdrop_path ? (
                    <Image
                        src={backdropUrl(series.backdrop_path)}
                        alt={series.name}
                        fill
                        className="object-cover"
                        priority
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                    />
                ) : (
                    <div className="w-full h-full bg-bg-card" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0F]/80 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-black/40" />
            </section>

            {/* ==========================================
          2. CONTENT AREA
         ========================================== */}
            <section className="relative px-4 sm:px-6 lg:px-8 -mt-[200px] z-10" style={{ paddingBottom: "40px" }}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row gap-8">
                        {/* SOL - POSTER */}
                        <motion.div
                            className="flex-shrink-0 hidden sm:block"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="relative w-[220px] h-[330px] rounded-2xl overflow-hidden shadow-purple-glow">
                                {series.poster_path ? (
                                    <Image
                                        src={posterUrl(series.poster_path)}
                                        alt={series.name}
                                        fill
                                        className="object-cover"
                                        sizes="220px"
                                        placeholder="blur"
                                        blurDataURL={BLUR_PLACEHOLDER}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-bg-card flex items-center justify-center text-text-muted">
                                        Görsel Yok
                                    </div>
                                )}
                                {(watched || inWatchlist) && (
                                    <div className="absolute top-3 left-3">
                                        <Badge variant={watched ? "success" : "purple"}>
                                            {watched ? "İzlendi" : "Listede"}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* SAĞ - BİLGİLER */}
                        <motion.div
                            className="flex-1 space-y-5"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            {/* Dizi adı */}
                            <h1 className="font-display text-[32px] sm:text-[40px] font-bold text-text-primary leading-tight">
                                {series.name}
                            </h1>

                            {/* Orijinal ad */}
                            {series.original_name !== series.name && (
                                <p className="text-text-secondary text-base -mt-2">
                                    {series.original_name}
                                </p>
                            )}

                            {/* Meta bilgiler */}
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-text-primary font-medium">{year}</span>
                                <span className="w-1 h-1 bg-text-muted rounded-full" />
                                <span className="text-text-secondary">{series.number_of_seasons} Sezon</span>
                                <span className="w-1 h-1 bg-text-muted rounded-full" />
                                <span className="text-text-secondary">{totalEpisodes} Bölüm</span>
                                <span className="w-1 h-1 bg-text-muted rounded-full" />
                                <Badge variant={statusInfo.variant} className="text-xs">
                                    {statusInfo.label}
                                </Badge>
                                <span className="w-1 h-1 bg-text-muted rounded-full" />
                                <div className="flex flex-wrap gap-1.5">
                                    {series.genres.map((g) => (
                                        <Badge key={g.id} variant="default" className="text-xs">
                                            {g.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* PUANLAR */}
                            {ratingCards.length > 0 && (
                                <div className="flex flex-wrap gap-3">
                                    {ratingCards.map((card) => {
                                        const Icon = card.icon;
                                        return (
                                            <div
                                                key={card.source}
                                                className="flex items-center gap-2.5 bg-bg-card border border-border rounded-xl px-4 py-3 min-w-[120px]"
                                            >
                                                <Icon size={18} className={card.color} />
                                                <div>
                                                    <p className="text-text-muted text-[11px] uppercase tracking-wide leading-none mb-0.5">
                                                        {card.source}
                                                    </p>
                                                    <p className="text-text-primary font-bold text-lg leading-none">
                                                        {card.value}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Benim Puanım */}
                            <div className="flex items-center gap-4">
                                <span className="text-text-secondary text-sm">Benim Puanım:</span>
                                <RatingPicker
                                    id={params.id}
                                    type="dizi"
                                    title={series.name}
                                    posterPath={posterUrl(series.poster_path)}
                                    onRatingChange={() => { }}
                                />
                            </div>

                            {/* BUTONLAR */}
                            <div className="flex flex-wrap gap-3 pt-1">
                                {/* İZLE BUTONU */}
                                <motion.div whileTap={{ scale: 0.9 }}>
                                    <button
                                        onClick={() => router.push(watchLink)}
                                        className="flex items-center gap-3 px-6 py-3.5 bg-purple hover:bg-purple-light text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-purple/25 hover:shadow-purple/40 group"
                                    >
                                        {progress ? (
                                            <>
                                                <PlayCircle size={22} className="group-hover:scale-110 transition-transform" />
                                                <div className="text-left">
                                                    <span className="block text-sm font-bold">
                                                        S{progress.season}E{progress.episode}&apos;den Devam Et
                                                    </span>
                                                    {progress.episodeTitle && (
                                                        <span className="block text-[11px] text-white/70 font-normal truncate max-w-[180px]">
                                                            {progress.episodeTitle}
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Play size={22} fill="white" className="group-hover:scale-110 transition-transform" />
                                                <span className="text-base">İzlemeye Başla</span>
                                            </>
                                        )}
                                    </button>
                                </motion.div>

                                <motion.div whileTap={{ scale: 0.9 }}>
                                    <Button
                                        variant="secondary"
                                        icon={inWatchlist ? BookmarkCheck : Bookmark}
                                        onClick={handleWatchlist}
                                        className={inWatchlist ? "!border-purple !text-purple" : ""}
                                    >
                                        {inWatchlist ? "Koleksiyonda" : "Koleksiyona Ekle"}
                                    </Button>
                                </motion.div>

                                <motion.div whileTap={{ scale: 0.9 }}>
                                    <Button
                                        variant={watched ? "primary" : "secondary"}
                                        icon={Check}
                                        onClick={handleWatched}
                                        className={watched ? "!bg-success !border-success" : ""}
                                    >
                                        {watched ? "İzlendi" : "İzledim"}
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ==========================================
          PLATFORMLARDA İZLE
         ========================================== */}
            {hasProviders && (
                <section className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: "20px", paddingBottom: "40px" }}>
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 mb-5">
                            <MonitorPlay size={22} className="text-purple" />
                            <h2 className="font-display text-2xl font-bold text-text-primary">Platformlarda İzle</h2>
                        </div>

                        <div className="flex flex-col gap-6">
                            {providers.flatrate && providers.flatrate.length > 0 && (
                                <div>
                                    <p className="text-text-muted text-xs uppercase tracking-wider mb-3 font-medium">Abonelik</p>
                                    <div className="flex flex-wrap gap-3">
                                        {providers.flatrate.map((p) => (
                                            <div
                                                key={p.provider_id}
                                                className="flex items-center gap-3 bg-bg-card border border-border rounded-xl px-4 py-3 hover:border-purple/50 transition-colors"
                                            >
                                                {p.logo_path && (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                                        alt={p.provider_name}
                                                        width={36}
                                                        height={36}
                                                        className="rounded-lg"
                                                    />
                                                )}
                                                <span className="text-sm font-medium text-text-primary">{p.provider_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {providers.rent && providers.rent.length > 0 && (
                                <div>
                                    <p className="text-text-muted text-xs uppercase tracking-wider mb-3 font-medium">Kiralık</p>
                                    <div className="flex flex-wrap gap-3">
                                        {providers.rent.map((p) => (
                                            <div
                                                key={p.provider_id}
                                                className="flex items-center gap-3 bg-bg-card border border-border rounded-xl px-4 py-3 hover:border-purple/50 transition-colors"
                                            >
                                                {p.logo_path && (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                                        alt={p.provider_name}
                                                        width={36}
                                                        height={36}
                                                        className="rounded-lg"
                                                    />
                                                )}
                                                <span className="text-sm font-medium text-text-primary">{p.provider_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {providers.buy && providers.buy.length > 0 && (
                                <div>
                                    <p className="text-text-muted text-xs uppercase tracking-wider mb-3 font-medium">Satın Al</p>
                                    <div className="flex flex-wrap gap-3">
                                        {providers.buy.map((p) => (
                                            <div
                                                key={p.provider_id}
                                                className="flex items-center gap-3 bg-bg-card border border-border rounded-xl px-4 py-3 hover:border-purple/50 transition-colors"
                                            >
                                                {p.logo_path && (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                                        alt={p.provider_name}
                                                        width={36}
                                                        height={36}
                                                        className="rounded-lg"
                                                    />
                                                )}
                                                <span className="text-sm font-medium text-text-primary">{p.provider_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {providers.link && (
                                <a
                                    href={providers.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-purple hover:text-purple-light transition-colors"
                                >
                                    <ExternalLink size={14} />
                                    Tüm platformları gör (JustWatch)
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ==========================================
          3. İZLEME İLERLEMESI KARTI
         ========================================== */}
            <section className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: "40px", paddingBottom: "40px" }}>
                <div className="max-w-7xl mx-auto">
                    <Card className="max-w-xl p-6">
                        <h3 className="font-display text-lg font-bold text-text-primary mb-4">İzleme Durumun</h3>
                        <ProgressBar
                            value={progressPercent}
                            color="purple"
                            size="md"
                        />
                        <p className="text-text-secondary text-sm mt-2">{watchedEpCount} / {totalEpisodes} bölüm izlendi</p>
                    </Card>
                </div>
            </section>

            {/* ==========================================
          4. HİKAYE
         ========================================== */}
            <section className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: "40px", paddingBottom: "40px" }}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="font-display text-2xl font-bold text-text-primary mb-4">Hikaye</h2>
                    {series.overview ? (
                        <p className="text-text-secondary leading-relaxed max-w-3xl text-base">
                            {series.overview}
                        </p>
                    ) : (
                        <p className="text-text-muted italic">Özet bilgisi mevcut değil.</p>
                    )}
                </div>
            </section>

            {/* ==========================================
          5. SEZON LİSTESİ
         ========================================== */}
            {series.seasons && series.seasons.length > 0 && (
                <section className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: "40px", paddingBottom: "40px" }}>
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Sezonlar</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                            {series.seasons
                                .filter((s: TMDBSeasonSummary) => s.season_number > 0)
                                .map((season: TMDBSeasonSummary) => {
                                    const seasonEpCount = season.episode_count || 0;
                                    const seasonWatchedEps = getWatchedEpisodes(params.id).filter(
                                        (ep) => ep.seasonNumber === season.season_number
                                    );
                                    const seasonWatchedCount = seasonWatchedEps.length;
                                    const seasonProgress = seasonEpCount > 0
                                        ? Math.round((seasonWatchedCount / seasonEpCount) * 100)
                                        : 0;
                                    const isComplete = seasonProgress === 100 && seasonEpCount > 0;

                                    return (
                                        <Link
                                            key={season.id}
                                            href={`/dizi/${params.id}/sezon/${season.season_number}`}
                                        >
                                            <Card hover className="group overflow-hidden h-full">
                                                <div className="relative w-full aspect-[2/3] overflow-hidden bg-bg-card">
                                                    {season.poster_path ? (
                                                        <Image
                                                            src={posterUrl(season.poster_path)}
                                                            alt={season.name}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                            sizes="200px"
                                                            placeholder="blur"
                                                            blurDataURL={BLUR_PLACEHOLDER}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Tv size={40} className="text-text-muted" />
                                                        </div>
                                                    )}
                                                    {/* Completed overlay */}
                                                    {isComplete && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <CheckCircle2 size={48} className="text-success" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                                        <p className="text-xs text-gray-300">
                                                            {season.episode_count} Bölüm
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-purple transition-colors truncate">
                                                        Sezon {season.season_number}
                                                    </h3>
                                                    <p className="text-xs text-text-muted mb-2">
                                                        {season.air_date?.split("-")[0] || "—"}
                                                    </p>
                                                    {seasonEpCount > 0 && (
                                                        <ProgressBar
                                                            value={seasonProgress}
                                                            color={isComplete ? "success" : "purple"}
                                                            size="sm"
                                                        />
                                                    )}
                                                </div>
                                            </Card>
                                        </Link>
                                    );
                                })}
                        </div>
                    </div>
                </section>
            )}

            {/* ==========================================
          8. OYUNCU KADROSU
         ========================================== */}
            {series.credits?.cast && series.credits.cast.length > 0 && (
                <section className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: "40px", paddingBottom: "40px" }}>
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Oyuncular</h2>
                        <ScrollableRow innerClassName="flex gap-5">
                            {series.credits.cast.slice(0, 20).map((actor: TMDBCastMember, index: number) => (
                                <ActorCard key={actor.id} actor={actor} index={index} />
                            ))}
                        </ScrollableRow>
                    </div>
                </section>
            )}

            {/* ==========================================
          9. FRAGMAN
         ========================================== */}
            {trailer && (
                <section className="px-4 sm:px-6 lg:px-8 pb-20" style={{ paddingTop: "40px" }}>
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Fragman</h2>
                        <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-border" style={{ aspectRatio: "16/9" }}>
                            <iframe
                                src={`https://www.youtube.com/embed/${trailer.key}`}
                                title={trailer.name}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                            />
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

// ==========================================
// Alt Bileşen: ActorCard
// ==========================================
function ActorCard({ actor, index }: { actor: TMDBCastMember; index: number }) {
    const [imgError, setImgError] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
        >
            <Link href={`/oyuncu/${actor.id}`} className="group">
                <div className="flex flex-col items-center w-[100px] flex-shrink-0">
                    <div className="relative w-[80px] h-[80px] rounded-full overflow-hidden bg-bg-card border-2 border-border group-hover:border-purple transition-colors mb-2">
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
                                <User size={28} className="text-text-muted" />
                            </div>
                        )}
                    </div>
                    <h3 className="text-xs font-medium text-text-primary text-center leading-tight line-clamp-2 group-hover:text-purple transition-colors">
                        {actor.name}
                    </h3>
                    <p className="text-[10px] text-text-muted text-center leading-tight line-clamp-1 mt-0.5">
                        {actor.character}
                    </p>
                </div>
            </Link>
        </motion.div>
    );
}
