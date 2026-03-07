"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { getWatchlist } from "@/lib/db";
import { searchMulti, posterUrl } from "@/lib/tmdb";
import type { TMDBMultiSearchResult } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";
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
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

// --- Nav linkleri ---
const navLinks = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/koleksiyon", label: "Koleksiyon", icon: Library },
    { href: "/dizilerim", label: "Dizilerim", icon: Tv2 },
    { href: "/kesif", label: "Keşfet", icon: Compass },
    { href: "/gecmis", label: "Gecmis", icon: History },
];

export default function Navbar(): React.ReactElement | null {
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
    const searchButtonRef = useRef<HTMLButtonElement>(null);
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
        const handleStorage = (): void => { fetchWatchlistCount(); };
        const handleSupabaseUpdate = (): void => { fetchWatchlistCount(); };

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

    // --- Cleanup debounce timer on unmount ---
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // --- Click outside to close search ---
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent): void => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(e.target as Node) &&
                (!searchButtonRef.current || !searchButtonRef.current.contains(e.target as Node))
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
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
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

    const isActive = (href: string): boolean => {
        if (!pathname) return false;
        if (href === "/") return pathname === "/";
        return pathname === href || pathname.startsWith(href + "/");
    };

    // --- Group search results ---
    const movieResults = searchResults.filter((r) => r.media_type === "movie");
    const tvResults = searchResults.filter((r) => r.media_type === "tv");

    const handleResultClick = (result: TMDBMultiSearchResult): void => {
        const path =
            result.media_type === "movie"
                ? `/film/${result.id}`
                : `/dizi/${result.id}`;
        router.push(path);
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    // Username initial
    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || "U";
    const initial = typeof username === 'string' ? username.charAt(0).toUpperCase() : "U";

    if (pathname && pathname.startsWith("/izle/")) return null;

    return (
        <nav
            className={cn(
                "sticky top-0 z-50 h-14 border-b border-border-dim transition-all duration-300 backdrop-blur-xl",
                isScrolled ? "bg-void/[0.96]" : "bg-void/[0.82]"
            )}
        >
            <div className="max-w-[1400px] mx-auto px-16 max-lg:px-6 max-md:px-4 h-full flex items-center justify-between">
                {/* ===== LEFT: Logo ===== */}
                <Link
                    href="/"
                    className="flex items-center gap-2.5 group flex-shrink-0"
                >
                    <div className="w-6 h-6 rounded-md bg-purple-500 flex items-center justify-center">
                        <Clapperboard size={13} className="text-white" />
                    </div>
                    <span className="font-display text-[20px] tracking-[3px] text-white">
                        CINETRACK
                    </span>
                </Link>

                {/* ===== CENTER: Desktop nav links ===== */}
                <div className="hidden lg:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "relative flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                                    active
                                        ? "text-text-pri"
                                        : "text-text-sec hover:text-text-pri"
                                )}
                            >
                                <Icon size={14} />
                                {link.label}
                                {/* Koleksiyon badge */}
                                {link.href === "/koleksiyon" && watchlistCount > 0 && (
                                    <span className="min-w-[16px] h-4 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-purple-500 rounded-full">
                                        {watchlistCount > 99 ? "99+" : watchlistCount}
                                    </span>
                                )}
                                {/* Active indicator */}
                                {active && (
                                    <motion.span
                                        layoutId="navbar-active-indicator"
                                        className="absolute bottom-[-1px] left-2 right-2 h-[2px] bg-purple-500 rounded-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* ===== RIGHT: Search, Profile, Mobile menu ===== */}
                <div className="flex items-center gap-2">
                    {/* Search button */}
                    <button
                        ref={searchButtonRef}
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            isSearchOpen
                                ? "text-purple-400 bg-purple-500/10"
                                : "bg-subtle border border-border-dim text-text-sec hover:text-text-pri"
                        )}
                        aria-label="Ara"
                    >
                        <Search size={15} />
                    </button>

                    {/* Profile or Login */}
                    {loading ? (
                        <div className="w-8 h-8 rounded-lg bg-overlay animate-pulse shrink-0" />
                    ) : user ? (
                        <div className="relative group/dropdown">
                            <button
                                className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800/60 flex items-center justify-center hover:border-purple-500 transition-colors"
                                aria-label="Profil"
                            >
                                <span className="text-[13px] font-semibold text-purple-300">
                                    {initial}
                                </span>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-48 bg-raised border border-border-mid rounded-xl shadow-[0_16px_48px_rgba(0,0,0,.8)] opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all origin-top-right z-50 overflow-hidden">
                                <Link href="/profil" className="flex items-center gap-2 px-4 py-3 text-sm text-text-sec hover:text-text-pri hover:bg-overlay transition-colors">
                                    <UserCircle2 size={16} /> Profil
                                </Link>
                                <div className="border-t border-border-dim" />
                                <button
                                    onClick={async () => {
                                        await signOut();
                                        router.push("/auth");
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-err hover:text-err hover:bg-err/10 transition-colors text-left"
                                >
                                    <LogOut size={16} /> Cikis Yap
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link href="/auth">
                            <button className="h-8 px-4 rounded-lg bg-purple-500 text-white text-[13px] font-medium hover:bg-purple-400 transition-colors hidden sm:flex items-center gap-1.5 shadow-glow-sm">
                                <LogIn size={14} />
                                Giris Yap
                            </button>
                            <button className="sm:hidden w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center hover:bg-purple-400 transition-colors">
                                <LogIn size={14} />
                            </button>
                        </Link>
                    )}

                    {/* Removed PWA Install */}

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-text-sec hover:text-text-pri hover:bg-overlay transition-colors"
                        aria-label="Menu"
                    >
                        {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

            {/* ===== SEARCH BAR ===== */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        ref={searchContainerRef}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 right-0 top-14 bg-void/95 backdrop-blur-xl border-b border-border-dim z-40"
                    >
                        <div className="max-w-[1400px] mx-auto px-16 max-lg:px-6 max-md:px-4 py-3">
                            {/* Search input */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Film veya dizi ara..."
                                    className="w-full bg-overlay border border-border-dim rounded-xl h-10 pl-10 pr-4 text-[14px] text-white placeholder:text-text-muted focus:border-purple-500 focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Results dropdown */}
                            {(searchResults.length > 0 || isSearching) && (
                                <div className="mt-2 max-h-[60vh] overflow-y-auto bg-raised border border-border-dim rounded-xl shadow-[0_16px_48px_rgba(0,0,0,.8)]">
                                    {isSearching && (
                                        <div className="px-4 py-6 text-center text-text-sec text-sm">
                                            Araniyor...
                                        </div>
                                    )}

                                    {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                                        <div className="px-4 py-6 text-center text-text-sec text-sm">
                                            Sonuc bulunamadi
                                        </div>
                                    )}

                                    {!isSearching && movieResults.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                                                <Film size={12} />
                                                FILMLER
                                            </div>
                                            {movieResults.map((result) => (
                                                <button
                                                    key={`movie-${result.id}`}
                                                    onClick={() => handleResultClick(result)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-overlay transition-colors text-left cursor-pointer"
                                                >
                                                    {result.poster_path ? (
                                                        <Image
                                                            src={posterUrl(result.poster_path)}
                                                            alt={result.title || ""}
                                                            width={40}
                                                            height={60}
                                                            className="rounded-md object-cover flex-shrink-0 min-w-[40px] h-[60px]"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-[60px] bg-overlay rounded-md flex items-center justify-center flex-shrink-0 min-w-[40px]">
                                                            <Film size={14} className="text-text-dim" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[14px] font-medium text-white truncate">
                                                            {result.title}
                                                        </p>
                                                        {result.release_date && (
                                                            <p className="text-[12px] text-text-sec">
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
                                            <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                                                <Tv size={12} />
                                                DIZILER
                                            </div>
                                            {tvResults.map((result) => (
                                                <button
                                                    key={`tv-${result.id}`}
                                                    onClick={() => handleResultClick(result)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-overlay transition-colors text-left cursor-pointer"
                                                >
                                                    {result.poster_path ? (
                                                        <Image
                                                            src={posterUrl(result.poster_path)}
                                                            alt={result.name || ""}
                                                            width={40}
                                                            height={60}
                                                            className="rounded-md object-cover flex-shrink-0 min-w-[40px] h-[60px]"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-[60px] bg-overlay rounded-md flex items-center justify-center flex-shrink-0 min-w-[40px]">
                                                            <Tv size={14} className="text-text-dim" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[14px] font-medium text-white truncate">
                                                            {result.name}
                                                        </p>
                                                        {result.first_air_date && (
                                                            <p className="text-[12px] text-text-sec">
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

            {/* ===== MOBILE DRAWER ===== */}
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
                            initial={{ x: 288 }}
                            animate={{ x: 0 }}
                            exit={{ x: 288 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-72 bg-raised border-l border-border-mid z-[60] shadow-2xl flex flex-col lg:hidden"
                        >
                            {/* Drawer header */}
                            <div className="p-6 pb-4 border-b border-border-dim flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-purple-500 flex items-center justify-center">
                                        <Clapperboard size={13} className="text-white" />
                                    </div>
                                    <span className="font-display text-[18px] tracking-[2px] text-white">
                                        CINETRACK
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-overlay hover:bg-subtle transition-colors text-text-sec"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Nav links */}
                            <div className="p-6 flex flex-col gap-1 overflow-y-auto flex-1">
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    const active = isActive(link.href);
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors",
                                                active
                                                    ? "text-purple-400 bg-purple-500/10"
                                                    : "text-text-sec hover:text-text-pri hover:bg-overlay"
                                            )}
                                        >
                                            <Icon size={18} />
                                            {link.label}
                                            {link.href === "/koleksiyon" && watchlistCount > 0 && (
                                                <span className="ml-auto text-[10px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full">
                                                    {watchlistCount}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}

                                {/* Extra mobile links */}
                                <div className="mt-3 pt-3 border-t border-border-dim">
                                    {!loading && (
                                        user ? (
                                            <>
                                                <Link
                                                    href="/profil"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors",
                                                        isActive("/profil")
                                                            ? "text-purple-400 bg-purple-500/10"
                                                            : "text-text-sec hover:text-text-pri hover:bg-overlay"
                                                    )}
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
                                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors text-err hover:bg-err/10"
                                                >
                                                    <LogOut size={18} />
                                                    Cikis Yap
                                                </button>
                                            </>
                                        ) : (
                                            <Link
                                                href="/auth"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors",
                                                    isActive("/auth")
                                                        ? "text-purple-400 bg-purple-500/10"
                                                        : "text-text-sec hover:text-text-pri hover:bg-overlay"
                                                )}
                                            >
                                                <LogIn size={18} />
                                                Giris Yap
                                            </Link>
                                        )
                                    )}
                                </div>

                                {/* Removed Install PWA (Mobile) */}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
}
