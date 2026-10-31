/** İzleme ilerlemesi (devam et / geçmiş). Oynatıcı ve altyazı tipleri 2026-10-31'de oynatıcıyla birlikte kaldırıldı. */
export type WatchProgress = {
    tmdbId: string
    type: 'film' | 'dizi'
    title: string
    posterPath: string
    backdropPath?: string
    season?: number
    episode?: number
    episodeTitle?: string
    totalEpisodes?: number
    watchedEpisodes?: number
    timeSpentSeconds?: number
    updatedAt: string
}
