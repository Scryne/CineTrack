export type Source = {
    id: string
    name: string
    getMovieUrl: (tmdbId: string) => string
    getEpisodeUrl: (tmdbId: string, season: number, episode: number) => string
    isAvailable: boolean
}

export type Subtitle = {
    id: number
    language: string
    languageName: string
    url: string
    format: 'srt' | 'vtt'
    rating: number
}

export type PlayerState = {
    sourceIndex: number
    subtitleId: number | null
    isLoading: boolean
    hasError: boolean
    errorMessage: string | null
}

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

// --- OpenSubtitles API Types ---

export type SubtitleSearchParams = {
    tmdbId: string
    type: 'film' | 'dizi'
    season?: number
    episode?: number
    languages?: string[]
}

export type SubtitleFile = {
    fileId: number
    fileName: string
    url?: string
}

export type SubtitleResult = {
    id: number
    language: string
    languageName: string
    rating: number
    downloadCount: number
    files: SubtitleFile[]
}
