"use client";

import React from "react";
import { motion } from "framer-motion";

type ProgressColor = "purple" | "success";
type ProgressSize = "sm" | "md";

interface ProgressBarProps {
    value: number;
    color?: ProgressColor;
    size?: ProgressSize;
    showLabel?: boolean;
    className?: string;
}

const colorStyles: Record<ProgressColor, string> = {
    purple: "bg-[#7B5CF0]",
    success: "bg-[#22C55E]",
};

const sizeStyles: Record<ProgressSize, string> = {
    sm: "h-1.5",
    md: "h-2.5",
};

export default function ProgressBar({
    value,
    color = "purple",
    size = "md",
    showLabel = false,
    className = "",
}: ProgressBarProps) {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div
                className={`flex-1 bg-[#2A2A35] rounded-full overflow-hidden ${sizeStyles[size]}`}
            >
                <motion.div
                    className={`h-full rounded-full ${colorStyles[color]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedValue}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>

            {showLabel && (
                <span className="text-xs font-medium text-[#8B8B99] tabular-nums min-w-[3ch] text-right">
                    {Math.round(clampedValue)}%
                </span>
            )}
        </div>
    );
}
