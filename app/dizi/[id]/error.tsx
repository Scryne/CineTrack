"use client";

import Link from "next/link";
import { Tv } from "lucide-react";

export default function DiziError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <Tv size={40} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Dizi yüklenemedi</h2>
            <p className="text-muted mb-6 max-w-md">
                {error.message || "Dizi bilgileri alınırken bir hata oluştu."}
            </p>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors shadow-lg shadow-accent/25"
                >
                    Tekrar Dene
                </button>
                <Link
                    href="/"
                    className="px-6 py-3 bg-card border border-white/10 hover:border-white/20 text-white rounded-xl font-medium transition-colors"
                >
                    Ana Sayfaya Dön
                </Link>
            </div>
        </div>
    );
}
