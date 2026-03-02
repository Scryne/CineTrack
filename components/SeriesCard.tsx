"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { posterUrl, BLUR_PLACEHOLDER, getSeriesDetail } from "@/lib/tmdb";
import { addToWatchlist, removeFromWatchlist, isInWatchlist, markAsWatched, removeFromWatched, isWatched, markAllEpisodesWatched, removeAllEpisodesWatched } from "@/lib/storage";
import type { TMDBSeriesResult } from "@/lib/tmdb";

interface SeriesCardProps {
    series: TMDBSeriesResult;
}

export default function SeriesCard({ series }: SeriesCardProps) {
    const seriesId = series.id.toString();
    const [inWatchlist, setInWatchlist] = useState(() => isInWatchlist(seriesId, "dizi"));
    const [watched, setWatched] = useState(() => isWatched(seriesId, "dizi"));
    const [isHovered, setIsHovered] = useState(false);

    const year = series.first_air_date?.split("-")[0] || "—";
    const rating = series.vote_average?.toFixed(1) || "—";
    const poster = posterUrl(series.poster_path);

    const handleWatchlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (inWatchlist) {
            removeFromWatchlist(seriesId, "dizi");
            setInWatchlist(false);
        } else {
            addToWatchlist({
                id: seriesId,
                type: "dizi",
                title: series.name,
                posterPath: poster,
                addedAt: new Date().toISOString(),
            });
            setInWatchlist(true);
        }
    };

    const handleWatched = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (watched) {
            removeFromWatched(seriesId, "dizi");
            removeAllEpisodesWatched(seriesId);
            setWatched(false);
        } else {
            markAsWatched({
                id: seriesId,
                type: "dizi",
                title: series.name,
                posterPath: poster,
                watchedAt: new Date().toISOString(),
            });
            setWatched(true);
            // Tüm bölümleri izlendi olarak işaretle
            const detail = await getSeriesDetail(seriesId);
            if (detail?.seasons) {
                const seasonData = detail.seasons
                    .filter((s) => s.season_number > 0)
                    .map((s) => ({ seasonNumber: s.season_number, episodeCount: s.episode_count }));
                markAllEpisodesWatched(seriesId, seasonData);
            }
        }
    };

    return (
        <Link href={`/dizi/${series.id}`}>
            <motion.div
                className="relative group w-[200px] flex-shrink-0 rounded-lg overflow-hidden cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
            >
                {/* Poster */}
                <div className="relative w-[200px] h-[300px] bg-card">
                    {series.poster_path ? (
                        <Image
                            src={poster}
                            alt={series.name}
                            fill
                            className="object-cover"
                            sizes="200px"
                            placeholder="blur"
                            blurDataURL={BLUR_PLACEHOLDER}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-sm">
                            Görsel Yok
                        </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Puan badge */}
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-semibold text-white">{rating}</span>
                    </div>

                    {/* Alt bilgi */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                            {series.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">{year}</p>
                    </div>

                    {/* Hover aksiyon butonları */}
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                className="absolute top-2 left-2 flex flex-col gap-2"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.15 }}
                            >
                                <motion.button
                                    onClick={handleWatchlist}
                                    title={inWatchlist ? "Listeden çıkar" : "Listeye ekle"}
                                    whileTap={{ scale: 0.9 }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${inWatchlist
                                        ? "bg-accent text-white"
                                        : "bg-black/60 text-white hover:bg-accent"
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {inWatchlist ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        )}
                                    </svg>
                                </motion.button>
                                <motion.button
                                    onClick={handleWatched}
                                    title={watched ? "İzlenmedi yap" : "İzlendi işaretle"}
                                    whileTap={{ scale: 0.9 }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${watched
                                        ? "bg-green-600 text-white"
                                        : "bg-black/60 text-white hover:bg-green-600"
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </Link>
    );
}
