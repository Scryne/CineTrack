"use client";

import React from "react";

interface CardProps {
    children: React.ReactNode;
    hover?: boolean;
    onClick?: () => void;
    className?: string;
}

export default function Card({
    children,
    hover = false,
    onClick,
    className = "",
}: CardProps) {
    return (
        <div
            onClick={onClick}
            className={`
        bg-[#16161A] border border-[#2A2A35] rounded-2xl
        transition-all duration-200
        ${hover ? "hover:shadow-card-hover hover:border-[#7B5CF0] cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
