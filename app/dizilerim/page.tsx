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
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

const TABS = [
    { id: "devam", label: "Devam Ediyorum", icon: Play },
    { id: "tamamlandi", label: "Tamamladıklarım", icon: Trophy },
    { id: "bekliyor", label: "Bekliyorum", icon: Clock },
] as const;

type TabId = typeof TABS[number]["id"];
type SortType = "activity" | "progress" | "name";

// Tip Tanımlamaları
interface SeriesProgressInfo {
    id: string; // string tipindeki tmdb id
    tmdbData: TMDBSeriesDetail; // TMDBSeriesDetail
    watchedEpisodes: WatchedEpisode[];
    totalWatchedCount: number;
    progressPercentage: number;
    lastActivity: Date;
    dateAdded: Date;
    status: TabId;
}

export default function DizilerimPage() {
    const [activeTab, setActiveTab] = useState<TabId>("devam");
    const [sortBy, setSortBy] = useState<SortType>("activity");
    const [seriesData, setSeriesData] = useState<SeriesProgressInfo[]>([]);
    const [ratings, setRatings] = useState<RatingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAllSeriesData() {
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

                // Get unique series IDs prioritizing those that have activity or are in lists
                const uniqueSeriesIds = new Set<string>();
                watchedEpisodes.forEach(ep => uniqueSeriesIds.add(String(ep.seriesId)));
                watchedItems.forEach(item => uniqueSeriesIds.add(String(item.id)));
                watchlistItems.forEach(item => uniqueSeriesIds.add(String(item.id)));

                const allSeriesIds = Array.from(uniqueSeriesIds);

                // Fetch details from TMDB
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
                    // Eğer izlendi olarak işaretlenmişse VEYA tüm bölümler izlenmişse (tamamlandı mı mantığı)
                    if (watchedItem || progressPercentage === 100) {
                        status = "tamamlandi";
                    } else if (progressPercentage > 0) {
                        status = "devam";
                    } else {
                        status = "bekliyor";
                    }

                    data.push({
                        id,
                        tmdbData,
                        watchedEpisodes: seriesEpisodes,
                        totalWatchedCount,
                        progressPercentage,
                        lastActivity,
                        dateAdded,
                        status
                    });
                });

                setSeriesData(data);
            } catch (error) {
                logger.error('Dizi verileri yüklenirken hata', error);
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

    const activeCount = filteredAndSortedData.length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

            {/* BAŞLIK VE TABLAR */}
            <div className="mb-8 pt-6 border-b border-border">
                <h1 className="font-display text-3xl font-bold text-text-primary mb-6">
                    Dizilerim
                </h1>
                <div className="flex overflow-x-auto scrollbar-hide gap-1 pb-[-1px]">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-xl ${active
                                    ? "text-purple"
                                    : "text-text-secondary hover:text-text-primary hover:bg-bg-hover/50"
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-md bg-bg-hover">
                                    {seriesData.filter(d => d.status === tab.id).length}
                                </span>
                                {active && (
                                    <motion.div
                                        layoutId="dizilerim-tab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ARAÇ ÇUBUĞU */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <Badge variant="muted" className="shrink-0 h-[32px] flex items-center px-3 self-start">
                    {activeCount} içerik
                </Badge>

                {/* Sıralama (Sadece bekliyor için gizleyebiliriz ama tümünde kalsın) */}
                <div className="relative self-end sm:self-auto min-w-[160px]">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortType)}
                        className="w-full appearance-none bg-bg-card border border-border text-text-primary text-sm rounded-xl pl-4 pr-10 py-2 outline-none focus:border-purple cursor-pointer shadow-sm"
                    >
                        <option value="activity">Son Aktivite</option>
                        <option value="progress">İlerlemeye Göre</option>
                        <option value="name">Ada Göre (A-Z)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
            </div>

            {/* İÇERİK LİSTESİ */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={activeTab + sortBy}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                >
                    {filteredAndSortedData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-bg-card flex items-center justify-center mb-4 text-text-muted">
                                {activeTab === "devam" ? <Play size={28} /> : activeTab === "tamamlandi" ? <Trophy size={28} /> : <Clock size={28} />}
                            </div>
                            <h3 className="font-display font-bold text-xl text-text-primary mb-2">
                                {activeTab === "devam" && "Şu an izlediğiniz bir dizi yok"}
                                {activeTab === "tamamlandi" && "Henüz tamamladığınız dizi yok"}
                                {activeTab === "bekliyor" && "Bekleyen diziniz yok"}
                            </h3>
                            <p className="text-text-secondary mb-6 max-w-sm">
                                Keşfet sayfasından yeni diziler bulabilir ve koleksiyonunuza ekleyebilirsiniz.
                            </p>
                            <Link href="/kesif">
                                <Button variant="primary">Keşfetmeye Başla</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className={activeTab === "devam" ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
                            {filteredAndSortedData.map((item) => (
                                <SeriesCard
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
        </div>
    );
}

// YARDIMCI BİLEŞEN: TABLARA GÖRE FARKLI KART TASARIMLARI
function SeriesCard({ info, activeTab, rating }: { info: SeriesProgressInfo, activeTab: TabId, rating?: RatingItem }) {
    const d = info.tmdbData;

    // DEVAM EDİYORUM KARTI (Büyük Yatay Kart)
    if (activeTab === "devam") {
        // Son izlenen bölüm hesaplama
        let lastWatchedEpStr = "Henüz başlanmadı";
        let nextEpLink = `/dizi/${d.id}`;
        const isFinished = info.progressPercentage === 100;

        if (info.watchedEpisodes.length > 0) {
            const sortedEps = [...info.watchedEpisodes].sort((a, b) => {
                if (a.seasonNumber !== b.seasonNumber) return b.seasonNumber - a.seasonNumber;
                return b.episodeNumber - a.episodeNumber;
            });
            const lastEp = sortedEps[0];
            lastWatchedEpStr = `S${lastEp.seasonNumber}E${lastEp.episodeNumber}'te kaldın`;

            // Next Episode Link
            const currentSeason = d.seasons?.find((s: TMDBSeasonSummary) => s.season_number === lastEp.seasonNumber);
            if (currentSeason && lastEp.episodeNumber < currentSeason.episode_count) {
                // Ayni sezonda sonraki bolum var mi? Mantiken burasi sezon sayfasina gidiyor
                nextEpLink = `/dizi/${d.id}/sezon/${lastEp.seasonNumber}`;
            } else if (d.seasons?.some((s: TMDBSeasonSummary) => s.season_number === lastEp.seasonNumber + 1)) {
                // Sonraki sezon
                nextEpLink = `/dizi/${d.id}/sezon/${lastEp.seasonNumber + 1}`;
            }
        }

        return (
            <Card hover className="flex flex-col sm:flex-row p-0 overflow-hidden relative group border border-border bg-bg-card shadow-sm">
                {/* Sol Çeyrek: Poster */}
                <Link href={`/dizi/${d.id}`} className="w-full sm:w-[140px] md:w-[160px] h-[180px] sm:h-auto shrink-0 relative bg-bg-hover">
                    {d.poster_path ? (
                        <Image
                            src={posterUrl(d.poster_path)}
                            alt={d.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                            <Tv2 size={32} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-bg-primary via-bg-primary/50 sm:via-transparent to-transparent opacity-80" />
                </Link>

                {/* Sağ Üç Çeyrek: İçerik */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                    {/* Üst Satır: İsim ve Durum */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <Link href={`/dizi/${d.id}`}>
                            <h2 className="font-display font-bold text-xl text-text-primary hover:text-purple transition-colors truncate">
                                {d.name}
                            </h2>
                        </Link>
                        <Badge
                            variant={d.status === "Ended" ? "success" : d.status === "Canceled" ? "muted" : "purple"}
                            className="shrink-0"
                        >
                            {d.status === "Ended" ? "Tamamlandı" : d.status === "Canceled" ? "İptal" : "Devam Ediyor"}
                        </Badge>
                    </div>

                    {/* Orta: İlerleme Satırı */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 text-purple-light font-medium text-sm mb-2">
                            <Tv2 size={16} />
                            <span>{lastWatchedEpStr}</span>
                        </div>
                        <ProgressBar value={info.progressPercentage} color="purple" size="md" />
                        <div className="mt-1.5 text-xs text-text-secondary font-medium">
                            {info.totalWatchedCount} / {d.number_of_episodes || "?"} bölüm · %{info.progressPercentage}
                        </div>
                    </div>

                    {/* Alt: Sezon Mini Progress ve Butonlar */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-auto">
                        <div className="flex flex-wrap gap-1.5 sm:max-w-[180px] md:max-w-[250px]">
                            {d.seasons?.filter((s: TMDBSeasonSummary) => s.season_number > 0).map((season: TMDBSeasonSummary) => {
                                const epsInSeason = info.watchedEpisodes.filter(e => e.seasonNumber === season.season_number).length;
                                const isCompleted = epsInSeason >= season.episode_count && season.episode_count > 0;
                                const isStarted = epsInSeason > 0 && !isCompleted;

                                return (
                                    <div
                                        key={season.id}
                                        title={`Sezon ${season.season_number}`}
                                        className={`h-2 rounded-full min-w-[16px] flex-1 max-w-[32px] transition-colors ${isCompleted ? "bg-success" : isStarted ? "bg-purple" : "bg-bg-hover"
                                            }`}
                                    />
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <Link href={`/dizi/${d.id}`}>
                                <Button variant="ghost" size="sm">Detaya Git</Button>
                            </Link>
                            {!isFinished && (
                                <Link href={nextEpLink}>
                                    <Button variant="primary" size="sm" icon={Play}>Devam Et</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    // TAMAMLADIKLARIM KARTI (Kompakt ve Yeşilimsi)
    if (activeTab === "tamamlandi") {
        const totalRuntimeHours = Math.round(((d.number_of_episodes || 0) * (d.episode_run_time?.[0] || 45)) / 60);

        return (
            <Card hover className="p-4 flex flex-col border border-success/10 bg-success/5 hover:bg-success/10 transition-colors shadow-sm relative group overflow-hidden">
                <div className="flex gap-4">
                    {/* Sol Poster Mini */}
                    <Link href={`/dizi/${d.id}`} className="w-[72px] h-[108px] shrink-0 relative rounded-lg overflow-hidden bg-bg-hover shadow-sm">
                        {d.poster_path ? (
                            <Image src={posterUrl(d.poster_path)} alt={d.name} fill className="object-cover" sizes="72px" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-text-muted"><Tv2 size={24} /></div>
                        )}
                    </Link>

                    {/* Sağ Bilgi */}
                    <div className="flex-1 min-w-0 flex flex-col py-1">
                        <Link href={`/dizi/${d.id}`}>
                            <h3 className="font-display font-bold text-base text-text-primary hover:text-success transition-colors truncate mb-1">
                                {d.name}
                            </h3>
                        </Link>

                        <div className="flex flex-col gap-1.5 mt-auto">
                            {/* Tamamlama Tarihi (Eğer izlenen son bölüm veya watchedItem varsa) */}
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                <CheckCircle2 size={13} className="text-success" />
                                <span>{info.lastActivity.toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                <Clock size={13} className="text-text-muted" />
                                <span>{totalRuntimeHours} saat, {d.number_of_episodes} bölüm</span>
                            </div>
                            {rating && (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-rating mt-1">
                                    <Star size={13} fill="currentColor" />
                                    {rating.rating} / 10 (Sen)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    // BEKLİYORUM KARTI (Kompakt ve Muted)
    if (activeTab === "bekliyor") {
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - info.dateAdded.getTime());
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        return (
            <Card hover className="p-4 flex flex-col border border-border bg-bg-card shadow-sm relative group overflow-hidden">
                <div className="flex gap-4">
                    {/* Sol Poster Mini */}
                    <Link href={`/dizi/${d.id}`} className="w-[72px] h-[108px] shrink-0 relative rounded-lg overflow-hidden bg-bg-hover shadow-sm grayscale-[0.2] group-hover:grayscale-0 transition-all">
                        {d.poster_path ? (
                            <Image src={posterUrl(d.poster_path)} alt={d.name} fill className="object-cover" sizes="72px" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-text-muted"><Tv2 size={24} /></div>
                        )}
                    </Link>

                    {/* Sağ Bilgi */}
                    <div className="flex-1 min-w-0 flex flex-col py-1">
                        <Link href={`/dizi/${d.id}`}>
                            <h3 className="font-display font-bold text-base text-text-primary hover:text-purple transition-colors truncate mb-2">
                                {d.name}
                            </h3>
                        </Link>

                        <div className="flex flex-col gap-2 mt-auto items-start">
                            <Badge variant="muted" className="text-[10px] w-auto inline-flex">
                                <Calendar size={12} className="mr-1" />
                                {diffDays} gündür bekliyor
                            </Badge>

                            <div className="text-xs text-text-secondary mt-1 flex items-center gap-1.5 border border-border px-2 py-1 rounded-md bg-bg-hover dark:bg-card">
                                TMDB: <span className="font-medium text-text-primary">
                                    {d.status === "Ended" ? "Final Yaptı" : d.status === "Canceled" ? "İptal Edildi" : "Devam Ediyor"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    return null;
}
