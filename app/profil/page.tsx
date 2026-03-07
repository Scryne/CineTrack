"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
    getWatched,
    getAllWatchedEpisodes,
    getAllRatings,
    getUserProfile,
    saveUserProfile,
    saveNotificationSettings,
    getNotificationSettings,
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
import { cn } from "@/lib/utils";

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

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }): React.ReactElement {
    return (
        <button
            onClick={onToggle}
            className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200", enabled ? "bg-purple-500" : "bg-white/10")}
        >
            <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200", enabled ? "translate-x-6" : "translate-x-1")} />
        </button>
    );
}

function AnimatedCounter({ value, suffix = "", className = "" }: { value: number | string; suffix?: string; className?: string }): React.ReactElement {
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
            if (current >= numValue) { setDisplayValue(numValue); clearInterval(timer); }
            else { setDisplayValue(Math.floor(current)); }
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
}): React.ReactElement {
    return (
        <div className="relative overflow-hidden rounded-xl bg-raised border border-border-dim p-5 hover:border-border-bright transition-all group">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-opacity blur-xl" style={{ backgroundColor: color }} />
            <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={16} style={{ color }} />
                </div>
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-[1.5px]">{label}</p>
            </div>
            <p className="text-3xl font-display font-bold relative z-10" style={{ color }}>
                {loading ? <span className="inline-block w-16 h-7 skeleton rounded" /> : <AnimatedCounter value={value} />}
            </p>
        </div>
    );
}

export default function ProfilPage(): React.ReactElement {
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
        enabled: false, hour: 20, minute: 0, lastCheckedDate: "",
    });

    useEffect(() => {
        document.title = "Profilim - CineTrack";

        const loadProfileData = async (): Promise<void> => {
            try {
                const userProfile = await getUserProfile();
                if (userProfile) {
                    if (!AVATAR_ICONS.find(a => a.name === userProfile.avatar)) userProfile.avatar = "User";
                    setProfile(userProfile);
                    setTempUsername(userProfile.username || "");
                }
                const watchedItems = await getWatched();
                const allRatings = await getAllRatings();
                setWatched(watchedItems);
                setRatings(allRatings);

                const allEpisodes = await getAllWatchedEpisodes();
                setTotalEpisodes(allEpisodes.length);
                setTopPosters(watchedItems.slice(0, 4).map(w => posterUrl(w.posterPath)));
            } catch (error) {
                logger.error("Profil verileri yuklenirken hata:", error);
            } finally {
                setLoading(false);
            }
        };
        loadProfileData();

        getNotificationSettings().then((saved) => {
            setNotifSettings(saved);
        }).catch(() => {
            setNotifSettings({ enabled: false, hour: 20, minute: 0, lastCheckedDate: "" });
        });
    }, []);

    const fetchRecentTrends = useCallback(async (): Promise<void> => {
        if (watched.length === 0) { setDetailsLoading(false); return; }
        setDetailsLoading(true);
        const genreCounter = new Map<string, number>();
        let runtime = 0;
        const recentItems = watched.slice(0, 20);
        const batchSize = 5;
        for (let i = 0; i < recentItems.length; i += batchSize) {
            const batch = recentItems.slice(i, i + batchSize);
            const promises = batch.map(async (item) => {
                try {
                    if (item.type === "film") {
                        const detail = await getMovieDetail(item.id);
                        if (detail) {
                            if (detail.runtime) runtime += detail.runtime;
                            detail.genres?.forEach(g => { genreCounter.set(g.name, (genreCounter.get(g.name) || 0) + 1); });
                        }
                    } else {
                        const detail = await getSeriesDetail(item.id);
                        if (detail) {
                            detail.genres?.forEach(g => { genreCounter.set(g.name, (genreCounter.get(g.name) || 0) + 1); });
                        }
                    }
                } catch { /* ignore */ }
            });
            await Promise.all(promises);
        }
        const moviesCount = watched.filter(w => w.type === 'film').length;
        const approxMovieTime = (moviesCount > 0 && recentItems.length > 0) ? (runtime / recentItems.length) * moviesCount : 0;
        const totalEpTime = totalEpisodes * AVG_EPISODE_MINUTES;
        setTotalRuntime(approxMovieTime + totalEpTime);

        const sortedGenres = Array.from(genreCounter.entries()).sort((a, b) => b[1] - a[1]);
        setTopGenres(sortedGenres.map(([name, value]) => ({ name, value })));
        setDetailsLoading(false);
    }, [watched, totalEpisodes]);

    useEffect(() => {
        if (!loading && watched.length > 0) fetchRecentTrends();
        else if (!loading) setDetailsLoading(false);
    }, [loading, watched, fetchRecentTrends]);

    const handleSaveUsername = async (): Promise<void> => {
        const trimmed = tempUsername.trim();
        if (trimmed) {
            const updated = { ...profile, username: trimmed };
            setProfile(updated);
            await saveUserProfile(updated);
            toast.success("Kullanici adi guncellendi.");
        }
        else { setTempUsername(profile.username || ""); }
        setIsEditingUsername(false);
    };

    const handleSelectAvatar = async (iconName: string): Promise<void> => {
        const updated = { ...profile, avatar: iconName };
        setProfile(updated);
        await saveUserProfile(updated);
        setShowAvatarModal(false);
        toast.success("Avatar guncellendi.");
    };

    const handleToggleNotifications = async (): Promise<void> => {
        const newEnabled = !notifSettings.enabled;
        if (newEnabled) {
            const granted = await requestNotificationPermission();
            if (!granted) { alert("Bildirim izni verilmedi."); return; }
            const timeStr = `${String(notifSettings.hour).padStart(2, '0')}:${String(notifSettings.minute).padStart(2, '0')}`;
            await scheduleDailyNotification(timeStr);
        } else { await cancelScheduledNotifications(); }
        const updated = { ...notifSettings, enabled: newEnabled };
        setNotifSettings(updated);
        saveNotificationSettings(updated);
    };

    const handleTimeChange = async (field: "hour" | "minute", value: number): Promise<void> => {
        const updated = { ...notifSettings, [field]: value };
        setNotifSettings(updated);
        saveNotificationSettings(updated);
        if (updated.enabled) {
            const timeStr = `${String(updated.hour).padStart(2, '0')}:${String(updated.minute).padStart(2, '0')}`;
            await cancelScheduledNotifications();
            await scheduleDailyNotification(timeStr);
        }
    };

    const handleLogout = async (): Promise<void> => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/auth");
        router.refresh();
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
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-[1200px] mx-auto pb-24 px-16 max-lg:px-6 max-md:px-4 pt-12 relative"
        >
            {/* ==========================================
                PROFILE HEAD
                ========================================== */}
            <section className="relative overflow-hidden rounded-2xl bg-raised border border-border-dim mb-8">
                <div className="absolute inset-x-0 h-32 opacity-30" style={{ background: `linear-gradient(to bottom, ${currentAvatarConfig.color}30, transparent)` }} />

                <div className="relative p-8 sm:p-10 pb-8 flex flex-col md:flex-row items-center md:items-end gap-8">
                    {/* Avatar */}
                    <button
                        onClick={() => setShowAvatarModal(true)}
                        className="relative shrink-0 group/avatar z-10"
                    >
                        <div
                            className="w-28 h-28 rounded-2xl flex items-center justify-center bg-overlay border-2 transition-all duration-300 group-hover/avatar:scale-105"
                            style={{ borderColor: `${currentAvatarConfig.color}50`, boxShadow: `0 12px 24px -6px ${currentAvatarConfig.color}30` }}
                        >
                            <AvatarIcon size={48} style={{ color: currentAvatarConfig.color }} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-all">
                            <Pencil size={14} />
                        </div>
                    </button>

                    {/* Identity */}
                    <div className="flex-1 text-center md:text-left flex flex-col gap-2 relative z-10">
                        {isEditingUsername ? (
                            <div className="flex justify-center md:justify-start items-center gap-2">
                                <input
                                    type="text" value={tempUsername}
                                    onChange={(e) => setTempUsername(e.target.value)} maxLength={25}
                                    className="bg-overlay border border-border-mid rounded-xl px-4 py-2 text-[22px] font-display font-bold text-white focus:outline-none focus:border-purple-500 w-[240px]"
                                    autoFocus onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
                                />
                                <button onClick={handleSaveUsername} className="p-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors">
                                    <Check size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center md:justify-start items-baseline gap-3 group/title">
                                <h1 className="text-[28px] font-display font-bold text-white">{profile.username}</h1>
                                <button
                                    onClick={() => setIsEditingUsername(true)}
                                    className="opacity-0 group-hover/title:opacity-100 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all"
                                >
                                    <Pencil size={13} />
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[12px] text-text-muted">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-overlay border border-border-dim">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentAvatarConfig.color }} />
                                {personality.label}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Eye size={13} className="text-purple-400" />
                                <span className="text-white font-semibold">{watched.length}</span> izlendi
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Star size={13} className="text-warn" />
                                <span className="text-white font-semibold">{ratings.length}</span> oy
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row md:flex-col items-center gap-2 relative z-10 shrink-0">
                        <button
                            onClick={() => setShowShareCard(true)}
                            disabled={watched.length === 0}
                            className="bg-white text-black px-5 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-2 hover:bg-gray-100 transition-all disabled:opacity-40"
                        >
                            <Camera size={15} /> Paylas
                        </button>
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="bg-overlay border border-border-dim px-5 py-2.5 rounded-xl text-[13px] font-medium flex items-center gap-2 hover:border-border-bright transition-all text-text-sec hover:text-white"
                        >
                            <Settings size={15} /> Ayarlar
                        </button>
                    </div>
                </div>
            </section>

            {/* ==========================================
                STATS
                ========================================== */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                <StatCard icon={Film} label="Izlenen Film" value={totalMovies} color="#7B5CF0" loading={loading} />
                <StatCard icon={Tv2} label="Izlenen Dizi" value={totalSeries} color="#22C55E" loading={loading} />
                <StatCard icon={Clock} label="Harcanan Saat" value={detailsLoading ? "..." : runtimeHours} color="#3B82F6" loading={detailsLoading} />
                <StatCard icon={Star} label="Ortalama Puan" value={avgRating > 0 ? avgRating.toFixed(1) : "—"} color="#F59E0B" loading={false} />
            </section>

            {/* ==========================================
                TASTE & RECENT
                ========================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
                {/* Genre taste */}
                <div className="lg:col-span-5 rounded-xl bg-raised border border-border-dim p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                                <BarChart3 size={16} className="text-purple-400" />
                                Sinema Zevkin
                            </h2>
                            <p className="text-[11px] text-text-dim mt-0.5">Son izlenenlere gore</p>
                        </div>
                    </div>

                    {detailsLoading ? (
                        <div className="space-y-4 flex-1 flex flex-col justify-center">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-20 h-3 skeleton rounded" />
                                    <div className="flex-1 h-2 skeleton rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : topGenres.length > 0 ? (
                        <div className="space-y-3 flex-1">
                            {topGenres.slice(0, 5).map((genre, index) => {
                                const maxValue = topGenres[0]?.value || 1;
                                const percentage = (genre.value / maxValue) * 100;
                                const colors = ["#7B5CF0", "#3B82F6", "#22C55E", "#F59E0B", "#EC4899"];
                                const color = colors[index % colors.length];
                                return (
                                    <div key={genre.name} className="group flex items-center gap-3">
                                        <span className="text-[12px] font-medium text-text-sec w-20 truncate text-right group-hover:text-white transition-colors">{genre.name}</span>
                                        <div className="flex-1 h-2 bg-overlay rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, backgroundColor: color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-center py-6">
                            <Clapperboard size={28} className="mb-3 opacity-40" />
                            <p className="text-[12px]">Icerik izledikce zevk analizin acilacak.</p>
                        </div>
                    )}
                </div>

                {/* Recent watched */}
                <div className="lg:col-span-7 rounded-xl bg-raised border border-border-dim p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                                <TrendingUp size={16} className="text-ok" />
                                Son Izlenenler
                            </h2>
                            <p className="text-[11px] text-text-dim mt-0.5">{recentWatched.length} yapim</p>
                        </div>
                        {watched.length > 8 && (
                            <Link href="/gecmis" className="px-3 py-1.5 bg-overlay hover:bg-subtle rounded-lg text-[11px] font-medium text-text-sec hover:text-white transition-colors flex items-center gap-1">
                                Tumunu Gor <ChevronRight size={12} />
                            </Link>
                        )}
                    </div>

                    {recentWatched.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                            {recentWatched.map((item) => (
                                <Link key={`${item.type}-${item.id}`} href={`/${item.type === "film" ? "film" : "dizi"}/${item.id}`} className="group">
                                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-overlay border border-border-dim hover:border-border-bright transition-all">
                                        {item.posterPath ? (
                                            <Image
                                                src={item.posterPath.startsWith("http") ? item.posterPath : posterUrl(item.posterPath)}
                                                alt={item.title} fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                sizes="(max-width: 768px) 25vw, 15vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-text-muted"><Film size={20} /></div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                            <p className="text-[10px] font-medium text-white line-clamp-2 leading-tight">{item.title}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-center py-6 border border-dashed border-border-dim rounded-xl">
                            <Eye size={28} className="mb-3 opacity-40" />
                            <Link href="/kesif" className="text-purple-400 hover:underline text-[12px] font-medium">Kesfet</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* ==========================================
                MODALS
                ========================================== */}
            <Modal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} title="Profil Karakteri Sec">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-1">
                    {AVATAR_ICONS.map(({ name, icon: IconComponent, color }) => (
                        <button
                            key={name}
                            onClick={() => handleSelectAvatar(name)}
                            className={cn(
                                "w-full aspect-square flex items-center justify-center rounded-xl transition-all duration-200",
                                profile.avatar === name
                                    ? "bg-white border-2 border-white scale-105 shadow-lg"
                                    : "bg-overlay border border-border-dim hover:border-border-bright hover:scale-105"
                            )}
                        >
                            <IconComponent size={28} style={{ color: profile.avatar === name ? '#000' : color }} />
                        </button>
                    ))}
                </div>
            </Modal>

            <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Hesap Ayarlari">
                <div className="space-y-3">
                    <div className="bg-overlay border border-border-dim rounded-xl p-4 hover:bg-subtle transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", notifSettings.enabled ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-text-muted')}>
                                    {notifSettings.enabled ? <Bell size={18} /> : <BellOff size={18} />}
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-white">Izleme Hatirlaticisi</p>
                                    <p className="text-[11px] text-text-dim">Gunu kacirma</p>
                                </div>
                            </div>
                            <ToggleSwitch enabled={notifSettings.enabled} onToggle={handleToggleNotifications} />
                        </div>

                        {notifSettings.enabled && (
                            <div className="mt-3 pt-3 border-t border-border-dim flex items-center justify-between">
                                <div className="flex items-center gap-2 text-text-sec text-[12px]">
                                    <Clock size={14} />
                                    <span>Bildirim Saati</span>
                                </div>
                                <div className="flex items-center gap-1 bg-overlay border border-border-dim rounded-lg px-2 py-1">
                                    <select
                                        value={notifSettings.hour}
                                        onChange={(e) => handleTimeChange("hour", Number(e.target.value))}
                                        className="bg-transparent text-white text-[12px] font-mono focus:outline-none appearance-none cursor-pointer px-1"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i} className="bg-[#16161A]">{String(i).padStart(2, "0")}</option>
                                        ))}
                                    </select>
                                    <span className="text-text-muted text-[10px]">:</span>
                                    <select
                                        value={notifSettings.minute}
                                        onChange={(e) => handleTimeChange("minute", Number(e.target.value))}
                                        className="bg-transparent text-white text-[12px] font-mono focus:outline-none appearance-none cursor-pointer px-1"
                                    >
                                        {[0, 15, 30, 45].map(m => (
                                            <option key={m} value={m} className="bg-[#16161A]">{String(m).padStart(2, "0")}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-err/10 border border-err/20 hover:bg-err/20 transition-all text-left mt-4"
                    >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-err/20 text-err">
                            <LogOut size={18} />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-err">Hesaptan Cikis Yap</p>
                            <p className="text-[11px] text-err/60">Bu hesaptaki hicbir veri silinmez</p>
                        </div>
                    </button>
                </div>
            </Modal>

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
        </motion.div>
    );
}
