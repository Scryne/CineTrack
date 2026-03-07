"use client";

import { logger } from '@/lib/logger';

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Sliders,
    Film,
    Tv,
    LayoutGrid,
    List,
    Search,
    RefreshCcw,
    Star,
    Calendar,
    Swords,
    Map,
    Smile,
    Laugh,
    ShieldAlert,
    Camera,
    Theater,
    Users,
    Wand2,
    BookOpen,
    Ghost,
    Music,
    Heart,
    Rocket,
    Zap,
    Flag,
    Wind
} from "lucide-react";
import {
    DiscoverFilters,
    discoverMovies,
    discoverSeries,
    TMDBMovieResult,
    TMDBSeriesResult,
    posterUrl
} from "@/lib/tmdb";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type ViewMode = "grid" | "list";
type ContentType = "movie" | "tv";

const DEFAULT_FILTERS: DiscoverFilters = {
    sortBy: "popularity",
    page: 1,
};

const GENRE_MAP: Record<number, { name: string; icon: React.ElementType }> = {
    28: { name: "Aksiyon", icon: Swords },
    12: { name: "Macera", icon: Map },
    16: { name: "Animasyon", icon: Smile },
    35: { name: "Komedi", icon: Laugh },
    80: { name: "Suc", icon: ShieldAlert },
    99: { name: "Belgesel", icon: Camera },
    18: { name: "Dram", icon: Theater },
    10751: { name: "Aile", icon: Users },
    14: { name: "Fantastik", icon: Wand2 },
    36: { name: "Tarih", icon: BookOpen },
    27: { name: "Korku", icon: Ghost },
    10402: { name: "Muzik", icon: Music },
    9648: { name: "Gizem", icon: Search },
    10749: { name: "Romantik", icon: Heart },
    878: { name: "Bilim Kurgu", icon: Rocket },
    53: { name: "Gerilim", icon: Zap },
    10752: { name: "Savas", icon: Flag },
    37: { name: "Vahsi Bati", icon: Wind }
};

const GENRE_ENTRIES = Object.entries(GENRE_MAP).map(([id, data]) => ({ id: Number(id), ...data }));

const SkeletonCard = memo(({ viewMode }: { viewMode: ViewMode }): React.ReactElement => {
    if (viewMode === "list") {
        return (
            <div className="flex bg-raised rounded-xl overflow-hidden animate-pulse border border-border-dim h-[200px]">
                <div className="w-[133px] bg-overlay shrink-0" />
                <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                        <div className="h-6 w-3/4 skeleton rounded-md mb-3" />
                        <div className="flex gap-2 mb-4">
                            <div className="h-4 w-12 skeleton rounded-md" />
                            <div className="h-4 w-12 skeleton rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-full skeleton rounded-sm" />
                            <div className="h-3 w-5/6 skeleton rounded-sm" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return <div className="aspect-[2/3] skeleton rounded-xl" />;
});
SkeletonCard.displayName = "SkeletonCard";

export default function KesifPage(): React.ReactElement {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [contentType, setContentType] = useState<ContentType>("movie");

    const [results, setResults] = useState<(TMDBMovieResult | TMDBSeriesResult)[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
    const [draftFilters, setDraftFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);

    const [ratingPill, setRatingPill] = useState<number>(0);
    const [durationPill, setDurationPill] = useState<string>("all");

    const observerTarget = useRef<HTMLDivElement>(null);

    const fetchResults = useCallback(async (isLoadMore: boolean = false, activeFilters: DiscoverFilters): Promise<void> => {
        if (!isLoadMore) setLoading(true);
        else setLoadingMore(true);

        try {
            let newResults: (TMDBMovieResult | TMDBSeriesResult)[] = [];
            let tp = 1;

            if (contentType === "movie") {
                const res = await discoverMovies(activeFilters);
                newResults = res.results;
                tp = res.total_pages;
            } else {
                const res = await discoverSeries(activeFilters);
                newResults = res.results;
                tp = res.total_pages;
            }
            setTotalPages(tp);
            setTotalResults(tp * 20);
            setResults(prev => isLoadMore ? [...prev, ...newResults] : newResults);
        } catch (error) {
            logger.error('Discovery error', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [contentType]);

    useEffect(() => {
        if (filters.page && filters.page > 1) {
            fetchResults(true, filters);
        } else {
            fetchResults(false, filters);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [filters, fetchResults]);

    const handleApplyFilters = (): void => {
        setFilters({ ...draftFilters, page: 1 });
    };

    const handleResetFilters = (): void => {
        setDraftFilters(DEFAULT_FILTERS);
        setFilters(DEFAULT_FILTERS);
        setRatingPill(0);
        setDurationPill("all");
        setContentType("movie");
    };

    const handleChangeContentType = (type: ContentType): void => {
        setContentType(type);
        setDraftFilters({ ...draftFilters, page: 1 });
        setFilters({ ...draftFilters, page: 1 });
    };

    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loading && !loadingMore && results.length > 0) {
                    if ((filters.page ?? 1) < totalPages) {
                        setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
                    }
                }
            },
            { threshold: 0.1, rootMargin: "400px" }
        );

        observer.observe(target);
        return () => { if (target) observer.unobserve(target); };
    }, [loading, loadingMore, results.length, filters.page, totalPages]);

    const toggleGenre = (genreId: number): void => {
        const current = draftFilters.genreIds || [];
        const newIds = current.includes(genreId) ? current.filter(id => id !== genreId) : [...current, genreId];
        setDraftFilters(prev => ({ ...prev, genreIds: newIds }));
    };

    const handleRatingPill = (val: number): void => {
        setRatingPill(val);
        setDraftFilters(prev => ({ ...prev, ratingMin: val === 0 ? undefined : val, ratingMax: undefined }));
    };

    const handleDurationPill = (val: string): void => {
        setDurationPill(val);
        let min: number | undefined, max: number | undefined;
        if (val === "short") { max = 90; }
        else if (val === "normal") { min = 90; max = 150; }
        else if (val === "long") { min = 150; }
        setDraftFilters(prev => ({ ...prev, runtimeMin: min, runtimeMax: max }));
    };

    const pillCn = (active: boolean): string => cn(
        "h-8 px-3 rounded-lg text-[12px] font-medium border transition-colors",
        active
            ? "bg-purple-950 border-purple-800 text-purple-300"
            : "bg-subtle border-border-dim text-text-muted hover:border-border-bright hover:text-text-sec"
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-[1400px] mx-auto px-16 max-lg:px-6 max-md:px-4 py-12 max-md:py-8 flex flex-col lg:flex-row gap-6 pb-20"
        >
            {/* LEFT PANEL - FILTERS */}
            <aside className="w-full lg:w-[260px] shrink-0">
                <div className="bg-raised border border-border-dim rounded-xl p-5 lg:sticky lg:top-20 space-y-6 max-h-none lg:max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
                    <div className="flex items-center gap-2 mb-1">
                        <Sliders size={16} className="text-purple-400" />
                        <h2 className="text-[14px] font-semibold text-white">Filtreler</h2>
                    </div>

                    {/* Content Type */}
                    <div className="bg-overlay p-1 rounded-lg flex">
                        <button
                            onClick={() => handleChangeContentType("movie")}
                            className={cn("flex-1 py-2 flex items-center justify-center gap-1.5 text-[12px] font-medium rounded-md transition-all",
                                contentType === "movie" ? "bg-raised text-purple-300 border border-border-mid" : "text-text-muted hover:text-text-sec"
                            )}
                        >
                            <Film size={13} /> Film
                        </button>
                        <button
                            onClick={() => handleChangeContentType("tv")}
                            className={cn("flex-1 py-2 flex items-center justify-center gap-1.5 text-[12px] font-medium rounded-md transition-all",
                                contentType === "tv" ? "bg-raised text-purple-300 border border-border-mid" : "text-text-muted hover:text-text-sec"
                            )}
                        >
                            <Tv size={13} /> Dizi
                        </button>
                    </div>

                    {/* Genres */}
                    <div className="space-y-2">
                        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[1.5px]">Turler</h3>
                        <div className="grid grid-cols-2 gap-1.5">
                            {GENRE_ENTRIES.map(genre => {
                                const isSelected = draftFilters.genreIds?.includes(genre.id);
                                const Icon = genre.icon;
                                return (
                                    <button
                                        key={genre.id}
                                        onClick={() => toggleGenre(genre.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-left text-[11px] transition-all border",
                                            isSelected
                                                ? "bg-purple-950 border-purple-800 text-purple-300 font-medium"
                                                : "bg-subtle border-border-dim text-text-sec hover:border-border-bright"
                                        )}
                                    >
                                        <Icon size={12} className={isSelected ? "text-purple-400" : "text-text-muted"} />
                                        <span className="truncate">{genre.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Year Range */}
                    <div className="space-y-2">
                        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[1.5px]">Yil Araligi</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="number" min="1900" max="2030" placeholder="1950"
                                className="w-full bg-overlay border border-border-dim rounded-lg px-3 py-2 text-[12px] text-text-pri outline-none focus:border-purple-500 transition-colors"
                                value={draftFilters.yearFrom || ""}
                                onChange={(e) => setDraftFilters(prev => ({ ...prev, yearFrom: e.target.value ? Number(e.target.value) : undefined }))}
                            />
                            <span className="text-text-muted text-[10px]">—</span>
                            <input
                                type="number" min="1900" max="2030" placeholder="2024"
                                className="w-full bg-overlay border border-border-dim rounded-lg px-3 py-2 text-[12px] text-text-pri outline-none focus:border-purple-500 transition-colors"
                                value={draftFilters.yearTo || ""}
                                onChange={(e) => setDraftFilters(prev => ({ ...prev, yearTo: e.target.value ? Number(e.target.value) : undefined }))}
                            />
                        </div>
                    </div>

                    {/* Rating Pills */}
                    <div className="space-y-2">
                        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[1.5px]">Puan</h3>
                        <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => handleRatingPill(0)} className={pillCn(ratingPill === 0)}>Tumu</button>
                            <button onClick={() => handleRatingPill(7)} className={pillCn(ratingPill === 7)}>7.0+</button>
                            <button onClick={() => handleRatingPill(8)} className={pillCn(ratingPill === 8)}>8.0+</button>
                        </div>
                    </div>

                    {/* Duration (movie only) */}
                    {contentType === "movie" && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[1.5px]">Sure</h3>
                            <div className="flex flex-wrap gap-1.5">
                                <button onClick={() => handleDurationPill("all")} className={pillCn(durationPill === "all")}>Tumu</button>
                                <button onClick={() => handleDurationPill("short")} className={pillCn(durationPill === "short")}>Kisa</button>
                                <button onClick={() => handleDurationPill("normal")} className={pillCn(durationPill === "normal")}>Normal</button>
                                <button onClick={() => handleDurationPill("long")} className={pillCn(durationPill === "long")}>Uzun</button>
                            </div>
                        </div>
                    )}

                    {/* Sort & Language */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-[1.5px]">Siralama</label>
                            <select
                                className="w-full bg-overlay border border-border-dim rounded-lg p-2.5 text-[12px] text-text-sec outline-none focus:border-purple-500 cursor-pointer"
                                value={draftFilters.sortBy}
                                onChange={(e) => setDraftFilters(prev => ({ ...prev, sortBy: e.target.value as DiscoverFilters['sortBy'] }))}
                            >
                                <option value="popularity">Populerlige Gore</option>
                                <option value="rating">Puana Gore</option>
                                <option value="release_date">Tarihe Gore</option>
                                {contentType === "movie" && <option value="revenue">Hasilat</option>}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-[1.5px]">Dil</label>
                            <select
                                className="w-full bg-overlay border border-border-dim rounded-lg p-2.5 text-[12px] text-text-sec outline-none focus:border-purple-500 cursor-pointer"
                                value={draftFilters.language || ""}
                                onChange={(e) => setDraftFilters(prev => ({ ...prev, language: e.target.value }))}
                            >
                                <option value="">Tum Diller</option>
                                <option value="tr">Turkce</option>
                                <option value="en">Ingilizce</option>
                                <option value="ko">Korece</option>
                                <option value="ja">Japonca</option>
                                <option value="es">Ispanyolca</option>
                                <option value="fr">Fransizca</option>
                            </select>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="pt-2 flex flex-col gap-2 sticky bottom-0 bg-raised z-10">
                        <Button variant="primary" className="w-full justify-center" onClick={handleApplyFilters}>
                            Filtrele
                        </Button>
                        <Button variant="ghost" className="w-full justify-center" onClick={handleResetFilters}>
                            Sifirla
                        </Button>
                    </div>
                </div>
            </aside>

            {/* RIGHT - RESULTS */}
            <main className="flex-1 min-w-0">
                {/* Top bar */}
                <div className="flex items-center justify-between bg-raised border border-border-dim rounded-xl p-3 mb-4">
                    <p className="text-[12px] text-text-muted">
                        <span className="font-mono text-text-sec mr-1">
                            {new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(totalResults)}
                        </span>
                        sonuc
                    </p>
                    <div className="flex items-center gap-1 bg-overlay p-0.5 rounded-lg">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-raised text-purple-400 border border-border-mid" : "text-text-muted hover:text-text-sec")}
                        >
                            <LayoutGrid size={15} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-raised text-purple-400 border border-border-mid" : "text-text-muted hover:text-text-sec")}
                        >
                            <List size={15} />
                        </button>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 lg:grid-cols-2"}`}>
                        {[...Array(12)].map((_, i) => <SkeletonCard key={`skel-${i}`} viewMode={viewMode} />)}
                    </div>
                ) : results.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="Sonuc Bulunamadi"
                        description="Farkli filtreler denemeyi dusunebilirsiniz."
                        action={{ label: "Filtreleri Sifirla", onClick: handleResetFilters }}
                    />
                ) : (
                    <div className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 xl:grid-cols-2"}`}>
                        {results.map((item) => {
                            const linkHref = `/${contentType === "movie" ? "film" : "dizi"}/${item.id}`;
                            const title = 'title' in item ? item.title : item.name;
                            const rating = item.vote_average?.toFixed(1) || "0.0";
                            const date = 'release_date' in item ? item.release_date : item.first_air_date;
                            const year = date ? date.split("-")[0] : "TBA";
                            const overview = item.overview || "Aciklama bulunmuyor.";

                            if (viewMode === "grid") {
                                return (
                                    <Link key={`grid-${item.id}`} href={linkHref}>
                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-raised border border-border-dim hover:border-border-bright hover:shadow-card-up transition-all group">
                                            {item.poster_path ? (
                                                <Image src={posterUrl(item.poster_path)} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-text-muted"><Film size={32} /></div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-mono">
                                                <Star size={10} className="text-warn fill-warn" />
                                                <span className="text-white">{rating}</span>
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <h3 className="text-[13px] font-semibold text-white leading-tight line-clamp-2 mb-0.5 group-hover:text-purple-300 transition-colors">{title}</h3>
                                                <span className="text-[11px] text-text-muted">{year}</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            } else {
                                return (
                                    <Link key={`list-${item.id}`} href={linkHref}>
                                        <div className="flex overflow-hidden group bg-raised border border-border-dim hover:border-border-bright rounded-xl h-[180px] sm:h-[200px] transition-all">
                                            <div className="relative w-[120px] sm:w-[133px] h-full shrink-0">
                                                {item.poster_path ? (
                                                    <Image src={posterUrl(item.poster_path)} alt={title} fill className="object-cover" sizes="133px" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-text-muted bg-overlay"><Film size={32} /></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-[15px] font-semibold text-white mb-1 truncate group-hover:text-purple-300 transition-colors">{title}</h3>
                                                    <div className="flex items-center gap-3 mb-2 text-[12px] text-text-sec">
                                                        <div className="flex items-center gap-1">
                                                            <Star size={12} className="text-warn fill-warn" />
                                                            <span className="font-mono">{rating}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} className="text-text-muted" />
                                                            <span>{year}</span>
                                                        </div>
                                                    </div>
                                                    <div className="hidden sm:block">
                                                        <p className="text-[12px] text-text-muted line-clamp-3 leading-relaxed">{overview}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-auto pt-2 hidden sm:block">
                                                    <span className="text-[11px] font-medium text-purple-400 uppercase tracking-wider group-hover:underline">Detaylari Incele</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            }
                        })}
                    </div>
                )}

                {/* Infinite Scroll Trigger */}
                {results.length > 0 && !loading && (
                    <div ref={observerTarget} className="py-12 flex justify-center w-full">
                        {loadingMore && (
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCcw className="w-5 h-5 text-purple-400 animate-spin" />
                                <span className="text-[11px] text-text-muted">Yukleniyor...</span>
                            </div>
                        )}
                        {!loadingMore && filters.page && filters.page * 20 < totalResults && (
                            <Button variant="ghost" onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}>
                                Daha Fazla Yukle
                            </Button>
                        )}
                    </div>
                )}
            </main>
        </motion.div>
    );
}
