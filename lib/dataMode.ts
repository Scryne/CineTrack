/**
 * Veri modu: `supabase` (hesap + bulut eşitleme) ya da `local` (bu tarayıcıda, hesapsız).
 *
 * `NEXT_PUBLIC_DATA_MODE` açıkça verilirse o kullanılır; verilmezse Supabase anahtarları
 * tanımlıysa `supabase`, değilse `local`. Supabase projesi kapandığında anahtarlar dosyada
 * kalsa bile `NEXT_PUBLIC_DATA_MODE=local` uygulamayı tam işlevli tutar.
 */
export type DataMode = 'local' | 'supabase'

function resolveMode(): DataMode {
    const explicit = process.env.NEXT_PUBLIC_DATA_MODE
    if (explicit === 'local' || explicit === 'supabase') return explicit
    return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'supabase' : 'local'
}

export const DATA_MODE: DataMode = resolveMode()
export const isLocalMode = DATA_MODE === 'local'
