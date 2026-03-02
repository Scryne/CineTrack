// Dizi detay sayfası loading skeleton
export default function DiziLoading() {
    return (
        <div>
            {/* Backdrop skeleton */}
            <div className="relative w-full h-[50vh] skeleton-shimmer rounded-xl mb-8" />

            <div className="flex flex-col md:flex-row gap-8">
                {/* Poster skeleton */}
                <div className="w-[300px] h-[450px] skeleton-shimmer rounded-xl flex-shrink-0" />

                {/* Bilgi skeleton */}
                <div className="flex-1 space-y-4">
                    <div className="h-8 w-3/4 skeleton-shimmer rounded-lg" />
                    <div className="h-5 w-1/2 skeleton-shimmer rounded-lg" />
                    <div className="flex gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-8 w-20 skeleton-shimmer rounded-full" />
                        ))}
                    </div>
                    <div className="space-y-2 pt-4">
                        <div className="h-4 w-full skeleton-shimmer rounded" />
                        <div className="h-4 w-full skeleton-shimmer rounded" />
                        <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                    </div>
                    {/* Sezon tabları skeleton */}
                    <div className="flex gap-2 pt-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-10 w-24 skeleton-shimmer rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
