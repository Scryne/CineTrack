# DURUM — CineTrack — film/dizi takip

> **Ne bu dosya:** sertifika değil **envanter**. 2026-08-27 denetiminde ölçülen gerçek durum.
> "Çalışmıyor" yazan satır kusur değil, kayıt. Kapanış standardı:
> `ScryneOS/🎯 100-Command-Center/Kapanis-Standardi.md`

**Ölçüm tarihi:** 2026-08-27
**Tek cümle:** Uygulama eksiksiz derleniyor (15+ rota) ama sıfır testi var ve Supabase/TMDB anahtarı olmadan çalışmaz.

## Ne çalışıyor

- **Üretim derlemesi başarılı.** Rotalar: `/kesif` · `/koleksiyon` · `/dizilerim` ·
  `/oneriler` · `/takvim` · `/gecmis` · `/profil` · `/film/[id]` · `/dizi/[id]` ·
  `/dizi/[id]/sezon/[seasonId]` · `/izle/film/[id]` · `/izle/dizi/[id]/[sezon]/[bolum]` ·
  `/oyuncu/[id]` · `/auth/callback` + middleware.
- Yığın: Next.js 14 · TypeScript 5 · Tailwind 3 · Supabase (auth+db) · TMDB API · Framer Motion.
- Git: `main`, `origin/main` ile eşit.

## Ne çalışmıyor / doğrulanmadı

- **Sıfır test.** Test altyapısı yok, regresyon koruması yok.
- **Çalışır durumda doğrulanmadı:** Supabase projesi ve TMDB anahtarı gerekiyor,
  bu denetimde ayağa kaldırılmadı.
- Portföy engeli kayıtlı: oynatıcı ekranı telif nedeniyle **asla** görüntülenemez,
  demo hesabı şart.

## Ne yarım

- Kökte `git_status.txt` ve `git_status_utf8.txt` artık dosyaları duruyordu —
  bu denetimde silindi.

## Sonraki adım

Demo Supabase projesi + TMDB anahtarıyla bir kez ayağa kaldır, ekranın çalıştığını kanıtla.
