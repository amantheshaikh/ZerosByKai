import Image from 'next/image';
import { RevealContainer, RevealItem } from '@/components/Reveal';
import { MISSION_DESIGNATIONS } from '@/data/sampleData';

export default function DesignationTiers() {
    return (
        <section className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 bg-gray-900 text-white overflow-hidden">
            <RevealContainer className="max-w-6xl mx-auto" stagger={0.08} rootMargin="-100px 0px">
                <RevealItem type="scale" spring="bouncy" className="text-center mb-2 sm:mb-3">
                    <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-yellow-400">
                        MISSION DESIGNATIONS
                    </h2>
                </RevealItem>
                <RevealItem type="fade" spring="gentle" className="text-center mb-6 sm:mb-8">
                    <p className="comic-body text-base sm:text-lg lg:text-xl">
                        Stop lurking. Start building your record. Prove you can spot the signal.
                    </p>
                </RevealItem>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-6">
                    {MISSION_DESIGNATIONS.map((tier, idx) => (
                        <RevealItem
                            key={tier.title}
                            type="scaleRotate"
                            spring="snappy"
                            className={`comic-panel p-4 sm:p-5 text-center border-gray-700 relative overflow-visible group ${idx === 4 ? 'bg-gradient-to-br from-indigo-900 to-gray-800 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-gray-800'}`}
                            hover={{ scale: 1.05, borderColor: idx === 4 ? '#818cf8' : '#fbbf24', zIndex: 10 }}
                            tap={{ scale: 0.96 }}
                        >
                            {tier.special && (
                                <div className={`absolute top-0 right-0 ${idx === 4 ? 'bg-indigo-500' : 'bg-yellow-400'} text-black text-[8px] font-bold px-1 uppercase z-20`}>
                                    {tier.special}
                                </div>
                            )}

                            <div className="relative mb-3 sm:mb-4 h-24 sm:h-28 flex items-center justify-center">
                                <div className={`badge-container relative w-20 h-20 sm:w-24 sm:h-24 transition-all duration-500 ${idx === 4 ? 'animate-pulse-slow' : ''}`}>
                                    <Image
                                        src={tier.img}
                                        alt={tier.title}
                                        fill
                                        sizes="(max-width: 640px) 80px, 96px"
                                        className="drop-shadow-2xl filter brightness-110 mix-blend-screen object-contain"
                                    />
                                    <div className="absolute -bottom-8 left-0 right-0 h-full opacity-30 transform scale-y-[-0.5] mask-linear-gradient pointer-events-none">
                                        <Image src={tier.img} alt="" fill sizes="(max-width: 640px) 80px, 96px" className="mix-blend-screen object-contain" />
                                    </div>
                                </div>
                            </div>

                            <h3 className={`comic-title text-base sm:text-lg mb-1 ${tier.color} relative z-10`}>{tier.title}</h3>
                            <p className={`comic-body text-[10px] sm:text-xs uppercase font-bold tracking-tight ${idx === 4 ? 'text-indigo-300/60' : 'text-gray-500'} relative z-10`}>{tier.tier}</p>

                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay"></div>
                        </RevealItem>
                    ))}
                </div>
            </RevealContainer>
        </section>
    );
}
