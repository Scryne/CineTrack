/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { User } from '@supabase/supabase-js'

// ============ AUTH HELPER ============
// Parallel olarak çağrılan db fonksiyonlarının hepsinin ayrı ayrı
// getUser() yapmasını engelleyerek navigator.locks çakışmasını (AbortError) ortadan kaldırır.
let cachedUserPromise: Promise<User | null> | null = null;

async function getAuthUser(): Promise<User | null> {
    if (cachedUserPromise) return cachedUserPromise;

    const supabase = createClient();
    cachedUserPromise = supabase.auth.getUser()
        .then(({ data }: { data: { user: User | null } }) => {
            // 500ms cache — aynı render döngüsündeki tüm çağrılar tek sonucu paylaşır
            setTimeout(() => { cachedUserPromise = null }, 500);
            return data.user;
        })
        .catch((err: Error) => {
            cachedUserPromise = null;
            logger.error('getAuthUser error:', err);
            return null;
        });

    return cachedUserPromise;
}

// ============ WATCHLIST ============
export type WatchlistItem = {
    id: string; // Used for tmdbId by UI
    tmdbId?: string;
    type: "film" | "dizi";
    title: string;
    posterPath: string | null;
    addedAt: string;
};

export async function addToWatchlist(item: {
    id: string
    type: 'film' | 'dizi'
    title: string
    posterPath: string
    addedAt?: string
}) {
    const supabase = createClient()
    const user = await getAuthUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('watchlist')
        .upsert({
            user_id: user.id,
            tmdb_id: item.id,
            type: item.type,
            title: item.title,
            poster_path: item.posterPath,
        }, { onConflict: 'user_id,tmdb_id,type' })
        .select()
        .single()

    if (error) {
        logger.error('addToWatchlist error:', error)
        throw error
    }
    return data
}

export async function removeFromWatchlist(id: string, type: 'film' | 'dizi') {
    const supabase = createClient()
    const user = await getAuthUser()
    if (!user) return

    const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_id', id)
        .eq('type', type)

    if (error) throw error
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
    const supabase = createClient()
    const user = await getAuthUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })

    if (error) throw error
    return (data || []).map(d => ({
        id: d.tmdb_id, // Map tmdb_id back to 'id' for UI
        tmdbId: d.tmdb_id,
        type: d.type as any,
        title: d.title,
        posterPath: d.poster_path,
        addedAt: d.added_at || new Date().toISOString(),
    }))
}

export async function isInWatchlist(id: string, type: 'film' | 'dizi') {
    const supabase = createClient()
    const user = await getAuthUser()
    if (!user) return false

    const { data, error } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('tmdb_id', id)
        .eq('type', type)
        .maybeSingle()

    if (error) {
        logger.error('isInWatchlist error:', error)
        return false
    }
    return !!data
}

// ============ İZLENENLER ============

export type WatchedItem = {
    id: string; // Used as tmdbId
    tmdbId?: string;
    type: "film" | "dizi";
    title: string;
    posterPath: string | null;
    watchedAt: string;
};

export async function addToWatched(item: {
    id: string;
    type: "film" | "dizi";
    title: string;
    posterPath: string | null;
    watchedAt?: string;
}) {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('watched')
        .upsert({
            user_id: user.id,
            tmdb_id: item.id,
            type: item.type,
            title: item.title,
            poster_path: item.posterPath,
        }, { onConflict: 'user_id,tmdb_id,type' })
        .select()
        .single();

    if (error) {
        logger.error('addToWatched error:', error)
        throw error;
    }
    return data;
}

export async function markAsWatched(item: { id: string; type: "film" | "dizi"; title: string; posterPath: string | null; watchedAt?: string }) {
    return addToWatched({
        ...item,
        watchedAt: item.watchedAt || new Date().toISOString(),
    });
}

export async function removeFromWatched(id: string, type: "film" | "dizi") {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return;

    const { error } = await supabase
        .from('watched')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_id', id)
        .eq('type', type);

    if (error) throw error;
}

export async function getWatched(): Promise<WatchedItem[]> {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('watched')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(d => ({
        id: d.tmdb_id,
        tmdbId: d.tmdb_id,
        type: d.type as any,
        title: d.title,
        posterPath: d.poster_path,
        watchedAt: d.watched_at ? String(d.watched_at) : new Date().toISOString(),
    }));
}

export async function isWatched(id: string, type: "film" | "dizi") {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('watched')
        .select('id')
        .eq('user_id', user.id)
        .eq('tmdb_id', id)
        .eq('type', type)
        .maybeSingle();

    if (error) {
        logger.error('isWatched error:', error)
        return false;
    }
    return !!data;
}

// ============ BÖLÜM TAKİBİ ============

export type WatchedEpisode = {
    id?: string;
    seriesId: string;
    seasonNumber: number;
    episodeNumber: number;
    watchedAt: string;
};

export async function markEpisodeWatched(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number
) {
    const supabase = createClient()
    const user = await getAuthUser()
    if (!user) return

    const { error } = await supabase
        .from('episodes')
        .upsert({
            user_id: user.id,
            series_id: seriesId,
            season_number: seasonNumber,
            episode_number: episodeNumber,
        }, { onConflict: 'user_id,series_id,season_number,episode_number' })

    if (error) {
        logger.error('markEpisodeWatched error:', error)
        throw error
    }
}

export async function unmarkEpisodeWatched(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number
) {
    const supabase = createClient()
    const user = await getAuthUser()
    if (!user) return

    const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('user_id', user.id)
        .eq('series_id', seriesId)
        .eq('season_number', seasonNumber)
        .eq('episode_number', episodeNumber)

    if (error) throw error
}

export async function markAllEpisodesWatched(
    seriesId: string,
    seasonNumber?: number | any[],
    episodes?: number[]
) {
    const supabase = createClient()
    const user = await getAuthUser()
    if (!user) return

    if (!seasonNumber || !episodes) return;

    if (Array.isArray(seasonNumber)) {
        const inserts: any[] = [];
        seasonNumber.forEach((s: any) => {
            for (let i = 1; i <= s.episodeCount; i++) {
                inserts.push({ user_id: user.id, series_id: seriesId, season_number: s.seasonNumber, episode_number: i })
            }
        });
        const { error } = await supabase.from('episodes').upsert(inserts, { onConflict: 'user_id,series_id,season_number,episode_number' });
        if (error) throw error;
        return;
    }

    const inserts = episodes.map(ep => ({
        user_id: user.id,
        series_id: seriesId,
        season_number: seasonNumber as number,
        episode_number: ep,
    }))

    const { error } = await supabase
        .from('episodes')
        .upsert(inserts, { onConflict: 'user_id,series_id,season_number,episode_number' })

    if (error) throw error
}

export async function removeAllEpisodesWatched(
    seriesId: string,
    seasonNumber?: number,
    episodes?: number[]
) {
    const supabase = createClient()
    const user = await getAuthUser()
    if (!user) return

    let query = supabase.from('episodes').delete().eq('user_id', user.id).eq('series_id', seriesId)
    if (seasonNumber !== undefined) query = query.eq('season_number', seasonNumber)
    if (episodes !== undefined) query = query.in('episode_number', episodes)

    const { error } = await query

    if (error) throw error
}

export async function getWatchedEpisodes(seriesId: string): Promise<WatchedEpisode[]> {
    const supabase = createClient()
    const user = await getAuthUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', user.id)
        .eq('series_id', seriesId)

    if (error) throw error
    return (data || []).map(d => ({
        id: d.id,
        seriesId: d.series_id,
        seasonNumber: d.season_number,
        episodeNumber: d.episode_number,
        watchedAt: d.watched_at ? String(d.watched_at) : new Date().toISOString()
    }))
}

export async function getAllWatchedEpisodes(): Promise<WatchedEpisode[]> {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', user.id);

    if (error) throw error;
    return (data || []).map(d => ({
        id: d.id,
        seriesId: d.series_id,
        seasonNumber: d.season_number,
        episodeNumber: d.episode_number,
        watchedAt: d.watched_at ? String(d.watched_at) : new Date().toISOString()
    }))
}

export async function isEpisodeWatched(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number
) {
    const supabase = createClient()
    const user = await getAuthUser()
    if (!user) return false

    const { data, error } = await supabase
        .from('episodes')
        .select('id')
        .eq('user_id', user.id)
        .eq('series_id', seriesId)
        .eq('season_number', seasonNumber)
        .eq('episode_number', episodeNumber)
        .maybeSingle()

    if (error) {
        logger.error('isEpisodeWatched error:', error)
        return false
    }
    return !!data
}

// ============ PUANLAR ============
export type RatingItem = {
    id: string;
    tmdbId?: string;
    type: "film" | "dizi";
    title: string;
    posterPath: string | null;
    rating: number;
    ratedAt: string;
};

export async function addRating(id: string, type: "film" | "dizi", rating: number, title?: string, posterPath?: string) {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('ratings')
        .upsert({
            user_id: user.id,
            tmdb_id: id,
            type,
            rating,
            title: title || "Unknown Title",
            poster_path: posterPath || null
        }, { onConflict: 'user_id,tmdb_id,type' })
        .select()
        .single();

    if (error) {
        logger.error('addRating error:', error)
        throw error;
    }
    return data;
}

export async function getRating(id: string, type: "film" | "dizi"): Promise<number | null> {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('tmdb_id', id)
        .eq('type', type)
        .maybeSingle();

    if (error) {
        logger.error('getRating error:', error)
        return null;
    }
    return data?.rating ?? null;
}

export async function getAllRatings(): Promise<RatingItem[]> {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', user.id)
        .order('rated_at', { ascending: false });

    if (error) {
        logger.error('getAllRatings error:', error);
        return [];
    }
    return (data || []).map(d => ({
        id: d.tmdb_id,
        tmdbId: d.tmdb_id,
        type: d.type as any,
        title: d.title,
        posterPath: d.poster_path,
        rating: d.rating || 0,
        ratedAt: d.rated_at || new Date().toISOString()
    }))
}

export async function removeRating(id: string, type: "film" | "dizi") {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return;

    const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_id', id)
        .eq('type', type);

    if (error) throw error;
}

// ============ İZLEME GEÇMİŞİ ============
export type WatchProgress = {
    tmdbId: string;
    type: "film" | "dizi";
    title: string;
    posterPath: string;
    backdropPath?: string;
    progress?: number;
    timeSpentSeconds?: number;
    duration?: number;
    season?: number;
    episode?: number;
    episodeTitle?: string;
    totalEpisodes?: number;
    watchedEpisodes?: number;
    updatedAt: string;
};

export async function saveWatchProgress(progress: WatchProgress) {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('watch_progress')
        .upsert({
            user_id: user.id,
            tmdb_id: progress.tmdbId,
            type: progress.type,
            title: progress.title,
            poster_path: progress.posterPath,
            backdrop_path: progress.backdropPath,
            progress: progress.timeSpentSeconds || progress.progress || 0,
            duration: progress.duration || 0,
            season_number: progress.season,
            episode_number: progress.episode,
            total_episodes: progress.totalEpisodes,
            watched_episodes: progress.watchedEpisodes
        }, { onConflict: 'user_id,tmdb_id,type' })
        .select()
        .single();

    if (error) {
        logger.error('saveWatchProgress error:', error)
        throw error;
    }
    return data;
}

function mapToProgress(d: any): WatchProgress {
    return {
        tmdbId: d.tmdb_id,
        type: d.type as any,
        title: d.title,
        posterPath: d.poster_path,
        backdropPath: d.backdrop_path || undefined,
        progress: d.progress,
        timeSpentSeconds: d.progress,
        duration: d.duration,
        season: d.season_number || undefined,
        episode: d.episode_number || undefined,
        totalEpisodes: d.total_episodes || undefined,
        watchedEpisodes: d.watched_episodes || undefined,
        updatedAt: d.updated_at || new Date().toISOString()
    };
}

export async function getWatchProgress(tmdbId: string, type: "film" | "dizi"): Promise<WatchProgress | null> {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId)
        .eq('type', type)
        .single();

    if (error && error.code !== "PGRST116") throw error; // No rows returned is fine
    return data ? mapToProgress(data) : null;
}

export async function getAllProgress(limit?: number, offset?: number): Promise<WatchProgress[]> {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return [];

    let query = supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    } else if (limit !== undefined) {
        query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapToProgress);
}

export async function removeProgress(tmdbId: string, type: "film" | "dizi") {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return;

    const { error } = await supabase
        .from('watch_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId)
        .eq('type', type);

    if (error) throw error;
}

export async function getRecentlyWatched(limit: number = 5): Promise<WatchProgress[]> {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data || []).map(mapToProgress);
}

export async function clearAllProgress() {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return;

    const { error } = await supabase
        .from('watch_progress')
        .delete()
        .eq('user_id', user.id);

    if (error) throw error;
}

// ============ ETİKETLER ============

export async function getTags(tmdbId: string, type: "film" | "dizi") {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('tags')
        .select('tag')
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId)
        .eq('type', type);

    if (error) throw error;
    return data?.map(d => d.tag) || [];
}

export async function addTag(tmdbId: string, type: "film" | "dizi", tag: string) {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('tags')
        .upsert({
            user_id: user.id,
            tmdb_id: tmdbId,
            type,
            tag
        }, { onConflict: 'user_id,tmdb_id,type,tag' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function removeTag(tmdbId: string, type: "film" | "dizi", tag: string) {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return;

    const { error } = await supabase
        .from('tags')
        .delete()
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId)
        .eq('type', type)
        .eq('tag', tag);

    if (error) throw error;
}

export async function getAllTags() {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id);

    if (error) throw error
    return data || []
}

// ============ FİLM / DİZİ DEĞERLENDİRME ============

// ============ ÖZEL LİSTELER ============

export async function getCustomLists() {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('custom_lists')
        .select('*, custom_list_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Map back to the expected type format for UI compatibility if needed
    return data?.map(list => ({
        id: list.id,
        name: list.name,
        description: list.description || undefined,
        createdAt: list.created_at,
        items: list.custom_list_items.map((item: any) => ({
            id: item.tmdb_id,
            tmdbId: item.tmdb_id,
            type: item.type,
            title: item.title,
            posterPath: item.poster_path,
            addedAt: item.added_at
        }))
    })) ?? [];
}

export async function createCustomList(name: string, description?: string) {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('custom_lists')
        .insert({
            user_id: user.id,
            name,
            description
        })
        .select('*, custom_list_items(*)')
        .single();

    if (error) throw error;
    return {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        createdAt: data.created_at,
        items: []
    };
}

export async function deleteCustomList(listId: string) {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return;

    const { error } = await supabase
        .from('custom_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user.id); // For security

    if (error) throw error;
}

export async function addToCustomList(listId: string, item: {
    id: string;
    type: "film" | "dizi";
    title: string;
    posterPath: string;
}) {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return;

    const { error } = await supabase
        .from('custom_list_items')
        .insert({
            list_id: listId,
            user_id: user.id,
            tmdb_id: item.id,
            type: item.type,
            title: item.title,
            poster_path: item.posterPath,
        });

    if (error) throw error;
}

export async function removeFromCustomList(listId: string, tmdbId: string) {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return;

    const { error } = await supabase
        .from('custom_list_items')
        .delete()
        .eq('list_id', listId)
        .eq('tmdb_id', tmdbId)
        .eq('user_id', user.id);

    if (error) throw error;
}

// ============ PROFİL İŞLEMLERİ ============

export type UserProfile = {
    id: string;
    username?: string;
    avatar?: string;
    avatarEmoji?: string;
    cinemaIdentity?: string;
};

export async function getUserProfile() {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error && error.code !== "PGRST116") throw error; // Ignore not found
    if (data) {
        return {
            id: data.id,
            username: data.username || undefined,
            avatar: data.avatar_emoji || undefined,
            avatarEmoji: data.avatar_emoji || undefined,
            cinemaIdentity: data.cinema_identity || undefined,
        };
    }
    return null;
}

export async function saveUserProfile(profileData: Partial<UserProfile> & { username?: string; avatar?: string; avatarEmoji?: string; cinemaIdentity?: string }) {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return;

    const avatarValue = profileData.avatar || profileData.avatarEmoji;
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            username: profileData.username,
            avatar_emoji: avatarValue,
            cinema_identity: profileData.cinemaIdentity,
        });

    if (error) throw error;
}

export interface NotificationSettings {
    enabled: boolean;
    hour: number;
    minute: number;
    lastCheckedDate?: string;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return { enabled: false, hour: 20, minute: 0 };

    const { data } = await supabase
        .from('profiles')
        .select('notification_enabled, notification_time')
        .eq('id', user.id)
        .single();

    const timeStr = data?.notification_time || "20:00";
    const [hourStr, minStr] = timeStr.split(":");

    return {
        enabled: data?.notification_enabled ?? false,
        hour: parseInt(hourStr) || 20,
        minute: parseInt(minStr) || 0
    };
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    const supabase = createClient();
    const user = await getAuthUser();
    if (!user) return;

    const timeStr = `${settings.hour.toString().padStart(2, '0')}:${settings.minute.toString().padStart(2, '0')}`;

    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            notification_enabled: settings.enabled,
            notification_time: timeStr,
        });

    if (error) {
        logger.error('saveNotificationSettings error:', error);
        throw error;
    }
}


