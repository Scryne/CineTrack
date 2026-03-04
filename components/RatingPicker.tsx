"use client";

import { useState, useEffect } from "react";
import { addRating, getRating, removeRating } from "@/lib/db";
import toast from "react-hot-toast";

interface RatingPickerProps {
    id: string;
    type: "film" | "dizi";
    title: string;
    posterPath: string;
    onRatingChange?: (rating: number | null) => void;
}

export default function RatingPicker({ id, type, title, posterPath, onRatingChange }: RatingPickerProps) {
    const [currentRating, setCurrentRating] = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function fetchRating() {
            try {
                const saved = await getRating(id, type);
                if (isMounted) {
                    setCurrentRating(saved);
                    setShowActions(saved !== null && saved > 0);
                }
            } catch {
                // Rating yüklenemezse sessizce devam et
                if (isMounted) {
                    setCurrentRating(null);
                    setShowActions(false);
                }
            }
        }
        fetchRating();
        return () => { isMounted = false; };
    }, [id, type]);

    const handleRate = async (value: number) => {
        try {
            await addRating(id, type, value, title, posterPath);
            setCurrentRating(value);
            setShowActions(true);
            onRatingChange?.(value);
            toast.success("Puan başarıyla kaydedildi.");
        } catch (error: unknown) {
            console.error('Puan kaydetme hatası:', error);
            // Revert UI effectively
            const message = error instanceof Error ? error.message : "Puan kaydedilemedi.";
            toast.error("Hata: " + message);
        }
    };

    const handleRemove = async () => {
        try {
            await removeRating(id, type);
            setCurrentRating(null);
            setHoverRating(null);
            setShowActions(false);
            onRatingChange?.(null);
        } catch (error) {
            console.error('Puan kaldırma hatası:', error);
        }
    };

    const displayRating = hoverRating ?? currentRating;

    return (
        <div className="flex flex-col gap-3">
            {/* Yıldız Seçici */}
            <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => {
                    const isActive = displayRating !== null && star <= displayRating;
                    const isHovered = hoverRating !== null && star <= hoverRating;

                    return (
                        <button
                            key={star}
                            onClick={() => handleRate(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="relative p-0.5 transition-transform duration-200 ease-out hover:scale-[1.35] focus:outline-none"
                            aria-label={`${star} puan ver`}
                        >
                            <svg
                                className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors duration-200 ${isActive
                                    ? "text-[#f5c518] drop-shadow-[0_0_6px_rgba(245,197,24,0.5)]"
                                    : "text-white/20 hover:text-white/40"
                                    }`}
                                fill={isActive ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth={isActive ? 0 : 1.5}
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                />
                            </svg>

                            {/* Hover'da numara göster */}
                            {isHovered && hoverRating === star && (
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#f5c518] text-black text-xs font-bold rounded px-1.5 py-0.5 pointer-events-none shadow-lg">
                                    {star}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Puan gösterimi */}
                {displayRating !== null && (
                    <span className="ml-3 text-[#f5c518] font-bold text-lg tabular-nums">
                        {displayRating}/10
                    </span>
                )}
            </div>

            {/* Güncelle / Kaldır Butonları */}
            {showActions && currentRating !== null && (
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted">
                        Puanın: <span className="text-[#f5c518] font-semibold">{currentRating}/10</span>
                    </span>
                    <button
                        onClick={handleRemove}
                        className="text-xs px-3 py-1.5 rounded-md bg-white/5 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-white/10 transition-all duration-200"
                    >
                        Kaldır
                    </button>
                </div>
            )}
        </div>
    );
}
