/**
 * "İzle" bağlantıları yasal seçeneklere gider: film için detay sayfasındaki "nerede izlenir"
 * bölümü, dizi için bölüm takibinin yapıldığı sezon sayfası. Uygulama yayın oynatmaz; eski
 * /izle rotaları izinsiz kaynakları gömüyordu (2026-10-31'de kaldırıldı, next.config yönlendirir).
 */
export function watchHref(type: "film" | "dizi", id: string | number, season?: number | null): string {
    if (type === "film") return `/film/${id}#nerede-izlenir`;
    return season ? `/dizi/${id}/sezon/${season}` : `/dizi/${id}#nerede-izlenir`;
}
