"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { getWatchlist } from "@/lib/db";
import { searchMulti, posterUrl } from "@/lib/tmdb";
import type { TMDBMultiSearchResult } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";
import Input from "./ui/Input";
import {
    Home,
    Library,
    Tv2,
    Compass,
    Search,
    UserCircle2,
    Menu,
    X,
    Clapperboard,
    Film,
    Tv,
    History,
    LogIn,
    LogOut
} from "lucide-react";
import PWAInstallButton from "./PWAInstallButton";
import { useUser } from "@/hooks/useUser";
import Button from "./ui/Button";

// --- Nav linkleri ---
const navLinks = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/koleksiyon", label: "Koleksiyon", icon: Library },
    { href: "/dizilerim", label: "Dizilerim", icon: Tv2 },
    { href: "/kesif", label: "Keşfet", icon: Compass },
    { href: "/gecmis", label: "Geçmiş", icon: History },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, signOut } = useUser();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<TMDBMultiSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [watchlistCount, setWatchlistCount] = useState(0);

    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- Scroll listener ---
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // --- Watchlist count ---
    const fetchWatchlistCount = useCallback(async () => {
        const list = await getWatchlist();
        setWatchlistCount(list.length);
    }, []);

    useEffect(() => {
        fetchWatchlistCount();
        const handleStorage = () => fetchWatchlistCount();
        const handleSupabaseUpdate = () => fetchWatchlistCount();

        window.addEventListener("storage", handleStorage);
        window.addEventListener("cinetrack_supabase_update", handleSupabaseUpdate);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("cinetrack_supabase_update", handleSupabaseUpdate);
        };
    }, [fetchWatchlistCount, user]);

    // --- Update watchlist count + close mobile on route change ---
    useEffect(() => {
        fetchWatchlistCount();
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
    }, [pathname, fetchWatchlistCount]);

    // --- Focus search input when opening ---
    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isSearchOpen]);

    // --- Click outside to close search ---
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(e.target as Node)
            ) {
                setIsSearchOpen(false);
                setSearchQuery("");
                setSearchResults([]);
            }
        };
        if (isSearchOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSearchOpen]);

    // --- Debounced search ---
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        if (value.trim().length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        debounceTimerRef.current = setTimeout(async () => {
            const results = await searchMulti(value.trim());
            if (results) {
                setSearchResults(results.slice(0, 12));
            }
            setIsSearching(false);
        }, 300);
    }, []);

    const isActive = (href: string) => {
        if (!pathname) return false;
        if (href === "/") return pathname === "/";
        return pathname === href || pathname.startsWith(href + "/");
    };

    // --- Group search results ---
    const movieResults = searchResults.filter((r) => r.media_type === "movie");
    const tvResults = searchResults.filter((r) => r.media_type === "tv");

    const handleResultClick = (result: TMDBMultiSearchResult) => {
        const path =
            result.media_type === "movie"
                ? `/film/${result.id}`
                : `/dizi/${result.id}`;
        router.push(path);
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    if (pathname && pathname.startsWith("/izle/")) return null;

    return (
        <nav
            className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
                ? "bg-bg-primary/80 backdrop-blur-xl shadow-lg shadow-black/20"
                : "bg-bg-primary"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* ===== SOL: Logo ===== */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 group flex-shrink-0"
                    >
                        <Clapperboard
                            size={22}
                            className="text-purple-DEFAULT group-hover:text-purple-light transition-colors"
                        />
                        <span className="font-display text-[20px] font-bold text-text-primary">
                            CineTrack
                        </span>
                    </Link>

                    {/* ===== ORTA: Desktop nav linkleri ===== */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const active = isActive(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ${active
                                        ? "text-purple-DEFAULT"
                                        : "text-text-secondary hover:text-text-primary"
                                        }`}
                                >
                                    <Icon size={16} />
                                    {link.label}
                                    {/* Koleksiyon badge */}
                                    {link.href === "/koleksiyon" && watchlistCount > 0 && (
                                        <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-purple-DEFAULT rounded-full shadow-lg shadow-purple-DEFAULT/30">
                                            {watchlistCount > 99 ? "99+" : watchlistCount}
                                        </span>
                                    )}
                                    {/* Aktif çizgi */}
                                    {active && (
                                        <motion.span
                                            layoutId="navbar-active-indicator"
                                            className="absolute bottom-0 left-2 right-2 h-[2px] bg-purple-DEFAULT rounded-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* ===== SAĞ: Arama, Profil, Mobil menü ===== */}
                    <div className="flex items-center gap-2">
                        {/* Arama butonu */}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className={`p-2 rounded-lg transition-colors duration-200 ${isSearchOpen
                                ? "text-purple-DEFAULT bg-purple-DEFAULT/10"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                                }`}
                            aria-label="Ara"
                        >
                            <Search size={20} />
                        </button>

                        {/* Profil veya Giriş butonu */}
                        {loading ? (
                            <div className="w-9 h-9 rounded-full bg-border animate-pulse shrink-0" />
                        ) : user ? (
                            <div className="relative group/dropdown">
                                <button
                                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-bg-hover transition-colors"
                                    aria-label="Profil Menüsü"
                                >
                                    <div className="w-8 h-8 rounded-full bg-purple-DEFAULT/20 flex items-center justify-center border border-purple-DEFAULT/30 shrink-0">
                                        <UserCircle2 size={18} className="text-purple-DEFAULT" />
                                    </div>
                                    <span className="text-sm font-medium text-text-primary hidden md:block max-w-[100px] truncate">
                                        {user.user_metadata?.username || user.email?.split('@')[0] || "User"}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all origin-top-right z-50 overflow-hidden">
                                    <Link href="/profil" className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors">
                                        <UserCircle2 size={16} /> Profil
                                    </Link>
                                    <div className="border-t border-border" />
                                    <button
                                        onClick={async () => {
                                            await signOut();
                                            router.push("/auth");
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors text-left"
                                    >
                                        <LogOut size={16} /> Çıkış Yap
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link href="/auth">
                                <Button variant="primary" size="sm" icon={LogIn} className="hidden sm:flex rounded-full">
                                    Giriş Yap
                                </Button>
                                <Button variant="primary" size="sm" className="sm:hidden w-9 h-9 rounded-full p-0 flex items-center justify-center">
                                    <LogIn size={16} className="m-0" />
                                </Button>
                            </Link>
                        )}

                        {/* PWA İndir Butonu */}
                        <div className="hidden sm:block">
                            <PWAInstallButton />
                        </div>

                        {/* Mobil hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                            aria-label="Menüyü aç/kapat"
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== AÇILAN ARAMA BARI ===== */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        ref={searchContainerRef}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-border"
                    >
                        <div className="bg-bg-card px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
                            <Input
                                ref={searchInputRef}
                                icon={Search}
                                clearable
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Film veya dizi ara..."
                            />

                            {/* Sonuçlar dropdown */}
                            {(searchResults.length > 0 || isSearching) && (
                                <div className="mt-3 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-bg-card">
                                    {isSearching && (
                                        <div className="px-4 py-6 text-center text-text-secondary text-sm">
                                            Aranıyor...
                                        </div>
                                    )}

                                    {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                                        <div className="px-4 py-6 text-center text-text-secondary text-sm">
                                            Sonuç bulunamadı
                                        </div>
                                    )}

                                    {!isSearching && movieResults.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                <Film size={14} />
                                                Filmler
                                            </div>
                                            {movieResults.map((result) => (
                                                <button
                                                    key={`movie-${result.id}`}
                                                    onClick={() => handleResultClick(result)}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover transition-colors text-left"
                                                >
                                                    {result.poster_path ? (
                                                        <Image
                                                            src={posterUrl(result.poster_path)}
                                                            alt={result.title || ""}
                                                            width={32}
                                                            height={48}
                                                            className="rounded object-cover flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-12 bg-bg-hover rounded flex items-center justify-center flex-shrink-0">
                                                            <Film size={14} className="text-text-muted" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-text-primary truncate">
                                                            {result.title}
                                                        </p>
                                                        {result.release_date && (
                                                            <p className="text-xs text-text-secondary">
                                                                {result.release_date.slice(0, 4)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {!isSearching && tvResults.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                <Tv size={14} />
                                                Diziler
                                            </div>
                                            {tvResults.map((result) => (
                                                <button
                                                    key={`tv-${result.id}`}
                                                    onClick={() => handleResultClick(result)}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover transition-colors text-left"
                                                >
                                                    {result.poster_path ? (
                                                        <Image
                                                            src={posterUrl(result.poster_path)}
                                                            alt={result.name || ""}
                                                            width={32}
                                                            height={48}
                                                            className="rounded object-cover flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-12 bg-bg-hover rounded flex items-center justify-center flex-shrink-0">
                                                            <Tv size={14} className="text-text-muted" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-text-primary truncate">
                                                            {result.name}
                                                        </p>
                                                        {result.first_air_date && (
                                                            <p className="text-xs text-text-secondary">
                                                                {result.first_air_date.slice(0, 4)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== MOBİL DRAWER ===== */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-3/4 max-w-sm bg-bg-card border-l border-border z-[60] shadow-2xl flex flex-col lg:hidden"
                        >
                            {/* Drawer header */}
                            <div className="p-5 pb-3 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clapperboard size={18} className="text-purple-DEFAULT" />
                                    <span className="font-display text-lg font-bold text-text-primary">
                                        CineTrack
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 rounded-lg bg-bg-hover hover:bg-border transition-colors text-text-secondary"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Nav links */}
                            <div className="p-4 flex flex-col gap-1 overflow-y-auto flex-1">
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    const active = isActive(link.href);
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${active
                                                ? "text-purple-DEFAULT bg-purple-DEFAULT/10"
                                                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                                                }`}
                                        >
                                            <Icon size={18} />
                                            {link.label}
                                            {link.href === "/koleksiyon" && watchlistCount > 0 && (
                                                <span className="ml-auto text-xs font-bold bg-purple-DEFAULT text-white px-2 py-0.5 rounded-full">
                                                    {watchlistCount}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}

                                {/* Extra mobile links */}
                                <div className="mt-3 pt-3 border-t border-border">
                                    {!loading && (
                                        user ? (
                                            <>
                                                <Link
                                                    href="/profil"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive("/profil")
                                                        ? "text-purple-DEFAULT bg-purple-DEFAULT/10"
                                                        : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                                                        }`}
                                                >
                                                    <UserCircle2 size={18} />
                                                    Profilim
                                                </Link>
                                                <button
                                                    onClick={async () => {
                                                        setIsMobileMenuOpen(false);
                                                        await signOut();
                                                        router.push("/auth");
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10"
                                                >
                                                    <LogOut size={18} />
                                                    Çıkış Yap
                                                </button>
                                            </>
                                        ) : (
                                            <Link
                                                href="/auth"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive("/auth")
                                                    ? "text-purple-DEFAULT bg-purple-DEFAULT/10"
                                                    : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                                                    }`}
                                            >
                                                <LogIn size={18} />
                                                Giriş Yap
                                            </Link>
                                        )
                                    )}
                                </div>

                                {/* Install PWA (Mobile) */}
                                <div className="mt-2 text-center flex justify-center w-full">
                                    <PWAInstallButton />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
}
