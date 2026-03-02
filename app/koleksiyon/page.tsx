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
    getTags,
    getWatchedEpisodes,
} from "@/lib/storage";
import { getSeriesDetail, posterUrl } from "@/lib/tmdb";
import type { WatchlistItem, WatchedItem } from "@/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

const TABS = [
    { id: "watchlist", label: "İzleme Listem", icon: Bookmark },
    { id: "watched", label: "İzlediklerim", icon: CheckCircle2 },
] as const;

type TabId = typeof TABS[number]["id"];
type FilterType = "all" | "film" | "dizi";
type SortType = "date" | "name" | "genre";

// --- Alt Bileşenler ---

// Dizi ilerlemesi için mini progress bar (Sadece izleme listesinde ve dizilerde)
function SeriesMiniProgress({ seriesId }: { seriesId: string }) {
    const [totalEps, setTotalEps] = useState(0);
    const [watchedEps, setWatchedEps] = useState(0);

    useEffect(() => {
        let mounted = true;
        async function fetchTotal() {
            const data = await getSeriesDetail(seriesId);
            if (mounted && data) {
                setTotalEps(data.number_of_episodes || 0);
            }
        }
        fetchTotal();
        setWatchedEps(getWatchedEpisodes(seriesId).length);
        return () => { mounted = false; };
    }, [seriesId]);

    if (totalEps === 0) return null;

    const progress = Math.min(Math.round((watchedEps / totalEps) * 100), 100);

    return (
        <div className="mt-1.5" onClick={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between text-[10px] text-text-muted mb-1 font-medium">
                <span>{watchedEps} / {totalEps} bölüm</span>
                <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} color="purple" size="sm" />
        </div>
    );
}


export default function KoleksiyonPage() {
    const [activeTab, setActiveTab] = useState<TabId>("watchlist");
    const [filter, setFilter] = useState<FilterType>("all");
    const [sortBy, setSortBy] = useState<SortType>("date");

    // State
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [watched, setWatched] = useState<WatchedItem[]>([]);
    const [tagsMap, setTagsMap] = useState<Record<string, string[]>>({});
    const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});

    const reloadData = () => {
        const wl = getWatchlist();
        const wd = getWatched();
        setWatchlist(wl);
        setWatched(wd);

        const tMap: Record<string, string[]> = {};
        const rMap: Record<string, number> = {};

        [...wl, ...wd].forEach(item => {
            const key = `${item.type}-${item.id}`;
            if (!tMap[key]) tMap[key] = getTags(item.id, item.type);
            if (rMap[key] === undefined) {
                const r = getRating(item.id, item.type);
                if (r !== null) rMap[key] = r;
            }
        });

        setTagsMap(tMap);
        setRatingsMap(rMap);
    };

    useEffect(() => {
        reloadData();
        window.addEventListener("storage", reloadData);
        return () => window.removeEventListener("storage", reloadData);
    }, []);

    const handleRemoveWatchlist = (e: React.MouseEvent, id: string, type: "film" | "dizi") => {
        e.preventDefault();
        e.stopPropagation();
        removeFromWatchlist(id, type);
        reloadData();
    };

    const handleRemoveWatched = (e: React.MouseEvent, id: string, type: "film" | "dizi") => {
        e.preventDefault();
        e.stopPropagation();
        removeFromWatched(id, type);
        reloadData();
    };

    // --- Filtreleme ve Sıralama ---
    const filteredWatchlist = useMemo(() => {
        let items = watchlist;
        if (filter !== "all") items = items.filter(i => i.type === filter);

        return items.sort((a, b) => {
            if (sortBy === "name") return a.title.localeCompare(b.title);
            // fallback to date
            return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        });
    }, [watchlist, filter, sortBy]);

    const filteredWatched = useMemo(() => {
        let items = watched;
        if (filter !== "all") items = items.filter(i => i.type === filter);
        // always sort by recently watched
        return items.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
    }, [watched, filter]);

    // Sayı hesaplama
    const activeCount = activeTab === "watchlist"
        ? filteredWatchlist.length
        : filteredWatched.length;

    // --- Render İçerik ---

    const renderContent = () => {
        if (activeTab === "watchlist") {
            if (filteredWatchlist.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                        <div className="w-16 h-16 rounded-2xl bg-bg-card flex items-center justify-center mb-4 text-text-muted">
                            <Bookmark size={28} />
                        </div>
                        <h3 className="font-display font-bold text-xl text-text-primary mb-2">İzleme listeniz boş</h3>
                        <p className="text-text-secondary mb-6 max-w-sm">
                            İzlemek istediğiniz film ve dizileri koleksiyonunuza ekleyerek burada takip edebilirsiniz.
                        </p>
                        <Link href="/kesif">
                            <Button variant="primary">Keşfetmeye Başla</Button>
                        </Link>
                    </div>
                );
            }

            return (
                <div className="grid grid-cols-2 lg:grid-cols-5 md:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
                    {filteredWatchlist.map((item) => (
                        <Card hover key={`${item.type}-${item.id}`} className="relative group overflow-hidden h-full flex flex-col p-0">
                            <Link href={`/${item.type}/${item.id}`} className="flex-1 flex flex-col">
                                <div className="relative w-full aspect-[2/3] bg-bg-card">
                                    <Image
                                        src={posterUrl(item.posterPath)}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent opacity-80" />

                                    {/* Etiketler */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
                                        <Badge variant={item.type === "film" ? "default" : "purple"} className="text-[10px] uppercase font-bold tracking-wider">
                                            {item.type}
                                        </Badge>
                                    </div>

                                    {/* Sil Butonu */}
                                    <button
                                        onClick={(e) => handleRemoveWatchlist(e, item.id, item.type)}
                                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                                        title="Listeden Kaldır"
                                    >
                                        <X size={14} />
                                    </button>

                                    {/* Alt Bilgiler */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-end">
                                        <h4 className="font-display font-bold text-sm text-text-primary leading-tight line-clamp-2">
                                            {item.title}
                                        </h4>
                                        {item.type === "dizi" && <SeriesMiniProgress seriesId={item.id} />}
                                    </div>
                                </div>
                            </Link>
                        </Card>
                    ))}
                </div>
            );
        }

        if (activeTab === "watched") {
            if (filteredWatched.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                        <div className="w-16 h-16 rounded-2xl bg-bg-card flex items-center justify-center mb-4 text-text-muted">
                            <CheckCircle2 size={28} />
                        </div>
                        <h3 className="font-display font-bold text-xl text-text-primary mb-2">Henüz hiç izleme kaydı yok</h3>
                        <p className="text-text-secondary mb-6 max-w-sm">
                            İzlediğiniz içerikleri işaretleyerek kendi filmografinizi oluşturabilirsiniz.
                        </p>
                        <Link href="/">
                            <Button variant="primary">Ana Sayfaya Gön</Button>
                        </Link>
                    </div>
                );
            }

            return (
                <div className="grid grid-cols-2 lg:grid-cols-5 md:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
                    {filteredWatched.map((item) => {
                        const tk = `${item.type}-${item.id}`;
                        const rating = ratingsMap[tk];
                        const hasTekrar = tagsMap[tk]?.includes("tekrar izleyeceklerim");

                        return (
                            <Card hover key={tk} className="relative group overflow-hidden h-full flex flex-col p-0 bg-transparent border-0 hover:border-0 shadow-none hover:shadow-none hover:bg-transparent">
                                <Link href={`/${item.type}/${item.id}`} className="flex-1 flex flex-col relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-md">
                                    <Image
                                        src={posterUrl(item.posterPath)}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-black/10 to-transparent opacity-90" />

                                    <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start z-10">
                                        <Badge variant="success" className="text-[10px] uppercase font-bold tracking-wider">
                                            İzlendi
                                        </Badge>
                                        {hasTekrar && (
                                            <Badge variant="purple" className="text-[10px] uppercase font-bold tracking-wider">
                                                Tekrar
                                            </Badge>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => handleRemoveWatched(e, item.id, item.type)}
                                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                                        title="Gizle / Kaldır"
                                    >
                                        <X size={14} />
                                    </button>

                                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                                        <h4 className="font-display font-bold text-sm text-text-primary leading-tight line-clamp-2 drop-shadow-md">
                                            {item.title}
                                        </h4>
                                    </div>
                                </Link>
                                <div className="mt-2.5 flex items-center justify-between px-1">
                                    <p className="text-[11px] text-text-muted font-medium">
                                        {new Date(item.watchedAt).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                    {rating && (
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-rating">
                                            <Star size={10} fill="currentColor" /> {rating.toFixed(1)}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

            {/* 1. BAŞLIK VE TABLAR */}
            <div className="mb-8 pt-6 border-b border-border">
                <h1 className="font-display text-3xl font-bold text-text-primary mb-6">
                    Koleksiyon
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
                                {active && (
                                    <motion.div
                                        layoutId="koleksiyon-tab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* 2. ARAÇ ÇUBUĞU (Filtreler ve Sıralama) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <div className="flex bg-bg-card p-1 rounded-xl border border-border">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === "all" ? "bg-bg-hover text-text-primary" : "text-text-muted hover:text-text-primary"}`}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setFilter("film")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${filter === "film" ? "bg-bg-hover text-text-primary" : "text-text-muted hover:text-text-primary"}`}
                        >
                            <Film size={12} /> Film
                        </button>
                        <button
                            onClick={() => setFilter("dizi")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${filter === "dizi" ? "bg-bg-hover text-text-primary" : "text-text-muted hover:text-text-primary"}`}
                        >
                            <Tv size={12} /> Dizi
                        </button>
                    </div>

                    <Badge variant="muted" className="shrink-0 h-[32px] flex items-center px-3">
                        {activeCount} içerik
                    </Badge>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                    {activeTab === "watchlist" && (
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortType)}
                                className="appearance-none bg-bg-card border border-border text-text-primary text-sm rounded-xl pl-4 pr-10 py-2 outline-none focus:border-purple cursor-pointer"
                            >
                                <option value="date">Eklenme Tarihi</option>
                                <option value="name">Ada Göre (A-Z)</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* 3. İÇERİK */}
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

        </div>
    );
}
