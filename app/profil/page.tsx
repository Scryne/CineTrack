"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
    getWatched,
    getWatchedEpisodes,
    getAllRatings,
    getUserProfile,
    saveUserProfile,
    getNotificationSettings,
    saveNotificationSettings,
    STORAGE_KEYS,
} from "@/lib/storage";
import {
    getMovieDetail,
    getSeriesDetail,
    posterUrl,
} from "@/lib/tmdb";
import type { WatchedItem, RatingItem, UserProfile } from "@/types";
import type { NotificationSettings } from "@/lib/storage";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import ShareCardModal from "@/components/profil/ShareCardModal";
import {
    Pencil,
    Check,
    Bell,
    BellOff,
    Clock,
    Download,
    Trash2,
    Sparkles,
    Film,
    Tv2,
    Award,
    Users,
    User,
    Shield,
    Settings,
    Camera,
    Palette,
    Zap,
    Heart,
    Star,
    Flame,
    Globe,
    Music,
    Gamepad2,
    BookOpen,
    Coffee,
    Crown,
    Clapperboard,
    AlertTriangle,
} from "lucide-react";

// ==========================================
// Sabitler
// ==========================================
const AVG_EPISODE_MINUTES = 45;

// Avatar icon options (Lucide icon names)
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

// ==========================================
// Yardimci Fonksiyonlar
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
        return { label: "Aksiyon Tutkunu", description: "Adrenalin senin isin!" };
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
        return { label: "Bilgi Avcisi", description: "Ogrenmeyi seviyorsun." };
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
// Toggle Switch Component
// ==========================================

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${enabled ? "bg-purple" : "bg-[#2A2A35]"
                }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
    );
}

// ==========================================
// Ana Bilesen
// ==========================================

export default function ProfilPage() {
    const [profile, setProfile] = useState<UserProfile>({ username: "", avatar: "User" });
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [tempUsername, setTempUsername] = useState("");

    const [watched, setWatched] = useState<WatchedItem[]>([]);
    const [ratings, setRatings] = useState<RatingItem[]>([]);
    const [totalEpisodes, setTotalEpisodes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(true);

    // Stats
    const [totalRuntime, setTotalRuntime] = useState(0);
    const [topGenres, setTopGenres] = useState<{ name: string; value: number }[]>([]);
    const [topActor, setTopActor] = useState<{ name: string; count: number; profilePath: string | null } | null>(null);

    // Top 4 for Share Card
    const [topPosters, setTopPosters] = useState<string[]>([]);

    // Modals
    const [showShareCard, setShowShareCard] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // Notification settings
    const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
        enabled: false,
        hour: 9,
        minute: 0,
        lastCheckedDate: "",
    });

    // Initial load
    useEffect(() => {
        document.title = "Profilim - CineTrack";

        const userProfile = getUserProfile();
        // Migrate old emoji avatars to icon name
        if (!AVATAR_ICONS.find(a => a.name === userProfile.avatar)) {
            userProfile.avatar = "User";
        }
        setProfile(userProfile);
        setTempUsername(userProfile.username);

        const savedNotif = getNotificationSettings();
        setNotifSettings(savedNotif);

        const watchedItems = getWatched();
        const allRatings = getAllRatings();

        setWatched(watchedItems);
        setRatings(allRatings);

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
        setTopPosters(watchedItems.slice(0, 4).map(w => posterUrl(w.posterPath)));
        setLoading(false);
    }, []);

    const fetchDetails = useCallback(async () => {
        if (watched.length === 0) {
            setDetailsLoading(false);
            return;
        }

        setDetailsLoading(true);
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
                            if (detail.runtime) runtime += detail.runtime;
                            detail.genres.forEach(g => {
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
                            detail.genres.forEach(g => {
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

        runtime += totalEpisodes * AVG_EPISODE_MINUTES;
        setTotalRuntime(runtime);

        const sortedGenres = Array.from(genreCounter.entries())
            .sort((a, b) => b[1] - a[1]);
        setTopGenres(sortedGenres.map(([name, value]) => ({ name, value })));

        const sortedActors = Array.from(actorCounter.entries())
            .sort((a, b) => b[1].count - a[1].count);
        if (sortedActors.length > 0) {
            setTopActor({ name: sortedActors[0][0], ...sortedActors[0][1] });
        }

        setDetailsLoading(false);
    }, [watched, totalEpisodes]);

    useEffect(() => {
        if (!loading && watched.length > 0) {
            fetchDetails();
        } else if (!loading) {
            setDetailsLoading(false);
        }
    }, [loading, watched, fetchDetails]);

    // Profile updates
    const handleSaveUsername = () => {
        const trimmed = tempUsername.trim();
        if (trimmed) {
            const updated = { ...profile, username: trimmed };
            setProfile(updated);
            saveUserProfile(updated);
        } else {
            setTempUsername(profile.username);
        }
        setIsEditingUsername(false);
    };

    const handleSelectAvatar = (iconName: string) => {
        const updated = { ...profile, avatar: iconName };
        setProfile(updated);
        saveUserProfile(updated);
    };

    const handleToggleNotifications = () => {
        const updated = { ...notifSettings, enabled: !notifSettings.enabled };
        setNotifSettings(updated);
        saveNotificationSettings(updated);
    };

    const handleTimeChange = (field: "hour" | "minute", value: number) => {
        const updated = { ...notifSettings, [field]: value };
        setNotifSettings(updated);
        saveNotificationSettings(updated);
    };

    const handleExportData = () => {
        const keys = Object.values(STORAGE_KEYS);
        const data: Record<string, unknown> = {};
        keys.forEach(key => {
            try {
                const val = localStorage.getItem(key);
                if (val) data[key] = JSON.parse(val);
            } catch { /* skip */ }
        });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `cinetrack-export-${new Date().toISOString().slice(0, 10)}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleResetData = () => {
        const keys = Object.values(STORAGE_KEYS);
        keys.forEach(key => localStorage.removeItem(key));
        setShowResetModal(false);
        window.location.reload();
    };

    // Computations
    const totalMovies = watched.filter(w => w.type === "film").length;
    const totalSeries = watched.filter(w => w.type === "dizi").length;

    const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    const runtimeHours = Math.floor(totalRuntime / 60);

    const personality = getCinemaPersonality({
        totalMovies,
        totalSeries,
        totalEpisodes,
        avgRating,
        topGenres: topGenres.map(g => g.name),
        totalWatched: watched.length,
    });

    // Find current avatar icon
    const currentAvatarConfig = AVATAR_ICONS.find(a => a.name === profile.avatar) || AVATAR_ICONS[0];
    const AvatarIcon = currentAvatarConfig.icon;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-fade-in px-4">
            {/* Header / Profil Secimi */}
            <Card className="p-6 sm:p-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div
                            className="w-32 h-32 rounded-full flex items-center justify-center shadow-lg border-2 border-[#2A2A35] group-hover:border-purple/40 transition-colors"
                            style={{ backgroundColor: `${currentAvatarConfig.color}20` }}
                        >
                            <AvatarIcon size={56} style={{ color: currentAvatarConfig.color }} />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-6">
                        {/* Username */}
                        <div>
                            {isEditingUsername ? (
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <input
                                        type="text"
                                        value={tempUsername}
                                        onChange={(e) => setTempUsername(e.target.value)}
                                        maxLength={20}
                                        className="bg-[#0D0D0F] border border-[#2A2A35] rounded-lg px-4 py-2 text-2xl font-bold text-text-primary focus:outline-none focus:border-purple font-display"
                                        autoFocus
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
                                    />
                                    <button
                                        onClick={handleSaveUsername}
                                        className="p-2.5 bg-purple text-white rounded-lg hover:bg-purple-light transition-colors"
                                    >
                                        <Check size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <h1 className="text-4xl font-extrabold tracking-tight font-display">{profile.username}</h1>
                                    <button
                                        onClick={() => setIsEditingUsername(true)}
                                        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-[#1E1E24] transition-colors"
                                        title="Ismi Duzenle"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                </div>
                            )}
                            <p className="text-text-secondary mt-2 text-lg">CineTrack uyesi</p>
                        </div>

                        {/* Avatar Secici */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                <Palette size={14} />
                                Avatar Sec
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {AVATAR_ICONS.map(({ name, icon: IconComponent, color }) => (
                                    <button
                                        key={name}
                                        onClick={() => handleSelectAvatar(name)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${profile.avatar === name
                                            ? "bg-purple/20 border-2 border-purple scale-110 shadow-lg"
                                            : "bg-[#1E1E24] border border-transparent hover:bg-[#2A2A35] hover:scale-105"
                                            }`}
                                    >
                                        <IconComponent size={20} style={{ color }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                        <button
                            onClick={() => setShowShareCard(true)}
                            disabled={watched.length === 0}
                            className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/15 transition-all w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Camera size={18} />
                            <span>Profil Kartini Paylas</span>
                        </button>
                    </div>
                </div>
            </Card>

            {/* Sinema Kimligin & Istatistikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sol: Sinema Kimligi */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-dark via-purple to-purple-light p-8 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-white/80" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-white/80">
                                SINEMA KIMLIGIN
                            </h2>
                        </div>
                        <h3 className="text-4xl font-black mb-4 font-display">
                            {personality.label}
                        </h3>
                        <p className="text-sm text-white/70 mb-8 max-w-[80%] leading-relaxed">
                            {personality.description}
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                                    <Clock size={22} />
                                </div>
                                <div>
                                    <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-1">Hayatinin</p>
                                    <p className="text-xl font-bold">
                                        {detailsLoading ? "..." : <>{runtimeHours} saatini</>} sinemaya adadin
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                                    <Award size={22} />
                                </div>
                                <div>
                                    <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-1">En Cok Izledigin Tur</p>
                                    <p className="text-xl font-bold">
                                        {detailsLoading ? "..." : topGenres[0]?.name || "Belirsiz"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sag: Profil Istatistikleri */}
                <div className="space-y-6">
                    <Card className="p-6 sm:p-8 h-full flex flex-col justify-center gap-6">
                        <h2 className="text-xl font-display font-bold flex items-center gap-2">
                            <Award size={20} className="text-purple" />
                            Profil Istatistikleri
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#0D0D0F] p-4 rounded-xl border border-[#2A2A35]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Film size={14} className="text-purple" />
                                    <p className="text-xs text-text-secondary font-medium">Film</p>
                                </div>
                                <p className="text-2xl font-bold font-display">{totalMovies}</p>
                            </div>
                            <div className="bg-[#0D0D0F] p-4 rounded-xl border border-[#2A2A35]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Tv2 size={14} className="text-[#22C55E]" />
                                    <p className="text-xs text-text-secondary font-medium">Dizi</p>
                                </div>
                                <p className="text-2xl font-bold font-display">{totalSeries}</p>
                            </div>
                            <div className="bg-[#0D0D0F] p-4 rounded-xl border border-[#2A2A35]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Clock size={14} className="text-purple" />
                                    <p className="text-xs text-text-secondary font-medium">Toplam Saat</p>
                                </div>
                                <p className="text-2xl font-bold text-purple font-display">{detailsLoading ? "..." : runtimeHours}</p>
                            </div>
                            <div className="bg-[#0D0D0F] p-4 rounded-xl border border-[#2A2A35]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Star size={14} className="text-[#F59E0B]" />
                                    <p className="text-xs text-text-secondary font-medium">Puan Ortalamasi</p>
                                </div>
                                <p className="text-2xl font-bold text-[#F59E0B] font-display">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
                            </div>
                        </div>

                        {/* Top Actor */}
                        <div className="bg-[#0D0D0F] p-5 rounded-xl border border-[#2A2A35] flex items-center gap-4">
                            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#2A2A35] shrink-0 border-2 border-[#2A2A35]">
                                {topActor?.profilePath ? (
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w185${topActor.profilePath}`}
                                        alt={topActor.name}
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User size={24} className="text-text-secondary" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Users size={12} className="text-purple" />
                                    <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Ekranda En Cok Gordugn</p>
                                </div>
                                <p className="text-xl font-bold font-display">
                                    {detailsLoading ? "Yukleniyor..." : topActor?.name || "Belirsiz"}
                                </p>
                                {!detailsLoading && topActor && (
                                    <p className="text-sm text-text-secondary">{topActor.count} icerik</p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* ========================================== */}
            {/* AYARLAR */}
            {/* ========================================== */}
            <Card className="p-6 sm:p-8">
                <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
                    <Settings size={20} className="text-purple" />
                    Ayarlar
                </h2>

                <div className="space-y-6">
                    {/* Bildirimler */}
                    <div className="flex items-center justify-between py-3 border-b border-[#2A2A35]">
                        <div className="flex items-center gap-3">
                            {notifSettings.enabled ? (
                                <Bell size={18} className="text-purple" />
                            ) : (
                                <BellOff size={18} className="text-text-secondary" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-text-primary">Bildirimler</p>
                                <p className="text-xs text-text-secondary">Gunluk izleme hatirlaticisi</p>
                            </div>
                        </div>
                        <ToggleSwitch enabled={notifSettings.enabled} onToggle={handleToggleNotifications} />
                    </div>

                    {/* Bildirim Saati */}
                    {notifSettings.enabled && (
                        <div className="flex items-center justify-between py-3 border-b border-[#2A2A35]">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-purple" />
                                <div>
                                    <p className="text-sm font-medium text-text-primary">Bildirim Saati</p>
                                    <p className="text-xs text-text-secondary">Hangi saatte hatirlatilsin?</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <select
                                    value={notifSettings.hour}
                                    onChange={(e) => handleTimeChange("hour", Number(e.target.value))}
                                    className="bg-[#0D0D0F] border border-[#2A2A35] rounded-lg px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-purple appearance-none cursor-pointer"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                                    ))}
                                </select>
                                <span className="text-text-secondary font-bold">:</span>
                                <select
                                    value={notifSettings.minute}
                                    onChange={(e) => handleTimeChange("minute", Number(e.target.value))}
                                    className="bg-[#0D0D0F] border border-[#2A2A35] rounded-lg px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-purple appearance-none cursor-pointer"
                                >
                                    {[0, 15, 30, 45].map(m => (
                                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Veri Disa Aktar */}
                    <div className="flex items-center justify-between py-3 border-b border-[#2A2A35]">
                        <div className="flex items-center gap-3">
                            <Download size={18} className="text-purple" />
                            <div>
                                <p className="text-sm font-medium text-text-primary">Tum Veriyi Disa Aktar</p>
                                <p className="text-xs text-text-secondary">Verilerini JSON dosyasi olarak indir</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportData}
                            className="px-4 py-2 bg-[#1E1E24] border border-[#2A2A35] hover:border-purple text-sm text-text-primary rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                            <Download size={14} />
                            Indir
                        </button>
                    </div>

                    {/* Veriyi Sifirla */}
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <Trash2 size={18} className="text-red-500" />
                            <div>
                                <p className="text-sm font-medium text-red-400">Veriyi Sifirla</p>
                                <p className="text-xs text-text-secondary">Tum verilerini kalici olarak sil</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="px-4 py-2 bg-transparent border border-red-500/50 hover:bg-red-500/10 text-sm text-red-400 rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={14} />
                            Sifirla
                        </button>
                    </div>
                </div>
            </Card>

            {/* Sifirlama Onay Modali */}
            <Modal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                title="Veriyi Sifirla"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <AlertTriangle size={24} className="text-red-500 shrink-0" />
                        <p className="text-sm text-red-300">
                            Bu islem geri alinamaz! Tum izleme gecmisiniz, puanlariniz ve ayarlariniz kalici olarak silinecektir.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowResetModal(false)}
                            className="flex-1 py-3 bg-[#1E1E24] border border-[#2A2A35] text-text-primary rounded-xl font-medium hover:bg-[#2A2A35] transition-colors"
                        >
                            Vazgec
                        </button>
                        <button
                            onClick={handleResetData}
                            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} />
                            Evet, Sifirla
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Share Card Modal */}
            <ShareCardModal
                isOpen={showShareCard}
                onClose={() => setShowShareCard(false)}
                username={profile.username}
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
