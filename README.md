<p align="center">
  <img src="public/banner.png" alt="CineTrack Banner" width="100%" />
</p>

<h1 align="center">🎬 CineTrack</h1>

<p align="center">
  <strong>Film ve dizi dünyasını keşfet, takip et, puanla.</strong>
</p>

<p align="center">
  <a href="#özellikler">Özellikler</a> •
  <a href="#teknoloji-yığını">Teknoloji</a> •
  <a href="#kurulum">Kurulum</a> •
  <a href="#ekran-görüntüleri">Ekran Görüntüleri</a> •
  <a href="#proje-yapısı">Proje Yapısı</a> •
  <a href="#lisans">Lisans</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TMDB-API-01D277?style=for-the-badge&logo=themoviedatabase&logoColor=white" alt="TMDB API" />
  <img src="https://img.shields.io/badge/Framer_Motion-12-FF0055?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
</p>

---

## 📖 Hakkında

**CineTrack**, film ve dizi tutkunları için geliştirilmiş modern, hızlı ve kullanıcı dostu bir izleme takip uygulamasıdır. TMDB (The Movie Database) API kullanılarak oluşturulan bu proje ile en sevdiğiniz yapımları keşfedebilir, izleme listelerinizi yönetebilir, puanlayabilir ve oyuncular hakkında detaylı bilgilere ulaşabilirsiniz.

Tüm veriler tarayıcınızın **localStorage**'ında saklanır — kayıt veya giriş gerektirmez.

---

## ✨ Özellikler

### 🔍 Keşif & Arama
- **Gelişmiş Arama** — Film, dizi ve oyuncuları anında arayın (debounced multi-search)
- **Trend İçerikler** — Haftalık trend filmler ve diziler
- **Türe Göre Keşif** — 8 farklı kategoride (Aksiyon, Komedi, Dram, Gerilim, Bilim Kurgu, Korku, Animasyon, Belgesel) içerik keşfedin
- **Gelişmiş Filtreleme** — Yıl, puan, süre, dil ve oyuncuya göre filtreleme
- **Kişiselleştirilmiş Öneriler** — İzleme geçmişinize dayalı akıllı öneriler

### 📋 Koleksiyon Yönetimi
- **Özel Listeler** — Sınırsız sayıda özelleştirilmiş liste oluşturun
- **İzleme Listesi** — İzlemek istediğiniz yapımları kaydedin
- **İzlenenler** — İzlediğiniz yapımların kaydını tutun
- **Puanlama Sistemi** — 5 yıldızlı puanlama ile yapımları değerlendirin

### 🎬 İçerik Detayları
- **Film Detay Sayfaları** — Özet, oyuncu kadrosu, fragman, IMDb/OMDb puanları, benzer filmler
- **Dizi Detay Sayfaları** — Sezon & bölüm takibi, yayın durumu, network bilgileri
- **Oyuncu Profilleri** — Biyografi, filmografi (film/dizi sekmeli görünüm), kişisel bilgiler
- **Nerede İzlenir?** — TMDB Watch Providers ile platformları görüntüleyin

### ▶️ İzleme Deneyimi
- **Yerleşik Video Oynatıcı** — Çoklu kaynak desteği, otomatik fallback
- **Altyazı Desteği** — OpenSubtitles API entegrasyonu
- **Kaldığın Yerden Devam Et** — İzleme ilerlemesi otomatik kaydedilir
- **İzleme Geçmişi** — Tüm izleme geçmişinizi görüntüleyin

### 📊 İstatistikler & Profil
- **İzleme İstatistikleri** — Grafikler ve görselleştirmelerle analiz (Recharts)
- **Takvim Görünümü** — Yaklaşan yayınları takip edin
- **Profil Sayfası** — Koleksiyonlarınızı ve istatistiklerinizi bir arada görün

### 🎨 Tasarım & UX
- **Sinematik Karanlık Tema** — Özel renk paleti (#7B5CF0 mor aksan)
- **Akıcı Animasyonlar** — Framer Motion ile sayfa geçişleri ve mikro-animasyonlar
- **Tam Responsive** — Mobil, tablet ve masaüstüne optimize
- **PWA Desteği** — Uygulamayı ana ekranınıza yükleyin
- **Offline Destek** — Service Worker ile çevrimdışı çalışma

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Dil** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Stil** | [Tailwind CSS 3](https://tailwindcss.com/) |
| **Animasyon** | [Framer Motion 12](https://www.framer.com/motion/) |
| **Grafikler** | [Recharts 3](https://recharts.org/) |
| **İkonlar** | [Lucide React](https://lucide.dev/) |
| **Bildirimler** | [React Hot Toast](https://react-hot-toast.com/) |
| **API** | [TMDB](https://developer.themoviedb.org/) · [OMDb](https://www.omdbapi.com/) · [OpenSubtitles](https://www.opensubtitles.com/) |
| **Tipografi** | [Outfit](https://fonts.google.com/specimen/Outfit) (başlıklar) · [Inter](https://fonts.google.com/specimen/Inter) (gövde) |

---

## 🚀 Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org/) 18+ 
- [npm](https://www.npmjs.com/) veya [yarn](https://yarnpkg.com/)
- [TMDB API Key](https://www.themoviedb.org/settings/api) (ücretsiz)

### Adımlar

1. **Projeyi klonlayın:**
   ```bash
   git clone https://github.com/Scryne/CineTrack.git
   cd CineTrack
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Ortam değişkenlerini ayarlayın:**
   ```bash
   cp .env.local.example .env.local
   ```
   `.env.local` dosyasını açın ve API anahtarlarınızı ekleyin:
   ```env
   # Zorunlu
   NEXT_PUBLIC_TMDB_KEY=your_tmdb_api_key_here

   # İsteğe bağlı
   NEXT_PUBLIC_OMDB_KEY=your_omdb_api_key_here
   NEXT_PUBLIC_OPENSUBTITLES_KEY=your_opensubtitles_key_here
   ```

4. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm run dev
   ```

5. **Tarayıcınızda açın:**
   
   [http://localhost:3000](http://localhost:3000) adresine gidin.

### Üretim Derlemesi

```bash
npm run build
npm start
```

---

## 📁 Proje Yapısı

```
CineTrack/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Ana sayfa (Hero, Trend, Keşif)
│   ├── layout.tsx              # Root layout (Navbar, Font, Theme)
│   ├── globals.css             # Global stiller & animasyonlar
│   ├── film/[id]/              # Film detay sayfası
│   ├── dizi/[id]/              # Dizi detay sayfası
│   │   └── sezon/[seasonId]/   # Sezon detay sayfası
│   ├── oyuncu/[id]/            # Oyuncu detay sayfası
│   ├── izle/                   # İzleme sayfaları
│   │   ├── film/[id]/          # Film izleme
│   │   └── dizi/[id]/[sezon]/[bolum]/  # Dizi izleme
│   ├── kesif/                  # Keşif & arama sayfası
│   ├── koleksiyon/             # Koleksiyon yönetimi
│   ├── dizilerim/              # Dizi takip listesi
│   ├── oneriler/               # AI önerileri
│   ├── istatistikler/          # İzleme istatistikleri
│   ├── gecmis/                 # İzleme geçmişi
│   ├── profil/                 # Kullanıcı profili
│   └── takvim/                 # Yayın takvimi
├── components/
│   ├── ui/                     # Tekrar kullanılabilir UI bileşenleri
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── RatingStars.tsx
│   │   ├── ScrollableRow.tsx
│   │   └── Tabs.tsx
│   ├── player/                 # Video oynatıcı bileşenleri
│   │   ├── VideoPlayer.tsx
│   │   └── PlayerControls.tsx
│   ├── MovieCard.tsx           # Film kartı bileşeni
│   ├── SeriesCard.tsx          # Dizi kartı bileşeni
│   ├── Navbar.tsx              # Ana navigasyon
│   └── ...
├── lib/
│   ├── tmdb.ts                 # TMDB API istemcisi
│   ├── omdb.ts                 # OMDb API istemcisi
│   ├── storage.ts              # localStorage yönetimi
│   ├── sources.ts              # Video kaynak yönetimi
│   ├── subtitles.ts            # Altyazı API istemcisi
│   ├── tvmaze.ts               # TVMaze API istemcisi
│   └── constants.ts            # Sabitler & tür verileri
├── types/
│   ├── index.ts                # Genel tip tanımlamaları
│   └── player.ts               # Video oynatıcı tipleri
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker
│   └── icons/                  # Uygulama ikonları
├── tailwind.config.ts          # Tailwind yapılandırması
├── next.config.mjs             # Next.js yapılandırması
└── tsconfig.json               # TypeScript yapılandırması
```

---

## 🔑 API Anahtarları

| API | Amaç | Gereklilik | Ücretsiz |
|-----|-------|------------|----------|
| [TMDB](https://www.themoviedb.org/settings/api) | Film/dizi veritabanı | ✅ Zorunlu | ✅ Evet |
| [OMDb](https://www.omdbapi.com/apikey.aspx) | IMDb/Rotten Tomatoes puanları | ⭕ İsteğe bağlı | ✅ Evet |
| [OpenSubtitles](https://www.opensubtitles.com/en/consumers) | Altyazı desteği | ⭕ İsteğe bağlı | ✅ Evet |

---

## 🤝 Katkıda Bulunma

Katkılarınız her zaman memnuniyetle karşılanır! 

1. Bu repoyu **fork** edin
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Bir **Pull Request** açın

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

---

## 🙏 Teşekkürler

- [TMDB](https://www.themoviedb.org/) — Kapsamlı film ve dizi veritabanı
- [OMDb API](https://www.omdbapi.com/) — IMDb/Rotten Tomatoes puanları
- [OpenSubtitles](https://www.opensubtitles.com/) — Altyazı veritabanı
- [Lucide](https://lucide.dev/) — Güzel, tutarlı ikonlar
- [Vercel](https://vercel.com/) — Next.js hosting platformu

---

<p align="center">
  <sub>CineTrack ile yapıldı ❤️</sub>
</p>
