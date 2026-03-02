"use client";

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
    Theater, // Used for Drama
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
import Card from "@/components/ui/Card";

// ==========================================
// Types
// ==========================================
type ViewMode = "grid" | "list";
type ContentType = "movie" | "tv";

const DEFAULT_FILTERS: DiscoverFilters = {
    sortBy: "popularity",
    page: 1,
};

const GENRE_MAP: Record<number, { name: string, icon: React.ElementType }> = {
    28: { name: "Aksiyon", icon: Swords },
    12: { name: "Macera", icon: Map },
    16: { name: "Animasyon", icon: Smile },
    35: { name: "Komedi", icon: Laugh },
    80: { name: "Suç", icon: ShieldAlert },
    99: { name: "Belgesel", icon: Camera },
    18: { name: "Dram", icon: Theater },
    10751: { name: "Aile", icon: Users },
    14: { name: "Fantastik", icon: Wand2 },
    36: { name: "Tarih", icon: BookOpen },
    27: { name: "Korku", icon: Ghost },
    10402: { name: "Müzik", icon: Music },
    9648: { name: "Gizem", icon: Search },
    10749: { name: "Romantik", icon: Heart },
    878: { name: "Bilim Kurgu", icon: Rocket },
    53: { name: "Gerilim", icon: Zap },
    10752: { name: "Savaş", icon: Flag },
    37: { name: "Vahşi Batı", icon: Wind }
};

const GENRE_ENTRIES = Object.entries(GENRE_MAP).map(([id, data]) => ({ id: Number(id), ...data }));

// ==========================================
// Loading Skeleton
// ==========================================
const SkeletonCard = memo(({ viewMode }: { viewMode: ViewMode }) => {
    if (viewMode === "list") {
        return (
            <div className="flex bg-bg-card rounded-2xl overflow-hidden animate-pulse border border-border h-[200px]">
                <div className="w-[133px] bg-bg-hover shrink-0" />
                <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                        <div className="h-6 w-3/4 bg-bg-hover rounded-md mb-3" />
                        <div className="flex gap-2 mb-4">
                            <div className="h-4 w-12 bg-bg-hover rounded-md" />
                            <div className="h-4 w-12 bg-bg-hover rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-bg-hover rounded-sm" />
                            <div className="h-3 w-5/6 bg-bg-hover rounded-sm" />
                            <div className="h-3 w-4/6 bg-bg-hover rounded-sm" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-bg-card rounded-2xl overflow-hidden animate-pulse border border-border aspect-[2/3]">
            <div className="flex-1 bg-bg-hover" />
        </div>
    );
});
SkeletonCard.displayName = "SkeletonCard";

// ==========================================
// Kesiş (Discovery) Page Component
// ==========================================
export default function KesifPage() {
    // UI State
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [contentType, setContentType] = useState<ContentType>("movie");

    // Data State
    const [results, setResults] = useState<(TMDBMovieResult | TMDBSeriesResult)[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Filter State
    const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
    // Draft filters state to hold selections before applying
    const [draftFilters, setDraftFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);

    // Derived UI states for draft filters
    const [ratingPill, setRatingPill] = useState<number>(0);
    const [durationPill, setDurationPill] = useState<string>("all");

    // Infinite Scroll Ref
    const observerTarget = useRef<HTMLDivElement>(null);

    // Fetch Results
    const fetchResults = useCallback(async (isLoadMore: boolean = false, activeFilters: DiscoverFilters) => {
        if (!isLoadMore) setLoading(true);
        else setLoadingMore(true);

        try {
            let newResults: (TMDBMovieResult | TMDBSeriesResult)[] = [];
            let totalPages = 1;

            if (contentType === "movie") {
                const res = await discoverMovies(activeFilters);
                newResults = res.results;
                totalPages = res.total_pages;
                setTotalResults(totalPages * 20);
            } else {
                const res = await discoverSeries(activeFilters);
                newResults = res.results;
                totalPages = res.total_pages;
                setTotalResults(totalPages * 20);
            }

            setResults(prev => isLoadMore ? [...prev, ...newResults] : newResults);
        } catch (error) {
            console.error("Discovery error:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [contentType]);

    // Initial load & Filter change effect
    useEffect(() => {
        // Only fetch automatically when page changes (load more)
        if (filters.page && filters.page > 1) {
            fetchResults(true, filters);
        } else {
            // initial load or applied filters changed
            fetchResults(false, filters);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [filters, fetchResults]);

    // Apply Filter Function
    const handleApplyFilters = () => {
        setFilters({ ...draftFilters, page: 1 });
    };

    const handleResetFilters = () => {
        setDraftFilters(DEFAULT_FILTERS);
        setFilters(DEFAULT_FILTERS);
        setRatingPill(0);
        setDurationPill("all");
        setContentType("movie");
    };

    // Change Content Type
    const handleChangeContentType = (type: ContentType) => {
        setContentType(type);
        setDraftFilters({ ...draftFilters, page: 1 });
        setFilters({ ...draftFilters, page: 1 });
    };

    // Infinite Scroll Effect
    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loading && !loadingMore && results.length > 0) {
                    setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
                }
            },
            { threshold: 0.1, rootMargin: "400px" }
        );

        observer.observe(target);
        return () => {
            if (target) observer.unobserve(target);
        };
    }, [loading, loadingMore, results.length]);

    // Helpers for draft filters
    const toggleGenre = (genreId: number) => {
        const current = draftFilters.genreIds || [];
        const newIds = current.includes(genreId)
            ? current.filter(id => id !== genreId)
            : [...current, genreId];
        setDraftFilters(prev => ({ ...prev, genreIds: newIds }));
    };

    const handleRatingPill = (val: number) => {
        setRatingPill(val);
        setDraftFilters(prev => ({
            ...prev,
            ratingMin: val === 0 ? undefined : val,
            ratingMax: undefined
        }));
    };

    const handleDurationPill = (val: string) => {
        setDurationPill(val);
        let min: number | undefined, max: number | undefined;
        if (val === "short") { min = undefined; max = 90; }
        else if (val === "normal") { min = 90; max = 150; }
        else if (val === "long") { min = 150; max = undefined; }

        setDraftFilters(prev => ({
            ...prev,
            runtimeMin: min,
            runtimeMax: max
        }));
    };

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 pb-20">
            {/* SOL PANEL - FILTRELER (Sidebar) */}
            <aside className="w-full lg:w-[280px] shrink-0">
                <div className="bg-bg-card border border-border rounded-2xl p-6 lg:sticky lg:top-24 space-y-8 max-h-none lg:max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar shadow-sm">

                    <div className="flex items-center gap-2 mb-2">
                        <Sliders size={20} className="text-purple" />
                        <h2 className="font-display text-xl font-bold text-text-primary">Filtreler</h2>
                    </div>

                    {/* İçerik Tipi (Pill) */}
                    <div className="bg-bg-hover p-1 rounded-xl flex">
                        <button
                            onClick={() => handleChangeContentType("movie")}
                            className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-bold rounded-lg transition-all ${contentType === "movie" ? "bg-bg-card text-purple shadow-sm" : "text-text-muted hover:text-text-primary"}`}
                        >
                            <Film size={16} /> Film
                        </button>
                        <button
                            onClick={() => handleChangeContentType("tv")}
                            className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-bold rounded-lg transition-all ${contentType === "tv" ? "bg-bg-card text-purple shadow-sm" : "text-text-muted hover:text-text-primary"}`}
                        >
                            <Tv size={16} /> Dizi
                        </button>
                    </div>

                    {/* Türler */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Türler</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {GENRE_ENTRIES.map(genre => {
                                const isSelected = draftFilters.genreIds?.includes(genre.id);
                                const Icon = genre.icon;
                                return (
                                    <button
                                        key={genre.id}
                                        onClick={() => toggleGenre(genre.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-all border ${isSelected
                                            ? "bg-purple/10 border-purple text-purple font-semibold"
                                            : "bg-bg-card border-border text-text-secondary hover:border-purple/50 hover:text-text-primary"
                                            }`}
                                    >
                                        <Icon size={14} className={isSelected ? "text-purple" : "text-text-muted"} />
                                        <span className="truncate">{genre.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Yıl Aralığı */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Yıl Aralığı</h3>
                        <div className="flex items-center gap-3">
                            <input
                                type="number" min="1900" max="2030" placeholder="1950"
                                className="w-full bg-bg-hover border border-border rounded-xl px-4 py-2 text-sm text-text-primary outline-none focus:border-purple focus:bg-bg-card transition-colors"
                                value={draftFilters.yearFrom || ""}
                                onChange={(e) => setDraftFilters(prev => ({ ...prev, yearFrom: e.target.value ? Number(e.target.value) : undefined }))}
                            />
                            <span className="text-text-muted font-bold">-</span>
                            <input
                                type="number" min="1900" max="2030" placeholder="2024"
                                className="w-full bg-bg-hover border border-border rounded-xl px-4 py-2 text-sm text-text-primary outline-none focus:border-purple focus:bg-bg-card transition-colors"
                                value={draftFilters.yearTo || ""}
                                onChange={(e) => setDraftFilters(prev => ({ ...prev, yearTo: e.target.value ? Number(e.target.value) : undefined }))}
                            />
                        </div>
                    </div>

                    {/* Puan Aralığı (Pills) */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Puan</h3>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => handleRatingPill(0)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${ratingPill === 0 ? "bg-purple border-purple text-white" : "bg-bg-card border-border text-text-secondary hover:border-purple"}`}>Tümü</button>
                            <button onClick={() => handleRatingPill(7)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${ratingPill === 7 ? "bg-purple border-purple text-white" : "bg-bg-card border-border text-text-secondary hover:border-purple"}`}>7.0 ve üzeri</button>
                            <button onClick={() => handleRatingPill(8)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${ratingPill === 8 ? "bg-purple border-purple text-white" : "bg-bg-card border-border text-text-secondary hover:border-purple"}`}>8.0 ve üzeri</button>
                        </div>
                    </div>

                    {/* Süre (Sadece Film) */}
                    {contentType === "movie" && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Süre</h3>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleDurationPill("all")} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${durationPill === "all" ? "bg-purple border-purple text-white" : "bg-bg-card border-border text-text-secondary hover:border-purple"}`}>Tümü</button>
                                <button onClick={() => handleDurationPill("short")} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${durationPill === "short" ? "bg-purple border-purple text-white" : "bg-bg-card border-border text-text-secondary hover:border-purple"}`}>Kısa</button>
                                <button onClick={() => handleDurationPill("normal")} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${durationPill === "normal" ? "bg-purple border-purple text-white" : "bg-bg-card border-border text-text-secondary hover:border-purple"}`}>Normal</button>
                                <button onClick={() => handleDurationPill("long")} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${durationPill === "long" ? "bg-purple border-purple text-white" : "bg-bg-card border-border text-text-secondary hover:border-purple"}`}>Uzun</button>
                            </div>
                        </div>
                    )}

                    {/* Sıralama & Dil */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Sıralama</label>
                            <select
                                className="w-full bg-bg-hover border border-border rounded-xl p-3 text-sm text-text-primary outline-none focus:border-purple cursor-pointer"
                                value={draftFilters.sortBy}
                                onChange={(e) => setDraftFilters(prev => ({ ...prev, sortBy: e.target.value as DiscoverFilters['sortBy'] }))}
                            >
                                <option value="popularity">Popülerliğe Göre</option>
                                <option value="rating">Puana Göre</option>
                                <option value="release_date">Tarihe Göre (Yeni → Eski)</option>
                                {contentType === "movie" && <option value="revenue">Hasılat (En Yüksek)</option>}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Dil</label>
                            <select
                                className="w-full bg-bg-hover border border-border rounded-xl p-3 text-sm text-text-primary outline-none focus:border-purple cursor-pointer"
                                value={draftFilters.language || ""}
                                onChange={(e) => setDraftFilters(prev => ({ ...prev, language: e.target.value }))}
                            >
                                <option value="">Tüm Diller</option>
                                <option value="tr">Türkçe</option>
                                <option value="en">İngilizce</option>
                                <option value="ko">Korece</option>
                                <option value="ja">Japonca</option>
                                <option value="es">İspanyolca</option>
                                <option value="fr">Fransızca</option>
                            </select>
                        </div>
                    </div>

                    {/* Butonlar */}
                    <div className="pt-2 flex flex-col gap-3 sticky bottom-0 bg-bg-card z-10">
                        <Button variant="primary" className="w-full justify-center py-3" onClick={handleApplyFilters}>
                            Filtrele
                        </Button>
                        <Button variant="ghost" className="w-full justify-center text-text-muted hover:text-text-primary" onClick={handleResetFilters}>
                            Sıfırla
                        </Button>
                    </div>
                </div>
            </aside>

            {/* SAĞ ALAN - SONUÇLAR */}
            <main className="flex-1 min-w-0">
                {/* Üst Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-card border border-border rounded-2xl p-4 mb-6 shadow-sm">
                    <p className="text-sm text-text-secondary font-medium"><span className="font-bold text-text-primary text-base mr-1">{totalResults.toLocaleString("tr-TR")}</span> sonuç bulundu</p>

                    <div className="flex items-center gap-1 bg-bg-hover p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-bg-card text-purple shadow-sm" : "text-text-muted hover:text-text-primary"}`}
                            title="Grid Görünüm"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-bg-card text-purple shadow-sm" : "text-text-muted hover:text-text-primary"}`}
                            title="Liste Görünüm"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Sonuç Grid/List */}
                {loading ? (
                    <div className={`grid gap-4 sm:gap-6 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 lg:grid-cols-2"}`}>
                        {[...Array(12)].map((_, i) => <SkeletonCard key={`skel-${i}`} viewMode={viewMode} />)}
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-bg-card border border-border rounded-2xl text-center shadow-sm">
                        <div className="w-16 h-16 bg-bg-hover rounded-full flex items-center justify-center mb-6 text-text-muted">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-display font-bold text-text-primary mb-2">Sonuç Bulunamadı</h3>
                        <p className="text-text-secondary max-w-sm">Daha farklı filtreler denemeyi ya da kriterleri biraz daha genişletmeyi düşünebilirsiniz.</p>
                        <Button variant="ghost" onClick={handleResetFilters} className="mt-6">Tüm Filtreleri Sıfırla</Button>
                    </div>
                ) : (
                    <div className={`grid gap-4 sm:gap-6 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 xl:grid-cols-2"}`}>
                        {results.map((item) => {
                            const linkHref = `/${contentType === "movie" ? "film" : "dizi"}/${item.id}`;
                            const title = 'title' in item ? item.title : item.name;
                            const rating = item.vote_average?.toFixed(1) || "0.0";
                            const date = 'release_date' in item ? item.release_date : item.first_air_date;
                            const year = date ? date.split("-")[0] : "TBA";
                            const overview = item.overview || "Açıklama bulunmuyor.";

                            if (viewMode === "grid") {
                                return (
                                    <Link key={`grid-${item.id}`} href={linkHref}>
                                        <Card hover className="p-0 overflow-hidden relative group h-full flex flex-col bg-bg-card border-border border">
                                            <div className="relative w-full aspect-[2/3] bg-bg-hover shrink-0 overflow-hidden">
                                                {item.poster_path ? (
                                                    <Image
                                                        src={posterUrl(item.poster_path)}
                                                        alt={title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-text-muted"><Film size={32} /></div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />

                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-xl border border-white/5">
                                                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                    <span className="text-white">{rating}</span>
                                                </div>

                                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                                    <h3 className="font-display font-bold text-white leading-tight line-clamp-2 drop-shadow-md mb-1.5 group-hover:text-purple transition-colors">{title}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-300">
                                                        <span>{year}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                );
                            } else {
                                // LIST VIEW
                                return (
                                    <Link key={`list-${item.id}`} href={linkHref}>
                                        <Card hover className="flex flex-row p-0 overflow-hidden group h-[180px] sm:h-[220px] bg-bg-card border-border border shrink-0 min-w-0">
                                            <div className="relative w-[120px] sm:w-[145px] h-full shrink-0 bg-bg-hover">
                                                {item.poster_path ? (
                                                    <Image
                                                        src={posterUrl(item.poster_path)}
                                                        alt={title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="150px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-text-muted"><Film size={32} /></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
                                                <div>
                                                    <h3 className="font-display font-bold text-lg sm:text-xl text-text-primary mb-1 truncate group-hover:text-purple transition-colors">{title}</h3>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs sm:text-sm font-medium text-text-secondary">
                                                        <div className="flex items-center gap-1.5">
                                                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                            <span className="text-text-primary font-bold">{rating}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={14} className="text-text-muted" />
                                                            <span>{year}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-text-secondary line-clamp-3 leading-relaxed hidden sm:-webkit-box">
                                                        {overview}
                                                    </p>
                                                </div>
                                                <div className="mt-auto pt-2 hidden sm:block">
                                                    <span className="text-xs font-bold text-purple uppercase tracking-wider group-hover:underline">Detayları İncele</span>
                                                </div>
                                            </div>
                                        </Card>
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
                                <RefreshCcw className="w-6 h-6 text-purple animate-spin" />
                                <span className="text-xs font-medium text-text-muted">Sonraki sayfa yükleniyor...</span>
                            </div>
                        )}
                        {!loadingMore && filters.page && filters.page * 20 < totalResults && (
                            <Button
                                variant="ghost"
                                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                            >
                                Daha Fazla Yükle
                            </Button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
