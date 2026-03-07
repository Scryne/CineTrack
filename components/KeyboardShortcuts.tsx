"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeyboardShortcuts() {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Aktif element bir input, textarea veya contenteditable ise kısayolları engelle
            const activeEl = document.activeElement as HTMLElement;
            const isInputFocus = ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl?.tagName) || activeEl?.isContentEditable;
            if (isInputFocus) return;

            // Herhangi bir modal açıksa kısayolları engelle
            const hasOpenModal = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0.z-50');
            if (hasOpenModal) return;

            // Arama kısayolu
            if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                router.push("/kesif");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router]);

    return null;
}
