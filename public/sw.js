const CACHE_NAME = 'cinetrack-v1';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Mesaj dinleyici — ana uygulamadan mesaj alır
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
        const { title, body, scheduledTime, icon, url } = event.data.payload;
        const delay = new Date(scheduledTime).getTime() - Date.now();

        if (delay > 0) {
            setTimeout(() => {
                self.registration.showNotification(title, {
                    body,
                    icon: icon || '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    vibrate: [200, 100, 200],
                    data: { url: url || '/' },
                    actions: [
                        { action: 'open', title: 'Aç' },
                        { action: 'dismiss', title: 'Kapat' }
                    ]
                });
            }, delay);
        }
    }

    if (event.data?.type === 'CANCEL_NOTIFICATIONS') {
        // Tüm bekleyen bildirimleri iptal et (Timeout id'leri saklanıp temizlenebilir)
    }
});

// Bildirime tıklanınca
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
