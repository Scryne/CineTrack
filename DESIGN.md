---
version: alpha
name: CineTrack
description: Film ve dizi takibi için karanlık, afiş odaklı bir sinema arşivi; tek mor vurgu, görseller öne çıkar.
colors:
  void: "#080808"
  base: "#0E0E10"
  raised: "#141416"
  overlay: "#1C1C1F"
  subtle: "#242428"
  border-dim: "#1F1F23"
  border-mid: "#2C2C32"
  border-bright: "#3D3D45"
  primary: "#7B5CF0"
  primary-hover: "#5B3FBF"
  primary-soft: "#9D7FF4"
  primary-faint: "#BBA8F8"
  primary-deep: "#130B2E"
  text-pri: "#F2F2F7"
  text-sec: "#9494A0"
  text-muted: "#55555F"
  rating: "#F5C518"
  ok: "#34D399"
  warn: "#FBBF24"
  err: "#F87171"
typography:
  display:
    fontFamily: Bebas Neue
  body:
    fontFamily: Inter
  mono:
    fontFamily: JetBrains Mono
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  xl: 20px
---

## Overview

CineTrack kişisel bir sinema arşividir: izleme listesi, izlenenler, bölüm takibi, puan ve "nerede izlenir".
Arayüzün yıldızı afiş ve sahne görselleridir; kabuk geri çekilir. Ton gece seansı: neredeyse siyah zemin,
tek mor vurgu, büyük ve sıkışık başlıklar. Uygulama yayın oynatmaz; "izle" eylemleri yasal seçeneklere
(TMDB/JustWatch sağlayıcıları) ve bölüm takibine gider.

## Colors

- Zemin katmanları `void → base → raised → overlay → subtle` sırasıyla yükselir; kart `raised`, açılır menü ve
  ikincil yüzey `overlay`. Kenarlar `border-dim` (dinlenme), `border-mid` (etkileşimli), `border-bright` (vurgu).
- Tek vurgu `primary` (mor): birincil düğme, etkin sekme, odak halkası, ilerleme. İkinci bir vurgu rengi
  eklenmez.
- `rating` (sarı) yalnız puan yıldızlarında ve IMDb puanında. Durum renkleri (`ok`, `warn`, `err`) yalnız
  durum içindir; `err` ayrıca yıkıcı eylemin rengidir (silme, çıkış).
- Metin: başlık ve gövde `text-pri`, ikincil `text-sec`, yardımcı ve etiket `text-muted`. `text-muted` küçük
  metinde koyu zeminde kontrast sınırında olduğundan uzun cümlede kullanılmaz.

## Typography

- `display` (Bebas Neue) yalnız sayfa ve bölüm başlıklarında, büyük puntoda. Türkçe büyük harf (İ, Ş, Ğ)
  doğru yazılır; gövde metninde ve düğmede kullanılmaz.
- `body` (Inter) her şeyin geri kalanı. Düğme metni cümle düzeninde ("Koleksiyona ekle"), büyük harf yok.
- `mono` süre, sezon/bölüm numarası ve sayaçlarda, `tabular-nums` ile.
- Arayüz Türkçedir; Türkçe karakterler hiçbir yerde düşürülmez ("Gecmis" değil "Geçmiş").

## Layout

- Detay sayfaları tam genişlik sahne görseliyle açılır; altında afiş + künye + eylem satırı, sonra
  "Türkiye'de nerede izlenir", hikâye, kadro, benzerler. Bölümler `max-w-7xl` içinde.
- Yatay listeler (`ScrollableRow`) kaydırılır; sayfa hiçbir genişlikte yatay taşmaz (390 px dahil).
- Mobilde gezinme alt menüye ve hamburger çekmeceye iner; eylem satırları alt alta dizilir.

## Elevation & Depth

- Gölge yalnız kart kalktığında (`card-up`: mor kenar + derin gölge). Dinlenen kart düz, kenarla ayrılır.
- Mor parıltı (`glow`) yalnız birincil eylemde. Sahne görselinin altı `fade-b` ile zemine erir.

## Components

- **Birincil düğme:** `primary` zemin, beyaz metin, `rounded-xl`; sayfada bir tane.
- **İkincil düğme:** saydam zemin, `border-mid`, hover'da `overlay`.
- **Puan seçici:** 10 yıldız; mobilde küçülür, satıra sığar. Klavye odağı mor halkayla görünür.
- **Sağlayıcı rozeti:** logo + ad, `overlay` zemin; grup başlığı (Abonelik, Kiralık, Satın al) küçük büyük
  harf etiket. Bölüm her zaman görünür; veri yoksa bunu söyler ve JustWatch/TMDB atfını taşır.
- **Boş durum:** ikon + başlık + tek cümle + eylem ("Keşfet'e git").
- **Yerel veri paneli:** yerel modda profilde; yedek indirme ve iki adımlı silme.

## Do's and Don'ts

- Do: görseli büyük, metni az tut; puanı ve süreyi sayı olarak, eş aralıklı göster.
- Do: yasal izleme seçeneklerini ön plana çıkar; atfı gizleme.
- Don't: ikinci bir vurgu rengi, gradyan metin, büyük harf düğme metni.
- Don't: uygulama içinde oynatıcı ya da izinsiz yayın kaynağı.
- Don't: `focus:outline-none` ile odak halkasını kaldırıp yerine bir şey koymamak.
