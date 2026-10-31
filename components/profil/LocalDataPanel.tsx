"use client";

import { useState } from "react";
import { Download, HardDrive, Trash2 } from "lucide-react";
import { clearLocalData, exportLocalData } from "@/lib/localClient";

/**
 * Yerel modda hesap yok: veriler yalnız bu tarayıcıda durur. Kullanıcının onları yedekleyip
 * silebilmesi gerekir; "çıkış yap" burada anlamsızdı.
 */
export default function LocalDataPanel() {
    const [confirming, setConfirming] = useState(false);

    const download = () => {
        const blob = new Blob([JSON.stringify(exportLocalData(), null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cinetrack-yedek-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const wipe = () => {
        clearLocalData();
        window.location.assign("/");
    };

    return (
        <div className="mt-4 rounded-xl border border-border-dim bg-overlay p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-300">
                    <HardDrive size={18} aria-hidden />
                </div>
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-text-pri">Veriler bu tarayıcıda</p>
                    <p className="text-[11px] text-text-sec">
                        Yerel modda hesap gerekmez. Listelerin, puanların ve izleme geçmişin yalnız bu tarayıcıda
                        saklanır; tarayıcı verilerini temizlersen kaybolur.
                    </p>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={download}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-mid px-3 py-1.5 text-[12px] font-medium text-text-pri hover:bg-raised"
                >
                    <Download size={14} aria-hidden /> Yedeği indir (JSON)
                </button>
                {confirming ? (
                    <>
                        <button
                            type="button"
                            onClick={wipe}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-err px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-err/90"
                        >
                            <Trash2 size={14} aria-hidden /> Evet, tüm verileri sil
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="rounded-lg px-3 py-1.5 text-[12px] text-text-sec hover:text-text-pri"
                        >
                            Vazgeç
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-err/30 px-3 py-1.5 text-[12px] font-medium text-err hover:bg-err/10"
                    >
                        <Trash2 size={14} aria-hidden /> Bu tarayıcıdaki verileri sil
                    </button>
                )}
            </div>
        </div>
    );
}
