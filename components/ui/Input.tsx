"use client";

import { forwardRef } from "react";
import { LucideIcon, X } from "lucide-react";

interface InputProps {
    icon?: LucideIcon;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    required?: boolean;
    minLength?: number;
    clearable?: boolean;
    className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    {
        icon: Icon,
        type = "text",
        placeholder,
        value,
        onChange,
        onFocus,
        onBlur,
        onKeyDown,
        required,
        minLength,
        clearable,
        className = "",
    },
    ref,
) {
    return (
        <div className={`relative ${className}`}>
            {Icon && (
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                    <Icon size={18} />
                </div>
            )}
            <input
                ref={ref}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                required={required}
                minLength={minLength}
                className={`w-full bg-[#1A1A24] border border-[#2A2A35] rounded-xl py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple-DEFAULT focus:ring-1 focus:ring-purple-DEFAULT/30 transition-colors ${Icon ? "pl-11 pr-4" : "px-4"} ${clearable && value ? "pr-10" : ""}`}
            />
            {clearable && value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
});

export default Input;
