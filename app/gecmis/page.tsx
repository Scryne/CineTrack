"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { History, Trash2, Calendar, PlayCircle, X } from "lucide-react";
import { getAllProgress, removeProgress, clearAllProgress } from "@/lib/storage";
import { posterUrl } from "@/lib/tmdb";
import type { WatchProgress } from "@/types/player";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

export default function HistoryPage() {
    const [history, setHistory] = useState<WatchProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [showClearModal, setShowClearModal] = useState(false);

    useEffect(() => {
        setHistory(getAllProgress());
        setLoading(false);
    }, []);

    const handleRemove = (tmdbId: string, type: "film" | "dizi") => {
        removeProgress(tmdbId, type);
        setHistory(getAllProgress());
        toast.success("Geçmişten silindi.");
    };

    const handleClearAll = () => {
        clearAllProgress();
        setHistory([]);
        setShowClearModal(false);
        toast.success("Tüm izleme geçmişiniz temizlendi.");
    };

    // Group history by date
    const groupedHistory = history.reduce((acc, item) => {
        const date = new Date(item.updatedAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let group = "Daha Önce";

        if (date.toDateString() === today.toDateString()) {
            group = "Bugün";
        } else if (date.toDateString() === yesterday.toDateString()) {
            group = "Dün";
        } else if (date > oneWeekAgo) {
            group = "Bu Hafta";
        }

        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {} as Record<string, WatchProgress[]>);

    const groupOrder = ["Bugün", "Dün", "Bu Hafta", "Daha Önce"];

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-DEFAULT"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="font-display text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
                        <History className="text-purple-DEFAULT" size={32} />
                        İzleme Geçmişi
                    </h1>
                    <p className="text-text-secondary">Son izlediğiniz dizi ve filmlere kaldığınız yerden devam edin.</p>
                </div>

                {history.length > 0 && (
                    <Button
                        variant="secondary"
                        className="text-error border-error/50 hover:bg-error/10 hover:border-error w-full md:w-auto justify-center"
                        icon={Trash2}
                        onClick={() => setShowClearModal(true)}
                    >
                        Geçmişi Temizle
                    </Button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-bg-card border border-border rounded-3xl">
                    <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center mb-4 text-text-muted">
                        <History size={32} />
                    </div>
                    <h2 className="text-xl font-medium text-text-primary mb-2">Henüz geçmişinizde bir şey yok</h2>
                    <p className="text-text-secondary max-w-md mx-auto mb-6">
                        İzlemeye başladığınız film ve diziler burada listelenecektir.
                    </p>
                    <Link href="/kesif">
                        <Button variant="primary">Keşfetmeye Başla</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {groupOrder.map((group) => {
                        const items = groupedHistory[group];
                        if (!items || items.length === 0) return null;

                        return (
                            <div key={group}>
                                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Calendar size={16} />
                                    {group}
                                </h3>

                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <motion.div
                                            key={`${item.type}-${item.tmdbId}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-bg-card border border-border hover:border-purple/50 rounded-2xl p-3 sm:p-4 transition-all hover:shadow-lg hover:shadow-black/20"
                                        >
                                            <Link
                                                href={`/izle/${item.type}/${item.tmdbId}${item.type === "dizi" ? `/${item.season}/${item.episode}` : ""}`}
                                                className="block flex-shrink-0 w-full sm:w-[90px] h-[135px] sm:h-[135px] relative rounded-lg overflow-hidden border border-border"
                                            >
                                                <Image
                                                    src={posterUrl(item.posterPath)}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <PlayCircle className="text-white" size={32} />
                                                </div>
                                            </Link>

                                            <div className="flex-1 min-w-0 pr-10 sm:pr-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
                                                        {item.type === "film" ? "Kaldığın Yer" : "Son İzlenen"}
                                                    </span>
                                                    <span className="text-xs text-text-secondary">
                                                        {new Date(item.updatedAt).toLocaleTimeString("tr-TR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                                <Link
                                                    href={`/${item.type}/${item.tmdbId}`}
                                                    className="inline-block font-display text-lg font-bold text-text-primary hover:text-purple-light transition-colors mb-1 truncate max-w-full"
                                                >
                                                    {item.title}
                                                </Link>
                                                {item.type === "dizi" && (
                                                    <p className="text-sm font-medium text-purple-light truncate max-w-full mb-2">
                                                        S{item.season}E{item.episode} · {item.episodeTitle}
                                                    </p>
                                                )}
                                                {item.type === "dizi" && item.totalEpisodes && item.watchedEpisodes !== undefined && (
                                                    <div className="mt-2 mb-3 max-w-[200px]">
                                                        <div className="flex items-center justify-between text-xs text-text-muted mb-1 font-medium">
                                                            <span>Sezon İlerlemesi</span>
                                                            <span>{Math.round((item.watchedEpisodes / item.totalEpisodes) * 100)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-purple rounded-full transition-all"
                                                                style={{ width: `${Math.min((item.watchedEpisodes / item.totalEpisodes) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute top-3 right-3 sm:static sm:top-0 sm:right-0 flex sm:flex-col items-center gap-2">
                                                <Link href={`/izle/${item.type}/${item.tmdbId}${item.type === "dizi" ? `/${item.season}/${item.episode}` : ""}`}>
                                                    <Button variant="primary" className="hidden sm:flex" icon={PlayCircle}>
                                                        Devam Et
                                                    </Button>
                                                </Link>
                                                <button
                                                    onClick={() => handleRemove(item.tmdbId, item.type)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                                                    title="Geçmişten Kaldır"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            <div className="w-full sm:hidden border-t border-border pt-3 mt-1">
                                                <Link href={`/izle/${item.type}/${item.tmdbId}${item.type === "dizi" ? `/${item.season}/${item.episode}` : ""}`} className="w-full">
                                                    <Button variant="secondary" className="w-full justify-center">
                                                        İzlemeye Devam Et
                                                    </Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                title="Geçmişi Temizle"
            >
                <div className="flex flex-col gap-6">
                    <p className="text-text-secondary leading-relaxed">
                        Tüm izleme geçmişiniz geri dönülemez şekilde silinecektir. Emin misiniz?
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setShowClearModal(false)}>
                            İptal
                        </Button>
                        <Button variant="primary" className="!bg-error hover:!bg-error/90 !text-white" onClick={handleClearAll} icon={Trash2}>
                            Evet, Temizle
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
