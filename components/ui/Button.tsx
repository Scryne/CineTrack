"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    loading?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    type?: "button" | "submit" | "reset";
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        "bg-[#7B5CF0] hover:bg-[#9D7FF4] text-white border border-transparent",
    secondary:
        "bg-transparent border border-[#2A2A35] hover:bg-[#1E1E24] text-[#F0F0F5]",
    ghost:
        "bg-transparent border border-transparent hover:bg-[#1E1E24] text-[#F0F0F5]",
    danger:
        "bg-transparent border border-[#ef4444] hover:bg-[#ef4444]/10 text-[#ef4444]",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
};

const iconSizes: Record<ButtonSize, number> = {
    sm: 14,
    md: 16,
    lg: 18,
};

export default function Button({
    variant = "primary",
    size = "md",
    icon: Icon,
    loading = false,
    disabled = false,
    children,
    className = "",
    onClick,
    type = "button",
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <motion.button
            whileTap={isDisabled ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-colors duration-200 cursor-pointer
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
            disabled={isDisabled}
            onClick={onClick}
            type={type}
        >
            {loading ? (
                <Loader2 size={iconSizes[size]} className="animate-spin" />
            ) : Icon ? (
                <Icon size={iconSizes[size]} />
            ) : null}
            {children}
        </motion.button>
    );
}

