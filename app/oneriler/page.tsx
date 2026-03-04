"use client";

import { logger } from '@/lib/logger';

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Heart,
    History,
    Shuffle,
    BookmarkPlus,
    CheckCircle2,
    Copy,
    Star,
    Film,
    Tv,
    X,
    MessageSquareQuote
} from "lucide-react";
import {
    getRecommendations,
    getByGenres,
    getTrendingAll,
    getMovieDetail,
    getSeriesDetail,
    posterUrl
} from "@/lib/tmdb";
import type { TMDBMovieResult, TMDBSeriesResult } from "@/lib/tmdb";
import {
    getWatched,
    getAllRatings,
    addToWatchlist,
    isInWatchlist,
} from "@/lib/db";
import type { WatchedItem, RatingItem } from "@/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ScrollableRow from "@/components/ui/ScrollableRow";

// ==========================================
// Yardımcı Tipler
// ==========================================
type ContentItem = (TMDBMovieResult | TMDBSeriesResult) & {
    _mediaType?: "film" | "dizi";
    _reason?: string;
};

function getTitle(item: ContentItem): string {
    return (item as TMDBMovieResult).title || (item as TMDBSeriesResult).name || "—";
}

function getId(item: ContentItem): number {
    return item.id;
}

function getRating(item: ContentItem): number {
    return item.vote_average ?? 0;
}

function getYear(item: ContentItem): string {
    const date = (item as TMDBMovieResult).release_date || (item as TMDBSeriesResult).first_air_date;
    return date?.split("-")[0] || "TBA";
}

function getMediaType(item: ContentItem): "film" | "dizi" {
    if (item._mediaType) return item._mediaType;
    if ((item as TMDBMovieResult).title) return "film";
    return "dizi";
}

function getLink(item: ContentItem): string {
    const type = getMediaType(item);
    return type === "film" ? `/film/${item.id}` : `/dizi/${item.id}`;
}

// ==========================================
// Kart Bileşenleri
// ==========================================
function StandardRecCard({ item }: { item: ContentItem }) {
    const title = getTitle(item);
    const rating = getRating(item).toFixed(1);
    const year = getYear(item);
    const poster = posterUrl(item.poster_path);
    const link = getLink(item);

    return (
        <Card hover className="w-[160px] sm:w-[180px] shrink-0 p-0 relative group h-[240px] sm:h-[270px] bg-bg-card border-border overflow-hidden">
            <Link href={link} className="flex flex-col h-full w-full">
                {item.poster_path ? (
                    <Image src={poster} alt={title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="180px" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-bg-card text-text-muted"><Film size={32} /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent opacity-90" />

                {/* Puan Badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 flex items-center gap-1.5 rounded-lg border border-white/5 shadow-md">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[11px] font-bold text-white">{rating}</span>
                </div>

                {/* Info Text */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10 flex flex-col justify-end">
                    <h3 className="font-display font-bold text-sm text-text-primary leading-tight line-clamp-2 mb-1 group-hover:text-purple transition-colors drop-shadow-md">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        <span>{year}</span>
                        <span>•</span>
                        <span className="bg-bg-hover px-1.5 py-0.5 rounded text-[10px] text-text-muted">
                            {getMediaType(item) === "film" ? "Film" : "Dizi"}
                        </span>
                    </div>
                </div>
            </Link>
        </Card>
    );
}


// ==========================================
// Ana Sayfa Bileşeni
// ==========================================
export default function OnerilerPage() {
    const [personalizedItems, setPersonalizedItems] = useState<ContentItem[]>([]);
    const [similarRows, setSimilarRows] = useState<{ sourceTitle: string, items: ContentItem[] }[]>([]);
    const [discoveryItem, setDiscoveryItem] = useState<ContentItem | null>(null);
    const [highRatedItems, setHighRatedItems] = useState<RatingItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [discoveryLoading, setDiscoveryLoading] = useState(false);
    const [addedToList, setAddedToList] = useState(false);
    const [copied, setCopied] = useState(false);

    // Rastgele Animasyon State'i
    const [flipKey, setFlipKey] = useState(0);

    // ========================================
    // DATA FETCHING
    // ========================================
    const loadPersonalized = useCallback(async () => {
        const watched = await getWatched();
        if (watched.length === 0) return;

        const genreCount: Record<number, { count: number; name: string }> = {};
        const detailPromises = watched.slice(0, 15).map(async (w: WatchedItem) => {
            if (w.type === "film") {
                const detail = await getMovieDetail(w.id);
                detail?.genres?.forEach((g) => {
                    genreCount[g.id] = genreCount[g.id] || { count: 0, name: g.name };
                    genreCount[g.id].count++;
                });
            } else {
                const detail = await getSeriesDetail(w.id);
                detail?.genres?.forEach((g) => {
                    genreCount[g.id] = genreCount[g.id] || { count: 0, name: g.name };
                    genreCount[g.id].count++;
                });
            }
        });
        await Promise.all(detailPromises);

        const topGenres = Object.entries(genreCount)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3);

        if (topGenres.length === 0) return;

        const topGenreIds = topGenres.map(([id]) => Number(id));
        const watchedIds = new Set(watched.map((w) => w.id.toString()));

        const [movieResults, seriesResults] = await Promise.all([
            getByGenres(topGenreIds, "film"),
            getByGenres(topGenreIds, "dizi"),
        ]);

        const allResults: ContentItem[] = [];
        const processResults = (res: (TMDBMovieResult | TMDBSeriesResult)[], type: "film" | "dizi") => {
            (res || []).forEach(item => {
                if (!watchedIds.has(item.id.toString())) {
                    allResults.push({ ...item, _mediaType: type });
                }
            });
        };

        processResults(movieResults || [], "film");
        processResults(seriesResults || [], "dizi");

        allResults.sort((a, b) => getRating(b) - getRating(a));
        setPersonalizedItems(allResults.slice(0, 20));
    }, []);

    const loadRecommended = useCallback(async () => {
        const watched = await getWatched();
        if (watched.length === 0) return;

        // Son 3 izlenen içeriğin adlarını ve onlar için ayrı satırlar oluştur.
        const last3 = watched.slice(0, 3); // Assume getWatched() is sorted newest first
        const watchedIds = new Set(watched.map((w) => w.id.toString()));

        const rowsResult: { sourceTitle: string, items: ContentItem[] }[] = [];

        for (const w of last3) {
            const recs = await getRecommendations(w.id, w.type);
            if (recs && recs.length > 0) {
                const uniqueRecs: ContentItem[] = [];
                recs.forEach(r => {
                    if (!watchedIds.has(r.id.toString())) {
                        uniqueRecs.push({
                            ...r,
                            _mediaType: w.type // keep same type
                        });
                    }
                });

                if (uniqueRecs.length > 0) {
                    uniqueRecs.sort((a, b) => getRating(b) - getRating(a));
                    rowsResult.push({
                        sourceTitle: w.title,
                        items: uniqueRecs.slice(0, 15) // take top 15 for each row
                    });
                }
            }
        }

        setSimilarRows(rowsResult);
    }, []);

    const pickRandom = useCallback(async () => {
        setDiscoveryLoading(true);
        setAddedToList(false);
        setFlipKey(prev => prev + 1);

        try {
            // Trendlerden seçelim, hem film hem dizi gelsin
            const trends = await getTrendingAll();

            if (trends && trends.length > 0) {
                // Rastgele id al ama watchlist'te olmayan seç
                const randomItem = trends[Math.floor(Math.random() * trends.length)];

                const mType = (randomItem as TMDBMovieResult).title ? "film" : "dizi";
                const isWatchlisted = await isInWatchlist(randomItem.id.toString(), mType);

                setDiscoveryItem({
                    ...randomItem,
                    _mediaType: mType
                } as ContentItem);

                setAddedToList(isWatchlisted);
            }
        } catch (error) {
            logger.error('Rastgele keşif hatası', error);
        } finally {
            setDiscoveryLoading(false);
        }
    }, []);

    const handleAddToList = useCallback(async () => {
        if (!discoveryItem || addedToList) return;
        const mediaType = getMediaType(discoveryItem);
        await addToWatchlist({
            id: discoveryItem.id.toString(),
            type: mediaType,
            title: getTitle(discoveryItem),
            posterPath: posterUrl(discoveryItem.poster_path),
            addedAt: new Date().toISOString(),
        });
        setAddedToList(true);
    }, [discoveryItem, addedToList]);

    const loadHighRated = useCallback(async () => {
        const rats = await getAllRatings();
        const highRated = rats.filter((r) => r.rating >= 8).sort((a, b) => b.rating - a.rating);
        setHighRatedItems(highRated);
    }, []);

    const handleCopyList = useCallback(async () => {
        const text = highRatedItems.map((r, i) => `${i + 1}. ${r.title} (${r.rating}/10)`).join("\n");
        const fullText = `*Benim favorilerim!*\n\n${text}`;

        try {
            await navigator.clipboard.writeText(fullText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = fullText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [highRatedItems]);

    useEffect(() => {
        async function init() {
            setLoading(true);
            await Promise.all([loadPersonalized(), loadRecommended(), loadHighRated()]);
            // Başlangıçta bir rastgele de getirelim (arkada yüklensin)
            pickRandom();
            setLoading(false);
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // ========================================
    // RENDER
    // ========================================
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-purple border-t-transparent flex items-center justify-center rounded-full animate-spin shadow-lg shadow-purple/20">
                    <Sparkles size={16} className="text-purple animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            {/* Sayfa Başlığı */}
            <div className="mb-10 pt-6">
                <div className="flex justify-center items-center gap-3 mb-3">
                    <Sparkles className="text-purple w-8 h-8" />
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
                        Sana Özel
                    </h1>
                </div>
                <p className="text-text-secondary text-center text-sm md:text-base max-w-2xl mx-auto">
                    Algoritmamız, geçmiş izlemelerinizi ve puanlarınızı analiz ederek tamamen size özel bu küratörlüğü çıkardı.
                </p>
            </div>

            <div className="space-y-16">
                {/* BÖLÜM 1 - Algoritmik */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Badge variant="purple" className="text-xs uppercase tracking-wider font-bold h-[28px] items-center flex gap-1.5 shadow-sm">
                            <Heart size={12} className="fill-purple" />
                            Beğenilerine Göre
                        </Badge>
                    </div>
                    {personalizedItems.length > 0 ? (
                        <ScrollableRow innerClassName="flex gap-4 py-1 px-1 -mx-1 -my-1">
                            {personalizedItems.map(item => (
                                <StandardRecCard key={`p-${getId(item)}`} item={item} />
                            ))}
                        </ScrollableRow>
                    ) : (
                        <div className="bg-bg-card border border-border rounded-2xl p-8 text-center flex flex-col items-center">
                            <Film className="w-12 h-12 text-text-muted mb-4 opacity-50" />
                            <p className="text-text-secondary font-medium">Henüz yeterli izleme verinız yok. Keşfet&apos;ten içerik ekleyin.</p>
                        </div>
                    )}
                </section>

                {/* BÖLÜM 2 - Benzer İçerikler */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-bg-card border border-border flex items-center justify-center shadow-sm">
                            <History size={20} className="text-purple-light" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-text-primary">Son İzlediklerine Göre</h2>
                    </div>

                    {similarRows.length > 0 ? (
                        <div className="space-y-8">
                            {similarRows.map((row) => (
                                <div key={row.sourceTitle} className="relative">
                                    <h3 className="text-sm font-bold text-text-secondary mb-3 flex items-center gap-2">
                                        <MessageSquareQuote size={14} className="text-text-muted" />
                                        &quot;<span className="text-text-primary">{row.sourceTitle}</span>&quot; izlediğin için
                                    </h3>
                                    <ScrollableRow innerClassName="flex gap-4 py-1 px-1 -mx-1 -my-1">
                                        {row.items.map(item => (
                                            <StandardRecCard key={`r-${getId(item)}`} item={item} />
                                        ))}
                                    </ScrollableRow>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-bg-card border border-border rounded-2xl p-8 text-center flex flex-col items-center">
                            <Tv className="w-12 h-12 text-text-muted mb-4 opacity-50" />
                            <p className="text-text-secondary font-medium">İzleme geçmişiniz boş gözüküyor.</p>
                        </div>
                    )}
                </section>

                {/* BÖLÜM 3 - Rastgele Keşfet */}
                <section>
                    <div className="max-w-3xl mx-auto flex flex-col items-center py-6">
                        <div className="text-center mb-8">
                            <h2 className="font-display text-2xl font-bold text-text-primary mb-3 text-center">Rastgele Keşfet</h2>
                            <p className="text-sm text-text-secondary">Seçim yapmak zor geliyorsa algoritmaya güven.</p>
                        </div>

                        {discoveryLoading ? (
                            <Card className="w-full max-w-2xl h-[400px] flex flex-col items-center justify-center p-8 bg-bg-card border border-border shadow-2xl">
                                <div className="w-12 h-12 border-4 border-purple border-t-transparent flex items-center justify-center rounded-full animate-spin shadow-lg shadow-purple/20 mb-4" />
                                <span className="text-text-secondary font-medium font-display animate-pulse">Sürpriz çıkartılıyor...</span>
                            </Card>
                        ) : discoveryItem ? (
                            <div className="w-full max-w-2xl relative perspective-[1200px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={flipKey}
                                        initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, rotateX: -20 }}
                                        transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                                        className="w-full"
                                    >
                                        <Card className="relative p-0 overflow-hidden flex flex-col sm:flex-row bg-bg-card border border-border shadow-2xl shadow-purple/5">
                                            {/* Sol Afiş */}
                                            <div className="relative w-full sm:w-[220px] aspect-[2/3] sm:aspect-auto sm:h-[330px] shrink-0 bg-bg-hover">
                                                {discoveryItem.poster_path ? (
                                                    <Image
                                                        src={posterUrl(discoveryItem.poster_path)}
                                                        alt={getTitle(discoveryItem)}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-text-muted"><Film size={40} /></div>
                                                )}
                                            </div>
                                            {/* Sağ İçerik */}
                                            <div className="p-6 flex-1 flex flex-col justify-between min-w-0">
                                                <div>
                                                    <h3 className="font-display font-bold text-2xl text-text-primary mb-2 leading-tight">
                                                        {getTitle(discoveryItem)}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mb-4 text-sm font-medium">
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/50 border border-white/5 rounded-md text-yellow-400">
                                                            <Star size={14} className="fill-yellow-400" />
                                                            <span>{getRating(discoveryItem).toFixed(1)}</span>
                                                        </div>
                                                        <span className="text-text-secondary">{getYear(discoveryItem)}</span>
                                                        <span className="text-text-muted">•</span>
                                                        <span className="text-text-secondary uppercase text-[10px] tracking-widest font-bold">
                                                            {getMediaType(discoveryItem) === "film" ? "Film" : "Dizi"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-secondary line-clamp-4 leading-relaxed mix-blend-plus-lighter">
                                                        {discoveryItem.overview || "Bu içerik için açıklama detayı bulunmuyor."}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 pt-6 border-t border-border/50">
                                                    <Button variant="primary" className="w-full justify-center" onClick={pickRandom} icon={Shuffle}>
                                                        Başka Öner
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        className={`w-full justify-center ${addedToList ? 'pointer-events-none text-green-400' : 'bg-bg-hover'}`}
                                                        onClick={handleAddToList}
                                                        disabled={addedToList}
                                                        icon={addedToList ? CheckCircle2 : BookmarkPlus}
                                                    >
                                                        {addedToList ? "Listelendi" : "Listeye Ekle"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        ) : null}
                    </div>
                </section>

                {/* BÖLÜM 4 - Arkadaşa Önerdiklerim */}
                <section>
                    <div className="bg-bg-card border border-border p-6 sm:p-8 rounded-3xl relative overflow-hidden group">
                        {/* Arka plan süsleri */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-1 min-w-0 pr-0 md:pr-10 text-center md:text-left">
                                <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
                                    Arkadaşa Önerdiklerim
                                </h2>
                                <p className="text-sm font-medium text-text-secondary mb-6 leading-relaxed">
                                    8.0 ve üzeri puan verdiğin içerikler senin hit listen. Şimdi favorilerini kopyala ve arkadaşlarınla paylaş.
                                </p>

                                {highRatedItems.length > 0 ? (
                                    <Button
                                        variant="primary"
                                        onClick={handleCopyList}
                                        icon={copied ? CheckCircle2 : Copy}
                                        className={copied ? "bg-green-600 text-white hover:bg-green-700" : ""}
                                    >
                                        {copied ? "Kopyalandı!" : "Listemi Kopyala"}
                                    </Button>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-bg-hover rounded-lg text-sm text-text-muted font-bold">
                                        <X size={16} /> Henüz favorin yok
                                    </div>
                                )}
                            </div>

                            {/* Favoriler Grid */}
                            <div className="w-full md:w-auto shrink-0 flex-1 lg:flex-none">
                                {highRatedItems.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max">
                                        {highRatedItems.slice(0, 6).map(item => (
                                            <div key={`hr-${item.id}`} className="flex items-center gap-3 bg-bg-hover border border-border/50 rounded-xl p-2.5 shadow-sm min-w-[150px]">
                                                <div className="relative w-8 h-12 bg-bg-card rounded shadow shrink-0 overflow-hidden">
                                                    <Image src={posterUrl(item.posterPath)} alt={item.title} fill className="object-cover" />
                                                </div>
                                                <div className="min-w-0 flex-1 pr-1">
                                                    <p className="text-[11px] font-bold text-text-primary truncate">{item.title}</p>
                                                    <span className="text-xs font-bold text-rating flex items-center gap-1">
                                                        <Star size={10} className="fill-rating" /> {item.rating}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-32 border border-dashed border-border rounded-2xl flex items-center justify-center text-text-secondary bg-bg-hover/50">
                                        Yüksek puanlı filmler burada görünür
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
