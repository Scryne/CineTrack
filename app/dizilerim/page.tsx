"use client";

import { logger } from '@/lib/logger';

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Trophy, Clock, Tv2, Calendar, Star, ChevronDown, CheckCircle2 } from "lucide-react";
import { getAllWatchedEpisodes, getWatched, getWatchlist, getAllRatings } from "@/lib/db";
import { getSeriesDetail, posterUrl } from "@/lib/tmdb";
import type { TMDBSeasonSummary, TMDBSeriesDetail } from "@/lib/tmdb";
import type { WatchedEpisode, RatingItem, WatchedItem, WatchlistItem } from "@/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const TABS = [
    { id: "devam", label: "Devam Ediyorum", icon: Play },
    { id: "tamamlandi", label: "Tamamladiklarim", icon: Trophy },
    { id: "bekliyor", label: "Bekliyorum", icon: Clock },
] as const;

type TabId = typeof TABS[number]["id"];
type SortType = "activity" | "progress" | "name";

interface SeriesProgressInfo {
    id: string;
    tmdbData: TMDBSeriesDetail;
    watchedEpisodes: WatchedEpisode[];
    totalWatchedCount: number;
    progressPercentage: number;
    lastActivity: Date;
    dateAdded: Date;
    status: TabId;
}

export default function DizilerimPage(): React.ReactElement {
    const [activeTab, setActiveTab] = useState<TabId>("devam");
    const [sortBy, setSortBy] = useState<SortType>("activity");
    const [seriesData, setSeriesData] = useState<SeriesProgressInfo[]>([]);
    const [ratings, setRatings] = useState<RatingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAllSeriesData(): Promise<void> {
            setLoading(true);
            try {
                const [watchedEpisodes, watchedData, watchlistData, ratingsData] = await Promise.all([
                    getAllWatchedEpisodes(),
                    getWatched(),
                    getWatchlist(),
                    getAllRatings()
                ]);
                const watchedItems = (watchedData as WatchedItem[]).filter((i: WatchedItem) => i.type === "dizi");
                const watchlistItems = (watchlistData as WatchlistItem[]).filter((i: WatchlistItem) => i.type === "dizi");
                setRatings((ratingsData as RatingItem[]).filter((i: RatingItem) => i.type === "dizi"));

                const uniqueSeriesIds = new Set<string>();
                watchedEpisodes.forEach(ep => uniqueSeriesIds.add(String(ep.seriesId)));
                watchedItems.forEach(item => uniqueSeriesIds.add(String(item.id)));
                watchlistItems.forEach(item => uniqueSeriesIds.add(String(item.id)));

                const allSeriesIds = Array.from(uniqueSeriesIds);
                const fetchPromises = allSeriesIds.map(id => getSeriesDetail(id));
                const tmdbResults = await Promise.all(fetchPromises);

                const data: SeriesProgressInfo[] = [];

                allSeriesIds.forEach((id, index) => {
                    const tmdbData = tmdbResults[index];
                    if (!tmdbData) return;

                    const seriesEpisodes = watchedEpisodes.filter(ep => String(ep.seriesId) === id);
                    const watchlistItem = watchlistItems.find(item => String(item.id) === id);
                    const watchedItem = watchedItems.find(item => String(item.id) === id);

                    const totalWatchedCount = seriesEpisodes.length;

                    let progressPercentage = 0;
                    if (tmdbData.number_of_episodes > 0) {
                        progressPercentage = Math.round((totalWatchedCount / tmdbData.number_of_episodes) * 100);
                    }
                    if (progressPercentage > 100) progressPercentage = 100;

                    if (watchedItem && totalWatchedCount === 0 && tmdbData.number_of_episodes > 0) {
                        progressPercentage = 100;
                    }

                    let lastActivity = new Date("1970-01-01");
                    if (seriesEpisodes.length > 0) {
                        const latestEpDate = seriesEpisodes.reduce((latest, ep) => {
                            const date = new Date(ep.watchedAt);
                            return date > latest ? date : latest;
                        }, new Date("1970-01-01"));
                        lastActivity = latestEpDate;
                    } else if (watchedItem && watchedItem.watchedAt) {
                        lastActivity = new Date(watchedItem.watchedAt);
                    }

                    const dateAdded = watchlistItem ? new Date(watchlistItem.addedAt) : lastActivity;

                    let status: TabId;
                    if (watchedItem || progressPercentage === 100) {
                        status = "tamamlandi";
                    } else if (progressPercentage > 0) {
                        status = "devam";
                    } else {
                        status = "bekliyor";
                    }

                    data.push({
                        id, tmdbData, watchedEpisodes: seriesEpisodes,
                        totalWatchedCount, progressPercentage, lastActivity, dateAdded, status
                    });
                });

                setSeriesData(data);
            } catch (error) {
                logger.error('Dizi verileri yuklenirken hata', error);
            } finally {
                setLoading(false);
            }
        }

        fetchAllSeriesData();
    }, []);

    const filteredAndSortedData = useMemo(() => {
        const filtered = seriesData.filter(item => item.status === activeTab);
        return filtered.sort((a, b) => {
            if (sortBy === "activity") return b.lastActivity.getTime() - a.lastActivity.getTime();
            if (sortBy === "progress") return b.progressPercentage - a.progressPercentage;
            if (sortBy === "name") return (a.tmdbData.name || "").localeCompare(b.tmdbData.name || "");
            return 0;
        });
    }, [seriesData, activeTab, sortBy]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-[1400px] mx-auto px-16 py-12 max-lg:px-6 max-md:px-4 max-md:py-8"
        >
            {/* Tab system */}
            <div className="bg-raised border border-border-dim rounded-xl p-1 inline-flex gap-1 mb-6">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    const count = seriesData.filter(d => d.status === tab.id).length;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "h-8 px-4 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors",
                                active
                                    ? "bg-purple-500 text-white shadow-glow-sm"
                                    : "text-text-muted hover:text-text-sec hover:bg-overlay"
                            )}
                        >
                            <Icon size={14} />
                            {tab.label}
                            {count > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[10px]",
                                    active ? "bg-white/15 text-white" : "bg-overlay text-text-muted"
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Sort */}
            <div className="flex items-center justify-between mb-6">
                <span className="text-[12px] text-text-dim font-mono tabular-nums">
                    {filteredAndSortedData.length} dizi
                </span>
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortType)}
                        className="appearance-none bg-overlay border border-border-dim hover:border-border-bright rounded-lg h-9 pl-3 pr-8 text-[12px] text-white outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer transition-all"
                    >
                        <option value="activity">Son Aktivite</option>
                        <option value="progress">Ilerlemeye Gore</option>
                        <option value="name">Ada Gore (A-Z)</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={activeTab + sortBy}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                >
                    {filteredAndSortedData.length === 0 ? (
                        <EmptyState
                            icon={activeTab === "devam" ? Play : activeTab === "tamamlandi" ? Trophy : Clock}
                            title={activeTab === "devam" ? "Su an izlediginiz bir dizi yok" : activeTab === "tamamlandi" ? "Henuz tamamladiginiz dizi yok" : "Bekleyen diziniz yok"}
                            description="Kesfet sayfasindan yeni diziler bulabilir ve koleksiyonunuza ekleyebilirsiniz."
                            action={{ label: "Kesfetmeye Basla", href: "/kesif" }}
                        />
                    ) : (
                        <div className={activeTab === "devam" ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                            {filteredAndSortedData.map((item) => (
                                <SeriesCardView
                                    key={item.id}
                                    info={item}
                                    activeTab={activeTab}
                                    rating={ratings.find(r => r.id === item.id)}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

// ==========================================
// Series Card Views
// ==========================================
function SeriesCardView({ info, activeTab, rating }: { info: SeriesProgressInfo; activeTab: TabId; rating?: RatingItem }): React.ReactElement | null {
    const d = info.tmdbData;

    // DEVAM EDIYORUM - Large horizontal card
    if (activeTab === "devam") {
        let lastWatchedEpStr = "Henuz baslanmadi";
        let nextEpLink = `/dizi/${d.id}`;
        const isFinished = info.progressPercentage === 100;

        if (info.watchedEpisodes.length > 0) {
            const sortedEps = [...info.watchedEpisodes].sort((a, b) => {
                if (a.seasonNumber !== b.seasonNumber) return b.seasonNumber - a.seasonNumber;
                return b.episodeNumber - a.episodeNumber;
            });
            const lastEp = sortedEps[0];
            lastWatchedEpStr = `S${lastEp.seasonNumber}E${lastEp.episodeNumber}'te kaldin`;

            const currentSeason = d.seasons?.find((s: TMDBSeasonSummary) => s.season_number === lastEp.seasonNumber);
            if (currentSeason && lastEp.episodeNumber < currentSeason.episode_count) {
                nextEpLink = `/dizi/${d.id}/sezon/${lastEp.seasonNumber}`;
            } else if (d.seasons?.some((s: TMDBSeasonSummary) => s.season_number === lastEp.seasonNumber + 1)) {
                nextEpLink = `/dizi/${d.id}/sezon/${lastEp.seasonNumber + 1}`;
            }
        }

        return (
            <div className="flex flex-col sm:flex-row overflow-hidden relative group bg-raised border border-border-dim hover:border-border-bright rounded-xl transition-all">
                {/* Poster */}
                <Link href={`/dizi/${d.id}`} className="w-full sm:w-[140px] h-[180px] sm:h-auto shrink-0 relative">
                    {d.poster_path ? (
                        <Image src={posterUrl(d.poster_path)} alt={d.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-text-muted bg-overlay"><Tv2 size={32} /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-raised via-raised/50 sm:via-transparent to-transparent opacity-80" />
                </Link>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <Link href={`/dizi/${d.id}`}>
                            <h2 className="text-[16px] font-semibold text-white hover:text-purple-300 transition-colors truncate">{d.name}</h2>
                        </Link>
                        <Badge
                            variant={d.status === "Ended" ? "success" : d.status === "Canceled" ? "muted" : "purple"}
                            className="shrink-0 text-[10px]"
                        >
                            {d.status === "Ended" ? "Tamamlandi" : d.status === "Canceled" ? "Iptal" : "Devam Ediyor"}
                        </Badge>
                    </div>

                    <div className="mb-3">
                        <div className="flex items-center gap-2 text-purple-300 font-medium text-[13px] mb-2">
                            <Tv2 size={14} />
                            <span>{lastWatchedEpStr}</span>
                        </div>
                        <ProgressBar value={info.progressPercentage} color="purple" size="md" />
                        <div className="mt-1.5 text-[11px] text-text-muted font-mono">
                            {info.totalWatchedCount} / {d.number_of_episodes || "?"} bolum · %{info.progressPercentage}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-auto">
                        {/* Season mini progress */}
                        <div className="flex flex-wrap gap-1 sm:max-w-[200px]">
                            {d.seasons?.filter((s: TMDBSeasonSummary) => s.season_number > 0).map((season: TMDBSeasonSummary) => {
                                const epsInSeason = info.watchedEpisodes.filter(e => e.seasonNumber === season.season_number).length;
                                const isCompleted = epsInSeason >= season.episode_count && season.episode_count > 0;
                                const isStarted = epsInSeason > 0 && !isCompleted;
                                return (
                                    <div
                                        key={season.id}
                                        title={`Sezon ${season.season_number}`}
                                        className={cn("h-1.5 rounded-full min-w-[14px] flex-1 max-w-[28px]", isCompleted ? "bg-ok" : isStarted ? "bg-purple-500" : "bg-overlay")}
                                    />
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <Link href={`/dizi/${d.id}`}>
                                <Button variant="ghost" size="sm">Detay</Button>
                            </Link>
                            {!isFinished && (
                                <Link href={nextEpLink}>
                                    <Button variant="primary" size="sm" icon={Play}>Devam Et</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // TAMAMLADIKLARIM - Compact card
    if (activeTab === "tamamlandi") {
        const totalRuntimeHours = Math.round(((d.number_of_episodes || 0) * (d.episode_run_time?.[0] || 45)) / 60);

        return (
            <div className="p-4 flex gap-4 bg-raised border border-ok/10 hover:border-ok/30 rounded-xl transition-all group">
                <Link href={`/dizi/${d.id}`} className="w-[72px] h-[108px] shrink-0 relative rounded-lg overflow-hidden">
                    {d.poster_path ? (
                        <Image src={posterUrl(d.poster_path)} alt={d.name} fill className="object-cover" sizes="72px" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-text-muted bg-overlay"><Tv2 size={24} /></div>
                    )}
                </Link>

                <div className="flex-1 min-w-0 flex flex-col py-1">
                    <Link href={`/dizi/${d.id}`}>
                        <h3 className="text-[14px] font-semibold text-white hover:text-ok transition-colors truncate mb-1">{d.name}</h3>
                    </Link>
                    <div className="flex flex-col gap-1 mt-auto">
                        <div className="flex items-center gap-1.5 text-[11px] text-text-sec">
                            <CheckCircle2 size={12} className="text-ok" />
                            <span>{info.lastActivity.toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-text-dim">
                            <Clock size={12} />
                            <span>{totalRuntimeHours} saat, {d.number_of_episodes} bolum</span>
                        </div>
                        {rating && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-warn mt-0.5">
                                <Star size={12} fill="currentColor" /> {rating.rating} / 10
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // BEKLIYOR - Compact muted card
    if (activeTab === "bekliyor") {
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - info.dateAdded.getTime());
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        return (
            <div className="p-4 flex gap-4 bg-raised border border-border-dim hover:border-border-bright rounded-xl transition-all group">
                <Link href={`/dizi/${d.id}`} className="w-[72px] h-[108px] shrink-0 relative rounded-lg overflow-hidden grayscale-[0.2] group-hover:grayscale-0 transition-all">
                    {d.poster_path ? (
                        <Image src={posterUrl(d.poster_path)} alt={d.name} fill className="object-cover" sizes="72px" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-text-muted bg-overlay"><Tv2 size={24} /></div>
                    )}
                </Link>

                <div className="flex-1 min-w-0 flex flex-col py-1">
                    <Link href={`/dizi/${d.id}`}>
                        <h3 className="text-[14px] font-semibold text-white hover:text-purple-300 transition-colors truncate mb-2">{d.name}</h3>
                    </Link>
                    <div className="flex flex-col gap-2 mt-auto items-start">
                        <span className="text-[10px] text-text-muted bg-overlay border border-border-dim rounded-md px-2 py-0.5 flex items-center gap-1">
                            <Calendar size={10} />
                            {diffDays} gundur bekliyor
                        </span>
                        <span className="text-[10px] text-text-dim">
                            {d.status === "Ended" ? "Final Yapti" : d.status === "Canceled" ? "Iptal Edildi" : "Devam Ediyor"}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
