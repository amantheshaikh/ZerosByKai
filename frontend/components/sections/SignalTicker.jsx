import { LIVE_SIGNAL_SOURCES } from '@/data/sampleData';

export default function SignalTicker() {
    return (
        <div className="bg-black py-4 border-y-4 border-black overflow-hidden relative flex items-center">
            <div className="absolute left-0 top-0 bottom-0 bg-black z-20 flex items-center px-4 sm:px-8 shadow-[10px_0_15px_rgba(0,0,0,0.9)] border-r border-yellow-400/20">
                <span className="comic-title text-sm sm:text-base tracking-widest whitespace-nowrap text-yellow-400 opacity-90">⚡ LIVE SIGNAL FEEDS:</span>
            </div>

            <div className="flex overflow-hidden">
                <div className="flex gap-12 sm:gap-24 items-center animate-marquee whitespace-nowrap pl-48 sm:pl-64">
                    {[0, 1, 2].map((repeatIdx) => (
                        <div key={repeatIdx} className="flex gap-12 sm:gap-24 comic-body text-[11px] sm:text-sm font-bold text-white tracking-widest uppercase items-center">
                            {LIVE_SIGNAL_SOURCES.map((source, idx) => (
                                <span key={source} className="flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                                        style={{ animationDelay: `${idx * 75}ms` }}
                                    ></span>
                                    {source}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
