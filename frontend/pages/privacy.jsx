import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-yellow-50 font-sans">
            <Head>
                <title>Privacy Policy — Data & Newsletter Privacy | ZerosByKai</title>
                <meta name="description" content="ZerosByKai privacy policy. We collect your email for our free startup ideas newsletter. No data selling, no tracking. Unsubscribe anytime." />
                <meta property="og:title" content="Privacy Policy | ZerosByKai" />
                <meta property="og:description" content="Our privacy policy. We collect your email for startup ideas delivery. No data selling, no tracking." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://zerosbykai.com/privacy" />
                <meta name="twitter:title" content="Privacy Policy | ZerosByKai" />
                <link rel="canonical" href="https://zerosbykai.com/privacy" />
            </Head>

            <header className="p-6 border-b-4 border-black bg-white">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold hover:underline">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="comic-title text-xl tracking-widest">ZEROS BY KAI</div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="mb-12 text-center">
                    <h1 className="comic-title text-5xl mb-4 text-black">PRIVACY POLICY</h1>
                    <div className="comic-panel inline-block bg-black text-white px-4 py-2 transform rotate-1">
                        <p className="comic-body font-bold text-lg">NO SPAM. NO BS.</p>
                    </div>
                </div>

                <div className="comic-panel p-8 bg-white mb-8 comic-shadow relative">
                    <div className="space-y-8 comic-body text-lg">
                        <section>
                            <h2 className="comic-title text-2xl mb-4 text-rose-700">1. THE SHORT VERSION</h2>
                            <p className="mb-4 text-black">
                                We collect your email so we can send you startup ideas. That&apos;s it.
                                We don&apos;t sell your data to shady brokers. We don&apos;t track your every move.
                            </p>
                            <p className="font-bold bg-yellow-200 inline-block px-1 text-black">
                                We are too busy analyzing Reddit threads to spy on you.
                            </p>
                        </section>

                        <section>
                            <h2 className="comic-title text-2xl mb-4 text-black">2. WHAT WE COLLECT</h2>
                            <ul className="list-disc pl-6 space-y-2 text-black">
                                <li><strong>Email Address:</strong> To send you the newsletter.</li>
                                <li><strong>Name:</strong> So we can say &quot;Hey [Name]&quot; instead of &quot;Hey Human&quot;.</li>
                                <li><strong>Usage Data:</strong> Basic open rates to see if our ideas actually suck or not.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="comic-title text-2xl mb-4 text-black">3. COOKIES</h2>
                            <p className="text-black">
                                Yes, we use cookies. Mostly to make sure the site works and to know if you&apos;re a returning user.
                                It&apos;s standard stuff, nothing creepy.
                            </p>
                        </section>

                        <div className="bg-gray-100 p-6 border-l-4 border-black mt-8">
                            <h3 className="font-bold text-xl mb-2 text-black">UNSUBSCRIBE ANYTIME</h3>
                            <p className="text-sm text-gray-600">
                                Every email has a one-click unsubscribe link. If you leave, we won&apos;t hold a grudge.
                                (But you&apos;ll miss the next million-dollar idea.)
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-gray-900 text-white py-8 text-center comic-body text-sm">
                <p>&copy; {new Date().getFullYear()} ZerosByKai. All rights reserved.</p>
                <div className="mt-4 space-x-6">
                    <Link href="/terms" className="hover:text-yellow-400 underline">Terms</Link>
                    <Link href="/story" className="hover:text-yellow-400 underline">Story</Link>
                    <Link href="/" className="hover:text-yellow-400 underline">Home</Link>
                </div>
            </footer>
        </div>
    );
}
