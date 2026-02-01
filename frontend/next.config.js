/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    output: 'standalone',
    images: {
        formats: ['image/avif', 'image/webp'],
    },
    async redirects() {
        return [
            {
                source: '/about',
                destination: '/story',
                permanent: true,
            },
        ]
    },
}

module.exports = nextConfig
