import Image from 'next/image';
import Particles from '@/components/Particles';
import { TypingAnimation } from '@/components/ui/typing-animation';

export default function HeroSection() {
    return (
        <section className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 overflow-hidden">
            <div className="absolute inset-0 opacity-20 z-0">
                <Particles
                    particleColors={['#000000']}
                    particleCount={800}
                    particleSpread={12}
                    speed={0.1}
                    particleBaseSize={200}
                    moveParticlesOnHover={true}
                    alphaParticles={true}
                    disableRotation={false}
                />
            </div>

            <div className="relative z-10 max-w-7xl 2xl:max-w-screen-2xl mx-auto px-6 pt-32 pb-6">
                <div className="grid lg:grid-cols-2 gap-4 lg:gap-4 items-center py-4 lg:py-6">
                    {/* Left: Text Content */}
                    <div className="space-y-6 lg:space-y-8">
                        <div className="comic-panel p-3 sm:p-4 bg-white inline-block transform -rotate-2">
                            <p className="comic-body text-xs sm:text-sm font-bold uppercase text-black">⚡ 10 Fresh Ideas Every Monday</p>
                        </div>

                        <h1 className="comic-title text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl leading-none text-gray-900">
                            REAL PROBLEMS.<br />
                            <span className="text-rose-700">REAL STARTUP IDEAS.</span>
                        </h1>

                        <div className="comic-panel p-4 sm:p-4 lg:p-4 bg-white max-w-xl 2xl:max-w-2xl border-l-4 sm:border-l-8 border-black">
                            <p className="comic-body text-sm sm:text-lg lg:text-xl 2xl:text-2xl leading-relaxed text-black">
                                &quot;In a world where <span className="font-bold bg-yellow-200 px-1 transform -rotate-1 inline-block whitespace-nowrap">0 → 1</span> has become super easy,
                                find the <span className="font-bold bg-rose-700 text-white px-2 transform rotate-1 inline-flex items-center whitespace-nowrap">right&nbsp;<TypingAnimation showCursor={false} loop={true} delay={400} typeSpeed={100} deleteSpeed={100} startOnView={false}>ZER</TypingAnimation>O.</span>&quot;
                            </p>
                        </div>

                        <p className="text-base sm:text-lg lg:text-xl 2xl:text-2xl text-gray-900 comic-body max-w-xl 2xl:max-w-2xl leading-relaxed">
                            <span className="font-bold">Zeros are startup ideas </span>that aren&apos;t AI-generated slop. Every week, Kai digs through
                            <span className="font-bold"> millions of internet conversations</span> to surface <span className="font-bold">real problems </span>
                            people won&apos;t shut up about. <span className="font-bold">Real opportunities.</span> No BS. No trend-chasing.
                            Just validated pain points waiting to be built.
                        </p>
                    </div>

                    {/* Right: Kai Character with Social Proof Cards */}
                    <div className="relative flex flex-col items-center mt-8 lg:mt-0 lg:translate-x-12">
                        <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md mx-auto scale-90">
                            {/* Social Proof Card: Meet Kai - Top Left */}
                            <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-8 z-30 transform -rotate-6 animate-bob">
                                <div className="p-2 sm:p-3 comic-shadow border-3 border-yellow-400" style={{ background: '#000' }}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg sm:text-xl">👋</span>
                                        <div>
                                            <p className="comic-title text-xs sm:text-sm leading-none text-yellow-400">MEET KAI</p>
                                            <p className="comic-body text-[8px] sm:text-[10px] text-yellow-200">Your Idea Dealer</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kai Image */}
                            <div className="comic-panel comic-shadow p-2 bg-gradient-to-br from-yellow-200 to-yellow-100 rotate-2 z-10 relative">
                                <Image
                                    src="/kai-hero.jpg"
                                    alt="Kai - AI-powered startup idea curator finding validated business opportunities from the internet's noise"
                                    width={450}
                                    height={675}
                                    className="w-full h-auto border-2 sm:border-4 border-black"
                                    style={{ filter: 'contrast(1.1) brightness(1.05)' }}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 380px, 450px"
                                    priority
                                />
                            </div>

                            {/* Social Proof Card: Best Analyst - Bottom Right */}
                            <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-8 z-30 transform rotate-3 animate-bob" style={{ animationDelay: '1s' }}>
                                <div className="p-2 sm:p-3 comic-shadow border-3 border-black" style={{ background: '#be123c' }}>
                                    <p className="comic-title text-[10px] sm:text-xs leading-tight text-center text-white">
                                        🏆 WORLD&apos;S BEST<br />
                                        <span className="text-yellow-300">PROBLEM HUNTER</span>
                                    </p>
                                </div>
                            </div>

                            {/* Bonus Card: Stats - Top Right */}
                            <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-6 z-20 transform rotate-6 animate-bob" style={{ animationDelay: '2s' }}>
                                <div className="p-2 sm:p-3 comic-shadow border-3 border-black bg-white">
                                    <p className="comic-body text-[8px] sm:text-[10px] font-bold text-gray-700">
                                        🏅 EMPLOYEE OF THE MONTH<br />(EVERY MONTH)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
