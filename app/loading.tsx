// Ana sayfa loading skeleton
export default function HomeLoading() {
    return (
        <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            {/* Hero skeleton */}
            <section className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-16">
                <div className="h-12 w-96 skeleton-shimmer rounded-lg mb-4" />
                <div className="h-6 w-72 skeleton-shimmer rounded-lg mb-10" />
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
                                className="w-[200px] h-[300px] flex-shrink-0 skeleton-shimmer rounded-lg"
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
                                className="w-[200px] h-[300px] flex-shrink-0 skeleton-shimmer rounded-lg"
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
