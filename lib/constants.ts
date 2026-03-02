// ==========================================
// CineTrack - Uygulama Sabitleri
// ==========================================

// ==========================================
// Renk Sabitleri
// ==========================================

export const COLORS = {
    bg: {
        primary: "#0D0D0F",
        card: "#16161A",
        hover: "#1E1E24",
    },
    border: "#2A2A35",
    purple: {
        DEFAULT: "#7B5CF0",
        light: "#9D7FF4",
        dark: "#5A3FD4",
        glow: "rgba(123,92,240,0.15)",
    },
    text: {
        primary: "#F0F0F5",
        secondary: "#8B8B99",
        muted: "#4A4A5A",
    },
    success: "#22C55E",
    rating: "#F59E0B",
} as const;

/** Liste renk paleti (kullanıcı listeleri için) */
export const LIST_COLORS = [
    "#7B5CF0", // Purple
    "#22C55E", // Green
    "#F59E0B", // Amber
    "#3B82F6", // Blue
    "#EC4899", // Pink
    "#F97316", // Orange
    "#06B6D4", // Cyan
    "#8B5CF6", // Violet
] as const;

/** Grafik renk paleti (istatistik sayfası için) */
export const CHART_COLORS = [
    "#7B5CF0",
    "#22C55E",
    "#F59E0B",
    "#3B82F6",
    "#EC4899",
    "#F97316",
    "#06B6D4",
    "#A78BFA",
    "#34D399",
    "#FBBF24",
] as const;

// ==========================================
// TMDB Görsel URL Sabitleri
// ==========================================

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const TMDB_IMAGE_SIZES = {
    poster: "w500",
    posterSmall: "w342",
    backdrop: "original",
    backdropSmall: "w780",
    profile: "w185",
    profileSmall: "w92",
    still: "w300",
} as const;

/** Tam TMDB görsel URL helper'ı */
export const tmdbImageUrl = (
    path: string | null,
    size: keyof typeof TMDB_IMAGE_SIZES = "poster"
): string | null => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE}/${TMDB_IMAGE_SIZES[size]}${path}`;
};

// ==========================================
// Uygulama Sabitleri
// ==========================================

export const APP_NAME = "CineTrack";
export const APP_DESCRIPTION =
    "Filmlerinizi ve dizilerinizi takip edin, izleme listenizi yönetin, bölüm ilerlemelerinizi kaydedin.";

/** Sayfalama sabitleri */
export const PAGINATION = {
    defaultPageSize: 20,
    maxPageSize: 50,
} as const;

/** Confetti animasyonu varsayılan renkleri */
export const CONFETTI_COLORS = ["#7B5CF0", "#9D7FF4", "#22C55E", "#F59E0B", "#F0F0F5"] as const;
