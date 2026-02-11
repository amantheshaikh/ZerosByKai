import Reveal, { RevealContainer, RevealItem } from '@/components/animations/Reveal';
import RotatingText from '@/components/RotatingText';

export default function WhyKaiSection() {
    return (
        <section className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 relative overflow-hidden">
            <div className="absolute inset-0 halftone"></div>

            <div className="relative max-w-6xl 2xl:max-w-7xl mx-auto">
                <Reveal type="fade" delay={0} className="text-center mb-6 sm:mb-10">
                    <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-black drop-shadow-sm">
                        <div>This is for you, if you&apos;re a</div>
                        <div className="mt-4 flex justify-center">
                            <RotatingText
                                texts={['doer', 'builder', 'hustler', 'disruptor']}
                                mainClassName="bg-rose-700 text-white px-5 py-2 inline-flex font-bold uppercase tracking-widest text-xl sm:text-2xl md:text-3xl transform -rotate-2 comic-panel comic-shadow"
                                staggerFrom={"last"}
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "-120%", opacity: 0 }}
                                staggerDuration={0.025}
                                splitLevelClassName="overflow-hidden"
                                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                rotationInterval={2500}
                            />
                        </div>
                    </h2>
                </Reveal>

                <RevealContainer stagger={0.15} className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    <RevealItem
                        type="fade"
                        spring="gentle"
                        className="comic-panel p-5 sm:p-6 lg:p-8 bg-white md:-rotate-2 hover:rotate-0 hover:scale-[1.02] transition-transform duration-300 comic-shadow relative"
                    >
                        <div className="absolute -top-4 left-4 bg-blue-600 text-white border-2 border-black px-3 py-1 comic-title text-xs -rotate-2 uppercase tracking-wider">
                            FOR THE BUILDER
                        </div>
                        <div className="mt-4">
                            <h3 className="comic-title text-xl sm:text-2xl mb-3 leading-tight">
                                YOU&apos;VE GOT THE SKILLS.<br />
                                <span className="text-blue-600">YOU CAN SHIP.</span>
                            </h3>
                            <div className="border-l-4 border-blue-600 pl-4 mb-4">
                                <p className="comic-body text-sm text-gray-800">
                                    But you&apos;re stuck in <span className="font-bold bg-blue-100 px-1">analysis paralysis</span>,
                                    endlessly scrolling for that perfect idea while your competitor ships garbage and wins.
                                </p>
                            </div>
                            <div className="border-t-2 border-dashed border-gray-300 pt-4">
                                <p className="comic-title text-lg sm:text-xl text-blue-700 leading-tight">
                                    KAI FINDS THE 0.<br />
                                    YOU BUILD THE 1.
                                </p>
                            </div>
                        </div>
                    </RevealItem>

                    <RevealItem
                        type="fade"
                        spring="gentle"
                        className="comic-panel p-5 sm:p-6 lg:p-8 bg-white md:rotate-1 hover:rotate-0 hover:scale-[1.02] transition-transform duration-300 comic-shadow relative md:mt-8"
                    >
                        <div className="absolute -top-4 right-4 bg-purple-600 text-white border-2 border-black px-3 py-1 comic-title text-xs rotate-2 uppercase tracking-wider">
                            FOR THE VETERAN
                        </div>
                        <div className="mt-4">
                            <h3 className="comic-title text-xl sm:text-2xl mb-3 leading-tight">
                                YOU&apos;VE LAUNCHED BEFORE.<br />
                                <span className="text-purple-600">YOU KNOW THE GAME.</span>
                            </h3>
                            <div className="border-l-4 border-purple-600 pl-4 mb-4">
                                <p className="comic-body text-sm text-gray-800">
                                    But finding validated problems is brutal. <span className="font-bold bg-purple-100 px-1">The internet has gold buried</span> in millions of angry rants—if you know where to look.
                                </p>
                            </div>
                            <div className="border-t-2 border-dashed border-gray-300 pt-4">
                                <p className="comic-title text-lg sm:text-xl text-purple-700 leading-tight">
                                    KAI DOES THE DIGGING.<br />
                                    YOU DO THE BUILDING.
                                </p>
                            </div>
                        </div>
                    </RevealItem>

                    <RevealItem
                        type="fade"
                        spring="gentle"
                        className="comic-panel p-5 sm:p-6 lg:p-8 bg-white md:-rotate-1 hover:rotate-0 hover:scale-[1.02] transition-transform duration-300 comic-shadow relative"
                    >
                        <div className="absolute -top-4 left-4 bg-emerald-600 text-white border-2 border-black px-3 py-1 comic-title text-xs -rotate-2 uppercase tracking-wider">
                            FOR THE INVESTOR
                        </div>
                        <div className="mt-4">
                            <h3 className="comic-title text-xl sm:text-2xl mb-3 leading-tight">
                                YOU&apos;VE GOT THE CAPITAL.<br />
                                <span className="text-emerald-600">YOU NEED THE SIGNAL.</span>
                            </h3>
                            <div className="border-l-4 border-emerald-600 pl-4 mb-4">
                                <p className="comic-body text-sm text-gray-800">
                                    Tired of founders pitching <span className="font-bold bg-emerald-100 px-1">&quot;AI for dogs&quot;</span> and calling it revolutionary?
                                    You want opportunities backed by people begging to pay.
                                </p>
                            </div>
                            <div className="border-t-2 border-dashed border-gray-300 pt-4">
                                <p className="comic-title text-lg sm:text-xl text-emerald-700 leading-tight">
                                    KAI FILTERS THE NOISE.<br />
                                    YOU PLACE THE BETS.
                                </p>
                            </div>
                        </div>
                    </RevealItem>
                </RevealContainer>

                <Reveal type="scale" delay={0.4} spring="bouncy" className="mt-10 sm:mt-16 text-center">
                    <div className="inline-block p-4 sm:p-6 comic-shadow transform -rotate-1 border-3 border-black" style={{ background: '#000' }}>
                        <p className="comic-title text-xl sm:text-2xl lg:text-3xl text-yellow-400">
                            WHILE YOU&apos;RE BRAINSTORMING,<br />
                            <span className="text-white">SOMEONE&apos;S ALREADY BUILDING YOUR IDEA.</span>
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
