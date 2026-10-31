# DURUM — CineTrack — film/dizi takip

> **Ne bu dosya:** sertifika değil **envanter**. Ölçülen gerçek durum; "yok" yazan satır kusur değil, kayıt.
> Kapanış standardı: `ScryneOS/🎯 100-Command-Center/Kapanis-Standardi.md`

**Ölçüm tarihi:** 2026-10-31
**Tek cümle:** Next 16 / React 19 üzerinde, hesapsız yerel modda tam işlevli film-dizi takipçisi; yayın oynatmaz,
"nerede izlenir" ile yasal seçeneklere yönlendirir.

## Ne çalışıyor (ölçüldü, 2026-10-31)

- **Derleme ve kalite:** `next build` temiz (Next 16.4.3, React 19), `eslint .` 0 bulgu, `tsc` temiz,
  `npm audit --omit=dev` 0 açık (14.2.35'in kritik açığı geçişle kapandı).
- **Testler:** vitest 10 test — `db.ts`'in gerçek fonksiyonları yerel istemci üzerinden (liste, izlenen, bölüm,
  ilerleme, puan, özel liste + cascade, profil, Supabase `single`/`maybeSingle` anlamı).
- **Canlı:** üretim derlemesi `next start` ile 12 rota × 4 genişlik (390/768/1280/1440) = 48 kare; taşma, konsol
  hatası ve başarısız istek 0. Uçtan uca: koleksiyona ekle → koleksiyonda görünüyor; `/izle/film/603` → 308
  `/film/603#nerede-izlenir`; TR sağlayıcıları (Abonelik/Kiralık/Satın al) görünüyor.
- **Veri modu:** `NEXT_PUBLIC_DATA_MODE=local` (varsayılan: Supabase anahtarı yoksa local). Yerel istemci
  (`lib/localClient.ts`) `db.ts`'in kullandığı Supabase sorgu alt kümesini tarayıcı deposunda çalıştırır; `db.ts`
  iki modda aynı. Profilde yedek indirme ve iki adımlı silme.
- **Kimlik:** `DESIGN.md` (kod kanıtından; lint 0 hata). Arayüz metni Türkçe karakterli.

## Kapalı / yok (bilerek)

- **Oynatıcı yok.** `/izle` rotaları dört izinsiz gömme kaynağını (autoembed, smashystream, vidsrc, multiembed)
  oynatıyordu; rotalar, oynatıcı, kaynak listesi ve altyazı indirme 2026-10-31'de silindi. Eski adresler
  `next.config.mjs` ile yönlenir.
- **Supabase projesi yok.** `.env.local`'daki adres çözülmüyor (proje silinmiş/kapanmış). Bulut eşitleme için yeni
  bir Supabase projesi ve `NEXT_PUBLIC_DATA_MODE=supabase` gerekir; kod `@supabase/ssr` ile hazır.
- **OMDB anahtarı geçersiz (401).** Puan kutusu yalnız TMDB puanını gösterir; OMDB sunucu rotasından geçer
  (`app/api/omdb`), anahtar tarayıcıya inmez.

## Bilinen sınırlar

- `/api/tmdb` doğrudan TMDB'ye erişemezse genel bir vekile (`api.codetabs.com`) düşüyor; bu durumda istek ve TMDB
  anahtarı üçüncü tarafa gider. Bazı TR ağlarında TMDB engeli için konmuş; kendi vekili ya da yalnız doğrudan erişim
  daha doğru olur.
- Yerel modda veriler yalnız o tarayıcıdadır; tarayıcı verisi temizlenirse kaybolur (profilde yedek var).
