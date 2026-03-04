"use client";

import { logger } from '@/lib/logger';

import { Toaster } from "react-hot-toast";
import ScrollToTop from "./ScrollToTop";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { useEffect } from "react";

import { scheduleDailyNotification } from "@/lib/notifications";

export default function ClientSetup() {
    useEffect(() => {
        // Hydration sonrası yapılandırmalar

        // Handle chunk load errors caused by Next.js navigating between old and new build chunks
        const errorHandler = (e: ErrorEvent) => {
            if (e.message && /Loading chunk .* failed/i.test(e.message)) {
                window.location.reload();
            }
            // Suppress Supabase GoTrue lock errors (cosmetic in dev, doesn't affect auth)
            if (e.message && /Lock broken by another request/i.test(e.message)) {
                e.preventDefault();
                return;
            }
        };
        window.addEventListener('error', errorHandler);

        // Suppress unhandled promise rejections from AbortError (Supabase navigator.locks)
        const rejectionHandler = (e: PromiseRejectionEvent) => {
            const msg = e.reason?.message || e.reason?.toString?.() || '';
            if (/Lock broken by another request/i.test(msg) ||
                (e.reason?.name === 'AbortError' && /lock/i.test(msg))) {
                e.preventDefault();
                return;
            }
        };
        window.addEventListener('unhandledrejection', rejectionHandler);

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").then(() => {
                if ('Notification' in window && Notification.permission === 'granted') {
                    const savedTime = localStorage.getItem('notification_time');
                    if (savedTime) {
                        scheduleDailyNotification(savedTime);
                    }
                }
            }).catch((err) => logger.error('SW kayıt hatası', err));
        }

        return () => {
            window.removeEventListener('error', errorHandler);
            window.removeEventListener('unhandledrejection', rejectionHandler);
        };
    }, []);

    return (
        <>
            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        background: "#16161A",
                        color: "#F0F0F5",
                        border: "1px solid #2A2A35",
                        borderRadius: "12px",
                        fontSize: "14px",
                    },
                    success: {
                        iconTheme: { primary: "#22C55E", secondary: "#F0F0F5" },
                    },
                    error: {
                        iconTheme: { primary: "#EF4444", secondary: "#F0F0F5" },
                    },
                }}
            />
            <ScrollToTop />
            <KeyboardShortcuts />
        </>
    );
}
