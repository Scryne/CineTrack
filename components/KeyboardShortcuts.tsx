"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeyboardShortcuts() {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Aktif element bir input veya textarea ise kısayolları engelle
            const isInputFocus = ["INPUT", "TEXTAREA"].includes(
                (document.activeElement as HTMLElement)?.tagName
            );

            // Arama kısayolu
            if (e.key === "/" && !isInputFocus) {
                e.preventDefault();
                router.push("/kesif");
            }

            // Kapatma ve geriye dönme veya ana menüye gitme
            if (e.key === "Escape" && !isInputFocus) {
                // Eğer kesif sayfasındaysak ve bir iptal vs. aranıyorsa belki anasayfaya
                // Bu durumda anasayfaya atalım (Escape = Kapat)
                if (window.location.pathname === "/kesif") {
                    router.push("/");
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router]);

    return null;
}
