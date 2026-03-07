'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useUser() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        // Use onAuthStateChange which fires INITIAL_SESSION on mount
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null)
                if (event === 'INITIAL_SESSION') {
                    setLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
    }, [supabase])

    return { user, loading, signOut }
}
