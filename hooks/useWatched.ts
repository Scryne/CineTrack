'use client'
import { useState, useEffect } from 'react'
import { addToWatched, removeFromWatched, isWatched } from '@/lib/db'

export function useWatched(tmdbId: string, type: 'film' | 'dizi') {
    const [watched, setWatched] = useState(false)
    const [loading, setLoading] = useState(true)
    const [pending, setPending] = useState(false)

    useEffect(() => {
        isWatched(tmdbId, type).then(result => {
            setWatched(result)
            setLoading(false)
        }).catch(() => {
            setWatched(false)
            setLoading(false)
        })
    }, [tmdbId, type])

    const toggle = async (item: { title: string; posterPath: string }) => {
        if (pending) return
        setPending(true)
        const previousState = watched

        // Optimistic update
        setWatched(!watched)

        try {
            if (watched) {
                await removeFromWatched(tmdbId, type)
            } else {
                await addToWatched({ id: tmdbId, type, ...item })
            }
        } catch {
            setWatched(previousState)
        } finally {
            setPending(false)
        }
    }

    return { watched, loading, pending, toggle }
}
