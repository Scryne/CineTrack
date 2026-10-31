import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}

/**
 * Efektten bir veri yükleyiciyi başlatır. Yükleyicinin state güncellemeleri (ör. "yükleniyor")
 * efekt gövdesinde senkron değil, bir sonraki mikro görevde olur; React 19'un
 * `set-state-in-effect` kuralının uyardığı ardışık render zinciri oluşmaz.
 */
export function startLoad(load: () => unknown): void {
    void Promise.resolve().then(load);
}
