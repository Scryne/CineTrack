/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database as DatabaseType } from './database.types'
import { isLocalMode } from './dataMode'
import { createLocalClient } from './localClient'

export type Database = DatabaseType;

type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!isLocalMode && (!supabaseUrl || !supabaseAnonKey)) {
    throw new Error('Supabase modu seçili ama NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil.')
}

// Singleton: Tarayıcıda yalnızca bir Supabase istemcisi oluştur.
// Next.js Fast Refresh'te modül yeniden yüklense bile aynı istemciyi kullan.
// Bu, birden fazla GoTrue istemcisinin navigator.locks üzerinde çakışmasını engeller
// ("AbortError: Lock broken by another request with the 'steal' option").
let cachedClient: SupabaseClient | null = null;

export const createClient = (): SupabaseClient => {
    // Yerel mod: aynı sorgu zinciri tarayıcı deposunda çalışır (lib/localClient.ts).
    if (isLocalMode) return createLocalClient() as unknown as SupabaseClient

    if (typeof window !== 'undefined') {
        if (cachedClient) return cachedClient;

        cachedClient = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
        return cachedClient;
    }

    // SSR ortamında her seferinde yeni bir istemci oluştur (window yok)
    return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
}
