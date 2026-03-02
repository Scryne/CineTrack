"use client";

import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import {
    Film,
    Tv2,
    Clock,
    Award,
    Users,
    Sparkles,
    Download,
    X,
    ChevronRight,
    Clapperboard,
} from "lucide-react";

interface WrappedModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: {
        totalMovies: number;
        totalSeries: number;
        topGenre: string;
        topActor: string | null;
        totalHours: number;
        personalityLabel: string;
        personalityEmoji: string;
    };
    username: string;
}

export default function WrappedModal({ isOpen, onClose, stats, username }: WrappedModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const summaryRef = useRef<HTMLDivElement>(null);
    const totalSteps = 6;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            setTimeout(() => setCurrentStep(0), 300);
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!summaryRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(summaryRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: "#0D0D0F",
                logging: false,
            });
            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.download = `cinetrack-${username}-${new Date().getFullYear()}.png`;
            link.href = image;
            link.click();
        } catch (error) {
            console.error("Gorsel olusturulurken hata:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="text-center space-y-6 animate-slide-up">
                        <div className="w-20 h-20 rounded-full bg-purple/20 flex items-center justify-center mx-auto mb-4">
                            <Sparkles size={40} className="text-purple" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white p-4">
                            Hazir misin, {username}?
                        </h2>
                        <p className="text-xl md:text-2xl text-white/80">
                            {new Date().getFullYear()} yilinda sinemada nasil bir iz biraktigina bakalim...
                        </p>
                        <p className="text-sm text-white/50 mt-10 animate-pulse flex items-center justify-center gap-2">
                            Devam etmek icin ekrana tikla
                            <ChevronRight size={16} />
                        </p>
                    </div>
                );
            case 1:
                return (
                    <div className="text-center space-y-6 animate-slide-up">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Film size={32} className="text-purple" />
                            <span className="text-2xl text-white/80">+</span>
                            <Tv2 size={32} className="text-[#22C55E]" />
                        </div>
                        <p className="text-2xl text-white/80">Bu yil tam</p>
                        <h2 className="text-6xl md:text-8xl font-black text-purple drop-shadow-lg font-display">{stats.totalMovies}</h2>
                        <p className="text-3xl font-bold text-white">Film</p>
                        <p className="text-xl text-white/60">ve</p>
                        <h2 className="text-5xl md:text-7xl font-black text-[#22C55E] drop-shadow-lg font-display">{stats.totalSeries}</h2>
                        <p className="text-3xl font-bold text-white">Dizi izledin</p>
                    </div>
                );
            case 2:
                return (
                    <div className="text-center space-y-6 animate-slide-up">
                        <div className="w-20 h-20 rounded-full bg-purple/20 flex items-center justify-center mx-auto">
                            <Clock size={40} className="text-purple" />
                        </div>
                        <p className="text-2xl text-white/80">Hayatinin</p>
                        <h2 className="text-7xl md:text-9xl font-black text-white drop-shadow-2xl font-display">{stats.totalHours}</h2>
                        <p className="text-3xl font-bold text-purple">saatini</p>
                        <p className="text-xl text-white/80">ekran basinda gecirdin.</p>
                        <p className="text-sm text-white/50 mt-4">(Buna degdigini umuyoruz!)</p>
                    </div>
                );
            case 3:
                return (
                    <div className="text-center space-y-6 animate-slide-up">
                        <div className="w-20 h-20 rounded-full bg-[#F59E0B]/20 flex items-center justify-center mx-auto">
                            <Award size={40} className="text-[#F59E0B]" />
                        </div>
                        <p className="text-2xl text-white/80">En cok yoneldigin tur:</p>
                        <h2 className="text-5xl md:text-7xl font-black text-[#F59E0B] drop-shadow-lg font-display">{stats.topGenre || "Belirsiz"}</h2>
                        {stats.topActor && (
                            <>
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    <Users size={24} className="text-purple" />
                                </div>
                                <p className="text-xl text-white/80">Ve ekranda en cok gordugn kisi:</p>
                                <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-md font-display">{stats.topActor}</h2>
                            </>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="text-center space-y-6 animate-slide-up">
                        <p className="text-2xl text-white/80">Tum bunlara bakildiginda...</p>
                        <p className="text-2xl text-white/80">Senin sinema kimligin:</p>
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple to-purple-light flex items-center justify-center mx-auto my-6 animate-bounce">
                            <Clapperboard size={48} className="text-white" />
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple to-[#F59E0B] drop-shadow-xl p-2 font-display">
                            {stats.personalityLabel}
                        </h2>
                    </div>
                );
            case 5:
                return (
                    <div className="text-center space-y-8 animate-slide-up">
                        <div
                            ref={summaryRef}
                            className="p-8 bg-[#16161A] backdrop-blur-md rounded-3xl border border-[#2A2A35] max-w-lg w-full shadow-2xl mx-auto"
                        >
                            <h2 className="text-3xl font-black text-white mb-6 font-display">{username}&lsquo;in Ozeti</h2>
                            <div className="grid grid-cols-2 gap-6 text-left">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Film size={14} className="text-purple" />
                                        <p className="text-xs text-text-secondary uppercase">Film</p>
                                    </div>
                                    <p className="text-2xl font-bold text-white font-display">{stats.totalMovies}</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Tv2 size={14} className="text-[#22C55E]" />
                                        <p className="text-xs text-text-secondary uppercase">Dizi</p>
                                    </div>
                                    <p className="text-2xl font-bold text-white font-display">{stats.totalSeries}</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Clock size={14} className="text-purple" />
                                        <p className="text-xs text-text-secondary uppercase">Sure (Saat)</p>
                                    </div>
                                    <p className="text-2xl font-bold text-purple font-display">{stats.totalHours}</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Award size={14} className="text-[#F59E0B]" />
                                        <p className="text-xs text-text-secondary uppercase">Favori Tur</p>
                                    </div>
                                    <p className="text-xl font-bold text-white">{stats.topGenre || "Belirsiz"}</p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-[#2A2A35] mt-6">
                                <p className="text-xs text-text-secondary uppercase mb-1">Sinema Kimligi</p>
                                <p className="text-2xl font-black text-purple flex items-center justify-center gap-2 font-display">
                                    <Sparkles size={20} />
                                    {stats.personalityLabel}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-center max-w-lg mx-auto">
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex-1 py-3.5 bg-purple text-white font-bold rounded-xl hover:bg-purple-light transition-colors flex items-center justify-center gap-2"
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Olusturuluyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        <span>PNG Olarak Indir</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="flex-1 py-3.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                            >
                                Ana Ekrana Don
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#0D0D0F] to-[#1a0a2e] cursor-pointer"
            onClick={currentStep < totalSteps - 1 ? handleNext : undefined}
        >
            {/* Arka plan suslemeleri */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-dark rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F59E0B] rounded-full blur-[200px] opacity-10" />
            </div>

            {/* Ilerleme Cubugu */}
            <div className="absolute top-8 left-0 w-full px-8 flex gap-2 max-w-3xl mx-auto right-0 z-10">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full bg-white/20 overflow-hidden"
                    >
                        <div
                            className={`h-full bg-purple transition-all duration-500 ease-out ${i < currentStep ? "w-full" : i === currentStep ? "w-full" : "w-0"
                                }`}
                        />
                    </div>
                ))}
            </div>

            {/* Kapatma Butonu */}
            <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="absolute top-12 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white z-10 transition-colors"
                title="Kapat"
            >
                <X size={20} />
            </button>

            {/* Icerik */}
            <div className="relative z-10 w-full px-6 flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
                {renderStep()}
            </div>
        </div>
    );
}
