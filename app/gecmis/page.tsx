"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { History, Trash2, Calendar, PlayCircle, X } from "lucide-react";
import { getAllProgress, removeProgress, clearAllProgress } from "@/lib/db";
import { posterUrl } from "@/lib/tmdb";
import type { WatchProgress } from "@/types/player";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import toast from "react-hot-toast";

export default function HistoryPage(): React.ReactElement {
    const [history, setHistory] = useState<WatchProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [showClearModal, setShowClearModal] = useState(false);
    const limit = 20;

    const fetchHistory = async (currentPage: number, isRefresh: boolean = false): Promise<void> => {
        if (!isRefresh) setLoadingMore(true);
        const newItems = await getAllProgress(limit, currentPage * limit);
        if (newItems.length < limit) setHasMore(false);
        setHistory(prev => isRefresh ? newItems : [...prev, ...newItems]);
        setLoading(false);
        setLoadingMore(false);
    };

    useEffect(() => {
        fetchHistory(0, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLoadMore = (): void => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchHistory(nextPage);
    };

    const handleRemove = async (tmdbId: string, type: "film" | "dizi"): Promise<void> => {
        await removeProgress(tmdbId, type);
        setHistory(prev => prev.filter(h => h.tmdbId !== tmdbId || h.type !== type));
        toast.success("Gecmisten silindi.");
    };

    const handleClearAll = async (): Promise<void> => {
        await clearAllProgress();
        setHistory([]);
        setShowClearModal(false);
        toast.success("Tum izleme gecmisiniz temizlendi.");
    };

    // Group history by date
    const groupedHistory = useMemo(() => history.reduce((acc, item) => {
        const date = new Date(item.updatedAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let group = "Daha Once";
        if (date.toDateString() === today.toDateString()) group = "Bugun";
        else if (date.toDateString() === yesterday.toDateString()) group = "Dun";
        else if (date > oneWeekAgo) group = "Bu Hafta";

        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {} as Record<string, WatchProgress[]>), [history]);

    const groupOrder = ["Bugun", "Dun", "Bu Hafta", "Daha Once"];

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-[1400px] mx-auto px-16 py-12 max-lg:px-6 max-md:px-4 max-md:py-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-display text-[28px] text-white mb-1">Izleme Gecmisi</h1>
                    <p className="text-[14px] text-text-sec">Son izlediginiz dizi ve filmlere kaldiginiz yerden devam edin.</p>
                </div>
                {history.length > 0 && (
                    <Button
                        variant="secondary"
                        className="text-err border-err/50 hover:bg-err/10 w-full md:w-auto justify-center"
                        icon={Trash2}
                        onClick={() => setShowClearModal(true)}
                    >
                        Gecmisi Temizle
                    </Button>
                )}
            </div>

            {history.length === 0 ? (
                <EmptyState
                    icon={History}
                    title="Henuz gecmisinizde bir sey yok"
                    description="Izlemeye basladiginiz film ve diziler burada listelenecektir."
                    action={{ label: "Kesfetmeye Basla", href: "/kesif" }}
                />
            ) : (
                <div className="space-y-10">
                    {groupOrder.map((group) => {
                        const items = groupedHistory[group];
                        if (!items || items.length === 0) return null;

                        return (
                            <div key={group}>
                                <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[2px] mb-4 flex items-center gap-2">
                                    <Calendar size={13} />
                                    {group}
                                </h3>

                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <motion.div
                                            key={`${item.type}-${item.tmdbId}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-raised border border-border-dim hover:border-border-bright rounded-xl p-3 transition-all"
                                        >
                                            <Link
                                                href={`/izle/${item.type}/${item.tmdbId}${item.type === "dizi" ? `/${item.season}/${item.episode}` : ""}`}
                                                className="block flex-shrink-0 w-full sm:w-20 h-[120px] sm:h-[120px] relative rounded-lg overflow-hidden"
                                            >
                                                <Image
                                                    src={posterUrl(item.posterPath)}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <PlayCircle className="text-white" size={28} />
                                                </div>
                                            </Link>

                                            <div className="flex-1 min-w-0 pr-10 sm:pr-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold tracking-[1.5px] uppercase px-2 py-0.5 rounded-md bg-white/[0.05] text-text-muted border border-white/[0.06]">
                                                        {item.type === "film" ? "Film" : "Dizi"}
                                                    </span>
                                                    <span className="text-[11px] text-text-dim font-mono">
                                                        {new Date(item.updatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                                <Link
                                                    href={`/${item.type}/${item.tmdbId}`}
                                                    className="inline-block text-[15px] font-semibold text-white hover:text-purple-300 transition-colors mb-0.5 truncate max-w-full"
                                                >
                                                    {item.title}
                                                </Link>
                                                {item.type === "dizi" && (
                                                    <p className="text-[13px] text-purple-300 truncate max-w-full">
                                                        S{item.season}E{item.episode} · {item.episodeTitle}
                                                    </p>
                                                )}
                                                {item.type === "dizi" && item.totalEpisodes && item.watchedEpisodes !== undefined && (
                                                    <div className="mt-2 max-w-[200px]">
                                                        <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                                                            <span>Sezon Ilerlemesi</span>
                                                            <span className="font-mono">{Math.round((item.watchedEpisodes / item.totalEpisodes) * 100)}%</span>
                                                        </div>
                                                        <ProgressBar value={Math.min((item.watchedEpisodes / item.totalEpisodes) * 100, 100)} color="purple" size="xs" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute top-3 right-3 sm:static sm:top-0 sm:right-0 flex sm:flex-col items-center gap-2">
                                                <Link href={`/izle/${item.type}/${item.tmdbId}${item.type === "dizi" ? `/${item.season}/${item.episode}` : ""}`}>
                                                    <Button variant="primary" className="hidden sm:flex" size="sm" icon={PlayCircle}>
                                                        Devam Et
                                                    </Button>
                                                </Link>
                                                <button
                                                    onClick={() => handleRemove(item.tmdbId, item.type)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-sec hover:text-err hover:bg-err/10 transition-colors"
                                                    title="Gecmisten Kaldir"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="w-full sm:hidden border-t border-border-dim pt-3 mt-1">
                                                <Link href={`/izle/${item.type}/${item.tmdbId}${item.type === "dizi" ? `/${item.season}/${item.episode}` : ""}`} className="w-full">
                                                    <Button variant="secondary" className="w-full justify-center" size="sm">
                                                        Izlemeye Devam Et
                                                    </Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {hasMore && (
                        <div className="flex justify-center mt-8">
                            <Button
                                variant="secondary"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="w-full md:w-auto min-w-[200px] justify-center"
                            >
                                {loadingMore ? "Yukleniyor..." : "Daha Fazla Goster"}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                title="Gecmisi Temizle"
            >
                <div className="flex flex-col gap-6">
                    <p className="text-text-sec leading-relaxed">
                        Tum izleme gecmisiniz geri donulemez sekilde silinecektir. Emin misiniz?
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setShowClearModal(false)}>
                            Iptal
                        </Button>
                        <Button variant="danger" onClick={handleClearAll} icon={Trash2}>
                            Evet, Temizle
                        </Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
}
