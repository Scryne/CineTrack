"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Smile,
  Heart,
  AlertTriangle,
  Rocket,
  Ghost,
  Sparkles,
  BookOpen,
  PlayCircle,
  Info,
  Star,
} from "lucide-react";
import ContentCard from "@/components/ContentCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import ScrollableRow from "@/components/ui/ScrollableRow";
import {
  getTrendingMovies,
  getTrendingSeries,
  getMoviesByGenre,
  getPopularMovies,
  posterUrl,
  backdropUrl,
  getRecommendations,
} from "@/lib/tmdb";
import type { TMDBMovieResult, TMDBSeriesResult } from "@/lib/tmdb";
import {
  getRecentlyWatched,
  getAllRatings,
  isInWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isWatched as checkWatched,
  markAsWatched,
  removeFromWatched,
} from "@/lib/db";
import type { WatchProgress } from "@/types/player";
import { cn } from "@/lib/utils";

// ==========================================
// Genre data
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
// Movie/Series card wrapper with local state
// ==========================================
function MovieContentCardWrapper({ movie }: { movie: TMDBMovieResult }): React.ReactElement {
  const router = useRouter();
  const movieId = movie.id.toString();
  const [inWL, setInWL] = useState(false);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    let c = false;
    Promise.all([isInWatchlist(movieId, "film"), checkWatched(movieId, "film")]).then(([wl, w]) => {
      if (!c) { setInWL(wl); setWatched(w); }
    });
    return () => { c = true; };
  }, [movieId]);

  return (
    <ContentCard
      id={movieId}
      type="film"
      title={movie.title}
      year={movie.release_date?.split("-")[0]}
      posterPath={movie.poster_path}
      rating={movie.vote_average}
      inWatchlist={inWL}
      isWatched={watched}
      onWatchlistToggle={async () => {
        if (inWL) { await removeFromWatchlist(movieId, "film"); setInWL(false); }
        else { await addToWatchlist({ id: movieId, type: "film", title: movie.title, posterPath: posterUrl(movie.poster_path), addedAt: new Date().toISOString() }); setInWL(true); }
      }}
      onWatchedToggle={async () => {
        if (watched) { await removeFromWatched(movieId, "film"); setWatched(false); }
        else { await markAsWatched({ id: movieId, type: "film", title: movie.title, posterPath: posterUrl(movie.poster_path), watchedAt: new Date().toISOString() }); setWatched(true); }
      }}
      onClick={() => router.push(`/film/${movie.id}`)}
      width={160}
    />
  );
}

function SeriesContentCardWrapper({ series }: { series: TMDBSeriesResult }): React.ReactElement {
  const router = useRouter();
  const seriesId = series.id.toString();
  const [inWL, setInWL] = useState(false);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    let c = false;
    Promise.all([isInWatchlist(seriesId, "dizi"), checkWatched(seriesId, "dizi")]).then(([wl, w]) => {
      if (!c) { setInWL(wl); setWatched(w); }
    });
    return () => { c = true; };
  }, [seriesId]);

  return (
    <ContentCard
      id={seriesId}
      type="dizi"
      title={series.name}
      year={series.first_air_date?.split("-")[0]}
      posterPath={series.poster_path}
      rating={series.vote_average}
      inWatchlist={inWL}
      isWatched={watched}
      onWatchlistToggle={async () => {
        if (inWL) { await removeFromWatchlist(seriesId, "dizi"); setInWL(false); }
        else { await addToWatchlist({ id: seriesId, type: "dizi", title: series.name, posterPath: posterUrl(series.poster_path), addedAt: new Date().toISOString() }); setInWL(true); }
      }}
      onWatchedToggle={async () => {
        if (watched) { await removeFromWatched(seriesId, "dizi"); setWatched(false); }
        else { await markAsWatched({ id: seriesId, type: "dizi", title: series.name, posterPath: posterUrl(series.poster_path), watchedAt: new Date().toISOString() }); setWatched(true); }
      }}
      onClick={() => router.push(`/dizi/${series.id}`)}
      width={160}
    />
  );
}

// ==========================================
// Home Component
// ==========================================
export default function Home(): React.ReactElement {

  // --- State ---
  const [trendingMovies, setTrendingMovies] = useState<TMDBMovieResult[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<TMDBSeriesResult[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [genreMovies, setGenreMovies] = useState<TMDBMovieResult[]>([]);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [loading, setLoading] = useState(true);
  const [continueItems, setContinueItems] = useState<WatchProgress[]>([]);
  const [recommendations, setRecommendations] = useState<(TMDBMovieResult | TMDBSeriesResult)[]>([]);
  const [recommendationSource, setRecommendationSource] = useState<{ title: string; type: "film" | "dizi" } | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  // Hero state
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // --- Load trending data ---
  useEffect(() => {
    async function loadTrending(): Promise<void> {
      setLoading(true);
      const [movies, series, popular] = await Promise.all([
        getTrendingMovies(),
        getTrendingSeries(),
        getPopularMovies(),
      ]);
      setTrendingMovies(movies || []);
      setTrendingSeries(series || []);
      setGenreMovies(popular || []);
      setLoading(false);
    }
    loadTrending();
  }, []);

  // --- Continue watching ---
  useEffect(() => {
    async function fetchContinueItems(): Promise<void> {
      const items = await getRecentlyWatched(6);
      setContinueItems(items);
    }
    fetchContinueItems();
  }, []);

  // --- Recommendations ---
  useEffect(() => {
    async function loadRecommendations(): Promise<void> {
      try {
        setLoadingRecommendations(true);
        const ratings = await getAllRatings();
        const highRatings = ratings.filter((r) => (r.rating || 0) >= 7);

        let finalRecs: (TMDBMovieResult | TMDBSeriesResult)[] = [];
        let finalSource: { title: string; type: "film" | "dizi" } | null = null;

        if (highRatings.length > 0) {
          const shuffle = [...highRatings].sort(() => 0.5 - Math.random());
          for (const item of shuffle.slice(0, 3)) {
            const tmdbIdStr = item.tmdbId ? String(item.tmdbId) : "";
            if (!tmdbIdStr) continue;
            const recs = await getRecommendations(tmdbIdStr, item.type);
            if (recs && recs.length > 5) {
              finalRecs = recs;
              finalSource = { title: item.title || "Icerik", type: item.type };
              break;
            }
          }
        }

        if (finalRecs.length === 0) {
          const recent = await getRecentlyWatched(3);
          for (const item of recent) {
            const tmdbIdStr = item.tmdbId ? String(item.tmdbId) : "";
            if (!tmdbIdStr) continue;
            const recs = await getRecommendations(tmdbIdStr, item.type);
            if (recs && recs.length > 5) {
              finalRecs = recs;
              finalSource = { title: item.title || "Icerik", type: item.type };
              break;
            }
          }
        }

        if (finalSource && finalRecs.length > 0) {
          setRecommendationSource(finalSource);
          setRecommendations(finalRecs.slice(0, 15));
        } else {
          const movies = await getTrendingMovies();
          if (movies && movies.length > 0) {
            setRecommendationSource({ title: "Populer Icerikler", type: "film" });
            setRecommendations(movies.slice(0, 15));
          }
        }
      } catch (err) {
        console.error("Error loading recommendations", err);
      } finally {
        setLoadingRecommendations(false);
      }
    }
    loadRecommendations();
  }, []);

  // --- Genre click handler ---
  const handleGenreClick = useCallback(async (genreId: number) => {
    if (selectedGenre === genreId) {
      setSelectedGenre(null);
      setLoadingGenre(true);
      const popular = await getPopularMovies();
      setGenreMovies(popular || []);
      setLoadingGenre(false);
      return;
    }
    setSelectedGenre(genreId);
    setLoadingGenre(true);
    const movies = await getMoviesByGenre(genreId);
    setGenreMovies(movies || []);
    setLoadingGenre(false);
  }, [selectedGenre]);

  // Hero content
  const heroItems = trendingMovies.slice(0, 5);
  const heroItem = heroItems[heroIndex] || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ==========================================
          HERO SECTION (full screen)
          ========================================== */}
      <section ref={heroRef} className="relative h-[85vh] w-[100vw] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden -mt-[105px]">
        {/* Background layers */}
        <AnimatePresence mode="wait">
          {heroItem && (
            <motion.div
              key={heroItem.id}
              initial={{ scale: 1.04, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={backdropUrl(heroItem.backdrop_path)}
                alt={heroItem.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradient overlay A (bottom fade) */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: "linear-gradient(to bottom, rgba(8,8,8,.2) 0%, rgba(8,8,8,0) 35%, rgba(8,8,8,0) 55%, rgba(8,8,8,1) 100%)",
          }}
        />
        {/* Gradient overlay B (left fade) */}
        <div
          className="absolute inset-0 z-[2]"
          style={{
            background: "linear-gradient(to right, rgba(8,8,8,1) 0%, rgba(8,8,8,.6) 40%, rgba(8,8,8,0) 80%)",
          }}
        />

        {/* Hero content */}
        {heroItem && (
          <motion.div
            key={heroItem.id}
            className="absolute bottom-24 left-16 max-lg:left-6 max-md:left-4 z-10 max-w-xl"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {},
            }}
          >
            {/* Genre + Year badge */}
            <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
              <span className="inline-flex items-center bg-white/[0.08] backdrop-blur border border-white/10 rounded-full text-[12px] text-white/70 px-3 py-1">
                {heroItem.genre_ids?.length > 0 ? `Trend` : "Film"} · {heroItem.release_date?.split("-")[0] || "--"}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="font-display text-[48px] lg:text-[68px] leading-[0.92] text-white mt-3"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,.8)" }}
            >
              {heroItem.title}
            </motion.h1>

            {/* Overview */}
            <motion.p
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="text-[15px] text-white/60 leading-relaxed mt-3 max-w-md line-clamp-3"
            >
              {heroItem.overview?.slice(0, 130)}{heroItem.overview && heroItem.overview.length > 130 ? "..." : ""}
            </motion.p>

            {/* Rating row */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="flex items-center gap-2 text-[13px] text-white/50 mt-2"
            >
              <Star size={13} className="fill-warn text-warn" />
              <span className="text-warn font-mono">{heroItem.vote_average?.toFixed(1)}</span>
              <span>·</span>
              <span>{heroItem.release_date?.split("-")[0]}</span>
            </motion.div>

            {/* Buttons */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="flex gap-3 mt-6"
            >
              <Link href={`/izle/film/${heroItem.id}`}>
                <button className="flex items-center gap-2 bg-white text-black rounded-lg h-11 px-6 text-[14px] font-semibold hover:bg-white/90 transition-colors">
                  <PlayCircle size={16} />
                  Simdi Izle
                </button>
              </Link>
              <Link href={`/film/${heroItem.id}`}>
                <button className="flex items-center gap-2 bg-white/10 backdrop-blur text-white border border-white/15 rounded-lg h-11 px-6 text-[14px] font-medium hover:bg-white/[0.18] transition-colors">
                  <Info size={16} />
                  Detaya Git
                </button>
              </Link>
            </motion.div>
          </motion.div>
        )}

        {/* Right side — trending thumbnails */}
        <div className="absolute right-16 max-lg:right-6 max-md:hidden bottom-24 z-10 flex flex-col gap-2">
          {heroItems.slice(0, 4).map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setHeroIndex(idx)}
              className={cn(
                "w-[60px] h-[90px] rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
                idx === heroIndex
                  ? "border-purple-500 shadow-glow-sm"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={posterUrl(item.poster_path)}
                alt={item.title}
                width={60}
                height={90}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Page content */}
      <div className="space-y-[72px] pb-20">
        {/* ==========================================
            CONTINUE WATCHING
            ========================================== */}
        {continueItems.length > 0 && (
          <section className="max-w-[1400px] mx-auto px-16 max-lg:px-6 max-md:px-4 pt-12">
            <SectionHeader title="Kaldigin Yerden Devam Et" className="mb-5" />
            <ScrollableRow innerClassName="h-scroll pb-6 pt-2">
              {continueItems.map((item) => (
                <Link
                  key={`${item.type}-${item.tmdbId}`}
                  href={`/izle/${item.type}/${item.tmdbId}${item.type === "dizi" ? `/${item.season}/${item.episode}` : ""}`}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-72 h-44 rounded-xl overflow-hidden bg-raised border border-border-dim group-hover:border-purple-500/60 group-hover:shadow-card-up transition-all duration-300">
                    {/* Backdrop */}
                    {(item.backdropPath || item.posterPath) && (
                      <Image
                        src={item.backdropPath ? backdropUrl(item.backdropPath) : posterUrl(item.posterPath)}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="288px"
                      />
                    )}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to bottom, rgba(8,8,8,0) 0%, rgba(8,8,8,.95) 100%)" }}
                    />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <Badge variant="ghost" className="text-[10px]">
                        {item.type === "film" ? "Film" : "Dizi"}
                      </Badge>
                      <p className="text-[15px] font-semibold text-white mt-1 line-clamp-1">{item.title}</p>
                      {item.type === "dizi" && item.season && item.episode && (
                        <p className="text-purple-300 text-[12px]">S{item.season}E{item.episode}</p>
                      )}
                      {item.type === "dizi" && item.totalEpisodes && item.watchedEpisodes !== undefined && (
                        <ProgressBar
                          value={Math.min((item.watchedEpisodes / item.totalEpisodes) * 100, 100)}
                          size="xs"
                          className="mt-2"
                        />
                      )}
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="primary" size="xs" className="w-full" icon={PlayCircle}>
                          Devam Et
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </ScrollableRow>
          </section>
        )}

        {/* ==========================================
            PERSONALIZED RECOMMENDATIONS
            ========================================== */}
        {!loadingRecommendations && recommendations.length > 0 && recommendationSource && (
          <section className="max-w-[1400px] mx-auto px-16 max-lg:px-6 max-md:px-4">
            <SectionHeader
              title="Sana Ozel"
              subtitle="Izleme gecmisine gore"
              icon={Sparkles}
              className="mb-5"
            />
            <ScrollableRow innerClassName="h-scroll pb-6 pt-2">
              {recommendations.map((item) => (
                <div key={`rec-${item.id}`}>
                  {"title" in item ? (
                    <MovieContentCardWrapper movie={item as TMDBMovieResult} />
                  ) : (
                    <SeriesContentCardWrapper series={item as TMDBSeriesResult} />
                  )}
                </div>
              ))}
            </ScrollableRow>
          </section>
        )}

        {/* ==========================================
            TRENDING MOVIES
            ========================================== */}
        <section className="max-w-[1400px] mx-auto px-16 max-lg:px-6 max-md:px-4">
          <SectionHeader title="Bu Hafta Trend Filmler" href="/kesif?type=film" className="mb-5" />
          {loading ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-40 aspect-[2/3] flex-shrink-0 skeleton" />
              ))}
            </div>
          ) : (
            <ScrollableRow innerClassName="h-scroll pb-6 pt-2">
              {trendingMovies.map((movie) => (
                <MovieContentCardWrapper key={movie.id} movie={movie} />
              ))}
            </ScrollableRow>
          )}
        </section>

        {/* ==========================================
            TRENDING SERIES
            ========================================== */}
        <section className="max-w-[1400px] mx-auto px-16 max-lg:px-6 max-md:px-4">
          <SectionHeader title="Bu Hafta Trend Diziler" href="/kesif?type=dizi" className="mb-5" />
          {loading ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-40 aspect-[2/3] flex-shrink-0 skeleton" />
              ))}
            </div>
          ) : (
            <ScrollableRow innerClassName="h-scroll pb-6 pt-2">
              {trendingSeries.map((series) => (
                <SeriesContentCardWrapper key={series.id} series={series} />
              ))}
            </ScrollableRow>
          )}
        </section>

        {/* ==========================================
            GENRE DISCOVERY
            ========================================== */}
        <section className="max-w-[1400px] mx-auto px-16 max-lg:px-6 max-md:px-4 pb-8">
          <SectionHeader title="Ture Gore Kesfet" className="mb-5" />

          {/* Genre pills */}
          <ScrollableRow innerClassName="h-scroll mb-6 pb-4 pt-2">
            {GENRES.map((genre) => {
              const Icon = genre.icon;
              const active = selectedGenre === genre.id;
              return (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre.id)}
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 rounded-full text-[13px] font-medium whitespace-nowrap transition-all flex-shrink-0",
                    active
                      ? "bg-purple-950 border border-purple-800 text-purple-300"
                      : "bg-subtle border border-border-mid text-text-sec hover:bg-overlay hover:border-border-bright hover:text-text-pri"
                  )}
                >
                  <Icon size={15} className="text-text-muted" />
                  {genre.name}
                </button>
              );
            })}
          </ScrollableRow>

          {/* Genre results */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedGenre || "popular"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {loadingGenre ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] skeleton" />
                  ))}
                </div>
              ) : genreMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {genreMovies.map((movie, index) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                    >
                      <MovieContentCardWrapper movie={movie} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-center py-12">
                  Film bulunamadi.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </motion.div>
  );
}
