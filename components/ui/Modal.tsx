"use client";

import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleEscape]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative w-full max-w-lg bg-[#16161A] border border-[#2A2A35] rounded-2xl shadow-xl overflow-hidden"
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A35]">
                                <h2 className="text-lg font-semibold text-[#F0F0F5] font-display">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-[#8B8B99] hover:text-[#F0F0F5] hover:bg-[#1E1E24] transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        {/* Body */}
                        <div className="px-6 py-4">{children}</div>

                        {/* Close button when no title */}
                        {!title && (
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 p-1.5 rounded-lg text-[#8B8B99] hover:text-[#F0F0F5] hover:bg-[#1E1E24] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
