"use client";

import { Toaster } from "react-hot-toast";
import ScrollToTop from "./ScrollToTop";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { useEffect } from "react";

export default function ClientSetup() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(console.error);
        }
    }, []);

    return (
        <>
            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        background: "#1a1a1a",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.1)",
                    },
                }}
            />
            <ScrollToTop />
            <KeyboardShortcuts />
        </>
    );
}
