"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import Button from "@/components/ui/Button";

interface Props {
    open: boolean;
    onAllow: () => void;
    onDismiss: () => void;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Takvimdeki bildirim izni penceresi. `document.body`'ye portal ile çizilir: sayfa sarmalayıcısındaki
 * (app/template.tsx) dönüşüm yeni bir katman bağlamı açtığından pencere içeride kalınca menünün ve
 * içeriğin altına düşebiliyordu. Arka plan opak bir örtüyle kapanır; odak pencerede tutulur,
 * Esc ve örtüye tıklama "Şimdi değil" ile aynıdır, kapanınca odak önceki öğeye döner.
 */
export default function NotificationPermissionDialog({ open, onAllow, onDismiss }: Props) {
    const titleId = useId();
    const descId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const panel = panelRef.current;
        panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onDismiss();
                return;
            }
            if (e.key !== "Tab" || !panel) return;
            const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
            previous?.focus?.();
        };
    }, [open, onDismiss]);

    // Pencere yalnız istemcide, sayfa açıldıktan sonra açılır; sunucuda hiçbir şey çizilmez.
    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-void/85 backdrop-blur-sm"
                onClick={onDismiss}
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descId}
                className="relative w-full max-w-sm rounded-xl border border-border-mid bg-raised p-6 shadow-card-up"
            >
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-border-dim bg-overlay">
                        <Bell size={26} className="text-purple-400" aria-hidden="true" />
                    </div>
                    <h2 id={titleId} className="mb-2 text-lg font-semibold text-text-pri">
                        Bildirimleri aç
                    </h2>
                    <p id={descId} className="text-sm leading-relaxed text-text-sec">
                        Koleksiyonundaki dizilerin yeni bölümlerinden haberdar olmak için bildirimlere izin ver.
                        Her gün seçtiğin saatte hatırlatma gönderilir.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <Button variant="primary" size="lg" className="w-full" onClick={onAllow}>
                        İzin ver
                    </Button>
                    <Button variant="ghost" size="lg" className="w-full" onClick={onDismiss}>
                        Şimdi değil
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
