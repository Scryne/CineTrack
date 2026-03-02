// Oyuncu detay sayfası loading skeleton
export default function OyuncuLoading() {
    return (
        <div>
            <div className="flex flex-col md:flex-row gap-8 mb-10">
                {/* Profil fotoğrafı skeleton */}
                <div className="w-[260px] h-[390px] skeleton-shimmer rounded-xl flex-shrink-0" />

                {/* Bilgi skeleton */}
                <div className="flex-1 space-y-4">
                    <div className="h-8 w-64 skeleton-shimmer rounded-lg" />
                    <div className="h-5 w-48 skeleton-shimmer rounded-lg" />
                    <div className="space-y-2 pt-4">
                        <div className="h-4 w-full skeleton-shimmer rounded" />
                        <div className="h-4 w-full skeleton-shimmer rounded" />
                        <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                        <div className="h-4 w-5/6 skeleton-shimmer rounded" />
                    </div>
                </div>
            </div>

            {/* Filmografi skeleton */}
            <div className="h-8 w-48 skeleton-shimmer rounded-lg mb-6" />
            <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div
                        key={i}
                        className="w-[200px] h-[300px] flex-shrink-0 skeleton-shimmer rounded-lg"
                    />
                ))}
            </div>
        </div>
    );
}
