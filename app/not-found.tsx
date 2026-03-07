import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-page-enter">
            <div className="text-[120px] font-black text-purple/10 mb-2 select-none leading-none font-display">404</div>
            <div className="w-20 h-20 rounded-2xl bg-bg-card border border-border flex items-center justify-center mb-6 animate-float shadow-elevation-2">
                <svg
                    className="w-10 h-10 text-text-muted"
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
            <h2 className="text-2xl font-bold text-text-primary mb-2 font-display">Sayfa Bulunamadı</h2>
            <p className="text-text-secondary mb-8 max-w-md">
                Aradığın sayfa mevcut değil veya taşınmış olabilir.
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-purple hover:bg-purple-light text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-purple/25 hover:shadow-purple/40 hover:scale-105 active:scale-95"
            >
                Ana Sayfaya Dön
            </Link>
        </div>
    );
}
