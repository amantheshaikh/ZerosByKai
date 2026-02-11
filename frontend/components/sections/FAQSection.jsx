import AccordionItem from '@/components/AccordionItem';
import { faqSchema } from '@/data/sampleData';

export default function FAQSection() {
    return (
        <section className="bg-black py-6 sm:py-8 lg:py-10 px-4 sm:px-6 relative overflow-hidden border-t-4 border-b-4 border-black">
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 10px, transparent 10px, transparent 20px)' }}>
            </div>

            <div className="relative max-w-6xl 2xl:max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Column: Header & Intro */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 text-center lg:text-left mb-8 lg:mb-0">
                        <div className="comic-panel inline-block bg-yellow-400 p-3 sm:p-4 transform -rotate-2 mb-4 sm:mb-6 border-2 sm:border-4 border-white comic-shadow-white">
                            <h2 className="comic-title text-base sm:text-lg md:text-xl text-black uppercase tracking-widest">
                                ❓ FAQ
                            </h2>
                        </div>
                        <h3 className="comic-title text-2xl sm:text-3xl md:text-4xl text-white mb-4 leading-none">
                            GOT QUESTIONS?
                        </h3>
                        <p className="comic-body text-white text-base sm:text-lg mb-6 leading-relaxed opacity-90">
                            Everything you need to know about finding your next MILLION-DOLLAR idea.
                        </p>
                        <div className="hidden lg:block border-t-2 border-white/20 pt-6 mt-6">
                            <p className="comic-title text-base sm:text-lg text-yellow-400">
                                STILL CURIOUS? <br />STOP GUESSING. START BUILDING.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Accordion */}
                    <div className="lg:col-span-8 space-y-3">
                        {faqSchema.mainEntity.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                question={faq.name}
                                answer={faq.acceptedAnswer.text}
                                defaultOpen={false}
                            />
                        ))}

                        <div className="block lg:hidden mt-8 text-center border-t-2 border-white/20 pt-6">
                            <p className="comic-title text-sm sm:text-base text-yellow-400">
                                STILL CURIOUS? STOP GUESSING. START BUILDING.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
