'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            const protectedRoutes = [
                '/koleksiyon', '/dizilerim', '/gecmis',
                '/profil', '/oneriler',
                '/listeler', '/izle'
            ];

            const isProtected = protectedRoutes.some(route => pathname?.startsWith(route));

            if (isProtected && !user) {
                router.push('/auth');
            }
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-main">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    // Don't render protected content if user is not authenticated
    const protectedRoutes = [
        '/koleksiyon', '/dizilerim', '/gecmis',
        '/profil', '/oneriler',
        '/listeler', '/izle'
    ];
    const isProtected = protectedRoutes.some(route => pathname?.startsWith(route));
    
    if (isProtected && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-main">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
