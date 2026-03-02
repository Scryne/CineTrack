"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPersonDetail, posterUrl, profileUrl, BLUR_PLACEHOLDER } from "@/lib/tmdb";
import type { TMDBPersonDetail, TMDBPersonCredit } from "@/lib/tmdb";
import { Film, Tv, Star, User, Cake, MapPin, Play } from "lucide-react";

export default function ActorDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const [person, setPerson] = useState<TMDBPersonDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"movies" | "series">("movies");
    const [bioExpanded, setBioExpanded] = useState(false);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const data = await getPersonDetail(params.id);
            setPerson(data);

            // Sayfa başlığını güncelle (SEO)
            if (data) {
                document.title = `${data.name} - CineTrack`;
            }

            setLoading(false);
        }
        loadData();
    }, [params.id]);

    const scrollContainer = (id: string, direction: "left" | "right") => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollBy({ left: direction === "left" ? -400 : 400, behavior: "smooth" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!person) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="text-2xl font-bold mb-2">Oyuncu Bulunamadı</h1>
                <p className="text-muted mb-6">Bu oyuncu bilgilerine ulaşılamıyor.</p>
                <Link href="/" className="px-6 py-2 bg-accent rounded-lg text-white hover:bg-accent-hover transition-colors">
                    Ana Sayfaya Dön
                </Link>
            </div>
        );
    }

    // Filmler ve diziler
    const credits = person.combined_credits?.cast || [];
    const movies = credits
        .filter((c: TMDBPersonCredit) => c.media_type === "movie" && c.poster_path)
        .sort((a: TMDBPersonCredit, b: TMDBPersonCredit) => b.vote_average - a.vote_average);
    const series = credits
        .filter((c: TMDBPersonCredit) => c.media_type === "tv" && c.poster_path)
        .sort((a: TMDBPersonCredit, b: TMDBPersonCredit) => b.vote_average - a.vote_average);

    // Biyografiyi kısalt
    const bioSentences = person.biography?.split(". ") || [];
    const shortBio = bioSentences.slice(0, 3).join(". ") + (bioSentences.length > 3 ? "." : "");
    const hasLongBio = bioSentences.length > 3;

    // Yaş hesapla
    const calcAge = () => {
        if (!person.birthday) return null;
        const birth = new Date(person.birthday);
        const end = person.deathday ? new Date(person.deathday) : new Date();
        let age = end.getFullYear() - birth.getFullYear();
        const m = end.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
        return age;
    };

    const age = calcAge();

    return (
        <div>
            {/* ========================================== */}
            {/* 1. ÜST BÖLÜM - Profil */}
            {/* ========================================== */}
            <section className="mb-10">
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    {/* Profil fotoğrafı */}
                    <div className="relative w-[200px] h-[200px] flex-shrink-0 rounded-full overflow-hidden border-4 border-accent/30 shadow-2xl shadow-accent/10">
                        {person.profile_path && !imgError ? (
                            <Image
                                src={profileUrl(person.profile_path)}
                                alt={person.name}
                                fill
                                className="object-cover text-transparent"
                                sizes="200px"
                                placeholder="blur"
                                blurDataURL={BLUR_PLACEHOLDER}
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-full h-full bg-card flex items-center justify-center text-5xl text-muted">
                                <User size={48} className="text-text-muted" />
                            </div>
                        )}
                    </div>

                    {/* Bilgiler */}
                    <div className="flex-1 text-center sm:text-left space-y-3">
                        <h1 className="text-3xl sm:text-4xl font-bold">{person.name}</h1>

                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-sm text-muted">
                            {person.known_for_department && (
                                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                                    {person.known_for_department}
                                </span>
                            )}
                            {person.birthday && (
                                <>
                                    <span className="w-1 h-1 bg-muted rounded-full hidden sm:block" />
                                    <span className="flex items-center gap-1">
                                        <Cake size={14} className="text-text-muted" /> {person.birthday}
                                        {age !== null && ` (${age} yaşında)`}
                                    </span>
                                </>
                            )}
                            {person.deathday && (
                                <>
                                    <span className="w-1 h-1 bg-muted rounded-full" />
                                    <span>{person.deathday}</span>
                                </>
                            )}
                            {person.place_of_birth && (
                                <>
                                    <span className="w-1 h-1 bg-muted rounded-full hidden sm:block" />
                                    <span className="flex items-center gap-1"><MapPin size={14} className="text-text-muted" /> {person.place_of_birth}</span>
                                </>
                            )}
                        </div>

                        {/* Biyografi */}
                        {person.biography && (
                            <div className="pt-2 max-w-3xl">
                                <p className="text-muted leading-relaxed text-sm">
                                    {bioExpanded ? person.biography : shortBio}
                                </p>
                                {hasLongBio && (
                                    <button
                                        onClick={() => setBioExpanded(!bioExpanded)}
                                        className="text-accent text-sm font-medium mt-2 hover:underline"
                                    >
                                        {bioExpanded ? "Daha az göster" : "Devamını oku"}
                                    </button>
                                )}
                            </div>
                        )}

                        {!person.biography && (
                            <p className="text-muted italic text-sm">Biyografi bilgisi mevcut değil.</p>
                        )}

                        {/* İstatistik */}
                        <div className="flex justify-center sm:justify-start gap-6 pt-3">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{movies.length}</div>
                                <div className="text-xs text-muted">Film</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{series.length}</div>
                                <div className="text-xs text-muted">Dizi</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* 2. FİLMOGRAFİ */}
            {/* ========================================== */}
            <section>
                {/* Tablar */}
                <div className="flex items-center gap-1 mb-6 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab("movies")}
                        className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTab === "movies"
                            ? "text-white"
                            : "text-muted hover:text-white"
                            }`}
                    >
                        <Film size={16} className="inline mr-1" /> Filmler ({movies.length})
                        {activeTab === "movies" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("series")}
                        className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTab === "series"
                            ? "text-white"
                            : "text-muted hover:text-white"
                            }`}
                    >
                        <Tv size={16} className="inline mr-1" /> Diziler ({series.length})
                        {activeTab === "series" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                </div>

                {/* Film kartları */}
                {activeTab === "movies" && (
                    <div>
                        {movies.length > 0 ? (
                            <>
                                <div className="flex justify-end mb-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => scrollContainer("filmography-movies", "left")}
                                            className="w-9 h-9 rounded-full bg-card border border-white/10 flex items-center justify-center text-muted hover:text-white hover:border-white/30 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => scrollContainer("filmography-movies", "right")}
                                            className="w-9 h-9 rounded-full bg-card border border-white/10 flex items-center justify-center text-muted hover:text-white hover:border-white/30 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div
                                    id="filmography-movies"
                                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                                    style={{ scrollbarWidth: "none" }}
                                >
                                    {movies.map((credit: TMDBPersonCredit) => (
                                        <Link key={`movie-${credit.id}`} href={`/film/${credit.id}`}>
                                            <div className="w-[160px] flex-shrink-0 group cursor-pointer">
                                                <div className="relative w-[160px] h-[240px] rounded-lg overflow-hidden bg-card mb-2 border border-white/5 group-hover:border-accent/30 transition-colors">
                                                    <Image
                                                        src={posterUrl(credit.poster_path)}
                                                        alt={credit.title || ""}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        sizes="160px"
                                                        placeholder="blur"
                                                        blurDataURL={BLUR_PLACEHOLDER}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                                    {credit.vote_average > 0 && (
                                                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white font-semibold flex items-center gap-0.5">
                                                            <Star size={10} className="text-yellow-400" /> {credit.vote_average.toFixed(1)}
                                                        </div>
                                                    )}
                                                    {/* Play overlay */}
                                                    <Link
                                                        href={`/izle/film/${credit.id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-purple/90 flex items-center justify-center shadow-lg shadow-purple/30 hover:bg-purple transition-colors">
                                                            <Play size={22} fill="white" className="text-white ml-0.5" />
                                                        </div>
                                                    </Link>
                                                    <div className="absolute bottom-2 left-2 right-2">
                                                        <p className="text-xs text-gray-300 truncate">{credit.character}</p>
                                                    </div>
                                                </div>
                                                <h3 className="text-xs font-semibold text-white truncate group-hover:text-accent transition-colors">
                                                    {credit.title}
                                                </h3>
                                                <p className="text-[10px] text-muted">
                                                    {credit.release_date?.split("-")[0] || "—"}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-muted text-center py-10">Film bilgisi bulunamadı.</p>
                        )}
                    </div>
                )}

                {/* Dizi kartları */}
                {activeTab === "series" && (
                    <div>
                        {series.length > 0 ? (
                            <>
                                <div className="flex justify-end mb-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => scrollContainer("filmography-series", "left")}
                                            className="w-9 h-9 rounded-full bg-card border border-white/10 flex items-center justify-center text-muted hover:text-white hover:border-white/30 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => scrollContainer("filmography-series", "right")}
                                            className="w-9 h-9 rounded-full bg-card border border-white/10 flex items-center justify-center text-muted hover:text-white hover:border-white/30 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div
                                    id="filmography-series"
                                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                                    style={{ scrollbarWidth: "none" }}
                                >
                                    {series.map((credit: TMDBPersonCredit) => (
                                        <Link key={`tv-${credit.id}`} href={`/dizi/${credit.id}`}>
                                            <div className="w-[160px] flex-shrink-0 group cursor-pointer">
                                                <div className="relative w-[160px] h-[240px] rounded-lg overflow-hidden bg-card mb-2 border border-white/5 group-hover:border-accent/30 transition-colors">
                                                    <Image
                                                        src={posterUrl(credit.poster_path)}
                                                        alt={credit.name || ""}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        sizes="160px"
                                                        placeholder="blur"
                                                        blurDataURL={BLUR_PLACEHOLDER}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                                    {credit.vote_average > 0 && (
                                                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white font-semibold flex items-center gap-0.5">
                                                            <Star size={10} className="text-yellow-400" /> {credit.vote_average.toFixed(1)}
                                                        </div>
                                                    )}
                                                    {/* Play overlay */}
                                                    <Link
                                                        href={`/izle/dizi/${credit.id}/1/1`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-purple/90 flex items-center justify-center shadow-lg shadow-purple/30 hover:bg-purple transition-colors">
                                                            <Play size={22} fill="white" className="text-white ml-0.5" />
                                                        </div>
                                                    </Link>
                                                    <div className="absolute bottom-2 left-2 right-2">
                                                        <p className="text-xs text-gray-300 truncate">{credit.character}</p>
                                                    </div>
                                                </div>
                                                <h3 className="text-xs font-semibold text-white truncate group-hover:text-accent transition-colors">
                                                    {credit.name}
                                                </h3>
                                                <p className="text-[10px] text-muted">
                                                    {credit.first_air_date?.split("-")[0] || "—"}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-muted text-center py-10">Dizi bilgisi bulunamadı.</p>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
