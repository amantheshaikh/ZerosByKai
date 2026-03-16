const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compress: true,
    // output: 'standalone',
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
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; connect-src 'self' *.supabase.co https://zerosbykai-api-prod.fly.dev http://localhost:3001; img-src 'self' data: blob: *.supabase.co https://zerosbykai.com https://api.producthunt.com; frame-ancestors 'none'; object-src 'none';"
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    }
                ]
            }
        ]
    }
}

module.exports = nextConfig
