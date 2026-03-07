// ==========================================
// CineTrack - Sinema Kişiliği Hesaplama
// ==========================================

export interface CinemaPersonalityStats {
    totalMovies: number;
    totalSeries: number;
    totalEpisodes: number;
    avgRating: number;
    topGenres: string[];
    totalWatched: number;
}

export interface CinemaPersonality {
    label: string;
    description: string;
}

/**
 * Kullanıcının izleme alışkanlıklarına göre bir sinema kişiliği belirler.
 */
export function getCinemaPersonality(stats: CinemaPersonalityStats): CinemaPersonality {
    const { totalMovies, totalSeries, totalEpisodes, avgRating, topGenres, totalWatched } = stats;

    if (totalWatched === 0) {
        return { label: "Yeni Başlayan", description: "Henüz yolculuğun başında! Keşfetmeye başla." };
    }

    if (totalSeries > totalMovies * 2 && totalEpisodes > 50) {
        return { label: "Dizi Bağımlısı", description: "Dizilere hayatını adamışsın!" };
    }

    if (avgRating >= 8.0) {
        return { label: "Kalite Avcısı", description: "Sadece en iyileri izliyorsun, standartların yüksek." };
    }

    if (avgRating <= 4.0 && totalWatched > 10) {
        return { label: "Cesur Kaşif", description: "Her şeyi deniyorsun, iyi kötü demeden!" };
    }

    const topGenre = topGenres.length > 0 ? topGenres[0] : null;

    if (topGenre === "Aksiyon" || topGenre === "Macera") {
        return { label: "Aksiyon Tutkunu", description: "Adrenalin senin işin!" };
    }

    if (topGenre === "Korku" || topGenre === "Gerilim") {
        return { label: "Karanlık Ruh", description: "Gerilim ve korku senin alanın." };
    }

    if (topGenre === "Komedi") {
        return { label: "Gülme Uzmanı", description: "Hayat kısa, gülelim bari!" };
    }

    if (topGenre === "Dram") {
        return { label: "Duygusal Sinefil", description: "Derin hikayelere bayılıyorsun." };
    }

    if (topGenre === "Bilim Kurgu" || topGenre === "Fantastik") {
        return { label: "Hayal Gezgini", description: "Gerçekliğin sınırlarını zorluyorsun!" };
    }

    if (topGenre === "Belgesel") {
        return { label: "Bilgi Avcısı", description: "Öğrenmeyi seviyorsun." };
    }

    if (totalWatched > 50) {
        return { label: "Sinema Gurusu", description: "Sen artık bir profesyonelsin!" };
    }

    if (totalMovies > totalSeries) {
        return { label: "Film Sever", description: "Klasik bir sinema tutkunu." };
    }

    return { label: "Meraklı İzleyici", description: "Her şeyden biraz izliyorsun, dengeli bir profil!" };
}
