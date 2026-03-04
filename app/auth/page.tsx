"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Clapperboard, AlertCircle, Mail, Lock, User } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { getTrendingMovies, backdropUrl } from "@/lib/tmdb";

// SVG Google Icon
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function AuthPage() {
    const router = useRouter();
    const supabase = createClient();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [backdropSrc, setBackdropSrc] = useState<string | null>(null);
    const [backdropError, setBackdropError] = useState(false);

    // TMDB'den haftanın trend filmini çek ve backdrop'unu kullan
    useEffect(() => {
        async function loadBackdrop() {
            try {
                const trending = await getTrendingMovies();
                if (trending && trending.length > 0) {
                    // backdrop_path'i olan ilk filmi bul
                    const movieWithBackdrop = trending.find(m => m.backdrop_path);
                    if (movieWithBackdrop?.backdrop_path) {
                        setBackdropSrc(backdropUrl(movieWithBackdrop.backdrop_path));
                    }
                }
            } catch {
                // API hatası - gradient fallback gösterilecek
            }
        }
        loadBackdrop();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === "register") {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username || email.split("@")[0],
                        }
                    }
                });

                if (signUpError) throw signUpError;

                // Kayıt başarılıysa, otomatik profil oluşturulacak trigger üzerinden
                setMode("login");
                setError("Kayıt başarılı! Lütfen giriş yapın.");
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                router.push("/profil");
            }
        } catch (err: unknown) {
            setError((err as Error).message || "Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            });
            if (error) throw error;
        } catch (err: unknown) {
            setError((err as Error).message || "Google ile giriş yapılırken hata oluştu.");
        }
    };

    return (
        <div className="min-h-screen flex bg-bg-main">
            {/* Left Side - Backdrop */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                {backdropSrc && !backdropError ? (
                    <Image
                        src={backdropSrc}
                        alt="Trend Film"
                        fill
                        className="object-cover"
                        priority
                        onError={() => setBackdropError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-DEFAULT/20 via-bg-main to-bg-main" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-bg-main/90 to-bg-main/40" />
                <div className="absolute inset-0 bg-black/30" />

                <div className="absolute bottom-20 left-16 max-w-lg z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Clapperboard size={48} className="text-purple-DEFAULT" />
                        <h1 className="font-display text-5xl font-bold text-white tracking-tight">CineTrack</h1>
                    </div>
                    <p className="text-2xl text-gray-200 font-medium leading-relaxed">
                        Sinema dünyanda kaybol. <br />
                        <span className="text-gray-400 text-lg font-normal mt-2 block">
                            İzlediklerini takip et, listeler oluştur, yeni favoriler keşfet.
                        </span>
                    </p>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
                <div className="w-full max-w-[420px] space-y-8">

                    {/* Mobile Logo Logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden justify-center">
                        <Clapperboard size={36} className="text-purple-DEFAULT" />
                        <span className="font-display text-3xl font-bold text-white">CineTrack</span>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-text-primary mb-2">
                            CineTrack&apos;e Hoş Geldin
                        </h2>
                        <p className="text-text-secondary text-sm">
                            {mode === "login" ? "Hesabınıza giriş yaparak devam edin." : "Yeni bir hesap oluşturarak aramıza katılın."}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#2A2A35] mb-6">
                        <button
                            onClick={() => { setMode("login"); setError(null); }}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mode === "login" ? "border-purple-DEFAULT text-white" : "border-transparent text-text-muted hover:text-text-secondary"}`}
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={() => { setMode("register"); setError(null); }}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mode === "register" ? "border-purple-DEFAULT text-white" : "border-transparent text-text-muted hover:text-text-secondary"}`}
                        >
                            Kayıt Ol
                        </button>
                    </div>

                    {error && (
                        <div className={`p-4 rounded-xl flex items-start gap-3 border ${error.includes("başarılı") ? "bg-success/10 border-success/30 text-success" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "register" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Kullanıcı Adı</label>
                                <Input
                                    icon={User}
                                    type="text"
                                    placeholder="Kullanıcı adınızı girin"
                                    value={username}
                                    onChange={setUsername}
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">E-posta Adresi</label>
                            <Input
                                icon={Mail}
                                type="email"
                                placeholder="ornek@email.com"
                                value={email}
                                onChange={setEmail}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-text-secondary">Şifre</label>
                                {mode === "login" && (
                                    <Link href="#" className="text-xs text-purple-DEFAULT hover:underline">
                                        Şifremi Unuttum
                                    </Link>
                                )}
                            </div>
                            <Input
                                icon={Lock}
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={setPassword}
                                required
                                minLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-3 mt-4"
                            loading={loading}
                        >
                            {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
                        </Button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#2A2A35]"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-bg-main px-4 text-text-muted">veya</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GoogleIcon />
                        Google ile devam et
                    </button>

                </div>
            </div>
        </div>
    );
}
