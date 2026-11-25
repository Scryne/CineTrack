# DURUM — CineTrack — film/dizi takip

> **Ne bu dosya:** sertifika değil **envanter**. Ölçülen gerçek durum; "yok" yazan satır kusur değil, kayıt.
> Kapanış standardı: `ScryneOS/🎯 100-Command-Center/Kapanis-Standardi.md`

**Ölçüm tarihi:** 2026-11-25 (yayına hazır turu; önceki: 2026-11-16)

**Yayına hazır karnesi (2026-11-25):** Kod ✅ · Ürün ✅ · Ön yüz ✅ (vitrin: cila) · Belge ✅ · Kapı: ağaç temiz, geçmişte
`73b026f` (11-03 `gh pr merge`) gerçek e-posta kimliği; geçmişi yeniden yazma kararı Scryne'da · Dış: OMDB anahtarı.
Bitiş çizgisi ScryneOS `🎯 100-Command-Center/Yayina-Hazir-Karnesi.md`; bundan sonra bulunan "v2 fikirleri"ne girer.

## 2026-11-25 ölçümü

- **Kod:** `tsc` 0, `eslint` 0 hata, vitest 22/22, `next build` 0. `npm audit --omit=dev`: next 16.4.3'teki orta açık →
  16.4.6 (`eslint-config-next` aynı), 0.
- **Gezi (gerçek TMDB verisi, `next start`):** 12 rota (ana sayfa, keşfet, film, dizi, oyuncu, takvim, koleksiyon,
  dizilerim, geçmiş, öneriler, profil, oynatıcı) × 390/1440 × 2 tema = 48 kare; taşma 0. Oynatıcıdaki 4 hata gömülen
  üçüncü taraf kaynağın sertifikası (`smashy.stream`), uygulamanın değil.
- **Uçtan uca:** Matrix sayfasında "Koleksiyona Ekle" → düğme durumu değişti, `/koleksiyon`'da görünüyor; sayfa hatası 0.
  Geçmiş sayfası oynatıcı ilerlemesini listeler, "İzledim" işaretini değil (tasarım).
- **Cila (`ac682ff`):** oy almamış yapımlar (ör. Avengers: Doomsday, 2026) ana sayfa vitrininde, film/dizi kartlarında,
  Keşfet'te ve takvimde "★ 0.0" gösteriyordu; kötü puan gibi okunuyordu. ContentCard'ın kuralı (puan > 0) her yere
  uygulandı; ana sayfada "0.0" sayısı 0. Telefonda alttaki kartların boş görünmesi tam sayfa çekimde tembel yüklemeden:
  sayfa kaydırılınca 80 görselin hiçbiri kırık değil.

## Dış adımlar

- OMDB anahtarı (401): Scryne'ın hesabından yeni anahtar; yalnız ek puanlar için, sayfalar onsuz çalışıyor.

## v2 fikirleri

- Geçmiş sayfasında "İzledim" işaretlerini de göstermek (şu an yalnız oynatıcı ilerlemesi).

---

**Önceki ölçüm: 2026-11-16**
**Tek cümle:** Next 16 / React 19 üzerinde, hesapsız yerel modda tam işlevli film-dizi takipçisi ve oynatıcısı
(`/izle/film/<id>`, `/izle/dizi/<id>/<sezon>/<bölüm>`).

## 2026-11-16: oynatıcı kontrolü

- `next build` + `next start`, gerçek Chrome: `/izle/film/603` (1440) ve `/izle/dizi/1399/1/1` (390) açılıyor; kaynak
  iframe'i (`autoembed.co`) yükleniyor, 4 kaynak düğmesi, altyazı seçici, bölüm listesi ve "Sonraki Bölüm" yerinde,
  yatay taşma yok. Konsoldaki 4 hata gömülen üçüncü taraf sayfasından (sertifika, DNS, çerçeve gezinme engeli),
  uygulamadan değil. Oynatılan videonun kendisi bu makineden doğrulanamaz (kaynaklar üçüncü taraf).
- **Vekil kararı:** `/api/tmdb` önce TMDB'ye doğrudan gider, ISS engelinde (4 sn) codetabs yedeğine düşer; böyle
  kalıyor (sunucu yurt dışındaysa yedek hiç devreye girmez). OMDB anahtarı 401 veriyor: yeni anahtar Scryne'ın hesabından alınır (dış iş); OMDB yalnız ek puanlar
  için, sayfalar onsuz da açılıyor.

## 2026-11-13 denetimi (ölçüldü)

- **Bağımlılık ve kalite:** vitest 5 + `@types/node` 22 (`1ada2ad`), yazı tipleri `next/font`, rota başına sekme
  başlığı (`cf6d950`). `tsc` 0, `eslint` 0 hata (1 uyarı `/izle`'de, bilerek), vitest 22/22, `next build` 0.
  `npm audit`: 7 orta, hepsi `typescript-eslint` → `minimatch` zinciri (lint aracı; yama yalnız minimatch 11'de, üst akım).
- **Vekil önbelleği:** TMDB/OMDB vekil yanıtlarına `max-age` (`5b7955f`).
- **Keşfet süzgeci (`61c1dc4`):** 1440'ta yapışkan "Filtrele" düğmesi puan çiplerinin üstüne biniyor, panel altı
  kesik kalıyordu; gövde kendi içinde kayar, düğmeler ayrı altlıkta. `lg` altında panel "Filtreler" düğmesiyle açılır
  (önceden tam genişlik açılıp afiş ızgarasını ekranın altına itiyordu). Tür adları Türkçe karakterli (`9b26061`).
- **Takvim (`54265c9`):** izin penceresi 1440/390'da doğru. Gün ayrıntısı ve bildirim ayarları modalı `template.tsx`'in
  dönüşümlü kabına hapsolup mobilde üst çubuğun altında kalıyordu; `createPortal` ile `body`'ye taşındı.
- **Altyazı, gerçek anahtarla:** `/api/subtitles?tmdb_id=155&type=film` 200 + sonuç listesi; `?file_id=…` 200,
  `text/plain` SRT (134 KB), `cache-control: private, max-age=10800`. Tarayıcı OpenSubtitles'a gitmiyor; CORS yok.
- **Gezi:** `next start`, 14 rota (ana, koleksiyon, dizilerim, keşfet, geçmiş, takvim, öneriler, profil, auth, film,
  dizi, sezon, oyuncu, 404) × 390/1440 koyu: taşma 0, konsol 0 (404 rotası beklenen 404). Koleksiyona ekleme
  uçtan uca: film + dizi ekle → `/koleksiyon` "2 içerik", gezinme rozeti 2. Oynatıcı ve `/izle` bu turda açılmadı.

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
- 2026-11-03: 79 tanımsız Tailwind sınıfı (276 kullanım: hata sayfaları, takvim pencereleri, oyuncu sayfası) token'lara bağlandı; oyuncu sayfasındaki iç içe bağlantı ayrıldı. `DESIGN.md` oynatıcı kararıyla uyumlu.
- Yerel modda veriler yalnız o tarayıcıdadır; tarayıcı verisi temizlenirse kaybolur (profilde yedek var).
