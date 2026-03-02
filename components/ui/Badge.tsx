"use client";

import React from "react";

type BadgeVariant = "default" | "purple" | "success" | "warning" | "muted";

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-[#2A2A35] text-[#F0F0F5]",
    purple: "bg-[#7B5CF0]/15 text-[#9D7FF4]",
    success: "bg-[#22C55E]/15 text-[#22C55E]",
    warning: "bg-[#F59E0B]/15 text-[#F59E0B]",
    muted: "bg-[#1E1E24] text-[#8B8B99]",
};

export default function Badge({
    children,
    variant = "default",
    className = "",
}: BadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
        >
            {children}
        </span>
    );
}
