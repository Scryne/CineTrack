// ==========================================
// CineTrack - TVMaze API Helper
// ==========================================

const BASE_URL = "https://api.tvmaze.com";

// ==========================================
// Yardımcı: HTML etiketlerini temizle
// ==========================================

/** HTML etiketlerini kaldırıp düz metin döndürür */
function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim();
}

// ==========================================
// Response Tipleri
// ==========================================

interface TVMazeSearchResult {
    score: number;
    show: {
        id: number;
        name: string;
        url: string;
    };
}

interface TVMazeEpisodeResponse {
    id: number;
    name: string;
    season: number;
    number: number;
    airdate: string;
    runtime: number | null;
    summary: string | null;
}

// ==========================================
// API Fonksiyonları
// ==========================================

/** Dizi adı, sezon ve bölüm numarasına göre bölüm özetini getirir (İngilizce, düz metin) */
export async function getEpisodeSummary(
    showName: string,
    season: number,
    episode: number
): Promise<string | null> {
    try {
        // 1. Dizi adını ara ve ID'sini bul
        const searchRes = await fetch(
            `${BASE_URL}/search/shows?q=${encodeURIComponent(showName)}`
        );

        if (!searchRes.ok) {
            console.error(`TVMaze arama hatası: ${searchRes.status}`);
            return null;
        }

        const searchResults: TVMazeSearchResult[] = await searchRes.json();

        if (!searchResults.length) {
            console.error(`TVMaze: "${showName}" bulunamadı`);
            return null;
        }

        const showId = searchResults[0].show.id;

        // 2. Belirtilen bölümü getir
        const episodeRes = await fetch(
            `${BASE_URL}/shows/${showId}/episodebynumber?season=${season}&number=${episode}`
        );

        if (!episodeRes.ok) {
            console.error(`TVMaze bölüm hatası: ${episodeRes.status}`);
            return null;
        }

        const episodeData: TVMazeEpisodeResponse = await episodeRes.json();

        // 3. HTML'i strip edip düz metin döndür
        if (!episodeData.summary) {
            return null;
        }

        return stripHtml(episodeData.summary);
    } catch (error) {
        console.error("TVMaze API isteği başarısız:", error);
        return null;
    }
}
