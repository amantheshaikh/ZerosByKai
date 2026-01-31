/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    output: 'standalone',
    images: {
        formats: ['image/avif', 'image/webp'],
    },
}

module.exports = nextConfig
