# DURUM — CineTrack — film/dizi takip

> **Ne bu dosya:** sertifika değil **envanter**. Ölçülen gerçek durum; "yok" yazan satır kusur değil, kayıt.
> Kapanış standardı: `ScryneOS/🎯 100-Command-Center/Kapanis-Standardi.md`

**Ölçüm tarihi:** 2026-11-03
**Tek cümle:** Next 16 / React 19 üzerinde, hesapsız yerel modda tam işlevli film-dizi takipçisi ve oynatıcısı
(`/izle/film/<id>`, `/izle/dizi/<id>/<sezon>/<bölüm>`).

## Ne çalışıyor (ölçüldü, 2026-10-31)

- **Derleme ve kalite:** `next build` temiz (Next 16.4.3, React 19), `eslint .` 0 bulgu, `tsc` temiz,
  `npm audit --omit=dev` 0 açık (14.2.35'in kritik açığı geçişle kapandı).
- **Testler:** vitest 22 test — `db.ts`'in gerçek fonksiyonları yerel istemci üzerinden (liste, izlenen, bölüm,
  ilerleme, puan, özel liste + cascade, profil, Supabase `single`/`maybeSingle` anlamı) ve altyazı vekili
  (`tests/subtitles.test.ts`, 12 test, fetch sahte: arama, indirme, anahtarsız, ağ hatası, 401'de bekleme).
- **CI (2026-11-03):** `.github/workflows/ci.yml` her push (main) ve PR'da lint, `tsc`, vitest ve `next build`
  çalıştırır; Node 22, gizli anahtar yok (derleme anahtarsız geçiyor, yerelde ölçüldü). Lint'te 1 uyarı var,
  hata yok: `app/izle/dizi/.../page.tsx` `useEffect` bağımlılığı (oynatıcı akışı, bu işte dokunulmadı).
- **Canlı:** üretim derlemesi `next start` ile 12 rota × 4 genişlik (390/768/1280/1440) = 48 kare; taşma, konsol
  hatası ve başarısız istek 0. Uçtan uca: koleksiyona ekle → koleksiyonda görünüyor.
- **Oynatıcı (2026-11-01 geri geldi):** 10-31'de Scryne'a sorulmadan silinmişti (`4a66b07`), geri alındı ve Next 16'ya
  uyarlandı (`useParams`, efektlerde `startLoad`). Detaydaki "Kaldığın yerden devam et" → `/izle/film/603`, oynatıcı
  ve 4 kaynak düğmesi görünüyor; dizi bölüm sayfası (`/izle/dizi/1399/1/1`) açılıyor. **Kaynakların durumu
  (bu makineden, 11-01):** autoembed → autoembed.me'ye yönleniyor (200); multiembed 404; vidsrc.net bağlantı
  sıfırlanıyor; smashystream sertifika hatası. Kaynak listesi `lib/sources.ts`.
- **Altyazı (2026-11-03):** tarayıcı artık api.opensubtitles.com'a gitmiyor (CORS hataları bitti); arama ve indirme
  `app/api/subtitles` üzerinden (mantık `lib/subtitlesServer.ts`). Anahtar `OPENSUBTITLES_KEY` (yoksa eski
  `NEXT_PUBLIC_OPENSUBTITLES_KEY`), yalnız sunucuda. Anahtar yoksa ya da servis düşerse sayfa başına tek istek,
  boş liste; seçicide "Bu yapım için altyazı bulunamadı." yazar. 401/403'te sunucu bir saat yeniden denemez.
  `next start` + Playwright (`/izle/film/603`): `/api/subtitles`'a 1 istek, opensubtitles.com'a 0, altyazıyla
  ilgili konsol hatası 0. **Ölçülmedi:** gerçek anahtarla gerçek altyazı indirme (anahtar yok; bu makineden
  api.opensubtitles.com'a erişim de yok).
- **Takvim bildirim izni penceresi (2026-11-03):** `components/takvim/NotificationPermissionDialog.tsx`; `body`'ye
  portal, opak örtü (`void/85` + bulanıklık), `raised` panel, ortak `Button` (birincil + hayalet). `role="dialog"`,
  `aria-modal`, başlık/açıklama bağlı; odak ilk düğmede ve pencerede döner, Esc/örtü kapatır, odak geri döner.
  390 ve 1280 px'te Playwright ile denendi; yatay taşma yok.
- **Veri modu:** `NEXT_PUBLIC_DATA_MODE=local` (varsayılan: Supabase anahtarı yoksa local). Yerel istemci
  (`lib/localClient.ts`) `db.ts`'in kullandığı Supabase sorgu alt kümesini tarayıcı deposunda çalıştırır; `db.ts`
  iki modda aynı. Profilde yedek indirme ve iki adımlı silme.
- **Kimlik:** `DESIGN.md` (kod kanıtından; lint 0 hata). Arayüz metni Türkçe karakterli.

## Kapalı / yok (bilerek)

- **Supabase projesi yok.** `.env.local`'daki adres çözülmüyor (proje silinmiş/kapanmış). Bulut eşitleme için yeni
  bir Supabase projesi ve `NEXT_PUBLIC_DATA_MODE=supabase` gerekir; kod `@supabase/ssr` ile hazır.
- **OMDB anahtarı geçersiz (401).** Puan kutusu yalnız TMDB puanını gösterir; OMDB sunucu rotasından geçer
  (`app/api/omdb`), anahtar tarayıcıya inmez.

## Bilinen sınırlar

- `/api/tmdb` doğrudan TMDB'ye erişemezse genel bir vekile (`api.codetabs.com`) düşüyor; bu durumda istek ve TMDB
  anahtarı üçüncü tarafa gider. Bazı TR ağlarında TMDB engeli için konmuş; kendi vekili ya da yalnız doğrudan erişim
  daha doğru olur.
- Takvimdeki diğer iki pencere (gün ayrıntısı, bildirim ayarları) hâlâ tanımsız Tailwind sınıfları kullanıyor
  (`bg-card`, `bg-accent`, `text-muted`, `bg-background`, `modal-backdrop`); panelleri saydam görünebilir. Bu işin
  kapsamı dışında bırakıldı.
- `DESIGN.md` "uygulama içinde oynatıcı yok" diyor; oynatıcı 11-01'de geri geldi. Belge ile ürün çelişiyor;
  karar proje sahibinin.
- Yerel modda veriler yalnız o tarayıcıdadır; tarayıcı verisi temizlenirse kaybolur (profilde yedek var).
