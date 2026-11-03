// @vitest-environment node
/**
 * Altyazı vekili (lib/subtitlesServer.ts) ve istemcisi (lib/subtitles.ts). fetch sahtedir; hiçbir test
 * gerçek OpenSubtitles'a gitmez.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetForTests, handleSubtitlesRequest } from "@/lib/subtitlesServer";
import { getSubtitleDownloadUrl, searchSubtitles } from "@/lib/subtitles";

const BASE = "http://localhost/api/subtitles";
const fetchMock = vi.fn<typeof fetch>();

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const searchPayload = {
    data: [
        { id: "1", attributes: { language: "en", ratings: 7, download_count: 100, files: [{ file_id: 11, file_name: "a.srt" }] } },
        { id: "2", attributes: { language: "tr", ratings: 9, download_count: 50, files: [{ file_id: 22, file_name: "b.srt" }] } },
        { id: "3", attributes: { language: "xx", ratings: 9, download_count: 80, files: [] } },
    ],
};

beforeEach(() => {
    __resetForTests();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("OPENSUBTITLES_KEY", "sunucu-anahtari");
    vi.stubEnv("NEXT_PUBLIC_OPENSUBTITLES_KEY", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe("arama", () => {
    it("film için tmdb_id ile arar, anahtarı başlıkta gönderir, sonuçları sıralar", async () => {
        fetchMock.mockResolvedValueOnce(json(searchPayload));
        const res = await handleSubtitlesRequest(`${BASE}?tmdb_id=603&type=film`);
        expect(res.status).toBe(200);
        const { results } = await res.json();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        const u = new URL(String(url));
        expect(u.origin + u.pathname).toBe("https://api.opensubtitles.com/api/v1/subtitles");
        expect(u.searchParams.get("tmdb_id")).toBe("603");
        expect(u.searchParams.get("type")).toBe("movie");
        expect(u.searchParams.get("languages")).toBe("en,tr");
        expect((init?.headers as Record<string, string>)["Api-Key"]).toBe("sunucu-anahtari");

        expect(results.map((r: { id: number }) => r.id)).toEqual([3, 2, 1]);
        expect(results[1]).toMatchObject({ language: "tr", languageName: "Türkçe", files: [{ fileId: 22 }] });
        expect(results[0].languageName).toBe("XX");
    });

    it("dizi bölümünü parent_tmdb_id, sezon ve bölümle arar", async () => {
        fetchMock.mockResolvedValueOnce(json({ data: [] }));
        await handleSubtitlesRequest(`${BASE}?tmdb_id=1399&type=dizi&season=1&episode=2`);
        const u = new URL(String(fetchMock.mock.calls[0][0]));
        expect(u.searchParams.get("parent_tmdb_id")).toBe("1399");
        expect(u.searchParams.get("tmdb_id")).toBeNull();
        expect(u.searchParams.get("season_number")).toBe("1");
        expect(u.searchParams.get("episode_number")).toBe("2");
        expect(u.searchParams.get("type")).toBe("episode");
    });

    it("anahtar yoksa dışarı hiç istek atmadan boş liste döner", async () => {
        vi.stubEnv("OPENSUBTITLES_KEY", "");
        const res = await handleSubtitlesRequest(`${BASE}?tmdb_id=603&type=film`);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ results: [] });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("eski NEXT_PUBLIC_OPENSUBTITLES_KEY değişkenine düşer", async () => {
        vi.stubEnv("OPENSUBTITLES_KEY", "");
        vi.stubEnv("NEXT_PUBLIC_OPENSUBTITLES_KEY", "eski-anahtar");
        fetchMock.mockResolvedValueOnce(json({ data: [] }));
        await handleSubtitlesRequest(`${BASE}?tmdb_id=603&type=film`);
        const init = fetchMock.mock.calls[0][1];
        expect((init?.headers as Record<string, string>)["Api-Key"]).toBe("eski-anahtar");
    });

    it("ağ hatasında ve 5xx'te boş liste döner", async () => {
        fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
        expect(await (await handleSubtitlesRequest(`${BASE}?tmdb_id=603&type=film`)).json()).toEqual({ results: [] });
        fetchMock.mockResolvedValueOnce(new Response("x", { status: 503 }));
        expect(await (await handleSubtitlesRequest(`${BASE}?tmdb_id=603&type=film`)).json()).toEqual({ results: [] });
    });

    it("geçersiz anahtarda (401) bir saat boyunca yeniden denemez", async () => {
        fetchMock.mockResolvedValue(new Response("", { status: 401 }));
        await handleSubtitlesRequest(`${BASE}?tmdb_id=603&type=film`);
        await handleSubtitlesRequest(`${BASE}?tmdb_id=604&type=film`);
        await handleSubtitlesRequest(`${BASE}?file_id=11`);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("geçersiz parametreyi 400 ile reddeder", async () => {
        expect((await handleSubtitlesRequest(`${BASE}?tmdb_id=abc&type=film`)).status).toBe(400);
        expect((await handleSubtitlesRequest(`${BASE}?tmdb_id=603&type=movie`)).status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("indirme", () => {
    it("bağlantıyı alır, dosyayı sunucuda çeker, bağlantıyı önbellekler", async () => {
        fetchMock
            .mockResolvedValueOnce(json({ link: "https://dl.opensubtitles.com/x.srt" }))
            .mockResolvedValueOnce(new Response("1\n00:00:01,000 --> 00:00:02,000\nMerhaba\n"))
            .mockResolvedValueOnce(new Response("1\n00:00:01,000 --> 00:00:02,000\nMerhaba\n"));

        const first = await handleSubtitlesRequest(`${BASE}?file_id=11`);
        expect(first.status).toBe(200);
        expect(await first.text()).toContain("Merhaba");
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("https://api.opensubtitles.com/api/v1/download");
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({ file_id: 11 });
        expect(fetchMock.mock.calls[1][0]).toBe("https://dl.opensubtitles.com/x.srt");

        await handleSubtitlesRequest(`${BASE}?file_id=11`);
        expect(fetchMock).toHaveBeenCalledTimes(3); // ikinci kez /download çağrılmadı
    });

    it("anahtar yoksa 503, servis düşerse 502 döner", async () => {
        vi.stubEnv("OPENSUBTITLES_KEY", "");
        expect((await handleSubtitlesRequest(`${BASE}?file_id=11`)).status).toBe(503);
        expect(fetchMock).not.toHaveBeenCalled();

        vi.stubEnv("OPENSUBTITLES_KEY", "k");
        fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
        expect((await handleSubtitlesRequest(`${BASE}?file_id=11`)).status).toBe(502);
    });
});

describe("istemci (lib/subtitles.ts)", () => {
    it("yalnız aynı kökendeki rotaya tek istek atar", async () => {
        fetchMock.mockResolvedValueOnce(json({ results: [{ id: 5 }] }));
        const results = await searchSubtitles({ tmdbId: "1399", type: "dizi", season: 1, episode: 3 });
        expect(results).toEqual([{ id: 5 }]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe("/api/subtitles?tmdb_id=1399&type=dizi&season=1&episode=3");
    });

    it("rota hata verirse ya da ağ düşerse boş liste döner", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
        expect(await searchSubtitles({ tmdbId: "603", type: "film" })).toEqual([]);
        fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
        expect(await searchSubtitles({ tmdbId: "603", type: "film" })).toEqual([]);
    });

    it("indirme adresi aynı kökendeki rotadır", async () => {
        expect(await getSubtitleDownloadUrl(22)).toBe("/api/subtitles?file_id=22");
        expect(await getSubtitleDownloadUrl(-1)).toBeNull();
    });
});
