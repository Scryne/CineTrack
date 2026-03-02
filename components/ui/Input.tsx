"use client";

import React, { forwardRef } from "react";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    icon?: LucideIcon;
    clearable?: boolean;
    value?: string;
    onChange?: (value: string) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { icon: Icon, clearable = false, value, onChange, className = "", ...props },
    ref
) {
    return (
        <div className="relative group">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B99] group-focus-within:text-[#7B5CF0] transition-colors">
                    <Icon size={18} />
                </div>
            )}

            <input
                ref={ref}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className={`
          w-full bg-[#16161A] border border-[#2A2A35] rounded-xl
          px-4 py-2.5 text-sm text-[#F0F0F5] placeholder-[#4A4A5A]
          outline-none transition-all duration-200
          focus:border-[#7B5CF0] focus:shadow-[0_0_0_3px_rgba(123,92,240,0.15)]
          ${Icon ? "pl-10" : ""}
          ${clearable && value ? "pr-9" : ""}
          ${className}
        `}
                {...props}
            />

            {clearable && value && (
                <button
                    type="button"
                    onClick={() => onChange?.("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8B99] hover:text-[#F0F0F5] transition-colors"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
});

export default Input;
