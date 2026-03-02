"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    getWatched,
    getWatchedEpisodes,
    getAllRatings,
    getWatchlist,
} from "@/lib/storage";
import {
    getMovieDetail,
    getSeriesDetail,
} from "@/lib/tmdb";
import type { WatchedItem, RatingItem } from "@/types";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from "recharts";
import {
    Film,
    Tv2,
    PlayCircle,
    Clock,
    BarChart3,
    TrendingUp,
    Users,
    Award,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Clapperboard,
    User,
} from "lucide-react";
import Card from "@/components/ui/Card";
import WrappedModal from "@/components/profil/WrappedModal";

// ==========================================
// Sabitler
// ==========================================

const AVG_EPISODE_MINUTES = 45;

const GENRE_PIE_COLORS = [
    "#7B5CF0", "#9D7FF4", "#5A3FD4", "#A78BFA", "#6D4ED8",
    "#B49CFA", "#8B6CF7", "#C4B5FD", "#7C3AED", "#DDD6FE",
];

const MONTH_NAMES = [
    "Oca", "Sub", "Mar", "Nis", "May", "Haz",
    "Tem", "Agu", "Eyl", "Eki", "Kas", "Ara",
];

// ==========================================
// Count-Up Hook
// ==========================================

function useCountUp(target: number, duration: number = 1500): number {
    const [count, setCount] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (target === 0) {
            setCount(0);
            return;
        }

        const start = performance.now();
        const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration]);

    return count;
}

// ==========================================
// StatCard Component
// ==========================================

function StatCard({
    icon: Icon,
    label,
    value,
    suffix,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    suffix?: string;
}) {
    const animatedValue = useCountUp(value);

    return (
        <Card className="p-5 group">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple/15 flex items-center justify-center">
                    <Icon size={20} className="text-purple" />
                </div>
                <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">
                    {label}
                </span>
            </div>
            <div className="text-3xl font-display font-bold text-text-primary group-hover:text-purple transition-colors">
                {animatedValue.toLocaleString("tr-TR")}
                {suffix && (
                    <span className="text-lg text-text-secondary font-normal ml-1">
                        {suffix}
                    </span>
                )}
            </div>
        </Card>
    );
}

// ==========================================
// Interface for TMDB detail cache
// ==========================================

interface ContentDetail {
    id: number;
    genres: { id: number; name: string }[];
    runtime?: number | null;
    cast: { id: number; name: string; profile_path: string | null }[];
}

// ==========================================
// Cinema Personality
// ==========================================

function getCinemaPersonality(stats: {
    totalMovies: number;
    totalSeries: number;
    totalEpisodes: number;
    avgRating: number;
    topGenres: string[];
    totalWatched: number;
}): { label: string; description: string } {
    const { totalMovies, totalSeries, totalEpisodes, avgRating, topGenres, totalWatched } = stats;

    if (totalWatched === 0) {
        return { label: "Yeni Baslayan", description: "Henuz yolculugun basinda! Kesfetmeye basla." };
    }

    if (totalSeries > totalMovies * 2 && totalEpisodes > 50) {
        return { label: "Dizi Bagimlisi", description: "Dizilere hayatini adamissin!" };
    }

    if (avgRating >= 8.0) {
        return { label: "Kalite Avcisi", description: "Sadece en iyileri izliyorsun, standartlarin yuksek." };
    }

    if (avgRating <= 4.0 && totalWatched > 10) {
        return { label: "Cesur Kasif", description: "Her seyi deniyorsun, iyi kotu demeden!" };
    }

    if (topGenres[0] === "Aksiyon" || topGenres[0] === "Macera") {
        return { label: "Aksiyon Tutkunu", description: "Adrenalin senin isin! Patlama yoksa film degil." };
    }

    if (topGenres[0] === "Korku" || topGenres[0] === "Gerilim") {
        return { label: "Karanlik Ruh", description: "Gerilim ve korku senin alanin." };
    }

    if (topGenres[0] === "Komedi") {
        return { label: "Gulme Uzmani", description: "Hayat kisa, gulelim bari!" };
    }

    if (topGenres[0] === "Dram") {
        return { label: "Duygusal Sinefil", description: "Derin hikayelere bayiliyorsun." };
    }

    if (topGenres[0] === "Bilim Kurgu" || topGenres[0] === "Fantastik") {
        return { label: "Hayal Gezgini", description: "Gercekligin sinirlarini zorluyorsun!" };
    }

    if (topGenres[0] === "Belgesel") {
        return { label: "Bilgi Avcisi", description: "Ogrenmeyi seviyorsun, her belgesel seninle." };
    }

    if (totalWatched > 50) {
        return { label: "Sinema Gurusu", description: "Sen artik bir profesyonelsin!" };
    }

    if (totalMovies > totalSeries) {
        return { label: "Film Sever", description: "Klasik bir sinema tutkunu." };
    }

    return { label: "Merakli Izleyici", description: "Her seyden biraz izliyorsun, dengeli bir profil!" };
}

// ==========================================
// Custom Tooltip
// ==========================================

function ChartTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#16161A] border border-[#2A2A35] rounded-xl px-4 py-3 shadow-xl">
                <p className="text-text-primary text-sm font-medium mb-1">{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} className="text-xs" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
}

// ==========================================
// Main Component
// ==========================================

export default function IstatistiklerPage() {
    const [watched, setWatched] = useState<WatchedItem[]>([]);
    const [ratings, setRatings] = useState<RatingItem[]>([]);
    const [totalEpisodes, setTotalEpisodes] = useState(0);
    const [watchlistCount, setWatchlistCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(true);

    // Computed stats
    const [totalRuntime, setTotalRuntime] = useState(0);
    const [genreData, setGenreData] = useState<{ name: string; value: number }[]>([]);
    const [topActors, setTopActors] = useState<{ name: string; count: number; profilePath: string | null }[]>([]);

    // Wrapped modal
    const [showWrapped, setShowWrapped] = useState(false);

    // Load localStorage data first
    useEffect(() => {
        document.title = "Istatistiklerim - CineTrack";

        const watchedItems = getWatched();
        const allRatings = getAllRatings();
        const watchlist = getWatchlist();

        setWatched(watchedItems);
        setRatings(allRatings);
        setWatchlistCount(watchlist.length);

        let epCount = 0;
        const seriesIds = Array.from(new Set(watchedItems.filter(w => w.type === "dizi").map(w => w.id)));
        seriesIds.forEach(sid => {
            const eps = getWatchedEpisodes(sid);
            epCount += eps.length;
        });
        try {
            const epData = localStorage.getItem("cinetrack_episodes");
            if (epData) {
                const allEps = JSON.parse(epData);
                epCount = Math.max(epCount, allEps.length);
            }
        } catch { /* ignore */ }

        setTotalEpisodes(epCount);
        setLoading(false);
    }, []);

    // Fetch TMDB details for genre/runtime/actor stats
    const fetchDetails = useCallback(async () => {
        if (watched.length === 0) {
            setDetailsLoading(false);
            return;
        }

        setDetailsLoading(true);
        const detailMap = new Map<string, ContentDetail>();
        const genreCounter = new Map<string, number>();
        const actorCounter = new Map<string, { count: number; profilePath: string | null }>();
        let runtime = 0;

        const batchSize = 5;
        for (let i = 0; i < watched.length; i += batchSize) {
            const batch = watched.slice(i, i + batchSize);
            const promises = batch.map(async (item) => {
                try {
                    if (item.type === "film") {
                        const detail = await getMovieDetail(item.id);
                        if (detail) {
                            const cd: ContentDetail = {
                                id: detail.id,
                                genres: detail.genres,
                                runtime: detail.runtime,
                                cast: detail.credits?.cast?.slice(0, 5).map(c => ({
                                    id: c.id,
                                    name: c.name,
                                    profile_path: c.profile_path,
                                })) || [],
                            };
                            detailMap.set(`film-${item.id}`, cd);
                            if (detail.runtime) runtime += detail.runtime;
                            detail.genres.forEach(g => {
                                genreCounter.set(g.name, (genreCounter.get(g.name) || 0) + 1);
                            });
                            cd.cast.forEach(a => {
                                const existing = actorCounter.get(a.name);
                                actorCounter.set(a.name, {
                                    count: (existing?.count || 0) + 1,
                                    profilePath: a.profile_path || existing?.profilePath || null,
                                });
                            });
                        }
                    } else {
                        const detail = await getSeriesDetail(item.id);
                        if (detail) {
                            const cd: ContentDetail = {
                                id: detail.id,
                                genres: detail.genres,
                                runtime: null,
                                cast: detail.credits?.cast?.slice(0, 5).map(c => ({
                                    id: c.id,
                                    name: c.name,
                                    profile_path: c.profile_path,
                                })) || [],
                            };
                            detailMap.set(`dizi-${item.id}`, cd);
                            detail.genres.forEach(g => {
                                genreCounter.set(g.name, (genreCounter.get(g.name) || 0) + 1);
                            });
                            cd.cast.forEach(a => {
                                const existing = actorCounter.get(a.name);
                                actorCounter.set(a.name, {
                                    count: (existing?.count || 0) + 1,
                                    profilePath: a.profile_path || existing?.profilePath || null,
                                });
                            });
                        }
                    }
                } catch { /* ignore individual failures */ }
            });
            await Promise.all(promises);
        }

        runtime += totalEpisodes * AVG_EPISODE_MINUTES;
        setTotalRuntime(runtime);

        const sortedGenres = Array.from(genreCounter.entries())
            .sort((a, b) => b[1] - a[1]);
        setGenreData(sortedGenres.map(([name, value]) => ({ name, value })));

        const sortedActors = Array.from(actorCounter.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([name, data]) => ({ name, count: data.count, profilePath: data.profilePath }));
        setTopActors(sortedActors);

        setDetailsLoading(false);
    }, [watched, totalEpisodes]);

    useEffect(() => {
        if (!loading && watched.length > 0) {
            fetchDetails();
        } else if (!loading) {
            setDetailsLoading(false);
        }
    }, [loading, watched, fetchDetails]);

    // ==========================================
    // Compute Stats
    // ==========================================

    const totalMovies = watched.filter(w => w.type === "film").length;
    const totalSeries = watched.filter(w => w.type === "dizi").length;
    const totalWatched = watched.length;

    const runtimeHours = Math.floor(totalRuntime / 60);
    const runtimeDays = Math.floor(runtimeHours / 24);

    // Monthly viewing data (last 12 months)
    const getMonthlyData = () => {
        const now = new Date();
        const data = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const monthName = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear() !== now.getFullYear() ? date.getFullYear().toString().slice(2) : ""}`.trim();

            const movies = watched.filter(w => {
                const d = new Date(w.watchedAt);
                return w.type === "film" && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthKey;
            }).length;

            const series = watched.filter(w => {
                const d = new Date(w.watchedAt);
                return w.type === "dizi" && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthKey;
            }).length;

            data.push({ month: monthName, Film: movies, Dizi: series });
        }
        return data;
    };

    // Rating distribution
    const getRatingDistribution = () => {
        const dist: { puan: string; adet: number }[] = [];
        for (let i = 1; i <= 10; i++) {
            const count = ratings.filter(r => r.rating === i).length;
            dist.push({ puan: `${i}`, adet: count });
        }
        return dist;
    };

    // Average rating
    const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    // Most given rating
    const ratingDist = getRatingDistribution();
    const mostGivenRating = ratingDist.reduce(
        (best, curr) => curr.adet > best.adet ? curr : best,
        { puan: "—", adet: 0 }
    );

    // Top 5 genres (for sidebar)
    const topGenres = genreData.slice(0, 5);

    // This year vs last year
    const thisYear = new Date().getFullYear();
    const thisYearCount = watched.filter(w => new Date(w.watchedAt).getFullYear() === thisYear).length;
    const lastYearCount = watched.filter(w => new Date(w.watchedAt).getFullYear() === thisYear - 1).length;
    const yearDiff = thisYearCount - lastYearCount;

    // Cinema personality
    const personality = getCinemaPersonality({
        totalMovies,
        totalSeries,
        totalEpisodes,
        avgRating,
        topGenres: topGenres.map(g => g.name),
        totalWatched,
    });

    const monthlyData = getMonthlyData();
    const ratingDistData = getRatingDistribution();

    // For wrapped modal
    const topActor = topActors.length > 0 ? topActors[0] : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20 animate-fade-in">
            {/* Baslik */}
            <div>
                <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                    <BarChart3 size={28} className="text-purple" />
                    Istatistiklerim
                </h1>
                <p className="text-text-secondary mt-2">
                    Izleme aliskanliklarinizin detayli analizi.
                </p>
            </div>

            {/* ========================================== */}
            {/* OZET KARTLARI */}
            {/* ========================================== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Film} label="Toplam Film" value={totalMovies} />
                <StatCard icon={Tv2} label="Toplam Dizi" value={totalSeries} />
                <StatCard icon={PlayCircle} label="Toplam Bolum" value={totalEpisodes} />
                <StatCard
                    icon={Clock}
                    label="Toplam Saat"
                    value={runtimeDays > 0 ? runtimeDays : runtimeHours}
                    suffix={runtimeDays > 0 ? "gun" : "saat"}
                />
            </div>

            {/* Bos durum */}
            {totalWatched === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-purple/10 flex items-center justify-center mb-6">
                        <BarChart3 size={40} className="text-purple" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Henuz veri yok</h2>
                    <p className="text-text-secondary max-w-md mb-6">
                        Film ve dizi izlemeye basladiginizda burada detayli istatistiklerinizi goreceksiniz.
                    </p>
                    <Link
                        href="/"
                        className="px-6 py-2.5 bg-purple text-white rounded-xl font-semibold text-sm hover:bg-purple-light transition-colors"
                    >
                        Kesfetmeye Basla
                    </Link>
                </div>
            )}

            {totalWatched > 0 && (
                <>
                    {/* ========================================== */}
                    {/* AYLIK IZLEME GRAFIGI */}
                    {/* ========================================== */}
                    <Card className="p-6">
                        <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-purple" />
                            Aylik Izleme
                        </h2>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#8B8B99"
                                        fontSize={12}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#8B8B99"
                                        fontSize={12}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend
                                        wrapperStyle={{ paddingTop: "10px", fontSize: "13px" }}
                                    />
                                    <Bar
                                        dataKey="Film"
                                        fill="#7B5CF0"
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={1200}
                                    />
                                    <Bar
                                        dataKey="Dizi"
                                        fill="#22C55E"
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={1200}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* ========================================== */}
                    {/* TUR DAGILIMI VE PUAN DAGILIMI */}
                    {/* ========================================== */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tur Dagilimi */}
                        <Card className="p-6">
                            <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                                <Clapperboard size={20} className="text-purple" />
                                Tur Dagilimi
                            </h2>
                            {detailsLoading ? (
                                <div className="flex items-center justify-center h-[280px]">
                                    <div className="w-8 h-8 border-3 border-purple border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : genreData.length > 0 ? (
                                <div className="w-full h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={genreData.slice(0, 8)}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="value"
                                                animationDuration={1200}
                                                label={((props: { name?: string; percent?: number }) => {
                                                    const name = props.name || "";
                                                    const percent = props.percent || 0;
                                                    return `${name} ${(percent * 100).toFixed(0)}%`;
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                }) as any}
                                                labelLine={true}
                                            >
                                                {genreData.slice(0, 8).map((_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={GENRE_PIE_COLORS[index % GENRE_PIE_COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    background: "#16161A",
                                                    border: "1px solid #2A2A35",
                                                    borderRadius: "12px",
                                                    fontSize: "13px",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p className="text-text-secondary text-sm text-center py-10">Tur verisi yok</p>
                            )}
                        </Card>

                        {/* Puan Dagilimi */}
                        <Card className="p-6">
                            <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                                <Award size={20} className="text-[#F59E0B]" />
                                Puan Dagilimi
                            </h2>
                            {ratings.length > 0 ? (
                                <>
                                    <div className="w-full h-[240px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={ratingDistData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" />
                                                <XAxis
                                                    dataKey="puan"
                                                    stroke="#8B8B99"
                                                    fontSize={12}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    stroke="#8B8B99"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    allowDecimals={false}
                                                />
                                                <Tooltip content={<ChartTooltip />} />
                                                <Bar
                                                    dataKey="adet"
                                                    name="Adet"
                                                    fill="#F59E0B"
                                                    radius={[4, 4, 0, 0]}
                                                    animationDuration={1200}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-2 text-center">
                                        En cok <span className="text-[#F59E0B] font-semibold">{mostGivenRating.puan}</span> puan vermissin ({mostGivenRating.adet} kez)
                                    </p>
                                </>
                            ) : (
                                <p className="text-text-secondary text-sm text-center py-10">
                                    Henuz puan vermemissin
                                </p>
                            )}
                        </Card>
                    </div>

                    {/* ========================================== */}
                    {/* ALT ISTATISTIK SATIRLARI (2 kolon) */}
                    {/* ========================================== */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* En Cok Izlenen Turler */}
                        <Card className="p-6">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-5 flex items-center gap-2">
                                <Award size={16} className="text-purple" />
                                En Cok Izledigin Turler
                            </h3>
                            {detailsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : topGenres.length > 0 ? (
                                <div className="space-y-4">
                                    {topGenres.map((genre, i) => (
                                        <div key={genre.name}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-text-secondary w-5">{i + 1}.</span>
                                                    <span className="text-sm font-medium text-text-primary">{genre.name}</span>
                                                </div>
                                                <span className="text-xs text-text-secondary">{genre.value} icerik</span>
                                            </div>
                                            <div className="w-full h-2 bg-[#2A2A35] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{
                                                        width: `${(genre.value / (topGenres[0]?.value || 1)) * 100}%`,
                                                        backgroundColor: GENRE_PIE_COLORS[i],
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-secondary text-xs">Veri yukleniyor...</p>
                            )}
                        </Card>

                        {/* Top 5 Oyuncu */}
                        <Card className="p-6">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-5 flex items-center gap-2">
                                <Users size={16} className="text-purple" />
                                En Cok Izledigin Oyuncular
                            </h3>
                            {detailsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : topActors.length > 0 ? (
                                <div className="space-y-3">
                                    {topActors.map((actor) => (
                                        <div key={actor.name} className="flex items-center gap-3">
                                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[#2A2A35] flex-shrink-0">
                                                {actor.profilePath ? (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w185${actor.profilePath}`}
                                                        alt={actor.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="36px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <User size={16} className="text-text-secondary" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">{actor.name}</p>
                                            </div>
                                            <span className="text-xs text-text-secondary font-medium bg-purple/10 px-2 py-1 rounded-lg">
                                                {actor.count} yapim
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-secondary text-xs">Veri yukleniyor...</p>
                            )}
                        </Card>

                        {/* Bu Yil vs Gecen Yil */}
                        <Card className="p-6">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-5 flex items-center gap-2">
                                <TrendingUp size={16} className="text-purple" />
                                Bu Yil vs Gecen Yil
                            </h3>
                            <div className="flex items-center justify-between">
                                <div className="text-center">
                                    <p className="text-xs text-text-secondary mb-1">{thisYear}</p>
                                    <p className="text-3xl font-display font-bold text-text-primary">{thisYearCount}</p>
                                    <p className="text-xs text-text-secondary">icerik</p>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    {yearDiff > 0 ? (
                                        <ArrowUpRight size={28} className="text-[#22C55E]" />
                                    ) : yearDiff < 0 ? (
                                        <ArrowDownRight size={28} className="text-red-500" />
                                    ) : (
                                        <Minus size={28} className="text-text-secondary" />
                                    )}
                                    <span className={`text-sm font-bold ${yearDiff > 0 ? "text-[#22C55E]" : yearDiff < 0 ? "text-red-500" : "text-text-secondary"}`}>
                                        {yearDiff > 0 ? "+" : ""}{yearDiff}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-text-secondary mb-1">{thisYear - 1}</p>
                                    <p className="text-3xl font-display font-bold text-text-secondary">{lastYearCount}</p>
                                    <p className="text-xs text-text-secondary">icerik</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#2A2A35] grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-text-secondary">Ortalama Puan</p>
                                    <p className="text-lg font-bold text-[#F59E0B]">
                                        {ratings.length > 0 ? avgRating.toFixed(1) : "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary">Izleme Listesi</p>
                                    <p className="text-lg font-bold text-text-primary">{watchlistCount}</p>
                                </div>
                            </div>
                        </Card>

                        {/* Sinema Kimligin */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-dark via-purple to-purple-light p-6 text-white">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles size={16} className="text-white/80" />
                                    <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                                        Sinema Kimligin
                                    </p>
                                </div>
                                <h3 className="text-3xl font-display font-black mb-2">
                                    {personality.label}
                                </h3>
                                <p className="text-sm text-white/70 leading-relaxed">
                                    {personality.description}
                                </p>
                                <div className="mt-6 flex items-center gap-4">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                                        <p className="text-[10px] text-white/60 uppercase">Film</p>
                                        <p className="text-lg font-bold">{totalMovies}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                                        <p className="text-[10px] text-white/60 uppercase">Dizi</p>
                                        <p className="text-lg font-bold">{totalSeries}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                                        <p className="text-[10px] text-white/60 uppercase">Saat</p>
                                        <p className="text-lg font-bold">{runtimeHours}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========================================== */}
                    {/* YILLIK OZET */}
                    {/* ========================================== */}
                    <section className="border-t border-[#2A2A35] pt-10">
                        <div className="text-center">
                            <h2 className="text-2xl font-display font-bold mb-2 flex items-center justify-center gap-2">
                                <Sparkles size={22} className="text-purple" />
                                Yillik Ozet
                            </h2>
                            <p className="text-text-secondary text-sm mb-6">
                                Bu yilki izleme yolculugunun ozetini kesfet.
                            </p>
                            <button
                                onClick={() => setShowWrapped(true)}
                                disabled={totalWatched === 0}
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-purple text-white rounded-xl font-semibold text-base hover:bg-purple-light transition-colors shadow-lg shadow-purple/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Sparkles size={20} />
                                Yillik Ozet Olustur
                            </button>
                        </div>
                    </section>
                </>
            )}

            {/* Wrapped Modal */}
            <WrappedModal
                isOpen={showWrapped}
                onClose={() => setShowWrapped(false)}
                username="Sinema Sever"
                stats={{
                    totalMovies,
                    totalSeries,
                    totalHours: runtimeHours,
                    topGenre: topGenres[0]?.name || "Belirsiz",
                    topActor: topActor?.name || null,
                    personalityEmoji: "",
                    personalityLabel: personality.label,
                }}
            />
        </div>
    );
}
