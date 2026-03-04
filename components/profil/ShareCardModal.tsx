"use client";

import { logger } from '@/lib/logger';

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import html2canvas from "html2canvas";
import { Clapperboard, Download, X, Sparkles, User } from "lucide-react";

interface ShareCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: {
        totalMovies: number;
        totalSeries: number;
        totalHours: number;
        personalityLabel: string;
        personalityEmoji: string;
    };
    username: string;
    topPosters: string[]; // max 4
}

export default function ShareCardModal({
    isOpen,
    onClose,
    stats,
    username,
    topPosters
}: ShareCardModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);
        try {
            // Need useCORS for TMDB images
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 2, // High resolution
                backgroundColor: "#0f0f0f",
                logging: false,
            });

            const image = canvas.toDataURL("image/png", 1.0);

            // Create download link
            const link = document.createElement("a");
            link.download = `cinetrack-${username}-2024.png`;
            link.href = image;
            link.click();
        } catch (error) {
            logger.error('Görsel oluşturulurken hata', error);
            alert("Görsel oluşturulurken bir hata oluştu.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={18} />
                </button>

                <h3 className="text-xl font-bold mb-6">Profil Kartını Paylaş</h3>

                {/* GÖRÜNÜR KART (İndirilecek Alan) */}
                <div
                    ref={cardRef}
                    className="w-full aspect-square relative bg-gradient-to-br from-[#0f0f0f] via-black to-[#1a0000] rounded-xl overflow-hidden border border-white/5 shadow-inner"
                    style={{ width: "1080px", height: "1080px", position: "absolute", left: "-9999px", top: "-9999px" }}
                >
                    {/* Yüksek çözünürlüklü asıl kart (1080x1080) */}
                    <div className="absolute inset-0 flex flex-col justify-between p-16">
                        {/* Arka plan afişleri sönük ve bulanık (Grid) */}
                        <div className="absolute inset-0 z-0 opacity-20 flex flex-wrap">
                            {topPosters.map((poster, idx) => (
                                <div key={idx} className="w-1/2 h-1/2 relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={poster.startsWith("/") ? `https://image.tmdb.org/t/p/w500${poster}` : poster}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                </div>
                            ))}
                            {/* Eksik posterleri siyah doldur */}
                            {Array.from({ length: Math.max(0, 4 - topPosters.length) }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="w-1/2 h-1/2 relative bg-black" />
                            ))}
                            {/* Gradient Overlay for blending */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />
                        </div>

                        {/* Top: Logo & Avatar */}
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <Clapperboard size={48} className="text-purple" />
                                <span className="text-6xl font-bold">Cine<span className="text-purple">Track</span></span>
                            </div>
                            <div className="text-right">
                                <div className="w-32 h-32 bg-purple/20 rounded-full flex items-center justify-center mb-4 ml-auto border-4 border-purple/50">
                                    <User size={56} className="text-purple" />
                                </div>
                                <h2 className="text-5xl font-bold text-white max-w-xl break-words">{username}</h2>
                            </div>
                        </div>

                        {/* Middle: Cinema Identity */}
                        <div className="relative z-10 text-center my-auto">
                            <h3 className="text-4xl text-gray-400 uppercase tracking-widest mb-6 font-semibold">Senin Sinema Kimligin</h3>
                            <div className="mb-8 flex justify-center"><Sparkles size={72} className="text-purple" /></div>
                            <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple to-[#F59E0B] drop-shadow-xl p-4">
                                {stats.personalityLabel}
                            </h1>
                        </div>

                        {/* Bottom: Stats */}
                        <div className="relative z-10 grid grid-cols-3 gap-8 p-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20">
                            <div className="text-center">
                                <p className="text-3xl text-gray-400 uppercase font-bold tracking-wider mb-2">Izlenen Film</p>
                                <p className="text-7xl font-black text-white">{stats.totalMovies}</p>
                            </div>
                            <div className="text-center border-l border-r border-white/10">
                                <p className="text-3xl text-gray-400 uppercase font-bold tracking-wider mb-2">Izlenen Dizi</p>
                                <p className="text-7xl font-black text-white">{stats.totalSeries}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl text-gray-400 uppercase font-bold tracking-wider mb-2">Toplam Sure</p>
                                <p className="text-7xl font-black text-purple">{stats.totalHours} <span className="text-4xl text-white">sa</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ÖNİZLEME (Kullanıcıya gösterilen responsive versiyon) */}
                <div
                    className="w-full aspect-square relative bg-gradient-to-br from-[#0f0f0f] via-black to-[#1a0000] rounded-xl overflow-hidden border border-white/10 mb-6 flex flex-col justify-between p-6 pointer-events-none"
                    style={{ backgroundSize: "cover" }}
                >
                    {/* Arka plan afişleri */}
                    <div className="absolute inset-0 z-0 opacity-20 flex flex-wrap">
                        {topPosters.map((poster, idx) => (
                            <div key={idx} className="w-1/2 h-1/2 relative">
                                <Image
                                    src={`https://image.tmdb.org/t/p/w200${poster}`}
                                    alt=""
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />
                    </div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <Clapperboard size={20} className="text-purple" />
                            <span className="text-xl font-bold">Cine<span className="text-purple">Track</span></span>
                        </div>
                        <div className="text-right">
                            <div className="w-10 h-10 bg-purple/20 rounded-full flex items-center justify-center ml-auto border border-purple">
                                <User size={18} className="text-purple" />
                            </div>
                            <h2 className="text-lg font-bold mt-1 text-white truncate max-w-[120px]">{username}</h2>
                        </div>
                    </div>

                    <div className="relative z-10 text-center my-4">
                        <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Sinema Kimligin</h3>
                        <div className="flex justify-center"><Sparkles size={32} className="text-purple" /></div>
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple to-[#F59E0B]">
                            {stats.personalityLabel}
                        </h1>
                    </div>

                    <div className="relative z-10 grid grid-cols-3 gap-2 p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                        <div className="text-center">
                            <p className="text-[10px] text-gray-400 uppercase">Film</p>
                            <p className="text-lg font-bold text-white">{stats.totalMovies}</p>
                        </div>
                        <div className="text-center border-l border-r border-white/10">
                            <p className="text-[10px] text-gray-400 uppercase">Dizi</p>
                            <p className="text-lg font-bold text-white">{stats.totalSeries}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-400 uppercase">Saat</p>
                            <p className="text-lg font-bold text-purple">{stats.totalHours}</p>
                        </div>
                    </div>
                </div>

                {/* Aksiyon Butonu */}
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors py-3 flex items-center justify-center gap-2"
                >
                    {isDownloading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Görsel Oluşturuluyor...</span>
                        </>
                    ) : (
                        <>
                            <Download size={18} />
                            <span>Gorsel Olarak Indir</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
