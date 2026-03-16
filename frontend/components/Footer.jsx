import Link from 'next/link';
import { useScrollActions, scrollEasings } from '@/lib/smoothScroll';
import { useAuth } from '@/lib/auth';

export default function Footer() {
    const { scrollToElement } = useScrollActions();
    const { openFeedbackModal } = useAuth();

    const handleAnchorClick = (e, selector) => {
        e.preventDefault();
        scrollToElement(selector, {
            duration: 1.6,
            easing: scrollEasings.gentle,
        });
    };

    return (
        <footer className="relative w-full bg-gray-900 text-white py-8 sm:py-10 lg:py-12 2xl:py-16 px-4 sm:px-6 border-t-4 border-black">
            <div className="max-w-6xl 2xl:max-w-screen-2xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 2xl:gap-12 mb-6 sm:mb-8 2xl:mb-12">
                    <div>
                        <h3 className="comic-title text-xl sm:text-2xl 2xl:text-3xl mb-3 sm:mb-4 text-yellow-400">ZEROS BY KAI</h3>
                        <p className="comic-body text-sm sm:text-base 2xl:text-lg text-gray-400 leading-relaxed">
                            Startup opportunities mined from the chaos, curated by Kai every Monday.
                        </p>
                    </div>
                    <div>
                        <h4 className="comic-body font-bold mb-3 sm:mb-4 text-sm sm:text-base 2xl:text-lg text-white">LINKS</h4>
                        <ul className="space-y-2 comic-body text-sm sm:text-base 2xl:text-lg text-gray-400">
                            <li><a href="#ideas-section" onClick={(e) => handleAnchorClick(e, '#ideas-section')} className="hover:text-yellow-400 cursor-pointer transition-colors">This Week&apos;s Ideas</a></li>
                            <li><Link href="/archive" className="hover:text-yellow-400 transition-colors">Archive</Link></li>
                            <li><Link href="/story" className="hover:text-yellow-400 transition-colors">Kai&apos;s story</Link></li>
                            <li><Link href="/tools" className="hover:text-yellow-400 transition-colors">Secret Stash</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="comic-body font-bold mb-3 sm:mb-4 text-sm sm:text-base 2xl:text-lg text-white">CONNECT</h4>
                        <ul className="space-y-2 comic-body text-sm sm:text-base 2xl:text-lg text-gray-400">
                            <li><a href="mailto:kai@zerosbykai.com" className="hover:text-yellow-400 transition-colors">kai@zerosbykai.com</a></li>
                            <li><button onClick={openFeedbackModal} className="hover:text-yellow-400 transition-colors text-left">Feedback</button></li>
                            <li>
                                <div className="flex flex-row items-center gap-4 mt-6 overflow-x-auto no-scrollbar">
                                    <a
                                        href="https://foundrlist.com/product/zerosbykai"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:opacity-80 transition-opacity shrink-0"
                                    >
                                        <img
                                            src="https://foundrlist.com/api/badge/zerosbykai"
                                            alt="Live on FoundrList"
                                            width="180"
                                            height="72"
                                            className="h-auto w-24 sm:w-32"
                                        />
                                    </a>
                                    <a
                                        href="https://www.producthunt.com/products/zeros-by-kai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-zeros-by-kai"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:opacity-80 transition-opacity shrink-0"
                                    >
                                        <img
                                            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1078717&theme=dark&t=1773651973799"
                                            alt="Zeros By Kai - Real Problems. Real Startup Ideas. | Product Hunt"
                                            width="250"
                                            height="54"
                                            className="h-auto w-32 sm:w-40"
                                        />
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-6 sm:pt-8 2xl:pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 comic-body text-gray-500 text-xs sm:text-sm 2xl:text-base">
                    <p>&copy; 2026 Zeros By Kai. Find the right zero.</p>
                    <div className="flex gap-4 sm:gap-6">
                        <Link href="/terms" className="hover:text-yellow-400 underline transition-colors">Terms & Guidelines</Link>
                        <Link href="/privacy" className="hover:text-yellow-400 underline transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
