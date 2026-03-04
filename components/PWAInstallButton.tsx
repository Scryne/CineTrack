"use client";

import { Download } from "lucide-react";

import { useState, useEffect } from "react";

export default function PWAInstallButton() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleBeforeInstallPrompt = (e: any) => {
            // Chrome'un varsayılan yükleme ekranını göstermesini engelle
            e.preventDefault();
            // Etkinliği daha sonra tetiklemek üzere kaydet
            setDeferredPrompt(e);
            // Uygulamanın yüklenebilir olduğunu belirt
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Zaten yüklüyse state'i güncelle
        window.addEventListener("appinstalled", () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }
        // Yükleme istemini tetikle
        deferredPrompt.prompt();
        // Kullanıcının yanıtını bekle
        await deferredPrompt.userChoice;
        // İstem bir kez kullanıldıktan sonra tekrar kullanılamaz, prompt'u sıfırla
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    if (!isInstallable) {
        return null;
    }

    return (
        <button
            onClick={handleInstallClick}
            className="flex w-full justify-center items-center gap-2 px-3 py-1.5 bg-purple-DEFAULT/20 text-purple-DEFAULT font-medium rounded-lg hover:bg-purple-DEFAULT/30 transition-colors text-sm"
        >
            <Download size={16} />
            Uygulama İndir
        </button>
    );
}
