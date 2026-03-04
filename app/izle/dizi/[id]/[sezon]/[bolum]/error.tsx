'use client';

import { logger } from '@/lib/logger';



export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    logger.error('PAGE CRASH', error);
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-bg-primary text-text-primary">
            <h2 className="text-2xl font-bold mb-2">Bir şeyler ters gitti (Dizi İzleme)</h2>
            <p className="text-red-500 mb-6 max-w-md">
                {error.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."}
            </p>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-purple hover:bg-purple-light text-white rounded-xl font-medium transition-colors"
                >
                    Tekrar Dene
                </button>
            </div>
        </div>
    );
}
