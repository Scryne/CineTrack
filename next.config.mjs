/** @type {import('next').NextConfig} */
const nextConfig = {
    productionBrowserSourceMaps: false,
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
            ? { exclude: ['error'] }
            : false,
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "image.tmdb.org",
                pathname: "/t/p/**",
            },
        ],
    },
    async redirects() {
        return [
            {
                source: "/liste",
                destination: "/koleksiyon",
                permanent: true,
            },
            // Eski oynatıcı rotaları: uygulama yayın oynatmaz, yasal seçeneklere yönlendirir.
            {
                source: "/izle/film/:id",
                destination: "/film/:id#nerede-izlenir",
                permanent: true,
            },
            {
                source: "/izle/dizi/:id/:sezon/:bolum",
                destination: "/dizi/:id/sezon/:sezon",
                permanent: true,
            },
            {
                source: "/izlendi",
                destination: "/koleksiyon",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
