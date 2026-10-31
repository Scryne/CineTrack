/**
 * Yerel mod: db.ts'in gerçek fonksiyonları, Supabase yerine tarayıcı deposu üzerinden.
 * Supabase projesi kapanınca uygulama salt okunur kalmıştı; bu testler yazmanın,
 * okumanın ve silmenin Supabase'teki anlamıyla çalıştığını sınar.
 */
import { beforeEach, describe, expect, it } from "vitest";
import * as db from "@/lib/db";
import { clearLocalData, createLocalClient, exportLocalData, LOCAL_STORE_KEY } from "@/lib/localClient";

beforeEach(() => {
    window.localStorage.clear();
});

describe("izleme listesi ve izlenenler", () => {
    it("ekler, aynı öğeyi ikinci kez eklemez, en yeni üstte listeler, siler", async () => {
        await db.addToWatchlist({ id: "603", type: "film", title: "The Matrix", posterPath: "/m.jpg" });
        await new Promise((r) => setTimeout(r, 5));
        await db.addToWatchlist({ id: "1396", type: "dizi", title: "Breaking Bad", posterPath: "/b.jpg" });
        await db.addToWatchlist({ id: "603", type: "film", title: "The Matrix", posterPath: "/m2.jpg" });

        const list = await db.getWatchlist();
        expect(list.map((i) => i.id)).toEqual(["1396", "603"]);
        expect(list[1].posterPath).toBe("/m2.jpg");
        expect(await db.isInWatchlist("603", "film")).toBe(true);
        // Aynı TMDB kimliği farklı türde ayrı kayıttır (onConflict: user_id,tmdb_id,type).
        expect(await db.isInWatchlist("603", "dizi")).toBe(false);

        await db.removeFromWatchlist("603", "film");
        expect(await db.isInWatchlist("603", "film")).toBe(false);
        expect(await db.getWatchlist()).toHaveLength(1);
    });

    it("izlendi işareti kalıcıdır ve sayfa yenilenince (yeni istemci) okunur", async () => {
        await db.markAsWatched({ id: "27205", type: "film", title: "Inception", posterPath: null });
        expect(JSON.parse(window.localStorage.getItem(LOCAL_STORE_KEY)!).watched).toHaveLength(1);
        expect(await db.isWatched("27205", "film")).toBe(true);
        const watched = await db.getWatched();
        expect(watched[0]).toMatchObject({ id: "27205", title: "Inception", type: "film" });
        expect(Date.parse(watched[0].watchedAt)).not.toBeNaN();
    });
});

describe("bölüm takibi", () => {
    it("sezonu toplu işaretler, tek bölümü geri alır, sezon silince yalnız o sezon gider", async () => {
        await db.markAllSeriesEpisodesWatched("1396", [
            { seasonNumber: 1, episodeCount: 7 },
            { seasonNumber: 2, episodeCount: 13 },
        ]);
        expect(await db.getWatchedEpisodes("1396")).toHaveLength(20);

        await db.unmarkEpisodeWatched("1396", 2, 13);
        expect(await db.isEpisodeWatched("1396", 2, 13)).toBe(false);
        expect(await db.isEpisodeWatched("1396", 2, 12)).toBe(true);

        // Aynı bölümü iki kez işaretlemek çift satır üretmez.
        await db.markEpisodeWatched("1396", 1, 1);
        expect(await db.getWatchedEpisodes("1396")).toHaveLength(19);

        await db.removeAllEpisodesWatched("1396", 1);
        const left = await db.getWatchedEpisodes("1396");
        expect(left).toHaveLength(12);
        expect(left.every((e) => e.seasonNumber === 2)).toBe(true);

        await db.removeAllEpisodesWatched("1396", 2, [1, 2, 3]);
        expect(await db.getWatchedEpisodes("1396")).toHaveLength(9);
    });
});

describe("izleme ilerlemesi", () => {
    it("aynı yapımın ilerlemesini günceller, son güncelleneni başa alır, sayfalar", async () => {
        const base = { type: "dizi" as const, posterPath: "/p.jpg", updatedAt: "" };
        await db.saveWatchProgress({ ...base, tmdbId: "1", title: "A", season: 1, episode: 1 });
        await new Promise((r) => setTimeout(r, 5));
        await db.saveWatchProgress({ ...base, tmdbId: "2", title: "B", season: 1, episode: 1 });
        await new Promise((r) => setTimeout(r, 5));
        await db.saveWatchProgress({ ...base, tmdbId: "1", title: "A", season: 1, episode: 4 });

        const all = await db.getAllProgress();
        expect(all.map((p) => p.tmdbId)).toEqual(["1", "2"]);
        expect(all[0].episode).toBe(4);
        expect((await db.getAllProgress(1, 1)).map((p) => p.tmdbId)).toEqual(["2"]);
        expect(await db.getWatchProgress("9", "film")).toBeNull();
        expect((await db.getRecentlyWatched(1)).map((p) => p.tmdbId)).toEqual(["1"]);
    });
});

describe("puanlar, etiketler, listeler, profil", () => {
    it("puanı günceller ve okur", async () => {
        await db.addRating("603", "film", 4, "The Matrix", "/m.jpg");
        await db.addRating("603", "film", 5, "The Matrix", "/m.jpg");
        expect(await db.getRating("603", "film")).toBe(5);
        expect(await db.getAllRatings()).toHaveLength(1);
        await db.removeRating("603", "film");
        expect(await db.getRating("603", "film")).toBeNull();
    });

    it("özel liste öğeleriyle döner; liste silinince öğeleri de gider", async () => {
        const list = await db.createCustomList("Hafta sonu", "Uzun filmler");
        expect(list).toBeTruthy();
        const listId = (list as { id: string }).id;
        await db.addToCustomList(listId, { id: "603", type: "film", title: "The Matrix", posterPath: "/m.jpg" });
        await db.addToCustomList(listId, { id: "27205", type: "film", title: "Inception", posterPath: "/i.jpg" });

        const [loaded] = await db.getCustomLists();
        expect(loaded).toMatchObject({ name: "Hafta sonu", description: "Uzun filmler" });
        expect(loaded.items.map((i: { id: string }) => i.id).sort()).toEqual(["27205", "603"]);

        await db.removeFromCustomList(listId, "603");
        expect((await db.getCustomLists())[0].items).toHaveLength(1);

        await db.deleteCustomList(listId);
        expect(await db.getCustomLists()).toEqual([]);
        expect(exportLocalData().custom_list_items ?? []).toEqual([]);
    });

    it("profil ve bildirim ayarı aynı satırda birleşir", async () => {
        await db.saveUserProfile({ username: "sinefil", avatar: "🎬" });
        await db.saveNotificationSettings({ enabled: true, hour: 0, minute: 30 });
        expect(await db.getUserProfile()).toMatchObject({ username: "sinefil", avatarEmoji: "🎬" });
        expect(await db.getNotificationSettings()).toMatchObject({ enabled: true, hour: 0, minute: 30 });
    });
});

describe("yerel istemcinin Supabase anlamı", () => {
    it("single: satır yoksa PGRST116, maybeSingle: null", async () => {
        const client = createLocalClient();
        const single = await client.from("watched").select("*").eq("tmdb_id", "x").single();
        expect(single.error?.code).toBe("PGRST116");
        const maybe = await client.from("watched").select("id").eq("tmdb_id", "x").maybeSingle();
        expect(maybe).toEqual({ data: null, error: null });
    });

    it("belirli sütun seçimi yalnız o sütunları döndürür", async () => {
        await db.addRating("1", "film", 3, "X");
        const client = createLocalClient();
        const { data } = await client.from("ratings").select("rating").eq("tmdb_id", "1").single();
        expect(data).toEqual({ rating: 3 });
    });

    it("verileri temizleyince her şey boşalır", async () => {
        await db.addToWatchlist({ id: "1", type: "film", title: "X", posterPath: "" });
        clearLocalData();
        expect(await db.getWatchlist()).toEqual([]);
    });
});
