import { Clapperboard } from "lucide-react";

// Ana sayfa loading skeleton
export default function HomeLoading() {
    return (
        <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 animate-page-enter">
            {/* Hero skeleton */}
            <section className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-16">
                <div className="flex items-center gap-3 mb-8 animate-subtle-pulse">
                    <div className="w-8 h-8 rounded-lg bg-purple/20 flex items-center justify-center">
                        <Clapperboard size={18} className="text-purple" />
                    </div>
                    <span className="text-lg font-display font-bold text-text-muted">CineTrack</span>
                </div>
                <div className="h-12 w-96 max-w-full skeleton-shimmer rounded-xl mb-4" />
                <div className="h-6 w-72 max-w-full skeleton-shimmer rounded-lg mb-10" />
                <div className="h-14 w-full max-w-2xl skeleton-shimmer rounded-2xl" />
            </section>

            {/* Trend filmler skeleton */}
            <section className="px-4 sm:px-6 lg:px-8 py-10">
                <div className="max-w-7xl mx-auto">
                    <div className="h-8 w-64 skeleton-shimmer rounded-lg mb-6" />
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-[200px] h-[300px] flex-shrink-0 skeleton-shimmer rounded-xl"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Trend diziler skeleton */}
            <section className="px-4 sm:px-6 lg:px-8 py-10">
                <div className="max-w-7xl mx-auto">
                    <div className="h-8 w-64 skeleton-shimmer rounded-lg mb-6" />
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-[200px] h-[300px] flex-shrink-0 skeleton-shimmer rounded-xl"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
