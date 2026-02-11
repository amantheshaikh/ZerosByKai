import Image from 'next/image';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { RevealContainer, RevealItem } from '@/components/animations/Reveal';

export default function HowItWorks() {
    return (
        <section className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 bg-white overflow-hidden">
            <RevealContainer className="max-w-6xl mx-auto" stagger={0.15} rootMargin="-100px 0px">
                <RevealItem type="slide" direction="up" spring="gentle" className="text-center mb-6 sm:mb-10">
                    <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-black">
                        HOW IT WORKS
                    </h2>
                </RevealItem>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                    <RevealItem type="slide" direction="up" spring="snappy" className="text-center group" hover={{ y: -8 }} tap={{ scale: 0.96 }}>
                        <div className="comic-panel p-3 sm:p-4 bg-yellow-100 mb-4 sm:mb-6 inline-block transform -rotate-2 group-hover:rotate-0 transition-transform">
                            <Image src="/icon-stash.png" alt="Weekly startup ideas delivered every Monday from internet noise" width={128} height={128} className="w-20 h-20 sm:w-32 sm:h-32 object-contain" />
                        </div>
                        <h3 className="comic-title text-xl sm:text-2xl mb-2 sm:mb-3 text-black">1. GET THE STASH</h3>
                        <p className="comic-body text-sm sm:text-base text-gray-700">
                            Every Monday: <span className="font-bold text-black">10 opportunities</span> scraped from the noise of the internet.
                            No fluff. No AI hallucinations. Just real problems people are screaming about.
                        </p>
                    </RevealItem>

                    <RevealItem type="slide" direction="up" spring="snappy" className="text-center group" hover={{ y: -8 }} tap={{ scale: 0.96 }}>
                        <div className="comic-panel p-3 sm:p-4 bg-blue-100 mb-4 sm:mb-6 inline-block transform rotate-2 group-hover:rotate-0 transition-transform">
                            <Image src="/icon-target.png" alt="Vote on validated startup ideas and pick the best business opportunity" width={128} height={128} className="w-20 h-20 sm:w-32 sm:h-32 object-contain" />
                        </div>
                        <h3 className="comic-title text-xl sm:text-2xl mb-2 sm:mb-3 text-black">2. PICK YOUR WINNER</h3>
                        <p className="comic-body text-sm sm:text-base text-gray-700">
                            <span className="font-bold text-black">One vote. One idea.</span> Which problem would you solve?
                            Which opportunity would you bet on? Make your call.
                        </p>
                    </RevealItem>

                    <RevealItem type="slide" direction="up" spring="snappy" className="text-center group sm:col-span-2 md:col-span-1" hover={{ y: -8 }} tap={{ scale: 0.96 }}>
                        <div className="comic-panel p-3 sm:p-4 bg-rose-100 mb-4 sm:mb-6 inline-block badge-shine transform -rotate-1 group-hover:rotate-0 transition-transform">
                            <Image src="/icon-trophy.png" alt="Earn badges for picking winning startup ideas" width={128} height={128} className="w-20 h-20 sm:w-32 sm:h-32 object-contain" />
                        </div>
                        <h3 className="comic-title text-xl sm:text-2xl mb-2 sm:mb-3 text-black">3. EARN YOUR BADGE</h3>
                        <p className="comic-body text-sm sm:text-base text-gray-700">
                            Pick the winning idea? <span className="font-bold text-black">Badge unlocked.</span> Level up your designation and prove you&apos;ve
                            got the nose for opportunities. Stack wins. Become a Unicorn Hunter.
                        </p>
                    </RevealItem>
                </div>
            </RevealContainer>
        </section>
    );
}
