import { Bangers, Courier_Prime } from 'next/font/google'
import Head from 'next/head'
import Script from 'next/script'
import '@/styles/globals.css'
import { AuthProvider } from '@/lib/auth'
import dynamic from 'next/dynamic'

const AuthModal = dynamic(() => import('@/components/AuthModal'), {
    loading: () => null,
})

const bangers = Bangers({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-bangers',
})

const courierPrime = Courier_Prime({
    weight: ['400', '700'],
    subsets: ['latin'],
    variable: '--font-courier-prime',
})

const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ZerosByKai",
    "url": "https://zerosbykai.com",
    "logo": "https://zerosbykai.com/favicon.ico",
    "description": "AI-powered startup idea curation platform. Validated business opportunities scraped from Reddit threads, delivered weekly.",
    "sameAs": [],
    "contactPoint": {
        "@type": "ContactPoint",
        "email": "kai@zerosbykai.com",
        "contactType": "customer support"
    }
}

const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ZerosByKai",
    "url": "https://zerosbykai.com",
    "description": "Find validated startup ideas from Reddit. 10 curated business opportunities every Monday.",
    "potentialAction": {
        "@type": "SearchAction",
        "target": "https://zerosbykai.com/archive?q={search_term_string}",
        "query-input": "required name=search_term_string"
    }
}

export default function App({ Component, pageProps }) {
    return (
        <AuthProvider>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                {/* Default OG fallbacks — overridden per page */}
                <meta property="og:site_name" content="ZerosByKai" />
                <meta property="og:locale" content="en_US" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@zerosbykai" />
                <meta name="robots" content="index, follow" />
            </Head>
            <Script
                id="org-schema"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <Script
                id="website-schema"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
            <main className={`${bangers.variable} ${courierPrime.variable} font-sans`}>
                <Component {...pageProps} />
                <AuthModal />
            </main>
        </AuthProvider>
    )
}
