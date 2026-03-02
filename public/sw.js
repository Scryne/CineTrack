// ==========================================
// CineTrack — Service Worker (Bildirimler)
// ==========================================

const CACHE_NAME = "cinetrack-sw-v1";
const OFFLINE_URL = "/offline.html";

// Install
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.add(OFFLINE_URL);
        })
    );
    self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
                );
            }),
            self.clients.claim()
        ])
    );
});

// Fetch - Offline Fallback
self.addEventListener("fetch", (event) => {
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(OFFLINE_URL);
            })
        );
    }
});

// Client'dan mesaj al
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "CHECK_SCHEDULE") {
        const { shows } = event.data;
        if (shows && shows.length > 0) {
            shows.forEach((show) => {
                self.registration.showNotification("🎬 CineTrack Yayın Hatırlatması", {
                    body: `Bugün ${show.name} yeni bölüm!${show.episode ? ` S${String(show.season).padStart(2, "0")}E${String(show.episode).padStart(2, "0")}` : ""}`,
                    icon: show.poster || "/favicon.ico",
                    badge: "/favicon.ico",
                    tag: `cinetrack-${show.id}`,
                    data: {
                        url: `/dizi/${show.id}`,
                    },
                });
            });
        }
    }
});

// Bildirime tıklanınca
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/takvim";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // Zaten açık bir pencere varsa odaklan
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Yoksa yeni pencere aç
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});
