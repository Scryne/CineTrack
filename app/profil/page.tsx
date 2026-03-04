"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    getWatched,
    getAllWatchedEpisodes,
    getAllRatings,
    getUserProfile,
    saveUserProfile,
    saveNotificationSettings,
} from "@/lib/db";
import { createClient } from "@/lib/supabase";
import {
    getMovieDetail,
    getSeriesDetail,
    posterUrl,
} from "@/lib/tmdb";
import {
    requestNotificationPermission,
    scheduleDailyNotification,
    cancelScheduledNotifications
} from "@/lib/notifications";
import type { WatchedItem, RatingItem, UserProfile } from "@/types";
import type { NotificationSettings } from "@/lib/db";
import Modal from "@/components/ui/Modal";
import ShareCardModal from "@/components/profil/ShareCardModal";
import { getCinemaPersonality } from "@/lib/cinema-personality";

import {
    Pencil,
    Check,
    Bell,
    BellOff,
    Clock,
    Camera,
    Film,
    Tv2,
    Star,
    Crown,
    Settings,
    User,
    LogOut,
    Eye,
    TrendingUp,
    ChevronRight,
    BarChart3,
    Heart,
    Zap,
    Clapperboard,
    Flame,
    Globe,
    Music,
    Gamepad2,
    BookOpen,
    Coffee,
    Shield
} from "lucide-react";

// ==========================================
// Sabitler
// ==========================================
const AVG_EPISODE_MINUTES = 45;

const AVATAR_ICONS = [
    { name: "User", icon: User, color: "#7B5CF0" },
    { name: "Film", icon: Film, color: "#9D7FF4" },
    { name: "Tv2", icon: Tv2, color: "#5A3FD4" },
    { name: "Clapperboard", icon: Clapperboard, color: "#22C55E" },
    { name: "Star", icon: Star, color: "#F59E0B" },
    { name: "Heart", icon: Heart, color: "#EC4899" },
    { name: "Flame", icon: Flame, color: "#F97316" },
    { name: "Zap", icon: Zap, color: "#3B82F6" },
    { name: "Crown", icon: Crown, color: "#A78BFA" },
    { name: "Globe", icon: Globe, color: "#06B6D4" },
    { name: "Music", icon: Music, color: "#8B5CF6" },
    { name: "Gamepad2", icon: Gamepad2, color: "#34D399" },
    { name: "BookOpen", icon: BookOpen, color: "#FBBF24" },
    { name: "Coffee", icon: Coffee, color: "#F87171" },
    { name: "Shield", icon: Shield, color: "#60A5FA" },
];

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${enabled ? "bg-purple" : "bg-white/10"}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-1"}`}
            />
        </button>
    );
}

function AnimatedCounter({ value, suffix = "", className = "" }: { value: number | string; suffix?: string; className?: string }) {
    const [displayValue, setDisplayValue] = useState(0);
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;

    useEffect(() => {
        if (numValue === 0) { setDisplayValue(0); return; }
        const duration = 800;
        const steps = 30;
        const increment = numValue / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= numValue) {
                setDisplayValue(numValue);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [numValue]);

    return (
        <span className={className}>
            {typeof value === "string" && value.includes(".") ? displayValue.toFixed(1) : displayValue}
            {suffix}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, color, loading }: {
    icon: React.ElementType; label: string; value: number | string; color: string; loading?: boolean;
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-[#0F0F13] border border-white/5 p-5 hover:border-white/10 hover:bg-[#131318] transition-all duration-300 group">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity blur-xl"
                style={{ backgroundColor: color }} />
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-3xl sm:text-4xl font-black font-display relative z-10" style={{ color }}>
                {loading ? (
                    <span className="inline-block w-16 h-8 bg-white/5 rounded animate-pulse" />
                ) : (
                    <AnimatedCounter value={value} />
                )}
            </p>
        </div>
    );
}

// ==========================================
// Ana Bileşen
// ==========================================
export default function ProfilPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile>({ username: "", avatar: "User" });
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [tempUsername, setTempUsername] = useState("");
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const [watched, setWatched] = useState<WatchedItem[]>([]);
    const [ratings, setRatings] = useState<RatingItem[]>([]);
    const [totalEpisodes, setTotalEpisodes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(true);

    const [totalRuntime, setTotalRuntime] = useState(0);
    const [topGenres, setTopGenres] = useState<{ name: string; value: number }[]>([]);

    const [topPosters, setTopPosters] = useState<string[]>([]);
    const [showShareCard, setShowShareCard] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
        enabled: false,
        hour: 20,
        minute: 0,
        lastCheckedDate: "",
    });

    useEffect(() => {
        document.title = "Profilim - CineTrack";

        const loadProfileData = async () => {
            try {
                const userProfile = await getUserProfile();
                if (userProfile) {
                    if (!AVATAR_ICONS.find(a => a.name === userProfile.avatar)) {
                        userProfile.avatar = "User";
                    }
                    setProfile(userProfile);
                    setTempUsername(userProfile.username || "");
                }

                const watchedItems = await getWatched();
                const allRatings = await getAllRatings();

                setWatched(watchedItems);
                setRatings(allRatings);

                let epCount = 0;
                const allEpisodes = await getAllWatchedEpisodes();
                epCount = allEpisodes.length;

                setTotalEpisodes(epCount);
                setTopPosters(watchedItems.slice(0, 4).map(w => posterUrl(w.posterPath)));
            } catch (error) {
                logger.error("Profil verileri yüklenirken hata:", error);
            } finally {
                setLoading(false);
            }
        };

        loadProfileData();

        setNotifSettings({
            enabled: false,
            hour: 20,
            minute: 0,
            lastCheckedDate: "", // default value
        });
    }, []);

    // Fetch details for only the latest 20 items to avoid TMDB rate limit / slow times
    const fetchRecentTrends = useCallback(async () => {
        if (watched.length === 0) {
            setDetailsLoading(false);
            return;
        }

        setDetailsLoading(true);
        const genreCounter = new Map<string, number>();
        const actorCounter = new Map<string, { count: number; profilePath: string | null }>();
        let runtime = 0;

        const recentItems = watched.slice(0, 20); // Only analyze recent 20 for trends

        const batchSize = 5;
        for (let i = 0; i < recentItems.length; i += batchSize) {
            const batch = recentItems.slice(i, i + batchSize);
            const promises = batch.map(async (item) => {
                try {
                    if (item.type === "film") {
                        const detail = await getMovieDetail(item.id);
                        if (detail) {
                            if (detail.runtime) runtime += detail.runtime;
                            detail.genres?.forEach(g => {
                                genreCounter.set(g.name, (genreCounter.get(g.name) || 0) + 1);
                            });
                            detail.credits?.cast?.slice(0, 5).forEach(a => {
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
                            detail.genres?.forEach(g => {
                                genreCounter.set(g.name, (genreCounter.get(g.name) || 0) + 1);
                            });
                            detail.credits?.cast?.slice(0, 5).forEach(a => {
                                const existing = actorCounter.get(a.name);
                                actorCounter.set(a.name, {
                                    count: (existing?.count || 0) + 1,
                                    profilePath: a.profile_path || existing?.profilePath || null,
                                });
                            });
                        }
                    }
                } catch { /* ignore */ }
            });
            await Promise.all(promises);
        }

        // Estimate full runtime from episodes and movies
        // (For historical accurately we just use the episode count, plus approximate recent movie time)
        // If they have 100 movies but we only checked 20, we extrapolate the rest.
        const moviesCount = watched.filter(w => w.type === 'film').length;
        const approxMovieTime = (moviesCount > 0 && recentItems.length > 0) ? (runtime / recentItems.length) * moviesCount : 0;
        const totalEpTime = totalEpisodes * AVG_EPISODE_MINUTES;

        setTotalRuntime(approxMovieTime + totalEpTime);

        const sortedGenres = Array.from(genreCounter.entries())
            .sort((a, b) => b[1] - a[1]);
        setTopGenres(sortedGenres.map(([name, value]) => ({ name, value })));

        setDetailsLoading(false);
    }, [watched, totalEpisodes]);

    useEffect(() => {
        if (!loading && watched.length > 0) {
            fetchRecentTrends();
        } else if (!loading) {
            setDetailsLoading(false);
        }
    }, [loading, watched, fetchRecentTrends]);

    const handleSaveUsername = async () => {
        const trimmed = tempUsername.trim();
        if (trimmed) {
            const updated = { ...profile, username: trimmed };
            setProfile(updated);
            await saveUserProfile(updated);
        } else {
            setTempUsername(profile.username || "");
        }
        setIsEditingUsername(false);
    };

    const handleSelectAvatar = async (iconName: string) => {
        const updated = { ...profile, avatar: iconName };
        setProfile(updated);
        await saveUserProfile(updated);
        setShowAvatarModal(false);
    };

    const handleToggleNotifications = async () => {
        const newEnabled = !notifSettings.enabled;
        if (newEnabled) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                alert("Bildirim izni verilmedi. Lütfen tarayıcı ayarlarından izin verin.");
                return;
            }
            const timeStr = `${String(notifSettings.hour).padStart(2, '0')}:${String(notifSettings.minute).padStart(2, '0')}`;
            await scheduleDailyNotification(timeStr);
        } else {
            await cancelScheduledNotifications();
        }
        const updated = { ...notifSettings, enabled: newEnabled };
        setNotifSettings(updated);
        saveNotificationSettings(updated);
    };

    const handleTimeChange = async (field: "hour" | "minute", value: number) => {
        const updated = { ...notifSettings, [field]: value };
        setNotifSettings(updated);
        saveNotificationSettings(updated);
        if (updated.enabled) {
            const timeStr = `${String(updated.hour).padStart(2, '0')}:${String(updated.minute).padStart(2, '0')}`;
            await cancelScheduledNotifications();
            await scheduleDailyNotification(timeStr);
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/auth/login");
        router.refresh(); // strict clear
    };

    const totalMovies = watched.filter(w => w.type === "film").length;
    const totalSeries = watched.filter(w => w.type === "dizi").length;
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
    const runtimeHours = Math.floor(totalRuntime / 60);

    const personality = getCinemaPersonality({
        totalMovies, totalSeries, totalEpisodes, avgRating,
        topGenres: topGenres.map(g => g.name), totalWatched: watched.length,
    });

    const currentAvatarConfig = AVATAR_ICONS.find(a => a.name === profile.avatar) || AVATAR_ICONS[0];
    const AvatarIcon = currentAvatarConfig.icon;
    const recentWatched = watched.slice(0, 8);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-muted text-sm font-medium animate-pulse">Profil yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6 animate-fade-in relative">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple/5 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            {/* ========================================== */}
            {/* PROFILE HEAD */}
            {/* ========================================== */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0F0F13]/80 backdrop-blur-xl border border-white/5 mb-10 group">
                <div
                    className="absolute inset-x-0 h-40 opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                    style={{ background: `linear-gradient(to bottom, ${currentAvatarConfig.color}40, transparent)` }}
                />

                <div className="relative p-8 sm:p-12 pb-10 flex flex-col md:flex-row items-center md:items-end gap-8">
                    {/* Avatar Studio */}
                    <button
                        onClick={() => setShowAvatarModal(true)}
                        className="relative shrink-0 group/avatar z-10"
                        title="Avatar değiştirmek için tıkla"
                    >
                        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover/avatar:opacity-100 transition duration-500" />
                        <div
                            className="w-36 h-36 rounded-[2rem] flex items-center justify-center outline outline-offset-4 outline-2 outline-white/5 bg-[#16161A] shadow-2xl transition-all duration-500 group-hover/avatar:rotate-2 group-hover/avatar:scale-105"
                            style={{
                                outlineColor: `${currentAvatarConfig.color}80`,
                                boxShadow: `0 20px 40px -10px ${currentAvatarConfig.color}40`
                            }}
                        >
                            <AvatarIcon size={64} style={{ color: currentAvatarConfig.color }} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-lg border-2 border-[#0F0F13] scale-0 opacity-0 group-hover/avatar:scale-100 group-hover/avatar:opacity-100 transition-all duration-300">
                            <Pencil size={18} />
                        </div>
                    </button>

                    {/* Identity & Actions */}
                    <div className="flex-1 text-center md:text-left flex flex-col gap-3 relative z-10">
                        {isEditingUsername ? (
                            <div className="flex justify-center md:justify-start items-center gap-3">
                                <input
                                    type="text"
                                    value={tempUsername}
                                    onChange={(e) => setTempUsername(e.target.value)}
                                    maxLength={25}
                                    className="bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-3xl font-black text-white focus:outline-none focus:border-white w-[250px] font-display shadow-inner"
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
                                />
                                <button
                                    onClick={handleSaveUsername}
                                    className="p-4 bg-white text-black rounded-2xl hover:bg-gray-200 transition-colors shadow-lg"
                                >
                                    <Check size={20} className="stroke-[3]" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center md:justify-start items-baseline gap-4 group/title select-none">
                                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 font-display">
                                    {profile.username}
                                </h1>
                                <button
                                    onClick={() => setIsEditingUsername(true)}
                                    className="opacity-0 group-hover/title:opacity-100 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all transform hover:scale-110"
                                >
                                    <Pencil size={16} />
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-5 text-sm font-medium text-white/60">
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentAvatarConfig.color }} />
                                {personality.label}
                            </span>
                            <span className="flex items-center gap-2">
                                <Eye size={16} className="text-purple" />
                                <span className="text-white font-bold">{watched.length}</span> izlendi
                            </span>
                            <span className="flex items-center gap-2">
                                <Star size={16} className="text-[#F59E0B]" />
                                <span className="text-white font-bold">{ratings.length}</span> oy
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center gap-3 relative z-10 shrink-0">
                        <button
                            onClick={() => setShowShareCard(true)}
                            disabled={watched.length === 0}
                            className="bg-white text-black px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            <Camera size={18} className="stroke-[2.5]" />
                            <span>Sosyalde Paylaş</span>
                        </button>
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="bg-[#16161A] border border-white/5 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#1E1E24] hover:border-white/10 transition-all w-full sm:w-auto text-white/70 hover:text-white"
                        >
                            <Settings size={18} />
                            <span>Hesap Ayarları</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* PRIME STATS CARD */}
            {/* ========================================== */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatCard icon={Film} label="İzlenen Film" value={totalMovies} color="#7B5CF0" loading={loading} />
                <StatCard icon={Tv2} label="İzlenen Dizi" value={totalSeries} color="#22C55E" loading={loading} />
                <StatCard icon={Clock} label="Harcanan Saat" value={detailsLoading ? "..." : runtimeHours} color="#3B82F6" loading={detailsLoading} />
                <StatCard icon={Star} label="Ortalama Puan" value={avgRating > 0 ? avgRating.toFixed(1) : "—"} color="#F59E0B" loading={false} />
            </section>

            {/* ========================================== */}
            {/* DISCOVERY & TASTE */}
            {/* ========================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">

                {/* Son Trendler (Gen/Taste) */}
                <div className="lg:col-span-5 rounded-[2rem] bg-[#0F0F13] border border-white/5 p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-display font-black text-white flex items-center gap-3">
                                <BarChart3 size={20} className="text-purple" />
                                Sinema Zevkin
                            </h2>
                            <p className="text-sm text-white/40 mt-1">Son izlenenlere göre analizin</p>
                        </div>
                    </div>

                    {detailsLoading ? (
                        <div className="space-y-5 flex-1 justify-center flex flex-col">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
                                    <div className="flex-1 h-3 bg-white/5 rounded-full animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : topGenres.length > 0 ? (
                        <div className="space-y-4 flex-1">
                            {topGenres.slice(0, 5).map((genre, index) => {
                                const maxValue = topGenres[0]?.value || 1;
                                const percentage = (genre.value / maxValue) * 100;
                                const colors = ["#7B5CF0", "#3B82F6", "#22C55E", "#F59E0B", "#EC4899"];
                                const color = colors[index % colors.length];

                                return (
                                    <div key={genre.name} className="group flex items-center gap-4">
                                        <span className="text-sm font-semibold text-white/60 w-24 truncate text-right group-hover:text-white transition-colors">{genre.name}</span>
                                        <div className="flex-1 h-3 bg-[#16161A] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out break-all"
                                                style={{ width: `${percentage}%`, backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-center py-6">
                            <Clapperboard size={36} className="mb-4 opacity-50" />
                            <p className="text-sm font-medium">Burası biraz sessiz.</p>
                            <p className="text-xs mt-1">İçerik izledikçe zevk analizin açılacak.</p>
                        </div>
                    )}
                </div>

                {/* Son İzlenenler Rafı */}
                <div className="lg:col-span-7 rounded-[2rem] bg-[#0F0F13] border border-white/5 p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-display font-black text-white flex items-center gap-3">
                                <TrendingUp size={20} className="text-green-500" />
                                Son İzlenenler
                            </h2>
                            <p className="text-sm text-white/40 mt-1">İzleme defterindeki son {recentWatched.length} yapım</p>
                        </div>
                        {watched.length > 8 && (
                            <Link href="/gecmis" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2">
                                Tümünü Gör <ChevronRight size={14} />
                            </Link>
                        )}
                    </div>

                    {recentWatched.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                            {recentWatched.map((item) => (
                                <Link
                                    key={`${item.type}-${item.id}`}
                                    href={`/${item.type === "film" ? "film" : "dizi"}/${item.id}`}
                                    className="group flex flex-col aspcet-poster relative overflow-hidden rounded-xl border border-white/5 hover:border-white/20 transition-all duration-300"
                                >
                                    <div className="relative aspect-[2/3] w-full bg-[#16161A]">
                                        {item.posterPath ? (
                                            <Image
                                                src={item.posterPath.startsWith("http") ? item.posterPath : posterUrl(item.posterPath)}
                                                alt={item.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                sizes="(max-width: 768px) 25vw, 15vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-white/20">
                                                <Film size={24} />
                                            </div>
                                        )}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-xs font-bold text-white line-clamp-2 leading-tight">
                                                {item.title}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-center py-6 border-2 border-dashed border-white/5 rounded-2xl">
                            <Eye size={36} className="mb-4 opacity-50" />
                            <p className="text-sm font-medium">Bomboş bir sayfa.</p>
                            <Link href="/kesif" className="text-purple hover:underline mt-2 text-sm font-semibold">Keşfe çıkmaya ne dersin?</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================== */}
            {/* AVATAR SELECTION MODAL */}
            {/* ========================================== */}
            <Modal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} title="Profil Karakteri Seç">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-2">
                    {AVATAR_ICONS.map(({ name, icon: IconComponent, color }) => (
                        <button
                            key={name}
                            onClick={() => handleSelectAvatar(name)}
                            className={`w-full aspect-square flex items-center justify-center rounded-[1.25rem] transition-all duration-300 ${profile.avatar === name
                                ? "bg-white border-2 border-white scale-110 shadow-lg z-10"
                                : "bg-[#16161A] border border-white/5 hover:bg-[#1E1E24] hover:scale-105 hover:border-white/20"
                                }`}
                        >
                            <IconComponent size={32} style={{ color: profile.avatar === name ? '#000' : color }} />
                        </button>
                    ))}
                </div>
            </Modal>

            {/* ========================================== */}
            {/* SETTINGS MODAL */}
            {/* ========================================== */}
            <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Hesap Ayarları">
                <div className="space-y-3">
                    {/* Bildirimler */}
                    <div className="bg-[#16161A] border border-white/5 rounded-2xl p-5 hover:bg-[#1A1A1F] transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notifSettings.enabled ? 'bg-purple/20 text-purple' : 'bg-white/5 text-white/40'
                                    }`}>
                                    {notifSettings.enabled ? <Bell size={20} /> : <BellOff size={20} />}
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-white">İzleme Hatırlatıcısı</p>
                                    <p className="text-sm text-white/40">Günü kaçırma, dizilerini hatırla</p>
                                </div>
                            </div>
                            <ToggleSwitch enabled={notifSettings.enabled} onToggle={handleToggleNotifications} />
                        </div>

                        {notifSettings.enabled && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-white/70">
                                    <Clock size={16} />
                                    <span className="text-sm font-medium">Bildirim Saati</span>
                                </div>
                                <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl px-2 py-1">
                                    <select
                                        value={notifSettings.hour}
                                        onChange={(e) => handleTimeChange("hour", Number(e.target.value))}
                                        className="bg-transparent text-white focus:outline-none appearance-none cursor-pointer py-1 px-2 font-mono font-medium"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i} className="bg-[#16161A]">{String(i).padStart(2, "0")}</option>
                                        ))}
                                    </select>
                                    <span className="text-white/30 font-bold">:</span>
                                    <select
                                        value={notifSettings.minute}
                                        onChange={(e) => handleTimeChange("minute", Number(e.target.value))}
                                        className="bg-transparent text-white focus:outline-none appearance-none cursor-pointer py-1 px-2 font-mono font-medium"
                                    >
                                        {[0, 15, 30, 45].map(m => (
                                            <option key={m} value={m} className="bg-[#16161A]">{String(m).padStart(2, "0")}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Çıkış */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all text-left mt-6"
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/20 text-red-500">
                            <LogOut size={20} />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-red-400">Hesaptan Çıkış Yap</p>
                            <p className="text-sm text-red-400/60">Tarikata kısa bir mola ver</p>
                        </div>
                    </button>
                    <p className="text-xs text-center text-white/30 pt-4">Bu, hesabınızdaki hiçbir veriyi silmez.</p>
                </div>
            </Modal>

            {/* Share Card Modal */}
            <ShareCardModal
                isOpen={showShareCard}
                onClose={() => setShowShareCard(false)}
                username={profile.username || ""}
                topPosters={topPosters}
                stats={{
                    totalMovies,
                    totalSeries,
                    totalHours: runtimeHours,
                    personalityEmoji: "",
                    personalityLabel: personality.label,
                }}
            />
        </div>
    );
}
