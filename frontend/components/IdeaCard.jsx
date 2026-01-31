export default function IdeaCard({ idea, index, isUserPick, btnProps, votingIdeaId, onVote }) {
    return (
        <div
            className={`comic-panel bg-white hover:scale-[1.01] transition-all cursor-pointer comic-shadow flex flex-col h-full relative group ${isUserPick ? 'ring-4 ring-yellow-400' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            {/* YOUR PICK badge */}
            {isUserPick && (
                <div className="absolute -top-4 -left-4 bg-yellow-400 border-4 border-black px-4 py-1 comic-title transform -rotate-3 z-20 shadow-md text-sm text-black">
                    ✓ YOUR PICK
                </div>
            )}

            {/* Top Badge */}
            <div className="absolute -top-3 sm:-top-4 -right-3 sm:-right-4 bg-yellow-400 border-2 sm:border-4 border-black px-3 sm:px-4 py-1 comic-title text-sm sm:text-base transform rotate-3 z-10 shadow-md group-hover:rotate-6 transition-transform">
                IDEA #{index + 1}
            </div>

            <div className="p-5 sm:p-6 lg:p-8 flex-grow">
                {/* Header */}
                <div className="mb-4 sm:mb-6 border-b-4 border-gray-100 pb-4 sm:pb-6">
                    <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                        <span className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold bg-blue-50 border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)]">{idea.tag}</span>
                        <span className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold bg-purple-50 border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)]">{idea.category}</span>
                    </div>
                    <h3 className="comic-title text-2xl sm:text-3xl mb-2 leading-none">{idea.name}</h3>
                    <h4 className="comic-body font-bold text-gray-600 text-xs sm:text-sm bg-gray-100 inline-block px-2 py-1">{idea.title}</h4>
                </div>

                {/* Content Grid */}
                <div className="space-y-4 sm:space-y-5">
                    {/* Problem */}
                    <div className="bg-rose-50 p-3 sm:p-4 border-2 border-black rounded-none relative">
                        <div className="absolute -top-3 left-3 sm:left-4 bg-black text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">The Problem</div>
                        <p className="comic-body text-xs sm:text-sm leading-relaxed text-gray-900">{idea.problem}</p>
                    </div>

                    {/* Solution */}
                    <div className="bg-green-50 p-3 sm:p-4 border-2 border-black rounded-none relative">
                        <div className="absolute -top-3 left-3 sm:left-4 bg-black text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">The Fix</div>
                        <p className="comic-body text-xs sm:text-sm leading-relaxed text-gray-900">{idea.solution}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <div className="comic-body text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase mb-1">Target Audience</div>
                            <p className="comic-body text-xs font-bold text-gray-900">{idea.target}</p>
                        </div>
                        <div>
                            <div className="comic-body text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase mb-1">Market Potential</div>
                            <p className="comic-body text-xs font-bold text-rose-700">{idea.why_it_matters || idea.why}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vote Button - At Bottom */}
            <div className="p-4 bg-gray-50 border-t-4 border-black mt-auto">
                <button
                    onClick={() => onVote(idea.id)}
                    disabled={votingIdeaId === idea.id}
                    className="w-full relative group"
                >
                    <div className={`w-full py-3 transition-colors border-2 border-transparent ${btnProps.style} ${votingIdeaId === idea.id ? 'opacity-50' : ''}`}>
                        <span className="comic-title text-xl tracking-wider">
                            {votingIdeaId === idea.id ? 'VOTING...' : btnProps.label}
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
}
