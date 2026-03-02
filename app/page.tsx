"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Film,
  Tv,
  ArrowRight,
  ChevronRight,
  Zap,
  Smile,
  Heart,
  AlertTriangle,
  Rocket,
  Ghost,
  Sparkles,
  BookOpen,
  Loader2,
  Clock,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import MovieCard from "@/components/MovieCard";
import SeriesCard from "@/components/SeriesCard";
import ScrollableRow from "@/components/ui/ScrollableRow";
import { searchMulti, getTrendingMovies, getTrendingSeries, getMoviesByGenre, posterUrl, backdropUrl } from "@/lib/tmdb";
import type { TMDBMultiSearchResult, TMDBMovieResult, TMDBSeriesResult } from "@/lib/tmdb";
import { getRecentlyWatched } from "@/lib/storage";
import type { WatchProgress } from "@/types/player";

// ==========================================
// Tür Verileri
// ==========================================
const GENRES = [
  { id: 28, name: "Aksiyon", icon: Zap },
  { id: 35, name: "Komedi", icon: Smile },
  { id: 18, name: "Dram", icon: Heart },
  { id: 53, name: "Gerilim", icon: AlertTriangle },
  { id: 878, name: "Bilim Kurgu", icon: Rocket },
  { id: 27, name: "Korku", icon: Ghost },
  { id: 16, name: "Animasyon", icon: Sparkles },
  { id: 99, name: "Belgesel", icon: BookOpen },
];


// ==========================================
// Ana Sayfa Bileşeni
// ==========================================
export default function Home() {
  // --- State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBMultiSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [trendingMovies, setTrendingMovies] = useState<TMDBMovieResult[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<TMDBSeriesResult[]>([]);

  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [genreMovies, setGenreMovies] = useState<TMDBMovieResult[]>([]);
  const [loadingGenre, setLoadingGenre] = useState(false);

  const [loading, setLoading] = useState(true);

  // Continue watching state
  const [continueItems, setContinueItems] = useState<WatchProgress[]>([]);

  // --- Trending verileri yukle ---
  useEffect(() => {
    async function loadTrending() {
      setLoading(true);
      const [movies, series] = await Promise.all([
        getTrendingMovies(),
        getTrendingSeries(),
      ]);
      setTrendingMovies(movies || []);
      setTrendingSeries(series || []);
      setLoading(false);
    }
    loadTrending();
  }, []);

  // --- Continue watching verileri ---
  useEffect(() => {
    const items = getRecentlyWatched(6);
    setContinueItems(items);
  }, []);

  // --- Arama (debounce 400ms) ---
  const doSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    const results = await searchMulti(query);
    if (results) {
      setSearchResults(
        results.filter((r) => r.media_type !== "person").slice(0, 10)
      );
      setShowDropdown(true);
    }
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  // --- Dropdown disariya tiklaninca kapat ---
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Ture gore kesfet ---
  const handleGenreClick = async (genreId: number) => {
    if (selectedGenre === genreId) {
      setSelectedGenre(null);
      setGenreMovies([]);
      return;
    }
    setSelectedGenre(genreId);
    setLoadingGenre(true);
    const movies = await getMoviesByGenre(genreId);
    setGenreMovies(movies || []);
    setLoadingGenre(false);
  };

  // --- Film ve dizi sonuclarini ayir ---
  const movieResults = searchResults.filter((r) => r.media_type === "movie");
  const tvResults = searchResults.filter((r) => r.media_type === "tv");

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* ========================================== */}
      {/* BOLUM 1 — HERO                            */}
      {/* ========================================== */}
      <section
        className="relative flex flex-col items-center px-4"
        style={{
          paddingTop: "120px",
          paddingBottom: "80px",
          background:
            "radial-gradient(ellipse at center, rgba(123,92,240,0.10) 0%, #0D0D0F 70%)",
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="purple" className="mb-6 text-sm px-4 py-1.5">
            Sinematik Deneyim
          </Badge>
        </motion.div>

        {/* Ana Baslik */}
        <motion.h1
          className="font-display text-[40px] sm:text-[48px] lg:text-[56px] font-bold text-text-primary text-center leading-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Sinema Dünyanı Keşfet
        </motion.h1>

        {/* Alt Baslik */}
        <motion.p
          className="text-lg text-text-secondary text-center mb-10 max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Filmlerini ve dizilerini takip et, keşfet, puanla.
        </motion.p>

        {/* Arama Kutusu */}
        <motion.div
          ref={searchRef}
          className="relative w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="relative">
            <Input
              icon={Search}
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder="Film veya dizi ara..."
              clearable
              className="!py-4 !pl-12 !text-base !rounded-2xl !bg-bg-card !border-border"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 size={18} className="animate-spin text-purple" />
              </div>
            )}
          </div>

          {/* Arama Dropdown */}
          <AnimatePresence>
            {showDropdown && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 w-full bg-bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[420px] overflow-y-auto"
              >
                {/* Film Sonuclari */}
                {movieResults.length > 0 && (
                  <div>
                    <div className="px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border flex items-center gap-2">
                      <Film size={14} />
                      Filmler
                    </div>
                    {movieResults.map((result) => (
                      <Link
                        key={`movie-${result.id}`}
                        href={`/film/${result.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="relative w-[40px] h-[60px] flex-shrink-0 rounded-md overflow-hidden bg-bg-hover">
                          {result.poster_path ? (
                            <Image
                              src={posterUrl(result.poster_path)}
                              alt={result.title || ""}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-text-muted">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {result.release_date?.split("-")[0] || "--"}
                            {result.vote_average
                              ? ` / ${result.vote_average.toFixed(1)}`
                              : ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Dizi Sonuclari */}
                {tvResults.length > 0 && (
                  <div>
                    <div className="px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border border-t flex items-center gap-2">
                      <Tv size={14} />
                      Diziler
                    </div>
                    {tvResults.map((result) => (
                      <Link
                        key={`tv-${result.id}`}
                        href={`/dizi/${result.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="relative w-[40px] h-[60px] flex-shrink-0 rounded-md overflow-hidden bg-bg-hover">
                          {result.poster_path ? (
                            <Image
                              src={posterUrl(result.poster_path)}
                              alt={result.name || ""}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-text-muted">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {result.name}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {result.first_air_date?.split("-")[0] || "--"}
                            {result.vote_average
                              ? ` / ${result.vote_average.toFixed(1)}`
                              : ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Tumunu Gor */}
                <Link
                  href={`/kesif?q=${encodeURIComponent(searchQuery)}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-purple hover:bg-bg-hover transition-colors border-t border-border"
                  onClick={() => setShowDropdown(false)}
                >
                  Tümünü gör
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ========================================== */}
      {/* BOLUM 2 — KALDIGIN YERDEN DEVAM ET         */}
      {/* ========================================== */}
      {continueItems.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: "80px" }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">
              Kaldığın Yerden Devam Et
            </h2>

            <ScrollableRow>
              {continueItems.map((item) => (
                <Link
                  key={`${item.type}-${item.tmdbId}`}
                  href={`/izle/${item.type}/${item.tmdbId}${item.type === "dizi" ? `/${item.season}/${item.episode}` : ""}`}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-[280px] h-[160px] rounded-xl overflow-hidden bg-bg-card border border-border group-hover:border-purple transition-all duration-300">
                    {/* Backdrop / Poster */}
                    {(item.backdropPath || item.posterPath) && (
                      <Image
                        src={item.backdropPath ? backdropUrl(item.backdropPath) : posterUrl(item.posterPath)}
                        alt={item.title}
                        fill
                        className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        sizes="280px"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                    {/* Icerik */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className={`text-sm text-white leading-tight line-clamp-1 mb-1 ${item.type === "dizi" ? "font-bold" : "font-semibold"}`}>
                        {item.title}
                      </h3>

                      {item.type === "film" ? (
                        <p className="flex items-center gap-1.5 text-xs text-text-muted mb-2">
                          <Clock size={12} className="text-text-muted" /> Filmde kaldın
                        </p>
                      ) : (
                        <p className="text-xs text-purple-light mb-2">
                          S{item.season}E{item.episode} · {item.episodeTitle}
                        </p>
                      )}

                      {/* Progress bar (dizi icin) */}
                      {item.type === "dizi" && item.totalEpisodes && item.watchedEpisodes !== undefined && (
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-purple rounded-full transition-all"
                            style={{ width: `${Math.min((item.watchedEpisodes / item.totalEpisodes) * 100, 100)}%` }}
                          />
                        </div>
                      )}

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-light">
                          {item.type === "film" ? "İzlemeye Devam Et" : "Devam Et"}
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </ScrollableRow>
          </div>
        </section>
      )}

      {/* ========================================== */}
      {/* BOLUM 3 — TREND FILMLER                    */}
      {/* ========================================== */}
      <section className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: "80px" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-text-primary">
              Bu Hafta Trend Filmler
            </h2>
            <Link
              href="/kesif?type=film"
              className="flex items-center gap-1 text-sm font-medium text-purple hover:text-purple-light transition-colors"
            >
              Tümünü Gör
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[180px] h-[270px] flex-shrink-0 bg-bg-card rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <ScrollableRow>
              {trendingMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ScrollableRow>
          )}
        </div>
      </section>

      {/* ========================================== */}
      {/* BOLUM 4 — TREND DIZILER                    */}
      {/* ========================================== */}
      <section className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: "80px" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-text-primary">
              Bu Hafta Trend Diziler
            </h2>
            <Link
              href="/kesif?type=dizi"
              className="flex items-center gap-1 text-sm font-medium text-purple hover:text-purple-light transition-colors"
            >
              Tümünü Gör
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[180px] h-[270px] flex-shrink-0 bg-bg-card rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <ScrollableRow>
              {trendingSeries.map((series) => (
                <SeriesCard key={series.id} series={series} />
              ))}
            </ScrollableRow>
          )}
        </div>
      </section>

      {/* ========================================== */}
      {/* BOLUM 5 — TURE GORE KESFET                 */}
      {/* ========================================== */}
      <section
        className="px-4 sm:px-6 lg:px-8 pb-20"
        style={{ paddingTop: "80px" }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-text-primary mb-6">
            Türe Göre Keşfet
          </h2>

          {/* Tur Pill Butonlari */}
          <ScrollableRow innerClassName="flex gap-3">
            {GENRES.map((genre) => {
              const Icon = genre.icon;
              const isActive = selectedGenre === genre.id;
              return (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre.id)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium
                    whitespace-nowrap transition-all duration-200 flex-shrink-0
                    ${isActive
                      ? "bg-purple text-white shadow-lg shadow-purple/25"
                      : "bg-bg-card text-text-secondary border border-border hover:border-purple/50 hover:text-text-primary"
                    }
                  `}
                >
                  <Icon size={16} />
                  {genre.name}
                </button>
              );
            })}
          </ScrollableRow>

          {/* Ture Gore Sonuclar */}
          <AnimatePresence mode="wait">
            {selectedGenre && (
              <motion.div
                key={selectedGenre}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-6">
                  {loadingGenre ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-[2/3] bg-bg-card rounded-xl animate-pulse"
                        />
                      ))}
                    </div>
                  ) : genreMovies.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {genreMovies.map((movie, index) => (
                        <motion.div
                          key={movie.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.03,
                          }}
                        >
                          <MovieCard movie={movie} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-secondary text-center py-12">
                      Bu türde film bulunamadı.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
