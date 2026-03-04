/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database as DatabaseType } from './database.types'

export type Database = DatabaseType;

type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ortam değişkeni tanımlanmamış!')
}

if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY ortam değişkeni tanımlanmamış!')
}

// Singleton: Tarayıcıda yalnızca bir Supabase istemcisi oluştur.
// Next.js Fast Refresh'te modül yeniden yüklense bile aynı istemciyi kullan.
// Bu, birden fazla GoTrue istemcisinin navigator.locks üzerinde çakışmasını engeller
// ("AbortError: Lock broken by another request with the 'steal' option").
let cachedClient: SupabaseClient | null = null;

export const createClient = (): SupabaseClient => {
    if (typeof window !== 'undefined') {
        if (cachedClient) return cachedClient;

        cachedClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
        return cachedClient;
    }

    // SSR ortamında her seferinde yeni bir istemci oluştur (window yok)
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
