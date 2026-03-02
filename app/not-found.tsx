import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
            <div className="text-8xl font-bold text-accent/20 mb-4 select-none">404</div>
            <div className="w-20 h-20 rounded-full bg-card border border-white/10 flex items-center justify-center mb-6">
                <svg
                    className="w-10 h-10 text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Sayfa Bulunamadı</h2>
            <p className="text-muted mb-8 max-w-md">
                Aradığın sayfa mevcut değil veya taşınmış olabilir.
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors shadow-lg shadow-accent/25"
            >
                Ana Sayfaya Dön →
            </Link>
        </div>
    );
}
