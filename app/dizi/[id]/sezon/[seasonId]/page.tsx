"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star,
    Tv2,
    Circle,
    CheckCircle2,
    ChevronRight,
    Loader2,
    RotateCcw,
    PlayCircle,
} from "lucide-react";
import { getSeasonDetail, getSeriesDetail, posterUrl, BLUR_PLACEHOLDER } from "@/lib/tmdb";
import {
    markEpisodeWatched,
    unmarkEpisodeWatched,
    isEpisodeWatched,
} from "@/lib/db";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import type { TMDBSeasonDetail, TMDBEpisode } from "@/lib/tmdb";
import confetti from "canvas-confetti";

export default function SeasonDetailPage({
    params,
}: {
    params: { id: string; seasonId: string };
}) {
    const [season, setSeason] = useState<TMDBSeasonDetail | null>(null);
    const [seriesName, setSeriesName] = useState("");
    const [loading, setLoading] = useState(true);
    const [watchedMap, setWatchedMap] = useState<Record<string, boolean>>({});
    const [expandedEp, setExpandedEp] = useState<number | null>(null);

    const seasonNumber = parseInt(params.seasonId, 10);

    const refreshWatchedMap = useCallback(async () => {
        if (!season) return;
        const map: Record<string, boolean> = {};

        const promises = season.episodes.map(async (ep: TMDBEpisode) => {
            const watched = await isEpisodeWatched(
                params.id,
                ep.season_number,
                ep.episode_number
            );
            map[`${ep.season_number}-${ep.episode_number}`] = watched;
        });

        await Promise.all(promises);
        setWatchedMap(map);
    }, [season, params.id]);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const seriesData = await getSeriesDetail(params.id);
            if (seriesData) setSeriesName(seriesData.name);

            const seasonData = await getSeasonDetail(params.id, seasonNumber);
            setSeason(seasonData);

            document.title = `${seriesData?.name || "Dizi"} - Sezon ${seasonNumber} - CineTrack`;
            setLoading(false);
        }
        loadData();
    }, [params.id, seasonNumber]);

    useEffect(() => {
        refreshWatchedMap();
    }, [refreshWatchedMap]);

    const toggleEpisode = async (ep: TMDBEpisode) => {
        const key = `${ep.season_number}-${ep.episode_number}`;
        if (watchedMap[key]) {
            await unmarkEpisodeWatched(params.id, ep.season_number, ep.episode_number);
        } else {
            await markEpisodeWatched(params.id, ep.season_number, ep.episode_number);
            confetti({
                particleCount: 60,
                spread: 55,
                origin: { y: 0.7 },
                colors: ["#7B5CF0", "#9D7FF4", "#22C55E", "#ffffff"],
                zIndex: 9999,
            });
        }
        setWatchedMap((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const markAllWatched = async () => {
        if (!season) return;

        const promises = season.episodes.map(async (ep: TMDBEpisode) => {
            const watched = await isEpisodeWatched(params.id, ep.season_number, ep.episode_number);
            if (!watched) {
                await markEpisodeWatched(params.id, ep.season_number, ep.episode_number);
            }
        });

        await Promise.all(promises);

        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ["#7B5CF0", "#9D7FF4", "#22C55E", "#ffffff"],
            zIndex: 9999,
        });
        await refreshWatchedMap();
    };

    const resetSeason = async () => {
        if (!season) return;

        const promises = season.episodes.map(async (ep: TMDBEpisode) => {
            const watched = await isEpisodeWatched(params.id, ep.season_number, ep.episode_number);
            if (watched) {
                await unmarkEpisodeWatched(params.id, ep.season_number, ep.episode_number);
            }
        });

        await Promise.all(promises);
        await refreshWatchedMap();
    };

    const formatRuntime = (minutes: number | null) => {
        if (!minutes) return "";
        return minutes >= 60 ? `${Math.floor(minutes / 60)}s ${minutes % 60}dk` : `${minutes}dk`;
    };

    // --- Loading ---
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-purple-500" />
            </div>
        );
    }

    // --- Not found ---
    if (!season) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="font-display text-2xl font-bold mb-2 text-white">Sezon Bulunamadı</h1>
                <p className="text-text-sec mb-6">Bu sezon bilgilerine ulaşılamıyor.</p>
                <Link href={`/dizi/${params.id}`}>
                    <Button variant="primary">Diziye Dön</Button>
                </Link>
            </div>
        );
    }

    const totalEps = season.episodes.length;
    const watchedCount = Object.values(watchedMap).filter(Boolean).length;
    const progressPercent = totalEps > 0 ? Math.round((watchedCount / totalEps) * 100) : 0;

    return (
        <div>
            {/* ==========================================
          ÜST KISIM - BREADCRUMB + PROGRESS
         ========================================== */}
            <section className="mb-10">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
                    <Link href={`/dizi/${params.id}`} className="hover:text-white transition-colors">
                        {seriesName || "Dizi"}
                    </Link>
                    <ChevronRight size={14} />
                    <span className="text-white font-medium">Sezon {seasonNumber}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* Sezon poster */}
                    {season.poster_path && (
                        <div className="relative w-[150px] h-[225px] flex-shrink-0 rounded-xl overflow-hidden border border-border-dim shadow-glow-sm">
                            <Image
                                src={posterUrl(season.poster_path)}
                                alt={season.name}
                                fill
                                className="object-cover text-transparent"
                                sizes="150px"
                                placeholder="blur"
                                blurDataURL={BLUR_PLACEHOLDER}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>
                    )}

                    <div className="flex-1 space-y-4">
                        <div>
                            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
                                {season.name}
                            </h1>
                            <p className="text-text-muted mt-1">
                                {totalEps} Bölüm
                                {season.air_date && ` · ${season.air_date.split("-")[0]}`}
                            </p>
                        </div>

                        {season.overview && (
                            <p className="text-text-sec text-sm leading-relaxed max-w-2xl">{season.overview}</p>
                        )}

                        {/* Progress */}
                        <div className="max-w-md">
                            <ProgressBar
                                value={progressPercent}
                                color="success"
                                size="md"
                            />
                            <p className="text-text-sec text-sm mt-2">{watchedCount} / {totalEps} bölüm izlendi</p>
                        </div>

                        {/* Butonlar */}
                        <div className="flex gap-3">
                            <Button
                                variant="primary"
                                icon={CheckCircle2}
                                onClick={markAllWatched}
                            >
                                Sezonu Tamamla
                            </Button>
                            <Button
                                variant="danger"
                                icon={RotateCcw}
                                onClick={resetSeason}
                            >
                                Sıfırla
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==========================================
          BÖLÜM LİSTESİ
         ========================================== */}
            <section>
                <h2 className="font-display text-xl font-bold text-white mb-4">Bölümler</h2>
                <div className="space-y-3">
                    {season.episodes.map((ep: TMDBEpisode, index: number) => {
                        const key = `${ep.season_number}-${ep.episode_number}`;
                        const epWatched = watchedMap[key] || false;
                        const isExpanded = expandedEp === ep.id;

                        return (
                            <motion.div
                                key={ep.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: index * 0.03 }}
                            >
                                <Card
                                    className={`!p-0 overflow-hidden transition-all ${epWatched
                                        ? "!border-success/30 !bg-success/5"
                                        : ""
                                        }`}
                                >
                                    <div className="flex gap-4 p-4">
                                        {/* Sol: Görsel */}
                                        <div className="relative w-[160px] h-[90px] flex-shrink-0 rounded-xl overflow-hidden bg-raised hidden sm:block">
                                            {ep.still_path ? (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                                                    alt={ep.name}
                                                    fill
                                                    className="object-cover text-transparent"
                                                    sizes="160px"
                                                    placeholder="blur"
                                                    blurDataURL={BLUR_PLACEHOLDER}
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Tv2 size={24} className="text-text-muted" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Orta: Bilgiler */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-2 mb-1">
                                                <Badge variant="muted" className="text-[10px] flex-shrink-0">
                                                    S{ep.season_number}E{ep.episode_number}
                                                </Badge>
                                                <h3 className="font-display font-bold text-white text-sm sm:text-base leading-tight line-clamp-1">
                                                    {ep.name}
                                                </h3>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mb-1">
                                                {ep.air_date && (
                                                    <span>
                                                        {new Date(ep.air_date).toLocaleDateString("tr-TR", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                )}
                                                {ep.runtime && (
                                                    <>
                                                        <span className="w-1 h-1 bg-text-muted rounded-full" />
                                                        <span>{formatRuntime(ep.runtime)}</span>
                                                    </>
                                                )}
                                                {ep.vote_average > 0 && (
                                                    <>
                                                        <span className="w-1 h-1 bg-text-muted rounded-full" />
                                                        <span className="flex items-center gap-0.5">
                                                            <Star size={10} className="text-rating" fill="currentColor" />
                                                            {ep.vote_average.toFixed(1)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {ep.overview && (
                                                <>
                                                    <p className={`text-xs text-text-sec leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                                                        {ep.overview}
                                                    </p>
                                                    {ep.overview.length > 120 && (
                                                        <button
                                                            onClick={() => setExpandedEp(isExpanded ? null : ep.id)}
                                                            className="text-xs text-purple-500 hover:text-purple-400 mt-0.5 font-medium"
                                                        >
                                                            {isExpanded ? "Gizle" : "Devamını Oku"}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Sağ: İzle butonu + İşaretleme */}
                                        <div className="flex items-center gap-3 flex-shrink-0 flex-col sm:flex-row justify-center">
                                            <Link href={`/izle/dizi/${params.id}/${ep.season_number}/${ep.episode_number}`}>
                                                <motion.button
                                                    whileTap={{ scale: 0.85 }}
                                                    whileHover={{ scale: 1.1 }}
                                                    title="Bölümü İzle"
                                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white transition-colors"
                                                >
                                                    <PlayCircle size={24} />
                                                </motion.button>
                                            </Link>

                                            <motion.button
                                                onClick={() => toggleEpisode(ep)}
                                                whileTap={{ scale: 0.85 }}
                                                whileHover={{ scale: 1.1 }}
                                                title={epWatched ? "İzlenmedi olarak işaretle" : "İzledim olarak işaretle"}
                                                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                                            >
                                                <AnimatePresence mode="wait">
                                                    {epWatched ? (
                                                        <motion.div
                                                            key="checked"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            exit={{ scale: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <CheckCircle2 size={28} className="text-success" />
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="unchecked"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            exit={{ scale: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <Circle size={28} className="text-[#2A2A35] hover:text-text-muted transition-colors" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
