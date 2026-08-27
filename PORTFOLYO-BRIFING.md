# CineTrack — Portföy Brifingi

> Bu dosya veri çıkarma çıktısıdır, pazarlama metni değildir. Her sayının yanında kaynağı vardır.
> Ölçüm tarihi: 2026-08-08. Ölçümler `main` dalında, `5e42273` commit'i üzerinde yapıldı.

---

## 1. Künye

**Ne yapar** — Kullanıcının izlediği ve izleyeceği film/dizileri kaydeden, puanlayan ve bölüm
bazında takip eden bir web uygulaması; içeriği gömülü üçüncü taraf oynatıcılar üzerinden
uygulama içinde de oynatıyor.

**Kimin için** — Koddan çıkarılabildiği kadarıyla: tek kullanıcılık kişisel kullanım. Paylaşım,
takip etme, yorum, çok kullanıcılı liste gibi hiçbir sosyal özellik yok; tüm Supabase sorguları
`.eq('user_id', user.id)` ile kendi verisine kilitli (`lib/db.ts` genelinde). Arayüz tamamen
Türkçe; rota adları da Türkçe (`/kesif`, `/koleksiyon`, `/dizilerim`, `/izle`) — hedef kitle
Türkçe konuşan kullanıcı. TMDB istekleri `LANGUAGE = "tr-TR"` ile atılıyor, boş dönerse
İngilizce'ye düşüyor (`lib/tmdb.ts:7-8`).

**Çalışma dönemi** — Git geçmişi: **2026-03-02 → 2026-08-08** (`git log --reverse --date=short`
ve `git log -1`). Ama bu geçmiş gerçek çalışma dönemini **yansıtmıyor**:

| Commit | Tarih | Not |
| --- | --- | --- |
| `b7c9202` | 2026-03-02 | "Initial commit with full CineTrack features" — proje git'e **bitmiş halde** girmiş |
| `e796787` | 2026-03-04 | Veri katmanı yeniden yazımı (bkz. bölüm 6) |
| `e76e5c8` | 2026-03-07 | 20 dosyada arayüz değişikliği + README |
| `5e42273` | 2026-08-08 | Hata düzeltmeleri ve güvenlik iyileştirmeleri |

Yani: 2–7 Mart arası yoğun bir hafta, ardından **5 aylık ara**, sonra 8 Ağustos'ta tek bir
bakım commit'i. İlk commit'ten önceki geliştirme süresi git'te **kayıtlı değil** — o dönemin
uzunluğu `BİLİNMİYOR`. (Not: bu bir çıkarım değil ölçüm — ilk commit 100+ dosya ve tam
özellik setiyle geliyor.)

**Rol** — `git shortlog -sn --all` iki kimlik gösteriyor:

```
3  Your Name <you@example.com>
1  Scryne <218348029+Scryne@users.noreply.github.com>
```

`Your Name <you@example.com>` git'in yapılandırılmamış varsayılan değeri. **Çıkarım** (ölçüm
değil): tek geliştirici, ilk üç commit'te git kimliği ayarlanmamış. Kod içinde başka bir
katkıda bulunana dair iz yok. Son commit'te `Co-Authored-By: Claude Opus 5` trailer'ı var
(`git show 5e42273`).

**Yığın** (mimariyi belirleyenler, manifest'in tamamı değil):

1. **Next.js 14.2.35, App Router** — `package.json`; 15 sayfanın **15'i de** `'use client'`
   (`grep -rl "use client" app --include="page.tsx"` → 15/15)
2. **TypeScript 5** — `tsconfig.json`, `npx tsc --noEmit` temiz
3. **Supabase** — Auth (GoTrue) + Postgres; 9 tablo (`lib/database.types.ts`)
4. **Tailwind CSS 3** — `tailwind.config.ts`, tek `globals.css` (97 satır)
5. **TMDB API** — tüm içerik verisi; kendi `/api/tmdb` proxy route'u üzerinden
6. **Üçüncü taraf embed oynatıcılar** — `lib/sources.ts`, 4 kaynak, `<iframe>` ile
7. **Framer Motion 12** — sayfa geçişleri ve mikro animasyonlar
8. **PWA** — elle yazılmış `public/sw.js` (64 satır) + `manifest.json`

**Satır ve dosya sayısı** (`node_modules`, `.next`, üretilmiş dosyalar hariç):

| Ölçüm | Değer | Kaynak |
| --- | --- | --- |
| TS/TSX dosya | 71 | `find app components lib hooks types -name "*.ts" -o -name "*.tsx" \| wc -l` |
| TS/TSX satır | 15.092 | `find ... -exec wc -l {} +` |
| + CSS/SW/worker | 15.295 toplam | `globals.css` 97 + `sw.js` 64 + `subtitlesWorker.js` 42 |
| Git'te izlenen dosya | 102 | `git ls-files \| wc -l` |
| Test dosyası | **0** | `find ... -name "*.test.*" -o -name "*.spec.*"` → 0 |

En büyük dosyalar: `app/izle/dizi/[id]/[sezon]/[bolum]/page.tsx` 1023 satır ·
`lib/tmdb.ts` 627 · `app/profil/page.tsx` 622 · `app/page.tsx` 604 ·
`app/izle/film/[id]/page.tsx` 580 · `app/oneriler/page.tsx` 542.

**Commit sayısı** — 4 (`git rev-list --count HEAD`).

---

## 2. Durum

### `geliştirme`

**Gerekçe:** Özellik yüzeyi geniş ve derleniyor, ama dağıtılmamış, test edilmemiş ve README'nin
vaat ettiği özelliklerin bir kısmı arayüzde yok.

Ölçülebilir ayrıntılar:

- **Derleme temiz:** `npm run build` başarılı, 18 rota üretiliyor; `npx tsc --noEmit` 0 hata;
  `npm run lint` **0 hata, 1 uyarı** (`app/izle/dizi/[id]/[sezon]/[bolum]/page.tsx:298`,
  `react-hooks/exhaustive-deps`).
- **Test 0/0:** Test dosyası yok, test runner bağımlılığı yok, `.github/` klasörü yok — CI yok.
  Depodaki `test_sources.js` bir test değil, embed kaynaklarına tek seferlik `fetch` atan
  25 satırlık bir betik.
- **Yayında değil:** `.vercel`, Dockerfile, dağıtım yapılandırması yok; README'de canlı URL yok.
- **README'de olup arayüzde olmayan üç özellik** (bölüm 3'te ayrıntılı):
  - "Özel Listeler" — `lib/db.ts`'te 5 fonksiyon + 2 tablo var, **hiçbir bileşen çağırmıyor**
    (`grep -rn "CustomList\|custom_list" app components hooks` → 0 sonuç)
  - "Yıl Sonu Özeti (Wrapped)" — `components/profil/WrappedModal.tsx` yazılmış ama
    **hiçbir yerden import edilmiyor** (`grep -rn "WrappedModal" app components` → yalnızca
    kendi dosyası)
  - "Yapay Zeka Destekli Özet Bandı" — kodda **hiçbir LLM/AI çağrısı yok**
    (`grep -rin "openai\|anthropic\|claude\|gemini" app components lib` → 0 sonuç)
- **Ölü bağlantılar:** `middleware.ts:56` `/listeler` rotasını koruyor, ama `app/listeler/`
  klasörü yok. `app/koleksiyon/page.tsx:110` ve `components/Navbar.tsx:76`
  `cinetrack_supabase_update` olayını dinliyor, ama kodda **hiçbir yerde**
  `dispatchEvent` çağrısı yok (`grep -rn "dispatchEvent" app components hooks lib` → 0).
- **Kullanılmayan bağımlılık:** `recharts` `package.json`'da, kodda kullanılmıyor
  (`grep -rln "recharts" app components` → 0).
- `TODO`/`FIXME`/`HACK` sayısı: **0** (`grep -rn` → 0). Yarım kalmışlık yorum olarak değil,
  **çağrılmayan kod** olarak duruyor.

Ayrıca bölüm 9'daki yayın engeli, projeyi teknik olgunluğundan bağımsız olarak "yayında"
olamaz durumda tutuyor.

---

## 3. Problem

### README'nin tanımı

README'de açık bir problem tanımı **yok**. Olan şey bir ürün tanıtımı: "film ve dizi tutkunları
için geliştirilmiş modern, hızlı ve kullanıcı dostu bir izleme takip uygulaması"
(`README.md:32`). Bu bir problem cümlesi değil.

### Koddan çıkan problem tanımı

Kodda üç somut acı noktası, üzerine kod yazılacak kadar ciddiye alınmış:

1. **İzleme takibi cihaza hapsoluyor.** Projenin ilk hali veriyi `localStorage`'da tutuyordu
   (`git show b7c9202:lib/storage.ts`, 562 satır, 10 ayrı `localStorage` anahtarı). İkinci
   commit'te bunun tamamı silinip Supabase'e taşındı. Yani çözülen problem: *"listem tarayıcıyı
   değiştirince kayboluyor."*

2. **Dizi takibinde granülerlik eksikliği.** `episodes` tablosu bölüm bazında satır tutuyor
   (`user_id, series_id, season_number, episode_number` — `lib/db.ts:291-296`); tüm sezonu
   işaretleme, sezonun bir kısmını işaretleme ve toplu geri alma için ayrı fonksiyonlar var
   (`markSeasonEpisodesWatched`, `markAllSeriesEpisodesWatched`, `removeAllEpisodesWatched`).
   Uzun dizilerde 1000+ satır beklendiği için upsert'ler 500'lük parçalara bölünmüş
   (`EPISODE_UPSERT_CHUNK_SIZE`, `lib/db.ts:300`). Çözülen problem: *"20 sezonluk dizide nerede
   kaldığımı hatırlamıyorum."*

3. **TMDB'ye erişim engeli.** `/api/tmdb` route'u TMDB'ye önce doğrudan gidiyor, başarısız
   olursa isteği `api.codetabs.com` üzerinden tekrarlıyor; kod yorumu sebebi açıkça yazıyor:
   `// Attempt 1: Direct fetch (may fail due to ISP DNS/IP block)` ve
   `// Attempt 2: Proxy-based fetch (bypass ISP block)` (`app/api/tmdb/route.ts:62,79`).
   Çözülen problem: *"TMDB'ye buradan erişilemiyor."* Bu, projenin Türkiye bağlamında
   yazıldığının en sağlam kanıtı.

### Ayrışma

README ile kod **ayrışmış**, güncel olan kod. README özellik listesinde arayüzde karşılığı
olmayan üç madde var (bölüm 2) ve "Netflix Seviyesi", "Kapsamlı testlerden geçirilmiş"
(test yok), "pürüzsüz otomatik failover" gibi kanıtsız iddialar taşıyor. README, 7 Mart
commit'inde son kez güncellenmiş; 8 Ağustos'taki davranış değişiklikleri README'ye
yansımamış.

---

## 4. Sistem

### Ana bileşenler ve sorumluluk sınırları

| Bileşen | Sorumluluk | Sınır ihlali var mı |
| --- | --- | --- |
| `middleware.ts` (75 satır) | Her istekte `getUser()` ile JWT doğrula, 7 rota önekini koru, giriş yapmış kullanıcıyı `/auth`'tan uzak tut | Temiz. Koruduğu `/listeler` rotası mevcut değil |
| `app/api/tmdb/route.ts` (99 satır) | TMDB'ye tek çıkış kapısı: 14 desenlik uç allowlist'i, API anahtarını sunucuda tut, 4 sn timeout, proxy fallback, 1 saat CDN cache | Temiz |
| `lib/tmdb.ts` (627 satır) | TMDB uç noktalarının tipli sarmalayıcıları, TR→EN dil fallback'i, görsel URL yardımcıları | Temiz, ama route'taki allowlist ile **elle senkron tutulmak zorunda** (route'ta bu yorumla yazılı) |
| `lib/db.ts` (978 satır) | Supabase üzerindeki **tüm** veri işlemleri: watchlist, watched, episodes, ratings, watch_progress, tags, custom_lists, profiles, notification settings | **Her şeyi yapıyor.** 9 tablonun tamamı tek dosyada; içinde çağrılmayan iki alan (tags, custom_lists) var |
| `lib/sources.ts` (203 satır) | 4 embed kaynağının URL üretimi, sağlık kontrolü (sessionStorage'da 30 dk cache), X-Frame engelli kaynağı 1 saat bloklama | Temiz |
| `components/player/VideoPlayer.tsx` (398 satır) | iframe gömme, yükleme/hata durumu, popup engelleme (`window.open` override), VTT altyazı ayrıştırma (web worker) ve **kendi saatiyle** altyazı senkronu | **Sınır aşımı:** oynatıcı kabuğu aynı zamanda reklam engelleyici ve altyazı motoru |
| `app/izle/dizi/[id]/[sezon]/[bolum]/page.tsx` (1023 satır) | Bölüm izleme sayfası: veri çekme, kaynak seçimi, altyazı arama/indirme, ilerleme kaydı, otomatik "izlendi", sonraki bölüm geri sayımı, dokunmatik kaydırma, baskın renk çıkarma | **Sınır aşımı.** Projenin en büyük dosyası; tek bileşende en az 7 ayrı sorumluluk |
| `hooks/` (3 hook, toplam 116 satır) | `useUser`, `useWatchlist`, `useWatched` | Kısmi kullanımda — sayfaların çoğu hook yerine `lib/db.ts`'i doğrudan çağırıyor (20 import noktası) |

### Veri akışı

**Girdi nereden geliyor:**
- İçerik verisi (film/dizi/kişi/sezon): TMDB → `/api/tmdb` → `lib/tmdb.ts` → sayfa
- Puan verisi (IMDb/RT/Metacritic): OMDb, **tarayıcıdan doğrudan** (`lib/omdb.ts`)
- Altyazı: OpenSubtitles, **tarayıcıdan doğrudan** (`lib/subtitles.ts`)
- Video: 4 üçüncü taraf embed sitesinden biri, `<iframe src>` ile — **hiç sunucudan geçmiyor**
- Kullanıcı girdisi: form/tıklama → `lib/db.ts`

**Nerede duruyor:**
- Supabase Postgres, 9 tablo: `watchlist`, `watched`, `episodes`, `ratings`, `watch_progress`,
  `tags`, `custom_lists`, `custom_list_items`, `profiles` (`lib/database.types.ts`)
- Oturum: Supabase çerezi (middleware `getUser()` ile doğruluyor, `getSession()` değil —
  kod yorumu bunu açıkça belirtiyor: `middleware.ts:47`)
- Kaynak sağlık durumu ve blok listesi: `sessionStorage` (kalıcı değil, bilinçli)
- Bildirim saati: `localStorage` (`lib/notifications.ts:47`)

**Nasıl çıkıyor:**
- Ekran; `html2canvas` ile PNG kart üretimi (`components/profil/ShareCardModal.tsx:50`)
- Service Worker üzerinden yerel bildirim (`public/sw.js`)
- Dışa aktarma (export) özelliği **yok**

### Dış bağımlılıklar

| Bağımlılık | Zorunlu mu | Nerede çağrılıyor |
| --- | --- | --- |
| TMDB API | **Evet** — anahtarsız route 500 döner | Sunucu (`/api/tmdb`) |
| Supabase (Auth + Postgres) | **Evet** — `lib/supabase.ts:13-19` anahtar yoksa `throw` eder, uygulama açılmaz | İstemci + middleware |
| `api.codetabs.com` (genel proxy) | Hayır, yalnızca fallback | Sunucu |
| OMDb API | Hayır — anahtar yoksa sessizce boş döner | **İstemci** |
| OpenSubtitles API | Hayır — anahtar yoksa `[]` döner (`lib/subtitles.ts:33`) | **İstemci** |
| autoembed.co, player.smashy.stream, vidsrc.net, multiembed.mov | İzleme özelliği için evet | **İstemci (iframe)** |

### Diyagram önerisi — 9 kutu

```
1. Tarayıcı (Next.js istemci sayfaları, 15/15 'use client')
2. middleware.ts (JWT doğrulama, 7 korumalı rota)
3. /api/tmdb (allowlist'li proxy, 4 sn timeout)
4. TMDB API
5. codetabs proxy (yalnızca fallback yolu)
6. Supabase Auth
7. Supabase Postgres (9 tablo)
8. Üçüncü taraf embed oynatıcı (iframe, 4 kaynak, failover)
9. OpenSubtitles + OMDb (istemciden doğrudan)
```

Kritik oklar: 1→2→1 (yönlendirme) · 1→3→4 · 3⇢5 (kesikli: yalnızca 4 başarısızsa) ·
1↔6 · 1↔7 · 1→8 (tek yönlü, cross-origin duvarı) · 1→9.
Kutu 8'e giden okun **cross-origin duvarı** olarak işaretlenmesi anlatının merkezinde:
bölüm 5'teki üçüncü kararın bedeli oradan doğuyor.

---

## 5. Kritik kararlar

### Karar 1 — Veri katmanını `localStorage`'dan Supabase'e taşımak

- **Seçim:** İkinci commit'te (`e796787`) `lib/storage.ts` (562 satır, saf `localStorage`)
  silindi, yerine `lib/db.ts` (938 satır, Supabase) yazıldı. Aynı commit'te `middleware.ts`,
  `app/auth/`, `lib/supabase.ts`, `lib/database.types.ts` (389 satır) eklendi.
- **Alternatif:** `localStorage`'da kalıp elle JSON dışa/içe aktarma vermek — cihaz değişiminde
  kullanıcı dosyayı taşır. Uygulama kimlik doğrulamasız kalırdı.
- **Gerekçe:** Cihazlar arası senkronizasyon ve veri kalıcılığı. Tarayıcı verisi
  silinebiliyor; izleme geçmişi kaybı bu üründe kullanıcıyı geri getirilemez şekilde kaybettirir.
- **Bedel:** Üç ayrı kayıp.
  (a) **Uygulama giriş zorunlu hale geldi** — `/koleksiyon`, `/profil`, `/gecmis`, `/izle`
  dahil 7 rota kimlik doğrulaması istiyor (`middleware.ts:50-56`; ölçüldü: `/koleksiyon` →
  HTTP 307 → `/auth`). Anonim deneme yolu kapandı.
  (b) **Göç yolu yazılmadı** — mevcut `localStorage` verisini Supabase'e taşıyan hiçbir kod yok
  (`grep -rn "cinetrack_watchlist\|cinetrack_watched" app components lib hooks` → 0 sonuç).
  O tarihte tarayıcısında verisi olan kullanıcı verisini kaybetti.
  (c) Her veri okuması artık ağ isteği; çevrimdışı yazma tamamen kayboldu (PWA ve Service
  Worker hâlâ duruyor olmasına rağmen).

### Karar 2 — TMDB'yi kendi sunucu route'undan, allowlist'li proxy olarak geçirmek

- **Seçim:** Tüm TMDB istekleri `/api/tmdb?endpoint=...`'ten geçiyor. Route 14 regex desenlik
  bir allowlist tutuyor, anahtarı sunucuda tutuyor, 4 sn timeout uyguluyor, doğrudan istek
  başarısız olursa aynı isteği `api.codetabs.com` üzerinden tekrarlıyor, yanıtı
  `s-maxage=3600` ile cache'liyor.
- **Alternatif:** Tarayıcıdan doğrudan `api.themoviedb.org`'a gitmek — TMDB CORS'a izin verir,
  route hiç yazılmazdı.
- **Gerekçe:** Kod yorumlarında yazılı: ISP'nin DNS/IP engeli doğrudan isteği düşürüyor
  (`app/api/tmdb/route.ts:62,79`). Sunucudan gitmek engeli aşıyor; ayrıca API anahtarı
  istemci paketine girmiyor ve tek kapı cache'lenebiliyor.
- **Bedel:** Üç kayıp.
  (a) **Bakım borcu, kodun kendisinde itiraf edilmiş:** "Bu liste `lib/tmdb.ts`'ten birebir
  türetilmiştir; oraya yeni bir uç eklenirse buraya da eklenmelidir, aksi halde istek 400
  döner" (`app/api/tmdb/route.ts:10-12`). İki dosya elle senkron tutuluyor, bunu doğrulayan
  test yok.
  (b) **Fallback yolunda sorgu üçüncü bir tarafa gidiyor** — `api.codetabs.com` isteği görüyor
  (arama terimi dahil). Bu servis üzerinde hiçbir kontrol yok.
  (c) Her içerik isteği kendi sunucusundan geçiyor: ek gecikme + dağıtımda fonksiyon çağrısı
  maliyeti. Ölçüm: yerelde ana sayfa 0,18 sn'de 200 dönüyor, ama bu cache'li tek isteklik
  bir ölçüm, yük altındaki davranış `BİLİNMİYOR`.

### Karar 3 — Videoyu üçüncü taraf embed'lerle, iframe içinde oynatmak

- **Seçim:** 4 embed sağlayıcı (`lib/sources.ts`), `<iframe>` ile gömülüyor; sağlık kontrolü,
  başarısız kaynağı 1 saat bloklama ve el ile kaynak değiştirme var.
- **Alternatif:** Hiç oynatmamak, yalnızca TMDB Watch Providers ile "nerede yasal olarak
  izlenir" bilgisini göstermek. Bu veri **zaten çekiliyor** (`getWatchProviders`,
  `app/api/tmdb/route.ts:24`) — yani alternatif hipotetik değil, kodda mevcut.
- **Gerekçe:** Takip uygulamasından çıkıp uygulama içi izleme deneyimi vermek; kullanıcıyı
  siteden çıkarmamak.
- **Bedel:** Bu projenin en pahalı kararı, dört ayrı bedeli var.
  (a) **Oynatma zamanı okunamıyor.** iframe cross-origin; `currentTime` yok. Altyazı senkronu
  bu yüzden gerçek videoya değil, **embed yüklendiği andan itibaren duvar saatine** bağlı
  (`VideoPlayer.tsx:224` — `timerStartRef.current = performance.now()`). Kullanıcı duraklatırsa
  altyazı kayıyor; çözüm olarak elle **±0,5 sn offset butonları** konmuş
  (`VideoPlayer.tsx:376-393`). Bu bir özellik değil, bir tazminat.
  (b) **"İzlendi" işareti tahmin.** Bölüm otomatik izlendi sayılması gerçek oynatmadan değil,
  **5 dakikalık görünür ön plan süresinden** çıkarılıyor
  (`AUTO_COMPLETE_SECONDS = 5 * 60`, `app/izle/dizi/.../page.tsx:43`).
  (c) **Reklam savunması uygulamaya sızdı.** `window.open` global olarak override ediliyor,
  iframe'in üst %15'i görünmez bir div ile kapatılıyor (`VideoPlayer.tsx:121,315-325`).
  Uygulama kodu, kontrol etmediği bir sayfanın davranışını dengelemeye çalışıyor.
  (d) **Yayın engeli** — bkz. bölüm 9. Bu karar tek başına projenin public bir portföyde
  demolanabilirliğini belirliyor.

### Karar 4 — Tüm sayfaları istemci bileşeni yapmak

- **Seçim:** 15 sayfanın 15'i de `'use client'`. Sunucu bileşeni yalnızca iki route handler'da
  kullanılıyor (`/api/tmdb`, `/auth/callback`).
- **Alternatif:** Detay sayfalarını (`/film/[id]`, `/dizi/[id]`, `/oyuncu/[id]`) sunucu
  bileşeni yapıp TMDB verisini sunucuda çekmek, yalnızca kullanıcıya özel parçaları
  istemciye bırakmak.
- **Gerekçe:** Supabase istemcisi tarayıcı istemcisi (`createBrowserClient`,
  `lib/supabase.ts`); neredeyse her ekranda kullanıcıya özel durum (izlendi mi, koleksiyonda mı,
  puanı ne) gösteriliyor. Tek model tutmak kararı sadeleştiriyor.
- **Bedel:** İki ölçülebilir kayıp.
  (a) **JS ağırlığı:** paylaşılan ilk yük 87,3 kB; `/profil` **273 kB First Load JS**,
  `/izle/dizi/...` 231 kB (`npm run build` çıktısı). Sunucuda çekilebilecek veri istemciye
  yük olarak biniyor.
  (b) **İstek şelalesi ve SEO:** içerik HTML'de yok, TMDB verisi ancak JS çalıştıktan sonra
  geliyor. Film/dizi detay sayfaları arama motoru için boş.

---

## 6. Zorlandığım yer

### Bulgu: `localStorage` → Supabase geçişi ve geçişin doğurduğu `navigator.locks` çakışması

Aday, uydurma değil; iki commit ve iki dosyadaki kod yorumlarıyla izlenebiliyor.

**Nasıl fark edildi** — `git show --stat e796787` commit'i "refactor: clean up unused code, fix
build errors, update README" başlığını taşıyor, ama gerçekte veri katmanının tamamını
değiştiriyor: `lib/storage.ts` **-562 satır**, `lib/db.ts` **+938 satır**, `lib/supabase.ts`
+36, `middleware.ts` +70, `lib/database.types.ts` +389. 65 dosya, +4293/-3089. Commit mesajı
yapılan işi olduğundan küçük gösteriyor — dosya istatistiği bunu ele veriyor.

Geçişin ardından bırakılan iki kod yorumu, üretimde yaşanmış bir hatayı doğrudan anlatıyor:

> `lib/supabase.ts:22-24` — "Bu, birden fazla GoTrue istemcisinin `navigator.locks` üzerinde
> çakışmasını engeller (`AbortError: Lock broken by another request with the 'steal' option`)."

> `lib/db.ts:7-8` — "Paralel olarak çağrılan db fonksiyonlarının hepsinin ayrı ayrı `getUser()`
> yapmasını engelleyerek `navigator.locks` çakışmasını (AbortError) ortadan kaldırır."

Bir hata mesajının kod yorumuna tam metin olarak geçirilmiş olması, o hatanın tahmin edilmediğini,
**görüldüğünü** gösterir.

**Kök sebep** — İki katmanlı, ve ikisi de aynı yanlış varsayımdan doğuyor: *"`localStorage`
çağrısı gibi, Supabase çağrısı da ucuz ve durumsuzdur."* Değil:

1. `createBrowserClient()` her çağrıldığında **yeni bir GoTrue istemcisi** üretiyordu. Her
   istemci oturum yenilemesi için Web Locks API üzerinde aynı kilidi almaya çalışıyor; ikincisi
   birincinin kilidini `steal` ediyor ve birinci `AbortError` ile düşüyor. Next.js Fast
   Refresh'te modül yeniden yüklendiği için geliştirmede daha da sık tetikleniyor.
2. `lib/db.ts`'teki her fonksiyon bağımsızca `supabase.auth.getUser()` çağırıyordu. Bir sayfa
   açılışında 5-6 fonksiyon paralel çalıştığında (ör. `/koleksiyon` aynı anda watchlist, watched,
   ratings, episodes okuyor) aynı kilit için 5-6 eşzamanlı yarış oluşuyordu. `localStorage`
   sürümünde bu fonksiyonlar senkron ve kilitsizdi — mimari birebir taşınınca sorun doğdu.

**Nasıl çözüldü** — İki katmana iki ayrı önlem, ikisi de `e796787` içinde:

1. **İstemci singleton'ı** (`lib/supabase.ts:26-38`): tarayıcıda modül düzeyinde tek istemci
   cache'leniyor; SSR tarafında (`window` yok) her seferinde yenisi üretiliyor.
2. **500 ms'lik paylaşılan kullanıcı promise'i** (`lib/db.ts:9-28`): `getAuthUser()` devam eden
   `getUser()` promise'ini paylaşıyor, 500 ms sonra cache'i düşürüyor. Aynı render döngüsündeki
   tüm çağrılar tek bir kimlik doğrulama isteğine iniyor.

**Sonrasında ne değişti**

- Yayın kodunda 20 import noktasının hepsi `lib/db.ts` üzerinden geçiyor; ayrı `getUser()`
  çağrısı yapan bileşen kalmadı.
- Bu geçiş, bölüm 5'teki 1. kararın (c) bedelini de yarattı: çevrimdışı yazma kayboldu.
- **Geçiş tamamlanmadı.** Aynı commit'te `lib/db.ts`'e yazılan `custom_lists` ve `tags`
  fonksiyonları (yaklaşık 100 satır, 3 tablo) hiçbir zaman arayüze bağlanmadı; tablolar şemada,
  fonksiyonlar dosyada, çağıran yok. `cinetrack_supabase_update` olay dinleyicileri de aynı
  dönemden kalma: iki bileşen dinliyor, kimse yayınlamıyor. Yani `localStorage` sürümünün
  senkronizasyon modeli, karşılığı yazılmadan sökülmüş.
- Aynı commit'te `app/istatistikler/page.tsx` (884 satır) silinip işlevi
  `app/profil/page.tsx`'e (+937 satır) taşındı; `lib/tvmaze.ts` (99 satır, ikinci veri
  kaynağı) terk edildi. Veri katmanı değişimi arayüz mimarisini de sürüklemiş.

**İkinci aday (ayrıca anlatılabilir):** `5e42273` commit'i, güven sınırının yanlış çizildiği
bir hatayı düzeltiyor — `postMessage` dinleyicisi **origin doğrulaması olmadan** çalışıyordu,
yani gömülü reklam scriptleri dahil herhangi bir sayfa `'ended'` mesajı yollayarak kullanıcıyı
bölümler arasında gezdirebiliyordu. Kod yorumu bunu açıkça yazıyor
(`app/izle/dizi/.../page.tsx:428-431`). Aynı commit `/api/tmdb`'ye allowlist ekleyerek route'un
açık proxy olarak kullanılmasını da kapatıyor. İkisi de aynı yanlış varsayımın iki yüzü:
*"iframe'e ve query parametresine gelen şey benim kontrolümde."*

---

## 7. Ekran görüntüsü hazırlığı

### Yerelde ayağa kalkıyor mu? — **Evet, denendi ve ölçüldü**

```bash
npm install
cp .env.local.example .env.local     # anahtarlar doldurulmalı
npm run build                        # ✓ başarılı, 18 rota
npm run start                        # ✓ "Ready in 304ms"
```

Ölçülen sonuçlar (2026-08-08, üretim derlemesi, gerçek `.env.local` ile):

| Test | Sonuç |
| --- | --- |
| `GET /` | **HTTP 200**, 0,178 sn |
| `GET /auth` | HTTP 200 |
| `GET /kesif` | HTTP 200 |
| `GET /koleksiyon` (girişsiz) | **HTTP 307 → /auth** |
| `GET /profil` (girişsiz) | HTTP 307 → /auth |
| `GET /izle/film/550` (girişsiz) | HTTP 307 → /auth |
| `GET /api/tmdb?endpoint=/trending/movie/week` | Gerçek TMDB verisi döndü |
| `GET /api/tmdb?endpoint=/evil` | `{"error":"Endpoint not allowed"}` — allowlist çalışıyor |
| Güvenlik başlıkları | `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` — üçü de geliyor |

`npm run dev` denenmedi; ölçümler üretim derlemesi üzerinde yapıldı.

### Ön koşullar

| Koşul | Olmadan ne olur |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` | **Uygulama hiç açılmaz.** `lib/supabase.ts:13-19` modül yüklenirken `throw` eder |
| Supabase şeması (9 tablo) | Uygulama açılır, her veri işlemi hata verir. **Şema deposunda yok** — `.gitignore` `*.sql` deseniyle SQL dosyalarını dışlıyor ve `e796787` commit'i üç migration dosyasını silmiş. Yeni bir makinede şemayı kurmanın yolu depoda **yok**; `lib/database.types.ts` (389 satır) tablo yapısını gösteriyor ama çalıştırılabilir DDL değil |
| `profiles` tablosu için signup trigger | Kayıt sonrası profil oluşmaz. `app/auth/page.tsx:73` yorumu "otomatik profil oluşturulacak trigger üzerinden" diyor — **trigger da depoda yok** |
| `NEXT_PUBLIC_TMDB_KEY` | Tüm içerik boş; `/api/tmdb` 500 döner. Ekran görüntüsü alınamaz |
| Supabase e-posta doğrulama ayarı | Proje ayarlarında e-posta doğrulaması zorunlu; ama `app/auth/page.tsx:74-75` kayıt sonrası "Kayıt başarılı! Lütfen giriş yapın." deyip giriş moduna geçiyor. **Kullanıcı doğrulama yapmadan giriş yapamaz, arayüz bunu söylemiyor.** (Bu, Supabase panel ayarına dayanan bir bilgidir, koddan doğrulanamaz) |
| Google OAuth sağlayıcısı | `/auth` sayfasında "Google ile devam et" butonu var (`app/auth/page.tsx:261-267`), ama sağlayıcının Supabase'de açık olup olmadığı koddan **doğrulanamaz**. Butonun ekran görüntüsüne girmesi sakıncasız; **tıklanmış hali** girmemeli |
| OMDb / OpenSubtitles anahtarları | İsteğe bağlı. Yoksa IMDb/RT puanları ve altyazı listesi sessizce boş kalır — ekran görüntüsünde **eksik alan** olarak görünür |
| Node.js 18+ | README:111 |

### Demo veri var mı? — **Hayır**

Seed script'i, fixture veya örnek veri dosyası **yok** (`git ls-files` içinde `.sql`, seed veya
fixture yok). İçerik verisi TMDB'den canlı geldiği için sorun değil; ama **kullanıcıya ait
her şey** (koleksiyon, izlendi, puanlar, bölüm ilerlemesi, profil, istatistikler) boş bir
hesapta boş görünür.

**Demo veri üretme maliyeti — çıkarım, ölçüm değil:** İki yol var.
1. **Elle:** Yeni bir hesap açıp arayüzden 15-20 içerik eklemek, birkaçını puanlamak, bir
   dizinin sezonunu işaretlemek. Tahmini 20-30 dakika; `/profil` istatistiklerinin dolu
   görünmesi için en az 10 puanlanmış içerik gerekli (`lib/cinema-personality.ts:26,35`
   eşikleri: `totalWatched === 0` → "Yeni Başlayan", `totalWatched > 10` gerekli dallar var).
2. **SQL ile:** Supabase SQL editöründen 9 tabloya doğrudan satır basmak. Şema `lib/database.types.ts`'te
   yazılı olduğu için yazılabilir; tahmini 1-2 saatlik iş, ama tek seferlik ve tekrarlanabilir.

Yol 1 önerilir — ekran görüntüsü sayısı az ve tek seferlik.

### Anlamlı ekranlar — 5 tane

| # | Rota | Neden önemli |
| --- | --- | --- |
| 1 | `/` (ana sayfa, giriş yapılmış, veri dolu) | "Kaldığın yerden devam et" şeridi + trend satırları. Ürünün asıl iddiasını (kişisel takip) tek karede gösteren ekran. 604 satırlık `app/page.tsx`'in tamamı burada |
| 2 | `/dizi/[id]` (çok sezonlu bir dizi, kısmen işaretlenmiş) | Sezon/bölüm ilerleme çubuğu. Projenin en derin veri modelini (`episodes` tablosu, bölüm bazlı satır) görünür kılan tek ekran. **Öneri: 3+ sezonlu bir dizi seçilsin** ki chunk'lama kararı anlamlansın |
| 3 | `/profil` (dolu istatistiklerle) | İzleme istatistikleri + sinema kişiliği. Build'de en ağır rota (273 kB) ve `/istatistikler` sayfasının taşındığı yer — bölüm 6'daki anlatının görsel karşılığı |
| 4 | `/kesif` (arama sonuçlarıyla) | Debounce'lı çoklu arama + tür filtreleri. TMDB proxy'sinin (Karar 2) çalıştığının kanıtı |
| 5 | `/takvim` | Takip edilen dizilerin yayın takvimi. Uygulamanın "kayıt tutucu" değil "hatırlatıcı" tarafını gösteren tek ekran |

**Ekran görüntüsüne girmemesi gerekenler:**
- `/izle/...` (oynatıcı) — bölüm 9'daki engel nedeniyle. Bir oynatıcı ekranı istenirse
  **iframe boşken** ve kaynak adları görünmeden alınmalı; kaynak seçici "Kaynak 1..4" yazdığı
  için (`lib/sources.ts`) alan adı ekranda görünmez, ama URL çubuğu ve ağ sekmesi görünmemeli.
- Tarayıcı geliştirici araçları açık hiçbir kare — `NEXT_PUBLIC_*` anahtarlar istemci
  paketinde.

### Gerçek veri riski — **Evet, var**

Uygulama giriş zorunlu olduğu için ekran görüntüsü **mutlaka bir hesapla** alınacak. Demo hesap
kullanılmazsa ekranda görünecekler:

- **Gerçek e-posta adresi** — `/profil` sayfasında ve navbar'da kullanıcı bilgisi
- **Gerçek izleme geçmişi** — `/gecmis`, `/profil`, ana sayfadaki "devam et" şeridi. İzleme
  geçmişi kişisel veridir; hangi içeriğin ne zaman izlendiği çıkarım yapılabilir bilgidir
- **Gerçek puanlar ve koleksiyon** — beğeni profili

**Öneri:** Sıfırdan bir demo hesabı (`demo@...`) açılıp yukarıdaki 20-30 dakikalık doldurma
yapılsın. Bulanıklaştırma ile kurtarılmaya çalışılmasın.

---

## 8. Ölçülebilir ne varsa

Yalnızca komut çıktısı veya dosya kanıtı olanlar:

| Ölçüm | Değer | Kanıt |
| --- | --- | --- |
| Üretim derlemesi | **Başarılı**, 18 rota | `npm run build`, 2026-08-08 |
| TypeScript hatası | **0** | `npx tsc --noEmit`, exit 0 |
| ESLint | **0 hata, 1 uyarı** | `npm run lint`; uyarı: `app/izle/dizi/[id]/[sezon]/[bolum]/page.tsx:298` |
| Test sayısı / geçme oranı | **0 test** | Test dosyası yok, test runner bağımlılığı yok |
| CI durumu | **CI yok** | `.github/` klasörü yok |
| Kapsam (coverage) | **Ölçülmüyor** | Kapsam aracı yapılandırılmamış |
| Sunucu açılış süresi | 304 ms | `next start` çıktısı |
| Ana sayfa yanıt süresi | 0,178 sn (HTTP 200) | `curl -w "%{time_total}"`, yerel, üretim derlemesi, tek istek |
| Paylaşılan ilk yük JS | 87,3 kB | `npm run build` rota tablosu |
| En ağır rota | `/profil` — 273 kB First Load JS | aynı tablo |
| En hafif sayfa rotası | `/oyuncu/[id]` — 108 kB | aynı tablo |
| Middleware boyutu | 74,8 kB | aynı tablo |
| Kaynak satırı | 15.295 (71 TS/TSX dosyada 15.092 + CSS/SW) | `wc -l` |
| Commit | 4 | `git rev-list --count HEAD` |
| Veritabanı tablosu | 9 | `lib/database.types.ts` |
| Embed kaynağı | 4 | `lib/sources.ts:5-34` |
| Allowlist'teki TMDB ucu | 14 desen | `app/api/tmdb/route.ts:12-25` |
| Korumalı rota | 7 önek (biri mevcut değil: `/listeler`) | `middleware.ts:50-56` |
| `TODO`/`FIXME`/`HACK` | 0 | `grep -rn` |
| Kullanılmayan bağımlılık | ≥1 (`recharts`) | `grep -rln "recharts" app components` → 0 |
| Ölü bileşen | ≥1 (`WrappedModal.tsx`, 100+ satır) | import eden yok |
| Kullanıcı sayısı | `BİLİNMİYOR` | Dağıtım yok, analitik yok |
| Veri hacmi | `BİLİNMİYOR` | Üretim veritabanı yok |

**Ölçülmedi ama ölçülebilir olduğu için not:** Lighthouse skoru, gerçek cihazda ilk boya süresi,
TMDB proxy'sinin yük altındaki gecikmesi. Bunların hiçbiri şu an elde yok — portföyde performans
iddiası yapılacaksa önce ölçülmeli.

---

## 9. Yayına çıkarma engelleri

### 🔴 Ana engel — Telif hakkı: gömülü izleme kaynakları

Bu, projenin tek ciddi engeli ve **kararı sana ait**.

`lib/sources.ts:5-34` dört alan adını kod içinde sabit tutuyor: `autoembed.co`,
`player.smashy.stream`, `vidsrc.net`, `multiembed.mov`. Bunlar telif sahibi olmayan, lisanssız
film/dizi akışı sunan embed servisleridir. Proje bu servisleri iframe içinde gömüyor
(`app/izle/**`), reklam popup'larını engelliyor (`VideoPlayer.tsx:121`) ve OpenSubtitles'tan
altyazı ekliyor. Depoda ayrıca `test_sources.log` var; içinde bu servislere atılmış isteklerin
yanıtları ve bir yönlendirme URL'si kayıtlı.

Somut riskler:

1. **İçerik hakkı** — Uygulama lisanssız içeriğe erişimi kolaylaştırıyor. Kodun public bir
   portföyde alan adlarıyla birlikte sergilenmesi, aracın ne yaptığını açıkça gösterir.
2. **Portföy barındırıcısı** — Vercel/Netlify gibi platformların kabul edilebilir kullanım
   politikaları bu tür projeleri kapsayabilir. Canlı demo yayınlanırsa DMCA bildirimi ve
   hesap kapatma riski var (bu bir hukuki görüş değil, bilinen bir platform pratiğidir).
3. **İşveren okuması** — Bu kod bir işe alım süreçlerinde okunacaksa, dört "pirate stream"
   alan adının kaynak dosyada sabit durması not edilir.

**Seçenekler — karar senin:**

| Seçenek | Ne kaybedersin | Ne kurtarırsın |
| --- | --- | --- |
| A) Vaka çalışmasında izleme özelliğini hiç anlatma, `/izle` ekran görüntüsü koyma; hikâyeyi "takip + keşif" üzerine kur | Bölüm 5'teki **en iyi karar anlatısı** (Karar 3, dört bedelli) gider | Depo ve demo temiz kalır |
| B) Karar 3'ü anlat ama alan adlarını **verme** ("dört üçüncü taraf embed sağlayıcı"), demo yayınlama, yalnızca ekran görüntüsü koy | Somutluk azalır | Teknik anlatı (cross-origin duvarı, altyazı senkronu, 5 dk kuralı) korunur — bu anlatı sağlayıcı adı olmadan da tam çalışır |
| C) Depoyu public yap, canlı demo yayınla | Yukarıdaki 3 risk | Hiçbir şey — canlı demo bu projede zaten giriş zorunlu olduğu için ziyaretçiye kapalı |

**Önerim: B.** Karar 3'ün teknik içeriği (kontrol edemediğin bir oynatıcının etrafında ürün
yapmanın bedeli) portföyün en güçlü mühendislik anlatısı; sağlayıcı adlarına ihtiyacı yok.
Canlı demo (C) zaten değer üretmiyor: `/` dışındaki her şey `/auth`'a yönleniyor.

### 🟡 İkincil bulgular

- **Sır sızıntısı: yok.** `.env.local` git'te izlenmiyor (`.gitignore` → `.env*.local`;
  `git ls-files | grep env` yalnızca `.env.local.example` döndürüyor). Git geçmişinin tamamında
  API anahtarı/JWT deseni aranıp bulunamadı
  (`git log -p --all | grep -E "eyJhbGciOi|api_key=[a-f0-9]{20}"` → 0 sonuç). `e796787` commit'i
  zaten "Remove setup_database.mjs (contained hardcoded API keys)" diyor — anahtar içeren
  dosya kaldırılmış ve geçmişte de görünmüyor. **Yerel `.env.local` dosyası gerçek anahtarlar
  içeriyor: [GİZLİ] — TMDB anahtarı, Supabase URL ve anon anahtarı. Brifinge girmedi, portföye
  de girmemeli.**

- **İstemciye açık anahtarlar — tasarım gereği ama söylenmeli.** `NEXT_PUBLIC_OMDB_KEY` ve
  `NEXT_PUBLIC_OPENSUBTITLES_KEY` istemci paketine giriyor (`lib/omdb.ts:8`,
  `lib/subtitles.ts:5`), çünkü bu iki servis tarayıcıdan doğrudan çağrılıyor. Uygulama
  yayınlanırsa **bu iki anahtar herkese açık olur**. Supabase anon anahtarı ise açık olması
  amaçlanan bir anahtar (RLS ile korunur) — ama **RLS politikaları depoda yok**, dolayısıyla
  gerçekten uygulanıp uygulanmadığı koddan doğrulanamaz. `lib/db.ts` her sorguda
  `.eq('user_id', user.id)` yazıyor; bu iyi bir pratik ama RLS'in yerine geçmez.
  **Yayın öncesi RLS durumu Supabase panelinden doğrulanmalı.**

- **Depoda derleme artıkları izleniyor.** `lint.log` (80 KB), `output.txt` (76 KB),
  `ts.log`, `test_sources*.log`, `build_output.txt`, `git_status.txt`, `git_status_utf8.txt`
  git'te kayıtlı. İçlerinde sır bulunamadı (arandı), ama `test_sources.log` embed servislerine
  atılmış isteklerin yanıtlarını içeriyor (bkz. ana engel) ve `output.txt`/`lint.log` eski
  hata dökümleri. **Depo public yapılacaksa bunlar silinmeli.**

- **Lisans uyumu.** Proje MIT lisanslı (`LICENSE`). TMDB kullanımı TMDB'nin atıf şartına tabi.
  Arayüzde **kısmi** atıf var: film ve dizi detay sayfalarındaki puan kartı kaynağı "TMDB"
  olarak etiketleniyor (`app/film/[id]/page.tsx:162`, `app/dizi/[id]/page.tsx:273`). Ama
  **TMDB logosu ve "bu ürün TMDB API'sini kullanır, TMDB tarafından onaylanmamıştır" ibaresi
  hiçbir yerde yok** — `app/layout.tsx` ve `components/Navbar.tsx`'te TMDB atıf metni
  bulunamadı, uygulamada footer yok. TMDB şartları ikisini de ister. Ekran görüntüsü
  yayınlanacaksa bu eksik **görünür** hale gelir. Düzeltmesi 10 dakikalık iş
  (`app/layout.tsx`'e bir footer).

- **Müşteri işi / NDA / kurum içi bilgi: yok.** Kişisel proje; kodda kurum adı, müşteri adı
  veya iç sistem referansı bulunamadı.

- **Kişisel veri:** Ekran görüntüsü riski bölüm 7'de. Kod tarafında kişisel veri gömülü değil.

---

## Portföy oturumuna notlar

- **Doldurulmayan alanlar** (portföy oturumunun kararı): `slug`, `featured`, `order`,
  `diagram`, `cover`, `updated`.
- **Doldurulanlar:** `title` = CineTrack · `period` = 2026-03 → 2026-08 (git geçmişi;
  öncesi kayıtsız) · `role` = Tek geliştirici · `status` = `geliştirme` ·
  `statusDetail` = "Derleme ve tip kontrolü temiz, 0 test, dağıtılmamış; README'nin
  vaat ettiği üç özellik arayüzde bağlı değil" · `stack` = bölüm 1'deki 8 madde.
- **Kademe önerisi:** Tam vaka çalışması. Bölüm 5 (4 karar, hepsi bedelli) ve bölüm 6 (kod
  yorumlarıyla kanıtlanmış gerçek hata) yeterli malzeme veriyor. Ama bölüm 9'daki B seçeneği
  onaylanmadan yazıma başlanmamalı — o karar, anlatılabilecek kararların hangisinin
  kalacağını belirliyor.
- **`tagline` için `BİLİNMİYOR`:** Bunu koddan çıkarmak abartıya kaçmadan mümkün değil; sen yaz.
