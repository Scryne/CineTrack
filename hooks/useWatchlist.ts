'use client'
import { useState, useEffect } from 'react'
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/db'

export function useWatchlist(tmdbId: string, type: 'film' | 'dizi') {
    const [inWatchlist, setInWatchlist] = useState(false)
    const [loading, setLoading] = useState(true)
    const [pending, setPending] = useState(false)

    useEffect(() => {
        isInWatchlist(tmdbId, type).then(result => {
            setInWatchlist(result)
            setLoading(false)
        }).catch(() => {
            setInWatchlist(false)
            setLoading(false)
        })
    }, [tmdbId, type])

    const toggle = async (item: { title: string; posterPath: string }) => {
        if (pending) return
        setPending(true)
        const previousState = inWatchlist

        // Optimistic update — önce UI'ı değiştir
        setInWatchlist(!inWatchlist)

        try {
            if (inWatchlist) {
                await removeFromWatchlist(tmdbId, type)
            } else {
                await addToWatchlist({ id: tmdbId, type, ...item, addedAt: new Date().toISOString() })
            }
        } catch {
            // Hata olursa eski state'e dön
            setInWatchlist(previousState)
        } finally {
            setPending(false)
        }
    }

    return { inWatchlist, loading, pending, toggle }
}
