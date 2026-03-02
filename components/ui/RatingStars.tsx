"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
    value: number; // 0-10
    onChange?: (value: number) => void;
    readonly?: boolean;
    className?: string;
}

export default function RatingStars({
    value,
    onChange,
    readonly = true,
    className = "",
}: RatingStarsProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    // Convert 0-10 scale to 0-5 for stars
    const displayValue = hoverValue !== null ? hoverValue / 2 : value / 2;

    const handleClick = (starIndex: number, isHalf: boolean) => {
        if (readonly || !onChange) return;
        const newValue = isHalf ? starIndex * 2 - 1 : starIndex * 2;
        onChange(newValue);
    };

    const handleMouseMove = (
        e: React.MouseEvent<HTMLButtonElement>,
        starIndex: number
    ) => {
        if (readonly) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isHalf = x < rect.width / 2;
        setHoverValue(isHalf ? starIndex * 2 - 1 : starIndex * 2);
    };

    return (
        <div
            className={`inline-flex items-center gap-0.5 ${className}`}
            onMouseLeave={() => setHoverValue(null)}
        >
            {[1, 2, 3, 4, 5].map((starIndex) => {
                const fillAmount = displayValue - (starIndex - 1);
                const isFull = fillAmount >= 1;
                const isHalf = fillAmount > 0 && fillAmount < 1;

                return (
                    <button
                        key={starIndex}
                        type="button"
                        disabled={readonly}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const clickIsHalf = x < rect.width / 2;
                            handleClick(starIndex, clickIsHalf);
                        }}
                        onMouseMove={(e) => handleMouseMove(e, starIndex)}
                        className={`relative ${readonly ? "cursor-default" : "cursor-pointer"} transition-transform ${!readonly ? "hover:scale-110" : ""
                            }`}
                    >
                        {/* Background star (empty) */}
                        <Star size={20} className="text-[#2A2A35]" fill="#2A2A35" />

                        {/* Filled star overlay */}
                        {(isFull || isHalf) && (
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: isFull ? "100%" : "50%" }}
                            >
                                <Star size={20} className="text-[#F59E0B]" fill="#F59E0B" />
                            </div>
                        )}
                    </button>
                );
            })}

            <span className="ml-1.5 text-sm font-medium text-[#F59E0B] tabular-nums">
                {value.toFixed(1)}
            </span>
        </div>
    );
}
