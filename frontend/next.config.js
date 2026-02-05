const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compress: true,
    output: 'standalone',
    images: {
        formats: ['image/avif', 'image/webp'],
    },
    experimental: {},
    turbopack: {
        // Silence warning about workspace root by explicitly setting it to the project root
        root: path.resolve(__dirname, '..'),
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
