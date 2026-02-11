import { Sparkles, Zap, Mail, ChevronRight } from 'lucide-react';
import { RevealContainer, RevealItem } from '@/components/animations/Reveal';

export default function FinalCTA({ email, setEmail, subscribeStatus, subscribeError, onSubscribe, onOpenAuth, noValidate }) {
    return (
        <section id="final-cta" className="bg-gradient-to-br from-yellow-400 to-amber-400 py-8 sm:py-10 lg:py-12 px-4 sm:px-6 relative overflow-hidden">
            <div className="absolute inset-0 halftone"></div>
            <RevealContainer stagger={0.1} className="relative max-w-6xl 2xl:max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left: Text Content */}
                    <div className="text-center lg:text-left">
                        <RevealItem type="fade" spring="gentle">
                            <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-6 text-black">
                                STOP GUESSING.<br />START BUILDING.
                            </h2>
                        </RevealItem>
                        <RevealItem type="fade" spring="gentle">
                            <p className="comic-body text-lg sm:text-xl lg:text-2xl max-w-xl mx-auto lg:mx-0 text-black">
                                <span className="font-bold">10 validated opportunities</span> land in your inbox every Monday.
                                No AI slop. No fake problems. Just real pain points from <span className="font-bold">the internet&apos;s digital town squares.</span>
                            </p>
                        </RevealItem>

                        <RevealItem type="fade" spring="gentle">
                            <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-yellow-400 comic-body text-sm font-bold border-2 border-yellow-400">
                                    <Sparkles className="w-4 h-4" /> Every Monday
                                </span>
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-yellow-400 comic-body text-sm font-bold border-2 border-yellow-400">
                                    <Zap className="w-4 h-4" /> 100% Free
                                </span>
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-yellow-400 comic-body text-sm font-bold border-2 border-yellow-400">
                                    <Mail className="w-4 h-4" /> No Spam
                                </span>
                            </div>
                        </RevealItem>
                    </div>

                    {/* Right: Subscribe Form */}
                    <RevealItem
                        type="fade"
                        spring="gentle"
                        className="comic-panel p-6 sm:p-8 bg-white comic-shadow rotate-1 hover:rotate-0 hover:scale-[1.02] transition-transform duration-300"
                    >
                        <h3 className="comic-title text-xl sm:text-2xl mb-4 text-black flex items-center gap-2">
                            <Mail className="w-6 h-6 text-rose-700" />
                            GET THE WEEKLY ZEROS
                        </h3>

                        {subscribeStatus === 'success' ? (
                            <div className="text-center py-4">
                                <div className="text-5xl mb-3">⚡</div>
                                <h4 className="comic-title text-2xl mb-2 text-black">YOU&apos;RE IN!</h4>
                                <p className="comic-body text-gray-700">First email drops Monday.</p>
                            </div>
                        ) : (
                            <form onSubmit={onSubscribe} className="space-y-4" noValidate={noValidate}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 text-black bg-white"
                                    required
                                />

                                {subscribeStatus === 'error' && (
                                    <div className="bg-red-50 border-2 border-red-400 p-3 text-red-700 comic-body text-sm">
                                        {subscribeError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={subscribeStatus === 'loading'}
                                    className="w-full px-6 py-4 bg-rose-700 text-white comic-title text-lg hover:bg-rose-800 transition-all comic-shadow disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {subscribeStatus === 'loading' ? 'SUBSCRIBING...' : (
                                        <>
                                            SUBSCRIBE FREE
                                            <ChevronRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        <p className="text-xs comic-body mt-4 text-gray-600 text-center">
                            ✓ 100% Free &bull; ✓ Unsubscribe anytime &bull; ✓ No spam
                        </p>
                        <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 text-center">
                            <p className="text-sm comic-body text-gray-600">
                                Want to vote &amp; earn badges?
                            </p>
                            <button
                                onClick={onOpenAuth}
                                className="mt-2 text-rose-700 font-bold comic-body hover:text-rose-900 inline-flex items-center gap-1 underline"
                            >
                                Create an account <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </RevealItem>
                </div>
            </RevealContainer>
        </section>
    );
}
