"use client";

import { logger } from '@/lib/logger';

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    getAiringToday,
    getOnTheAir,
    getUpcomingMovies,
    getSeriesNextEpisode,
    posterUrl,
    TMDBSeriesResult,
    TMDBMovieResult,
    TMDBSeriesDetail,
} from "@/lib/tmdb";
import { getWatchlist } from "@/lib/db";
import {
    getNotificationSettings,
    saveNotificationSettings,
    NotificationSettings,
} from "@/lib/db";
import type { WatchlistItem } from "@/types";
import { Tv, CalendarDays, Film, Star, Bell, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ==========================================
// Tipler
// ==========================================

interface ScheduleEpisode {
    seriesId: number;
    seriesName: string;
    posterPath: string | null;
    seasonNumber: number;
    episodeNumber: number;
    episodeName: string;
    airDate: string;
    network?: string;
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    items: CalendarItem[];
}

interface CalendarItem {
    id: number;
    title: string;
    posterPath: string | null;
    type: "movie" | "tv";
    date: string;
}

type TabKey = "week" | "calendar" | "upcoming";

// ==========================================
// Yardımcı fonksiyonlar
// ==========================================

function formatDate(d: Date): string {
    return d.toISOString().split("T")[0];
}

function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getMonthName(month: number): string {
    const names = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
    ];
    return names[month];
}

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// ==========================================
// Ana Bileşen
// ==========================================

export default function TakvimPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("week");
    const [weekEpisodes, setWeekEpisodes] = useState<ScheduleEpisode[]>([]);
    const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
    const [upcomingMovies, setUpcomingMovies] = useState<TMDBMovieResult[]>([]);
    const [upcomingSeries, setUpcomingSeries] = useState<{ name: string; id: number; posterPath: string | null; nextSeason: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(() => new Date());
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

    // Bildirim state'leri
    const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
        enabled: false,
        hour: 9,
        minute: 0,
        lastCheckedDate: "",
    });
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

    const today = useMemo(() => new Date(), []);

    // ==========================================
    // VERİ YÜKLEME
    // ==========================================

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const watchlist = await getWatchlist();
            const seriesInWatchlist = watchlist.filter((i: WatchlistItem) => i.type === "dizi");

            // 1) Bu haftanın bölümleri — watchlist dizileri
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay() + 1); // Pazartesi
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const episodePromises = seriesInWatchlist.map(async (item: WatchlistItem) => {
                try {
                    const ep = await getSeriesNextEpisode(item.id);
                    if (ep && ep.air_date) {
                        const airDate = new Date(ep.air_date);
                        if (airDate >= weekStart && airDate <= weekEnd) {
                            return {
                                seriesId: Number(item.id),
                                seriesName: item.title,
                                posterPath: item.posterPath,
                                seasonNumber: ep.season_number,
                                episodeNumber: ep.episode_number,
                                episodeName: ep.name,
                                airDate: ep.air_date,
                            } as ScheduleEpisode;
                        }
                    }
                } catch { /* skip */ }
                return null;
            });

            const episodeResults = await Promise.all(episodePromises);
            const validEpisodes = episodeResults.filter(Boolean) as ScheduleEpisode[];
            setWeekEpisodes(validEpisodes.sort((a, b) => a.airDate.localeCompare(b.airDate)));

            // 2) Takvim verileri — airing + on the air
            const [airingData, onAirData] = await Promise.all([
                getAiringToday(),
                getOnTheAir(),
            ]);

            const items: CalendarItem[] = [];
            const seen = new Set<string>();

            (airingData || []).forEach((s: TMDBSeriesResult) => {
                const key = `tv-${s.id}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    items.push({
                        id: s.id,
                        title: s.name,
                        posterPath: s.poster_path,
                        type: "tv",
                        date: formatDate(today),
                    });
                }
            });

            (onAirData || []).forEach((s: TMDBSeriesResult) => {
                const key = `tv-${s.id}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    items.push({
                        id: s.id,
                        title: s.name,
                        posterPath: s.poster_path,
                        type: "tv",
                        date: s.first_air_date || formatDate(today),
                    });
                }
            });

            setCalendarItems(items);

            // 3) Yakında çıkacaklar
            const upcoming = await getUpcomingMovies();
            setUpcomingMovies((upcoming || []).slice(0, 20));

            // Devam eden dizilerin sonraki sezon tahminleri
            const seriesUpcoming: typeof upcomingSeries = [];
            for (const item of seriesInWatchlist.slice(0, 10)) {
                try {
                    const res = await fetch(
                        `https://api.themoviedb.org/3/tv/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=tr-TR`
                    );
                    if (res.ok) {
                        const detail: TMDBSeriesDetail = await res.json();
                        if (detail.status === "Returning Series" && detail.next_episode_to_air?.air_date) {
                            seriesUpcoming.push({
                                name: detail.name,
                                id: detail.id,
                                posterPath: detail.poster_path,
                                nextSeason: detail.next_episode_to_air.air_date,
                            });
                        }
                    }
                } catch { /* skip */ }
            }
            setUpcomingSeries(seriesUpcoming);
        } catch (err) {
            logger.error('Takvim verileri yüklenirken hata', err);
        } finally {
            setLoading(false);
        }
    }, [today]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ==========================================
    // BİLDİRİM YÖNETİMİ
    // ==========================================

    useEffect(() => {
        // Ayarları yükle
        getNotificationSettings().then(settings => setNotifSettings(settings));

        // İzin durumunu kontrol et
        if (typeof Notification !== "undefined") {
            setNotifPermission(Notification.permission);
            if (Notification.permission === "default") {
                // İlk açılışta nazik modal göster
                const timer = setTimeout(() => setShowNotifModal(true), 2000);
                return () => clearTimeout(timer);
            }
        }
        return undefined;
    }, []);

    // Service Worker kaydet
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch((err) => {
                logger.error('SW kayıt hatası', err);
            });
        }
    }, []);

    // Bildirim zamanlayıcı
    useEffect(() => {
        if (!notifSettings.enabled || notifPermission !== "granted") return;

        const interval = setInterval(() => {
            const now = new Date();
            const todayStr = formatDate(now);

            if (
                now.getHours() === notifSettings.hour &&
                now.getMinutes() === notifSettings.minute &&
                notifSettings.lastCheckedDate !== todayStr
            ) {
                // SW'ye mesaj gönder
                if (navigator.serviceWorker.controller) {
                    const shows = weekEpisodes
                        .filter((ep) => ep.airDate === todayStr)
                        .map((ep) => ({
                            id: ep.seriesId,
                            name: ep.seriesName,
                            poster: ep.posterPath ? posterUrl(ep.posterPath) : null,
                            season: ep.seasonNumber,
                            episode: ep.episodeNumber,
                        }));

                    if (shows.length > 0) {
                        navigator.serviceWorker.controller.postMessage({
                            type: "CHECK_SCHEDULE",
                            shows,
                        });
                    }
                }
                saveNotificationSettings({ ...notifSettings, lastCheckedDate: todayStr });
                setNotifSettings((prev) => ({ ...prev, lastCheckedDate: todayStr }));
            }
        }, 60_000);

        return () => clearInterval(interval);
    }, [notifSettings, notifPermission, weekEpisodes]);

    const requestPermission = async () => {
        if (typeof Notification === "undefined") return;
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        setShowNotifModal(false);
        if (perm === "granted") {
            saveNotificationSettings({ ...notifSettings, enabled: true });
            setNotifSettings((prev) => ({ ...prev, enabled: true }));
        }
    };

    // ==========================================
    // TAKVİM HESAPLAMA
    // ==========================================

    const calendarDays = useMemo((): CalendarDay[] => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = new Date(year, month, 1).getDay();
        // Pazartesi = 0
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;

        const days: CalendarDay[] = [];

        // Önceki ayın günleri
        const prevMonthDays = getDaysInMonth(year, month - 1);
        for (let i = startOffset - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthDays - i);
            days.push({ date, isCurrentMonth: false, isToday: false, items: [] });
        }

        // Bu ayın günleri
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = formatDate(date);
            const dayItems = calendarItems.filter((item) => item.date === dateStr);
            days.push({
                date,
                isCurrentMonth: true,
                isToday: isSameDay(date, today),
                items: dayItems,
            });
        }

        // Sonraki ayın günleri (6 satır tamamlamak için)
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            const date = new Date(year, month + 1, d);
            days.push({ date, isCurrentMonth: false, isToday: false, items: [] });
        }

        return days;
    }, [currentMonth, calendarItems, today]);

    // ==========================================
    // HAFTALIK GRUPLAMA
    // ==========================================

    const groupedEpisodes = useMemo(() => {
        const todayStr = formatDate(today);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = formatDate(tomorrow);

        const groups: { label: string; episodes: ScheduleEpisode[] }[] = [
            { label: "Bugün", episodes: [] },
            { label: "Yarın", episodes: [] },
            { label: "Bu Hafta", episodes: [] },
        ];

        weekEpisodes.forEach((ep) => {
            if (ep.airDate === todayStr) groups[0].episodes.push(ep);
            else if (ep.airDate === tomorrowStr) groups[1].episodes.push(ep);
            else groups[2].episodes.push(ep);
        });

        return groups.filter((g) => g.episodes.length > 0);
    }, [weekEpisodes, today]);

    // ==========================================
    // RENDER
    // ==========================================

    const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
        { key: "week", label: "Bu Hafta", icon: Tv },
        { key: "calendar", label: "Aylık Takvim", icon: CalendarDays },
        { key: "upcoming", label: "Yakında Çıkacaklar", icon: Film },
    ];

    return (
        <div className="space-y-8">
            {/* Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
                        Yayın <span className="text-accent">Takvimi</span>
                    </h1>
                    <p className="text-muted mt-1">
                        Takip ettiğin dizilerin yayın takvimini ve yaklaşan içerikleri keşfet
                    </p>
                </div>

                {/* Bildirim Ayarları Butonu */}
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-white/10 hover:border-accent/50 transition-all text-sm"
                >
                    <Bell size={18} className="text-text-muted" />
                    <span>Bildirim Ayarları</span>
                    {notifSettings.enabled && notifPermission === "granted" && (
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                </button>
            </div>

            {/* Tab Navigasyon */}
            <div className="flex gap-2 p-1 bg-card rounded-xl border border-white/10">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                            ? "bg-accent text-white shadow-lg shadow-accent/30"
                            : "text-muted hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <span>{(() => { const TabIcon = tab.icon; return <TabIcon size={16} />; })()}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        <p className="text-muted text-sm">Yayın takvimi yükleniyor...</p>
                    </div>
                </div>
            )}

            {/* ==========================================
                BÖLÜM 1 — BU HAFTA
            ========================================== */}
            {!loading && activeTab === "week" && (
                <div className="space-y-6 animate-fade-in">
                    {groupedEpisodes.length === 0 ? (
                        <div className="text-center py-16">
                            <Inbox size={48} className="text-text-muted mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Bu hafta yayın yok</h3>
                            <p className="text-muted text-sm">
                                İzleme listendeki dizilerin bu haftaki yeni bölümleri burada görünecek
                            </p>
                        </div>
                    ) : (
                        groupedEpisodes.map((group, gi) => (
                            <div key={gi} className="space-y-3">
                                <h2 className="text-lg font-semibold px-1">{group.label}</h2>
                                <div className="grid gap-3">
                                    {group.episodes.map((ep, ei) => (
                                        <Link
                                            key={`${ep.seriesId}-${ei}`}
                                            href={`/dizi/${ep.seriesId}`}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-white/5 hover:border-accent/30 transition-all group"
                                        >
                                            {/* Poster */}
                                            <div className="relative w-14 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={posterUrl(ep.posterPath)}
                                                    alt={ep.seriesName}
                                                    fill
                                                    className="object-cover"
                                                    sizes="56px"
                                                />
                                            </div>

                                            {/* Bilgi */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-white group-hover:text-accent transition-colors truncate">
                                                    {ep.seriesName}
                                                </h3>
                                                <p className="text-sm text-muted mt-0.5">
                                                    S{String(ep.seasonNumber).padStart(2, "0")}E
                                                    {String(ep.episodeNumber).padStart(2, "0")}
                                                    {ep.episodeName && ` — ${ep.episodeName}`}
                                                </p>
                                                {ep.network && (
                                                    <p className="text-xs text-accent mt-1">{ep.network}</p>
                                                )}
                                            </div>

                                            {/* Tarih */}
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-medium text-white">
                                                    {new Date(ep.airDate).toLocaleDateString("tr-TR", {
                                                        day: "numeric",
                                                        month: "short",
                                                    })}
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {new Date(ep.airDate).toLocaleDateString("tr-TR", {
                                                        weekday: "short",
                                                    })}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ==========================================
                BÖLÜM 2 — AYLIK TAKVİM
            ========================================== */}
            {!loading && activeTab === "calendar" && (
                <div className="space-y-4 animate-fade-in">
                    {/* Ay Navigasyonu */}
                    <div className="flex items-center justify-between px-2">
                        <button
                            onClick={() =>
                                setCurrentMonth(
                                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                                )
                            }
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted hover:text-white"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <h2 className="text-xl font-bold">
                            {getMonthName(currentMonth.getMonth())} {currentMonth.getFullYear()}
                        </h2>

                        <button
                            onClick={() =>
                                setCurrentMonth(
                                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                                )
                            }
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted hover:text-white"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Gün İsimleri */}
                    <div className="grid grid-cols-7 gap-1">
                        {DAY_NAMES.map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-muted py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Takvim Hücreleri */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => (
                            <button
                                key={i}
                                onClick={() => day.items.length > 0 && setSelectedDay(day)}
                                className={`relative min-h-[80px] sm:min-h-[100px] p-1.5 rounded-lg border transition-all ${day.isToday
                                    ? "border-2 border-accent bg-accent/5"
                                    : day.isCurrentMonth
                                        ? "border-white/5 bg-card hover:border-white/20"
                                        : "border-transparent bg-card/40 opacity-40"
                                    } ${day.items.length > 0
                                        ? "cursor-pointer hover:scale-[1.02]"
                                        : "cursor-default"
                                    }`}
                            >
                                {/* Gün numarası */}
                                <span
                                    className={`text-xs font-medium ${day.isToday
                                        ? "text-accent font-bold"
                                        : day.isCurrentMonth
                                            ? "text-white/80"
                                            : "text-muted/50"
                                        }`}
                                >
                                    {day.date.getDate()}
                                </span>

                                {/* Yayın göstergeleri */}
                                {day.items.length > 0 && (
                                    <div className="mt-1 space-y-0.5">
                                        {day.items.slice(0, 2).map((item, j) => (
                                            <div key={j} className="flex items-center gap-1">
                                                <div className="relative w-5 h-7 rounded-sm overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={posterUrl(item.posterPath)}
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="20px"
                                                    />
                                                </div>
                                                <span className="text-[9px] text-muted truncate hidden sm:inline">
                                                    {item.title}
                                                </span>
                                            </div>
                                        ))}
                                        {day.items.length > 2 && (
                                            <span className="text-[9px] text-accent font-medium">
                                                +{day.items.length - 2}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Parlak nokta */}
                                {day.items.length > 0 && (
                                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent calendar-pulse" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Seçili Gün Detayı */}
                    {selectedDay && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 modal-backdrop"
                            onClick={() => setSelectedDay(null)}>
                            <div
                                className="bg-card border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[70vh] overflow-y-auto animate-slide-up"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        <CalendarDays size={18} className="inline mr-1" />{" "}
                                        {selectedDay.date.toLocaleDateString("tr-TR", {
                                            day: "numeric",
                                            month: "long",
                                            weekday: "long",
                                        })}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedDay(null)}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {selectedDay.items.map((item, i) => (
                                        <Link
                                            key={i}
                                            href={`/${item.type === "tv" ? "dizi" : "film"}/${item.id}`}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-white/5 transition-colors group"
                                            onClick={() => setSelectedDay(null)}
                                        >
                                            <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={posterUrl(item.posterPath)}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm group-hover:text-accent transition-colors truncate">
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {item.type === "tv" ? "Dizi" : "Film"}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ==========================================
                BÖLÜM 3 — YAKINDA ÇIKACAKLAR
            ========================================== */}
            {!loading && activeTab === "upcoming" && (
                <div className="space-y-8 animate-fade-in">
                    {/* Yakında Çıkacak Filmler */}
                    <div>
                        <h2 className="text-xl font-bold mb-4">Yakında Çıkacak Filmler</h2>
                        {upcomingMovies.length === 0 ? (
                            <p className="text-muted text-sm">Yakında çıkacak film bulunamadı.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {upcomingMovies.map((movie) => (
                                    <Link
                                        key={movie.id}
                                        href={`/film/${movie.id}`}
                                        className="group"
                                    >
                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/5 group-hover:border-accent/30 transition-all group-hover:scale-[1.02]">
                                            <Image
                                                src={posterUrl(movie.poster_path)}
                                                alt={movie.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                            {/* Tarih badge */}
                                            <div className="absolute top-2 right-2 bg-accent/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-medium">
                                                {movie.release_date
                                                    ? new Date(movie.release_date).toLocaleDateString("tr-TR", {
                                                        day: "numeric",
                                                        month: "short",
                                                    })
                                                    : "TBA"}
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <p className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
                                                    {movie.title}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star size={10} className="text-yellow-400" />
                                                    <span className="text-xs text-muted">
                                                        {movie.vote_average.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Devam Eden Diziler — Yeni Sezon */}
                    {upcomingSeries.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">
                                Listendekilerin Yeni Sezonları
                            </h2>
                            <div className="grid gap-3">
                                {upcomingSeries.map((s) => (
                                    <Link
                                        key={s.id}
                                        href={`/dizi/${s.id}`}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-card border border-white/5 hover:border-accent/30 transition-all group"
                                    >
                                        <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                            <Image
                                                src={posterUrl(s.posterPath)}
                                                alt={s.name}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold group-hover:text-accent transition-colors truncate">
                                                {s.name}
                                            </h3>
                                            <p className="text-sm text-muted">Devam eden dizi</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-medium text-accent">
                                                {new Date(s.nextSeason).toLocaleDateString("tr-TR", {
                                                    day: "numeric",
                                                    month: "long",
                                                })}
                                            </p>
                                            <p className="text-xs text-muted">Sonraki bölüm</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ==========================================
                BİLDİRİM İZİN MODALI
            ========================================== */}
            {showNotifModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 modal-backdrop">
                    <div className="bg-card border border-white/10 rounded-2xl p-6 max-w-sm w-full animate-slide-up">
                        <div className="text-center mb-6">
                            <Bell size={48} className="text-text-muted mb-3" />
                            <h3 className="text-xl font-bold mb-2">Bildirimleri Aç</h3>
                            <p className="text-muted text-sm leading-relaxed">
                                İzleme listenizde bulunan dizilerin yeni bölümlerinden haberdar olmak için
                                bildirimlere izin verin. Her sabah size hatırlatma göndereceğiz.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={requestPermission}
                                className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-colors"
                            >
                                İzin Ver
                            </button>
                            <button
                                onClick={() => setShowNotifModal(false)}
                                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-muted font-medium transition-colors"
                            >
                                Şimdi Değil
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==========================================
                BİLDİRİM AYARLARI PANELİ
            ========================================== */}
            {showSettings && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 modal-backdrop"
                    onClick={() => setShowSettings(false)}
                >
                    <div
                        className="bg-card border border-white/10 rounded-2xl p-6 max-w-sm w-full animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Bildirim Ayarları</h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* İzin Durumu */}
                        <div className="p-3 rounded-xl bg-background mb-4">
                            <div className="flex items-center gap-2 text-sm">
                                <span
                                    className={`w-2 h-2 rounded-full ${notifPermission === "granted"
                                        ? "bg-green-500"
                                        : notifPermission === "denied"
                                            ? "bg-red-500"
                                            : "bg-yellow-500"
                                        }`}
                                />
                                <span className="text-muted">
                                    Tarayıcı izni:{" "}
                                    <span className="text-white font-medium">
                                        {notifPermission === "granted"
                                            ? "Verildi"
                                            : notifPermission === "denied"
                                                ? "Reddedildi"
                                                : "Bekleniyor"}
                                    </span>
                                </span>
                            </div>
                            {notifPermission === "default" && (
                                <button
                                    onClick={requestPermission}
                                    className="mt-2 text-xs text-accent hover:underline"
                                >
                                    İzin ver →
                                </button>
                            )}
                            {notifPermission === "denied" && (
                                <p className="mt-2 text-xs text-muted">
                                    Tarayıcı ayarlarından bildirimlere izin vermeniz gerekiyor.
                                </p>
                            )}
                        </div>

                        {/* Açık/Kapalı Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-background mb-3">
                            <span className="text-sm font-medium">Bildirimler</span>
                            <button
                                onClick={() => {
                                    const newVal = !notifSettings.enabled;
                                    saveNotificationSettings({ ...notifSettings, enabled: newVal });
                                    setNotifSettings((prev) => ({ ...prev, enabled: newVal }));
                                }}
                                className={`relative w-12 h-7 rounded-full transition-colors ${notifSettings.enabled ? "bg-accent" : "bg-white/20"
                                    }`}
                                disabled={notifPermission !== "granted"}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${notifSettings.enabled ? "translate-x-5" : "translate-x-0"
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Saat Seçimi */}
                        <div className="p-3 rounded-xl bg-background">
                            <label className="text-sm font-medium block mb-2">
                                Bildirim Saati
                            </label>
                            <div className="flex items-center gap-2">
                                <select
                                    value={notifSettings.hour}
                                    onChange={(e) => {
                                        const hour = Number(e.target.value);
                                        saveNotificationSettings({ ...notifSettings, hour });
                                        setNotifSettings((prev) => ({ ...prev, hour }));
                                    }}
                                    className="flex-1 bg-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                                    disabled={!notifSettings.enabled}
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {String(i).padStart(2, "0")}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-muted font-bold">:</span>
                                <select
                                    value={notifSettings.minute}
                                    onChange={(e) => {
                                        const minute = Number(e.target.value);
                                        saveNotificationSettings({ ...notifSettings, minute });
                                        setNotifSettings((prev) => ({ ...prev, minute }));
                                    }}
                                    className="flex-1 bg-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                                    disabled={!notifSettings.enabled}
                                >
                                    {[0, 15, 30, 45].map((m) => (
                                        <option key={m} value={m}>
                                            {String(m).padStart(2, "0")}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-muted mt-2">
                                Her gün bu saatte yayın kontrolü yapılır
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
