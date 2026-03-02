/** @type {import('next').NextConfig} */
const nextConfig = {
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
