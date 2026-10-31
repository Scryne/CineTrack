/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Yerel mod: Supabase istemcisinin `lib/db.ts`'in kullandığı alt kümesini tarayıcı
 * deposu (localStorage) üzerinde taklit eder.
 *
 * Neden: CineTrack'in Supabase projesi artık yok (alan adı çözülmüyor). Yerel mod olmadan
 * izleme listesi, izlenenler, puanlar ve listeler sessizce `null` dönüyor, uygulama fiilen
 * salt okunur kalıyordu. `db.ts`'in 40 fonksiyonunu ikinci kez yazmak yerine aynı sorgu
 * zinciri burada çalıştırılır: iki modun davranışı ayrışamaz, Supabase yeniden bağlanınca
 * tek değişen istemcidir.
 *
 * Desteklenen alt küme (db.ts'te kullanılanın tamamı): from → select / insert / upsert /
 * delete · eq / in · order / limit / range · single / maybeSingle · `*, tablo(*)` gömme ·
 * auth.getUser / onAuthStateChange / signOut.
 */

type Row = Record<string, any>
type Store = Record<string, Row[]>
type QueryResult = { data: any; error: { code?: string; message: string } | null }

export const LOCAL_STORE_KEY = 'cinetrack-yerel-v1'

export const LOCAL_USER = {
    id: 'yerel-kullanici',
    email: null,
    app_metadata: { provider: 'local' },
    user_metadata: { name: 'Yerel profil' },
    aud: 'local',
    created_at: '2026-01-01T00:00:00.000Z',
} as const

/** Satır eklenirken boşsa "şimdi" ile doldurulan zaman sütunları (Postgres varsayılanlarının karşılığı). */
const TIMESTAMP_DEFAULTS: Record<string, string[]> = {
    watchlist: ['added_at'],
    watched: ['watched_at'],
    episodes: ['watched_at'],
    ratings: ['rated_at'],
    tags: ['created_at'],
    custom_lists: ['created_at'],
    custom_list_items: ['added_at'],
    watch_progress: ['updated_at'],
    profiles: ['created_at', 'updated_at'],
}

/** Her yazımda yenilenen sütun: "son izlenenler" sıralaması buna dayanıyor. */
const TOUCH_ON_WRITE: Record<string, string> = { watch_progress: 'updated_at', profiles: 'updated_at' }

/** Üst satır silinince alt satırlar da gider (veritabanındaki ON DELETE CASCADE). */
const CASCADE: Record<string, [string, string][]> = { custom_lists: [['custom_list_items', 'list_id']] }

/** `*, tablo(*)` gömmesinde alt tablonun üst satıra bağlandığı sütun. */
const EMBED_FOREIGN_KEY: Record<string, string> = { custom_list_items: 'list_id' }

let memoryStore: Store = {}

function readStore(): Store {
    if (typeof window === 'undefined') return memoryStore
    try {
        const raw = window.localStorage.getItem(LOCAL_STORE_KEY)
        return raw ? (JSON.parse(raw) as Store) : {}
    } catch {
        return {}
    }
}

function writeStore(store: Store) {
    if (typeof window === 'undefined') {
        memoryStore = store
        return
    }
    try {
        window.localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store))
    } catch {
        // Kota dolu ya da gizli pencere: yazma başarısız, çağıran hata nesnesini alır.
        throw new Error('Tarayıcı deposuna yazılamadı (depo dolu ya da kapalı).')
    }
}

function newId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function same(a: unknown, b: unknown): boolean {
    return a === b || (a !== null && b !== null && a !== undefined && b !== undefined && String(a) === String(b))
}

/** JSON'a giremeyen `undefined` değerleri Supabase'deki gibi "bu sütuna dokunma" demektir. */
function defined(row: Row): Row {
    return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined))
}

type Filter = { column: string; op: 'eq' | 'in'; value: any }

class LocalQuery implements PromiseLike<QueryResult> {
    private op: 'select' | 'insert' | 'upsert' | 'delete' = 'select'
    private payload: Row[] = []
    private conflict: string[] = ['id']
    private columns = '*'
    private returning = false
    private filters: Filter[] = []
    private orders: { column: string; ascending: boolean }[] = []
    private rangeFrom: number | null = null
    private rangeTo: number | null = null
    private mode: 'many' | 'single' | 'maybeSingle' = 'many'

    constructor(private table: string) {}

    select(columns = '*') {
        this.columns = columns
        if (this.op !== 'select') this.returning = true
        return this
    }

    insert(rows: Row | Row[]) {
        this.op = 'insert'
        this.payload = Array.isArray(rows) ? rows : [rows]
        return this
    }

    upsert(rows: Row | Row[], options?: { onConflict?: string }) {
        this.op = 'upsert'
        this.payload = Array.isArray(rows) ? rows : [rows]
        if (options?.onConflict) this.conflict = options.onConflict.split(',').map((c) => c.trim())
        return this
    }

    delete() {
        this.op = 'delete'
        return this
    }

    eq(column: string, value: any) {
        this.filters.push({ column, op: 'eq', value })
        return this
    }

    in(column: string, values: any[]) {
        this.filters.push({ column, op: 'in', value: values })
        return this
    }

    order(column: string, options?: { ascending?: boolean }) {
        this.orders.push({ column, ascending: options?.ascending ?? true })
        return this
    }

    limit(count: number) {
        this.rangeFrom = 0
        this.rangeTo = count - 1
        return this
    }

    range(from: number, to: number) {
        this.rangeFrom = from
        this.rangeTo = to
        return this
    }

    single() {
        this.mode = 'single'
        return this
    }

    maybeSingle() {
        this.mode = 'maybeSingle'
        return this
    }

    then<TResult1 = QueryResult, TResult2 = never>(
        onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2> {
        return Promise.resolve()
            .then(() => this.execute())
            .then(onfulfilled, onrejected)
    }

    private matches(row: Row): boolean {
        return this.filters.every((f) =>
            f.op === 'eq' ? same(row[f.column], f.value) : (f.value as any[]).some((v) => same(row[f.column], v))
        )
    }

    private execute(): QueryResult {
        try {
            const store = readStore()
            const rows = store[this.table] ?? []
            let result: Row[]

            if (this.op === 'select') {
                result = this.project(store, this.sorted(rows.filter((r) => this.matches(r))))
            } else if (this.op === 'delete') {
                const removed = rows.filter((r) => this.matches(r))
                store[this.table] = rows.filter((r) => !this.matches(r))
                for (const [child, fk] of CASCADE[this.table] ?? []) {
                    const ids = new Set(removed.map((r) => r.id))
                    store[child] = (store[child] ?? []).filter((c) => !ids.has(c[fk]))
                }
                writeStore(store)
                result = removed
            } else {
                const written = this.write(store, rows)
                writeStore(store)
                // Yazma sonrası select(...) Supabase'deki gibi seçilen sütunları (ve gömmeyi) döndürür.
                result = this.project(store, written)
            }

            return this.shape(this.op === 'select' || this.returning ? result : null, result)
        } catch (err) {
            return { data: null, error: { message: err instanceof Error ? err.message : String(err) } }
        }
    }

    private write(store: Store, rows: Row[]): Row[] {
        const now = new Date().toISOString()
        const written: Row[] = []
        for (const incoming of this.payload.map(defined)) {
            const touch = TOUCH_ON_WRITE[this.table]
            const existing =
                this.op === 'upsert' ? rows.find((r) => this.conflict.every((c) => same(r[c], incoming[c]))) : undefined
            if (existing) {
                Object.assign(existing, incoming, touch ? { [touch]: now } : {})
                written.push(existing)
                continue
            }
            if (this.op === 'insert' && this.conflict.length && rows.some((r) => same(r.id, incoming.id))) {
                throw new Error('Aynı kimlikte satır zaten var.')
            }
            const row: Row = { id: newId(), ...incoming }
            for (const column of TIMESTAMP_DEFAULTS[this.table] ?? []) row[column] ??= now
            rows.push(row)
            written.push(row)
        }
        store[this.table] = rows
        return written
    }

    private sorted(rows: Row[]): Row[] {
        let out = [...rows]
        for (const { column, ascending } of [...this.orders].reverse()) {
            out.sort((a, b) => {
                const x = a[column] ?? ''
                const y = b[column] ?? ''
                return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1)
            })
        }
        if (this.rangeFrom !== null && this.rangeTo !== null) out = out.slice(this.rangeFrom, this.rangeTo + 1)
        return out
    }

    private project(store: Store, rows: Row[]): Row[] {
        const parts = this.columns.split(',').map((p) => p.trim()).filter(Boolean)
        const embeds = parts
            .map((p) => /^(\w+)\(\*\)$/.exec(p)?.[1])
            .filter((t): t is string => Boolean(t))
        const plain = parts.filter((p) => !/\(/.test(p))
        return rows.map((row) => {
            const base: Row = plain.includes('*') ? { ...row } : Object.fromEntries(plain.map((c) => [c, row[c] ?? null]))
            for (const child of embeds) {
                const fk = EMBED_FOREIGN_KEY[child]
                base[child] = (store[child] ?? []).filter((c) => same(c[fk], row.id)).map((c) => ({ ...c }))
            }
            return base
        })
    }

    private shape(data: Row[] | null, rows: Row[]): QueryResult {
        if (this.mode === 'many') return { data, error: null }
        if (rows.length === 0) {
            return this.mode === 'maybeSingle'
                ? { data: null, error: null }
                : { data: null, error: { code: 'PGRST116', message: 'Satır bulunamadı.' } }
        }
        if (rows.length > 1) return { data: null, error: { code: 'PGRST116', message: 'Birden çok satır döndü.' } }
        return { data: data ? data[0] : null, error: null }
    }
}

type AuthListener = (event: string, session: { user: typeof LOCAL_USER } | null) => void

export function createLocalClient() {
    return {
        from: (table: string) => new LocalQuery(table),
        auth: {
            getUser: async () => ({ data: { user: LOCAL_USER }, error: null }),
            getSession: async () => ({ data: { session: { user: LOCAL_USER } }, error: null }),
            onAuthStateChange: (callback: AuthListener) => {
                // Yerel profil hep "oturum açık"; dinleyici ilk durumu yine de almalı.
                queueMicrotask(() => callback('INITIAL_SESSION', { user: LOCAL_USER }))
                return { data: { subscription: { unsubscribe: () => undefined } } }
            },
            signOut: async () => ({ error: null }),
        },
    }
}

/** Yerel verinin tamamı (dışa aktarma için) ve temizlenmesi. */
export function exportLocalData(): Store {
    return readStore()
}

export function clearLocalData() {
    writeStore({})
}
