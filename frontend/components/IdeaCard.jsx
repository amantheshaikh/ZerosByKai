// No icons needed for static view
const ensureTrailingPeriod = (text) => {
    if (!text) return '';
    const trimmed = text.trim();
    if (/[.?!…\u2026]$/u.test(trimmed)) return trimmed;
    return `${trimmed}.`;
};

export default function IdeaCard({ idea, index, isUserPick, btnProps, votingIdeaId, onVote }) {
    return (
        <div
            className={`w-full relative group mb-6 transition-all ${isUserPick ? 'z-20' : 'z-10'}`}
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            {/* Main Panel */}
            <div className={`comic-panel bg-white comic-shadow relative overflow-hidden transition-all duration-300 ${isUserPick ? 'ring-4 ring-yellow-400' : ''}`}>

                {/* Content Section */}
                <div className="p-3 sm:p-4 pb-2">
                    {/* Header: Horizontal Index + Info */}
                    <div className="flex items-start gap-4 mb-3">
                        {/* Index Number */}
                        <div className="w-10 h-10 bg-black text-yellow-400 flex items-center justify-center comic-title text-xl border-2 border-black rotate-[-2deg] flex-shrink-0 mt-0.5">
                            #{index + 1}
                        </div>

                        {/* Name & One-liner */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                <h3 className="comic-title text-2xl leading-tight text-gray-900 italic tracking-tight uppercase pr-2">
                                    {idea.name}
                                </h3>
                                {isUserPick && (
                                    <div className="bg-yellow-400 border-2 border-black px-2 py-0.5 comic-title text-[9px] transform -rotate-1 whitespace-nowrap">
                                        ✓ YOUR PICK
                                    </div>
                                )}
                            </div>
                            <p className="comic-body text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-[0.12em] leading-tight">
                                {idea.title}
                            </p>
                        </div>
                    </div>

                    {/* Problem Card */}
                    <div className="mb-4">
                        <DetailSection
                            title="THE PROBLEM"
                            content={idea.problem}
                            bgColor="bg-[#FFF1F2]"
                        />
                    </div>

                    {/* Fix Card */}
                    <div className="mb-4">
                        <DetailSection
                            title="THE FIX"
                            content={idea.solution}
                            bgColor="bg-[#F0FDF4]"
                        />
                    </div>

                    {/* Target & Market */}
                    <div className="flex flex-col gap-3 px-1 mb-4">
                        <div>
                            <h4 className="comic-body text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 opacity-60">
                                MARKET POTENTIAL
                            </h4>
                            <p className="comic-body text-xs sm:text-[13px] font-bold text-rose-700 leading-snug">
                                {ensureTrailingPeriod(idea.why_it_matters || idea.why)}
                            </p>
                        </div>

                        <div>
                            <h4 className="comic-body text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 opacity-60">
                                TARGET AUDIENCE
                            </h4>
                            <p className="comic-body text-xs sm:text-[13px] font-bold text-black leading-snug">
                                {ensureTrailingPeriod(idea.target)}
                            </p>
                        </div>
                    </div>

                    {/* Action Bar - Static Footer */}
                    <div className="flex items-center justify-between gap-4 py-2 border-t-2 border-gray-100 border-dashed">
                        {/* Tags - Multi-row Wrap */}
                        <div className="flex flex-wrap gap-2 items-center flex-1">
                            {(idea.tagsList || []).slice(0, 4).map((t, i) => (
                                <span
                                    key={i}
                                    className={`px-2 py-0.5 comic-body font-bold text-[10px] border-2 border-black comic-shadow-sm transition-transform hover:-translate-y-0.5 ${i === 0 ? 'bg-cyan-300' : i === 1 ? 'bg-yellow-300' : i === 2 ? 'bg-rose-300' : 'bg-green-300'
                                        }`}
                                >
                                    {t.toUpperCase()}
                                </span>
                            ))}
                        </div>

                        {/* Vote Button */}
                        <div className="flex-shrink-0">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onVote(idea.id);
                                }}
                                disabled={votingIdeaId === idea.id}
                                className={`px-4 py-1.5 comic-title text-xs sm:text-sm border-2 border-black comic-shadow-sm transition-transform active:translate-y-1 italic ${btnProps?.style ?? ''}`}
                            >
                                {votingIdeaId === idea.id ? 'VOTE...' : (btnProps?.label || 'VOTE FOR THIS')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailSection({ title, content, bgColor }) {
    return (
        <div className={`p-3 border-2 border-black rounded-none relative h-full ${bgColor}`}>
            <div className={`absolute -top-2.5 left-3 bg-black text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest shadow-sm`}>
                {title}
            </div>
            <p className="comic-body text-[12px] sm:text-[13px] leading-relaxed text-gray-900 pt-0.5">
                {content}
            </p>
        </div>
    );
}
