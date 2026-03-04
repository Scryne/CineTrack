export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (!('serviceWorker' in navigator)) return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

export async function getServiceWorkerRegistration() {
    if (!('serviceWorker' in navigator)) return null;

    try {
        const registration = await navigator.serviceWorker.ready;
        return registration;
    } catch {
        return null;
    }
}

export async function scheduleDailyNotification(time: string): Promise<void> {
    // time: "09:30" formatında
    const registration = await getServiceWorkerRegistration();
    if (!registration) return;

    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // Eğer saat geçtiyse yarına ayarla
    if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // SW'a mesaj gönder
    navigator.serviceWorker.controller?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: {
            title: 'CineTrack',
            body: 'Bugün ne izleyeceksin?',
            scheduledTime: scheduledTime.toISOString(),
            url: '/',
        }
    });

    // localStorage'a kaydet (sayfa yenilenince yeniden schedule et)
    localStorage.setItem('notification_time', time);
    localStorage.setItem('notification_scheduled', scheduledTime.toISOString());
}

export async function cancelScheduledNotifications(): Promise<void> {
    navigator.serviceWorker.controller?.postMessage({
        type: 'CANCEL_NOTIFICATIONS'
    });
    localStorage.removeItem('notification_scheduled');
}

export async function scheduleEpisodeNotification(
    seriesTitle: string,
    episodeTitle: string,
    airDate: string,
    seriesId: string
): Promise<void> {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return;

    const airDateTime = new Date(airDate);
    if (airDateTime <= new Date()) return;

    navigator.serviceWorker.controller?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: {
            title: `Yeni Bölüm: ${seriesTitle}`,
            body: episodeTitle,
            scheduledTime: airDateTime.toISOString(),
            url: `/dizi/${seriesId}`,
        }
    });
}
