// ==========================================
// CineTrack - Logger Utility
// ==========================================

type LogLevel = 'error' | 'warn' | 'info'

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
    error: (message: string, error?: unknown) => {
        // Always log errors, even in production
        console.error(`[CineTrack Error] ${message}`, error || '')
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
