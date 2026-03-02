// ==========================================
// CineTrack - localStorage CRUD İşlemleri
// ==========================================

import type { WatchlistItem, WatchedItem, WatchedEpisode, RatingItem, CustomList, TagItem } from "@/types";
import { toast } from "react-hot-toast";

// --- Storage Key'leri ---
const STORAGE_KEYS = {
    WATCHLIST: "cinetrack_watchlist",
    WATCHED: "cinetrack_watched",
    EPISODES: "cinetrack_episodes",
    RATINGS: "cinetrack_ratings",
    CUSTOM_LISTS: "cinetrack_custom_lists",
    TAGS: "cinetrack_tags",
    NOTIFICATION_SETTINGS: "cinetrack_notification_settings",
    PROFILE: "cinetrack_profile",
    PROGRESS: "cinetrack_progress",
} as const;

// --- Bildirim Ayarları Tipi ---
export interface NotificationSettings {
    enabled: boolean;
    hour: number; // 0-23
    minute: number; // 0-59
    lastCheckedDate: string; // ISO date string — son kontrol tarihi
}

// ==========================================
// Yardımcı Fonksiyonlar
// ==========================================

function getFromStorage<T>(key: string): T[] {
    if (typeof window === "undefined") return [];
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveToStorage<T>(key: string, data: T[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/** Storage'ın boyutunu KB cinsinden döndürür */
export function getStorageSize(): number {
    if (typeof window === "undefined") return 0;
    let total = 0;
    for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key) && key.startsWith("cinetrack_")) {
            total += (localStorage.getItem(key)?.length || 0);
        }
    }
    // UTF-16 karakterler 2 byte kaplar
    return Math.round((total * 2) / 1024);
}

/** Eski watch progress kayıtlarını siler (kota yönetimi) */
export function pruneOldProgress(): void {
    const list = getFromStorage<WatchProgress>(STORAGE_KEYS.PROGRESS);
    if (list.length > 50) {
        // En güncel olanlar başta olacak şekilde sırala
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        // En eski 20 tanesini silip en güncel 30 tanesini tut
        const pruned = list.slice(0, 30);
        saveToStorage(STORAGE_KEYS.PROGRESS, pruned);
    }
}

// ==========================================
// 1. Watchlist (İzleme Listesi)
// ==========================================

/** İzleme listesine öğe ekler */
export function addToWatchlist(item: WatchlistItem): void {
    const list = getFromStorage<WatchlistItem>(STORAGE_KEYS.WATCHLIST);
    // Aynı öğe zaten varsa ekleme
    const exists = list.some((i) => i.id === item.id && i.type === item.type);
    if (!exists) {
        list.push(item);
        saveToStorage(STORAGE_KEYS.WATCHLIST, list);
        window.dispatchEvent(new Event("storage"));
        toast.success("Listeye eklendi!");
    } else {
        toast("Zaten listede var.");
    }
}

/** İzleme listesinden öğe kaldırır */
export function removeFromWatchlist(
    id: string,
    type: "film" | "dizi"
): void {
    const list = getFromStorage<WatchlistItem>(STORAGE_KEYS.WATCHLIST);
    const filtered = list.filter((i) => !(i.id === id && i.type === type));
    saveToStorage(STORAGE_KEYS.WATCHLIST, filtered);
    window.dispatchEvent(new Event("storage"));
    toast("Listeden çıkarıldı.");
}

/** Tüm izleme listesini döndürür */
export function getWatchlist(): WatchlistItem[] {
    return getFromStorage<WatchlistItem>(STORAGE_KEYS.WATCHLIST);
}

/** Öğenin izleme listesinde olup olmadığını kontrol eder */
export function isInWatchlist(id: string, type: "film" | "dizi"): boolean {
    const list = getFromStorage<WatchlistItem>(STORAGE_KEYS.WATCHLIST);
    return list.some((i) => i.id === id && i.type === type);
}

// ==========================================
// 2. İzlenenler
// ==========================================

/** Öğeyi izlendi olarak işaretler */
export function markAsWatched(item: WatchedItem): void {
    const list = getFromStorage<WatchedItem>(STORAGE_KEYS.WATCHED);
    // Aynı öğe zaten varsa ekleme
    const exists = list.some((i) => i.id === item.id && i.type === item.type);
    if (!exists) {
        list.push(item);
        saveToStorage(STORAGE_KEYS.WATCHED, list);
        window.dispatchEvent(new Event("storage"));
        toast.success("İzlenenlere eklendi!");
    }
}

/** Öğeyi izlenenlerden kaldırır */
export function removeFromWatched(
    id: string,
    type: "film" | "dizi"
): void {
    const list = getFromStorage<WatchedItem>(STORAGE_KEYS.WATCHED);
    const filtered = list.filter((i) => !(i.id === id && i.type === type));
    saveToStorage(STORAGE_KEYS.WATCHED, filtered);
    window.dispatchEvent(new Event("storage"));
    toast("İzlenenlerden çıkarıldı.");
}

/** Tüm izlenenleri döndürür */
export function getWatched(): WatchedItem[] {
    return getFromStorage<WatchedItem>(STORAGE_KEYS.WATCHED);
}

/** Öğenin izlenip izlenmediğini kontrol eder */
export function isWatched(id: string, type: "film" | "dizi"): boolean {
    const list = getFromStorage<WatchedItem>(STORAGE_KEYS.WATCHED);
    return list.some((i) => i.id === id && i.type === type);
}

// ==========================================
// 3. Bölüm Takibi (Sadece Diziler)
// ==========================================

/** Bir bölümü izlendi olarak işaretler */
export function markEpisodeWatched(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number
): void {
    const list = getFromStorage<WatchedEpisode>(STORAGE_KEYS.EPISODES);
    const exists = list.some(
        (e) =>
            e.seriesId === seriesId &&
            e.seasonNumber === seasonNumber &&
            e.episodeNumber === episodeNumber
    );
    if (!exists) {
        list.push({
            seriesId,
            seasonNumber,
            episodeNumber,
            watchedAt: new Date().toISOString(),
        });
        saveToStorage(STORAGE_KEYS.EPISODES, list);
        window.dispatchEvent(new Event("storage"));
        toast.success("Bölüm izlendi olarak işaretlendi!");
    }
}

/** Bir bölümün izlendi işaretini kaldırır */
export function unmarkEpisodeWatched(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number
): void {
    const list = getFromStorage<WatchedEpisode>(STORAGE_KEYS.EPISODES);
    const filtered = list.filter(
        (e) =>
            !(
                e.seriesId === seriesId &&
                e.seasonNumber === seasonNumber &&
                e.episodeNumber === episodeNumber
            )
    );
    saveToStorage(STORAGE_KEYS.EPISODES, filtered);
}

/** Tüm izlenen bölümleri döndürür */
export function getAllWatchedEpisodes(): WatchedEpisode[] {
    return getFromStorage<WatchedEpisode>(STORAGE_KEYS.EPISODES);
}

/** Bir dizinin tüm izlenen bölümlerini döndürür */
export function getWatchedEpisodes(seriesId: string): WatchedEpisode[] {
    const list = getFromStorage<WatchedEpisode>(STORAGE_KEYS.EPISODES);
    return list.filter((e) => e.seriesId === seriesId);
}

/** Bir bölümün izlenip izlenmediğini kontrol eder */
export function isEpisodeWatched(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number
): boolean {
    const list = getFromStorage<WatchedEpisode>(STORAGE_KEYS.EPISODES);
    return list.some(
        (e) =>
            e.seriesId === seriesId &&
            e.seasonNumber === seasonNumber &&
            e.episodeNumber === episodeNumber
    );
}

/** Bir dizinin izlenme yüzdesini hesaplar */
export function getProgressPercent(
    seriesId: string,
    totalEpisodes: number
): number {
    if (totalEpisodes <= 0) return 0;
    const watched = getWatchedEpisodes(seriesId);
    const percent = (watched.length / totalEpisodes) * 100;
    return Math.min(Math.round(percent), 100);
}

/** Bir dizinin tüm bölümlerini toplu olarak izlendi işaretler */
export function markAllEpisodesWatched(
    seriesId: string,
    seasons: { seasonNumber: number; episodeCount: number }[]
): void {
    const list = getFromStorage<WatchedEpisode>(STORAGE_KEYS.EPISODES);
    let added = 0;
    for (const season of seasons) {
        if (season.seasonNumber === 0) continue; // Özel bölümleri atla
        for (let ep = 1; ep <= season.episodeCount; ep++) {
            const exists = list.some(
                (e) =>
                    e.seriesId === seriesId &&
                    e.seasonNumber === season.seasonNumber &&
                    e.episodeNumber === ep
            );
            if (!exists) {
                list.push({
                    seriesId,
                    seasonNumber: season.seasonNumber,
                    episodeNumber: ep,
                    watchedAt: new Date().toISOString(),
                });
                added++;
            }
        }
    }
    if (added > 0) {
        saveToStorage(STORAGE_KEYS.EPISODES, list);
        window.dispatchEvent(new Event("storage"));
    }
}

/** Bir dizinin tüm izlenen bölümlerini kaldırır */
export function removeAllEpisodesWatched(seriesId: string): void {
    const list = getFromStorage<WatchedEpisode>(STORAGE_KEYS.EPISODES);
    const filtered = list.filter((e) => e.seriesId !== seriesId);
    saveToStorage(STORAGE_KEYS.EPISODES, filtered);
    window.dispatchEvent(new Event("storage"));
}

// ==========================================
// 4. Kişisel Puanlama
// ==========================================

import type { WatchProgress } from '@/types/player';

export function getWatchProgress(tmdbId: string, type: 'film' | 'dizi'): WatchProgress | null {
    const list = getFromStorage<WatchProgress>(STORAGE_KEYS.PROGRESS);
    const found = list.find((i) => i.tmdbId === tmdbId && i.type === type);
    return found ? found : null;
}

export function saveWatchProgress(progress: WatchProgress): void {
    pruneOldProgress(); // Kota yönetimi
    const list = getFromStorage<WatchProgress>(STORAGE_KEYS.PROGRESS);
    const idx = list.findIndex((i) => i.tmdbId === progress.tmdbId && i.type === progress.type);
    if (idx >= 0) {
        list[idx] = progress;
    } else {
        list.push(progress);
    }
    saveToStorage(STORAGE_KEYS.PROGRESS, list);
}

export function getAllProgress(): WatchProgress[] {
    const list = getFromStorage<WatchProgress>(STORAGE_KEYS.PROGRESS);
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function removeProgress(tmdbId: string, type: 'film' | 'dizi'): void {
    const list = getFromStorage<WatchProgress>(STORAGE_KEYS.PROGRESS);
    const filtered = list.filter((i) => !(i.tmdbId === tmdbId && i.type === type));
    saveToStorage(STORAGE_KEYS.PROGRESS, filtered);
}

export function clearAllProgress(): void {
    saveToStorage(STORAGE_KEYS.PROGRESS, []);
}

export function getRecentlyWatched(limit: number): WatchProgress[] {
    const list = getAllProgress();
    return list.slice(0, limit);
}

/** Puan ekler veya günceller */
export function addRating(
    id: string,
    type: "film" | "dizi",
    rating: number,
    title: string,
    posterPath: string
): void {
    const list = getFromStorage<RatingItem>(STORAGE_KEYS.RATINGS);
    const idx = list.findIndex((i) => i.id === id && i.type === type);
    const item: RatingItem = {
        id,
        type,
        title,
        posterPath,
        rating,
        ratedAt: new Date().toISOString(),
    };
    if (idx >= 0) {
        list[idx] = item;
    } else {
        list.push(item);
    }
    saveToStorage(STORAGE_KEYS.RATINGS, list);
    window.dispatchEvent(new Event("storage"));
    toast.success("Puanınız kaydedildi!");
}

/** Belirli bir öğenin puanını döndürür */
export function getRating(id: string, type: "film" | "dizi"): number | null {
    const list = getFromStorage<RatingItem>(STORAGE_KEYS.RATINGS);
    const found = list.find((i) => i.id === id && i.type === type);
    return found ? found.rating : null;
}

/** Tüm puanlamaları döndürür */
export function getAllRatings(): RatingItem[] {
    return getFromStorage<RatingItem>(STORAGE_KEYS.RATINGS);
}

/** Puanlamayı kaldırır */
export function removeRating(id: string, type: "film" | "dizi"): void {
    const list = getFromStorage<RatingItem>(STORAGE_KEYS.RATINGS);
    const filtered = list.filter((i) => !(i.id === id && i.type === type));
    saveToStorage(STORAGE_KEYS.RATINGS, filtered);
}

// ==========================================
// 5. Özel Listeler
// ==========================================

const LIST_COLORS = ["#e50914", "#1db954", "#f5c518", "#0077b5", "#e040fb", "#ff6d00", "#00bcd4", "#8d6e63"];

/** Yeni özel liste oluşturur */
export function createCustomList(name: string, description?: string, color?: string): CustomList {
    const lists = getFromStorage<CustomList>(STORAGE_KEYS.CUSTOM_LISTS);
    const newList: CustomList = {
        id: generateId(),
        name,
        description: description || "",
        items: [],
        createdAt: new Date().toISOString(),
        color: color || LIST_COLORS[lists.length % LIST_COLORS.length],
    };
    lists.push(newList);
    saveToStorage(STORAGE_KEYS.CUSTOM_LISTS, lists);
    return newList;
}

/** Özel listeyi siler */
export function deleteCustomList(listId: string): void {
    const lists = getFromStorage<CustomList>(STORAGE_KEYS.CUSTOM_LISTS);
    const filtered = lists.filter((l) => l.id !== listId);
    saveToStorage(STORAGE_KEYS.CUSTOM_LISTS, filtered);
}

/** Özel listeyi günceller */
export function updateCustomList(listId: string, name: string, description: string, color: string): void {
    const lists = getFromStorage<CustomList>(STORAGE_KEYS.CUSTOM_LISTS);
    const idx = lists.findIndex((l) => l.id === listId);
    if (idx >= 0) {
        lists[idx] = { ...lists[idx], name, description, color };
        saveToStorage(STORAGE_KEYS.CUSTOM_LISTS, lists);
    }
}

/** Özel listeye öğe ekler */
export function addToCustomList(listId: string, item: WatchlistItem): void {
    const lists = getFromStorage<CustomList>(STORAGE_KEYS.CUSTOM_LISTS);
    const idx = lists.findIndex((l) => l.id === listId);
    if (idx >= 0) {
        const exists = lists[idx].items.some((i) => i.id === item.id && i.type === item.type);
        if (!exists) {
            lists[idx].items.push(item);
            saveToStorage(STORAGE_KEYS.CUSTOM_LISTS, lists);
        }
    }
}

/** Özel listeden öğe kaldırır */
export function removeFromCustomList(listId: string, itemId: string): void {
    const lists = getFromStorage<CustomList>(STORAGE_KEYS.CUSTOM_LISTS);
    const idx = lists.findIndex((l) => l.id === listId);
    if (idx >= 0) {
        lists[idx].items = lists[idx].items.filter((i) => i.id !== itemId);
        saveToStorage(STORAGE_KEYS.CUSTOM_LISTS, lists);
    }
}

/** Tüm özel listeleri döndürür */
export function getCustomLists(): CustomList[] {
    return getFromStorage<CustomList>(STORAGE_KEYS.CUSTOM_LISTS);
}

/** Belirli bir özel listeyi döndürür */
export function getCustomList(listId: string): CustomList | null {
    const lists = getFromStorage<CustomList>(STORAGE_KEYS.CUSTOM_LISTS);
    return lists.find((l) => l.id === listId) || null;
}

// ==========================================
// 6. Etiketler
// ==========================================

/** Öğeye etiket ekler */
export function addTag(id: string, type: "film" | "dizi", tag: string): void {
    const list = getFromStorage<TagItem>(STORAGE_KEYS.TAGS);
    const idx = list.findIndex((t) => t.id === id && t.type === type);
    const normalized = tag.trim().toLowerCase();
    if (!normalized) return;
    if (idx >= 0) {
        if (!list[idx].tags.includes(normalized)) {
            list[idx].tags.push(normalized);
            saveToStorage(STORAGE_KEYS.TAGS, list);
        }
    } else {
        list.push({ id, type, tags: [normalized] });
        saveToStorage(STORAGE_KEYS.TAGS, list);
    }
}

/** Öğeden etiket kaldırır */
export function removeTag(id: string, type: "film" | "dizi", tag: string): void {
    const list = getFromStorage<TagItem>(STORAGE_KEYS.TAGS);
    const idx = list.findIndex((t) => t.id === id && t.type === type);
    if (idx >= 0) {
        list[idx].tags = list[idx].tags.filter((t) => t !== tag);
        if (list[idx].tags.length === 0) {
            list.splice(idx, 1);
        }
        saveToStorage(STORAGE_KEYS.TAGS, list);
    }
}

/** Öğenin etiketlerini döndürür */
export function getTags(id: string, type: "film" | "dizi"): string[] {
    const list = getFromStorage<TagItem>(STORAGE_KEYS.TAGS);
    const found = list.find((t) => t.id === id && t.type === type);
    return found ? found.tags : [];
}

/** Tüm benzersiz etiketleri döndürür */
export function getAllTags(): string[] {
    const list = getFromStorage<TagItem>(STORAGE_KEYS.TAGS);
    const all = list.flatMap((t) => t.tags);
    return Array.from(new Set(all));
}



// ==========================================
// 8. Kullanıcı Profili
// ==========================================

import type { UserProfile } from "@/types";

const DEFAULT_USER_PROFILE: UserProfile = {
    username: "Sinema Sever",
    avatar: "",
};

/** Kullanıcı profilini döndürür */
export function getUserProfile(): UserProfile {
    if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
        return data ? { ...DEFAULT_USER_PROFILE, ...JSON.parse(data) } : DEFAULT_USER_PROFILE;
    } catch {
        return DEFAULT_USER_PROFILE;
    }
}

/** Kullanıcı profilini kaydeder */
export function saveUserProfile(profile: Partial<UserProfile>): void {
    if (typeof window === "undefined") return;
    const current = getUserProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
}

// ==========================================
// 8. Bildirim Ayarları
// ==========================================

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: false,
    hour: 9,
    minute: 0,
    lastCheckedDate: "",
};

/** Bildirim ayarlarını döndürür */
export function getNotificationSettings(): NotificationSettings {
    if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS;
    try {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
        return data ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(data) } : DEFAULT_NOTIFICATION_SETTINGS;
    } catch {
        return DEFAULT_NOTIFICATION_SETTINGS;
    }
}

/** Bildirim ayarlarını kaydeder */
export function saveNotificationSettings(settings: Partial<NotificationSettings>): void {
    if (typeof window === "undefined") return;
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(updated));
}

export { STORAGE_KEYS };
