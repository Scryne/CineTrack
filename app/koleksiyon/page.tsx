"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bookmark,
    CheckCircle2,
    X,
    Star,
    Film,
    Tv,
    ChevronDown
} from "lucide-react";
import {
    getWatchlist,
    getWatched,
    removeFromWatchlist,
    removeFromWatched,
    getRating,
    getWatchedEpisodes,
} from "@/lib/db";
import { getSeriesDetail, posterUrl } from "@/lib/tmdb";
import type { WatchlistItem, WatchedItem } from "@/types";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

const TABS = [
    { id: "watchlist", label: "Izleme Listem", icon: Bookmark },
    { id: "watched", label: "Izlediklerim", icon: CheckCircle2 },
] as const;

type TabId = typeof TABS[number]["id"];
type FilterType = "all" | "film" | "dizi";
type SortType = "date" | "name";

// --- Sub Components ---
function SeriesMiniProgress({ seriesId }: { seriesId: string }): React.ReactElement | null {
    const [totalEps, setTotalEps] = useState(0);
    const [watchedEps, setWatchedEps] = useState(0);

    useEffect(() => {
        let mounted = true;
        async function fetchTotal(): Promise<void> {
            const data = await getSeriesDetail(seriesId);
            if (mounted && data) setTotalEps(data.number_of_episodes || 0);
        }
        async function fetchWatched(): Promise<void> {
            const episodes = await getWatchedEpisodes(seriesId);
            if (mounted) setWatchedEps(episodes.length);
        }
        fetchTotal();
        fetchWatched();
        return () => { mounted = false; };
    }, [seriesId]);

    if (totalEps === 0) return null;
    const progress = Math.min(Math.round((watchedEps / totalEps) * 100), 100);

    return (
        <div className="mt-1.5" onClick={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between text-[10px] text-text-muted mb-1 font-medium">
                <span>{watchedEps} / {totalEps} bolum</span>
                <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} color="purple" size="sm" />
        </div>
    );
}

export default function KoleksiyonPage(): React.ReactElement {
    const [activeTab, setActiveTab] = useState<TabId>("watchlist");
    const [filter, setFilter] = useState<FilterType>("all");
    const [sortBy, setSortBy] = useState<SortType>("date");

    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [watched, setWatched] = useState<WatchedItem[]>([]);
    const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});

    const reloadData = async (): Promise<void> => {
        const wl = await getWatchlist();
        const wd = await getWatched();
        setWatchlist(wl);
        setWatched(wd);

        const rMap: Record<string, number> = {};
        const allItems = [...wl, ...wd];
        const uniqueKeys = new Set<string>();
        const uniqueItems = allItems.filter(item => {
            const key = `${item.type}-${item.id}`;
            if (uniqueKeys.has(key)) return false;
            uniqueKeys.add(key);
            return true;
        });

        await Promise.all(uniqueItems.map(async (item) => {
            const key = `${item.type}-${item.id}`;
            const rating = await getRating(item.id, item.type);
            if (rating !== null) rMap[key] = rating;
        }));

        setRatingsMap(rMap);
    };

    useEffect(() => {
        reloadData();
        window.addEventListener("cinetrack_supabase_update", reloadData);
        window.addEventListener("storage", reloadData);
        return () => {
            window.removeEventListener("cinetrack_supabase_update", reloadData);
            window.removeEventListener("storage", reloadData);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRemoveWatchlist = async (e: React.MouseEvent, id: string, type: "film" | "dizi"): Promise<void> => {
        e.preventDefault();
        e.stopPropagation();
        await removeFromWatchlist(id, type);
        reloadData();
    };

    const handleRemoveWatched = async (e: React.MouseEvent, id: string, type: "film" | "dizi"): Promise<void> => {
        e.preventDefault();
        e.stopPropagation();
        await removeFromWatched(id, type);
        reloadData();
    };

    const filteredWatchlist = useMemo(() => {
        let items = watchlist;
        if (filter !== "all") items = items.filter(i => i.type === filter);
        return items.sort((a, b) => {
            if (sortBy === "name") return a.title.localeCompare(b.title);
            return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        });
    }, [watchlist, filter, sortBy]);

    const filteredWatched = useMemo(() => {
        let items = watched;
        if (filter !== "all") items = items.filter(i => i.type === filter);
        return items.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
    }, [watched, filter]);

    const activeCount = activeTab === "watchlist" ? filteredWatchlist.length : filteredWatched.length;

    const renderContent = (): React.ReactElement | null => {
        if (activeTab === "watchlist") {
            if (filteredWatchlist.length === 0) {
                return <EmptyState icon={Bookmark} title="Izleme listeniz bos" description="Izlemek istediginiz film ve dizileri koleksiyonunuza ekleyerek burada takip edebilirsiniz." action={{ label: "Kesfetmeye Basla", href: "/kesif" }} />;
            }
            return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredWatchlist.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="relative group">
                            <Link href={`/${item.type}/${item.id}`}>
                                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-raised border border-border-dim hover:border-border-bright hover:shadow-card-up transition-all">
                                    <Image src={posterUrl(item.posterPath)} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent opacity-80" />

                                    {/* Type badge */}
                                    <div className="absolute top-2 left-2">
                                        <span className="bg-black/65 backdrop-blur text-[9px] uppercase tracking-[1.5px] text-white/60 px-2 py-0.5 rounded-md border border-white/[0.08]">
                                            {item.type}
                                        </span>
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        onClick={(e) => handleRemoveWatchlist(e, item.id, item.type)}
                                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-err/80 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                                    >
                                        <X size={13} />
                                    </button>

                                    {/* Bottom info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <h4 className="text-[13px] font-semibold text-white leading-tight line-clamp-2">{item.title}</h4>
                                        {item.type === "dizi" && <SeriesMiniProgress seriesId={item.id} />}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === "watched") {
            if (filteredWatched.length === 0) {
                return <EmptyState icon={CheckCircle2} title="Henuz hic izleme kaydi yok" description="Izlediginiz icerikleri isaretleyerek kendi filmografinizi olusturabilirsiniz." action={{ label: "Ana Sayfaya Don", href: "/" }} />;
            }
            return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredWatched.map((item) => {
                        const tk = `${item.type}-${item.id}`;
                        const rating = ratingsMap[tk];
                        return (
                            <div key={tk} className="relative group">
                                <Link href={`/${item.type}/${item.id}`}>
                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-raised border border-border-dim hover:border-border-bright hover:shadow-card-up transition-all">
                                        <Image src={posterUrl(item.posterPath)} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent opacity-80" />

                                        <div className="absolute top-2 left-2 flex gap-1.5">
                                            <Badge variant="success" className="text-[10px]">Izlendi</Badge>
                                        </div>

                                        <button
                                            onClick={(e) => handleRemoveWatched(e, item.id, item.type)}
                                            className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-err/80 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                                        >
                                            <X size={13} />
                                        </button>

                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <h4 className="text-[13px] font-semibold text-white leading-tight line-clamp-2">{item.title}</h4>
                                        </div>
                                    </div>
                                </Link>
                                <div className="mt-2 flex items-center justify-between px-1">
                                    <p className="text-[11px] text-text-dim">
                                        {new Date(item.watchedAt).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                    {rating && (
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-warn">
                                            <Star size={10} fill="currentColor" /> {rating.toFixed(1)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-[1400px] mx-auto px-16 py-12 max-lg:px-6 max-md:px-4 max-md:py-8"
        >
            <h1 className="text-[28px] md:text-[36px] font-display font-bold text-white mb-6">Koleksiyonum</h1>
            {/* Pill Tab System */}
            <div className="bg-raised border border-border-dim rounded-xl p-1 inline-flex gap-1 mb-6">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    const count = tab.id === "watchlist" ? watchlist.length : watched.length;
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

            {/* Filter + Sort bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    {(["all", "film", "dizi"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "h-8 px-3 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors",
                                filter === f
                                    ? "bg-subtle border border-border-bright text-text-pri"
                                    : "text-text-muted hover:text-text-sec"
                            )}
                        >
                            {f === "film" && <Film size={12} />}
                            {f === "dizi" && <Tv size={12} />}
                            {f === "all" ? "Tumu" : f === "film" ? "Film" : "Dizi"}
                        </button>
                    ))}

                    <span className="text-[12px] text-text-dim ml-2 font-mono tabular-nums">
                        {activeCount} icerik
                    </span>
                </div>

                {activeTab === "watchlist" && (
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortType)}
                            className="appearance-none bg-overlay border border-border-dim hover:border-border-bright rounded-lg h-9 pl-3 pr-8 text-[12px] text-white outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer transition-all"
                        >
                            <option value="date">Eklenme Tarihi</option>
                            <option value="name">Ada Gore (A-Z)</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab + filter + sortBy}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
