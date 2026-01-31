import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-8 sm:py-10 lg:py-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
                    <div>
                        <h3 className="comic-title text-xl sm:text-2xl mb-3 sm:mb-4 text-yellow-400">ZEROSBYKAI</h3>
                        <p className="comic-body text-sm sm:text-base text-gray-400">
                            Startup opportunities from Reddit, curated by Kai every Monday.
                        </p>
                    </div>
                    <div>
                        <h4 className="comic-body font-bold mb-3 sm:mb-4 text-sm sm:text-base">LINKS</h4>
                        <ul className="space-y-2 comic-body text-sm sm:text-base text-gray-400">
                            <li><a href="#ideas-section" className="hover:text-yellow-400">This Week&apos;s Ideas</a></li>
                            <li><Link href="/archive" className="hover:text-yellow-400">Archive</Link></li>
                            <li><Link href="/story" className="hover:text-yellow-400">About Kai</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="comic-body font-bold mb-3 sm:mb-4 text-sm sm:text-base">CONNECT</h4>
                        <ul className="space-y-2 comic-body text-sm sm:text-base text-gray-400">
                            <li><a href="#" className="hover:text-yellow-400">Twitter</a></li>
                            <li><a href="#" className="hover:text-yellow-400">LinkedIn</a></li>
                            <li><a href="mailto:kai@zerosbykai.com" className="hover:text-yellow-400">kai@zerosbykai.com</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 comic-body text-gray-500 text-xs sm:text-sm">
                    <p>&copy; 2026 ZerosByKai. Find the right zero.</p>
                    <div className="flex gap-4 sm:gap-6">
                        <Link href="/terms" className="hover:text-yellow-400 underline">Terms & Guidelines</Link>
                        <Link href="/privacy" className="hover:text-yellow-400 underline">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
