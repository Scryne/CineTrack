// ==========================================
// CineTrack - Logger Utility
// ==========================================

type LogLevel = 'error' | 'warn' | 'info'

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
    error: (message: string, error?: unknown) => {
        if (isDev) {
            console.error(`[CineTrack Error] ${message}`, error)
        }
        // Production'da burada Sentry veya benzeri bir servis çağrılabilir
    },
    warn: (message: string) => {
        if (isDev) {
            console.warn(`[CineTrack Warn] ${message}`)
        }
    },
    info: (message: string) => {
        if (isDev) {
            console.info(`[CineTrack Info] ${message}`)
        }
    },
}

export type { LogLevel }
