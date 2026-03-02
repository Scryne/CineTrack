"use client";

import { useRef, ReactNode, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollableRowProps {
    children: ReactNode;
    className?: string;
    innerClassName?: string;
}

export default function ScrollableRow({
    children,
    className = "",
    innerClassName = "flex gap-4"
}: ScrollableRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const handleScroll = () => {
        if (!rowRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
        setShowLeft(scrollLeft > 0);
        // Allow a small 1px margin of error for fractional pixel scrolling
        setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
    };

    // Setup initial scroll state and listen for resizes
    useEffect(() => {
        handleScroll();
        window.addEventListener("resize", handleScroll);
        return () => window.removeEventListener("resize", handleScroll);
    }, [children]);

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === "left"
                ? scrollLeft - clientWidth * 0.75
                : scrollLeft + clientWidth * 0.75;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    return (
        <div className={`relative group/row ${className}`}>
            {/* Sol Buton */}
            {showLeft && (
                <button
                    onClick={(e) => { e.preventDefault(); scroll("left"); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 -mt-2 z-20 bg-black/80 hover:bg-purple hover:scale-110 text-white w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover/row:opacity-100 transition-all backdrop-blur-md border border-white/20 shadow-2xl"
                    aria-label="Sola Kaydır"
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            {/* Icerik */}
            <div
                ref={rowRef}
                onScroll={handleScroll}
                className={`${innerClassName} overflow-x-auto pb-4 scrollbar-hide relative`}
                style={{ scrollbarWidth: "none" }}
            >
                {children}
            </div>

            {/* Sag Buton */}
            {showRight && (
                <button
                    onClick={(e) => { e.preventDefault(); scroll("right"); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 -mt-2 z-20 bg-black/80 hover:bg-purple hover:scale-110 text-white w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover/row:opacity-100 transition-all backdrop-blur-md border border-white/20 shadow-2xl"
                    aria-label="Sağa Kaydır"
                >
                    <ChevronRight size={24} />
                </button>
            )}
        </div>
    );
}
