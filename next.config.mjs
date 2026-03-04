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
                source: "/izle/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                ],
            },
            {
                source: "/:path*",
                headers: [
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
            {
                source: "/izlendi",
                destination: "/koleksiyon",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
