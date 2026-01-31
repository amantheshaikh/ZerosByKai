import { useState } from 'react';
import { Award, Trophy, Medal, RotateCw } from 'lucide-react';

const Leaderboard = ({ winners }) => {
    // Track which card is flipped (by index)
    const [flippedIndex, setFlippedIndex] = useState(null);

    // Ensure we have at least 3 items to show the structure
    const topThree = [
        winners?.[0] || { name: 'Determining Winner...', votes: 0, category: 'N/A' },
        winners?.[1] || { name: 'Runner Up', votes: 0, category: 'N/A' },
        winners?.[2] || { name: 'Third Place', votes: 0, category: 'N/A' }
    ];

    // Rearrange for Podium Effect: 2nd (Left), 1st (Center/Top), 3rd (Right)
    const podiumOrder = [topThree[1], topThree[0], topThree[2]];

    const handleCardClick = (index) => {
        setFlippedIndex(flippedIndex === index ? null : index);
    };

    return (
        <section className="bg-gradient-to-r from-rose-700 to-rose-600 py-24 px-6 relative overflow-visible">
            <div className="absolute inset-0 halftone opacity-20 pointer-events-none"></div>

            <div className="relative max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-20 justify-center">
                    <Trophy className="w-12 h-12 text-yellow-300 transform -rotate-12" />
                    <h2 className="comic-title text-4xl md:text-5xl text-white tracking-wide drop-shadow-md text-center">
                        LAST WEEK&apos;S WINNERS
                    </h2>
                    <Trophy className="w-12 h-12 text-yellow-300 transform rotate-12" />
                </div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
                    {podiumOrder.map((winner, index) => {
                        let color, icon, cardHeight, orderClass, badge, scaleClass, marginTop;

                        if (index === 1) { // 1st Place (Center)
                            color = "bg-yellow-400";
                            cardHeight = 480;
                            orderClass = "order-1 md:order-2";
                            scaleClass = "";
                            marginTop = "mt-0";
                            icon = <Award className="w-16 h-16 text-yellow-600 mb-2" />;
                            badge = "🥇 GOLD FINDER";
                        } else if (index === 0) { // 2nd Place (Left)
                            color = "bg-gray-300";
                            cardHeight = 400;
                            orderClass = "order-2 md:order-1";
                            scaleClass = "md:scale-95";
                            marginTop = "md:mt-20"; // 80px offset to create podium effect
                            icon = <Medal className="w-12 h-12 text-gray-600 mb-2" />;
                            badge = "🥈 SILVER FINDER";
                        } else { // 3rd Place (Right)
                            color = "bg-orange-300";
                            cardHeight = 400;
                            orderClass = "order-3 md:order-3";
                            scaleClass = "md:scale-95";
                            marginTop = "md:mt-20"; // 80px offset to create podium effect
                            icon = <Medal className="w-12 h-12 text-orange-700 mb-2" />;
                            badge = "🥉 BRONZE FINDER";
                        }

                        const isFlipped = flippedIndex === index;

                        return (
                            <div
                                key={index}
                                className={`${orderClass} ${scaleClass} ${marginTop}`}
                                style={{
                                    perspective: '1000px',
                                    height: `${cardHeight}px`
                                }}
                            >
                                {/* Card Container - this is the element that flips */}
                                <div
                                    onClick={() => handleCardClick(index)}
                                    className="cursor-pointer"
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                        transformStyle: 'preserve-3d',
                                        transformOrigin: 'center center',
                                        transition: 'transform 0.6s',
                                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                        zIndex: isFlipped ? 10 : 1
                                    }}
                                >
                                    {/* --- FRONT SIDE --- */}
                                    <div
                                        className="flex flex-col comic-panel p-6 bg-white shadow-2xl"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden'
                                        }}
                                    >
                                        {/* Rank Badge */}
                                        <div className={`absolute -top-4 inset-x-0 mx-auto w-max px-4 py-1 border-2 border-black ${color} comic-title text-black text-sm uppercase tracking-wider shadow-sm transform -rotate-1`}>
                                            {badge}
                                        </div>

                                        {/* Content */}
                                        <div className="mt-8 flex-1 text-center flex flex-col items-center">
                                            <div className={`p-3 rounded-full border-2 border-black ${color.replace('300', '100').replace('400', '200')} mb-3`}>
                                                {icon}
                                            </div>

                                            <div className="inline-block px-2 py-1 bg-gray-100 border border-gray-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                                                {winner.category}
                                            </div>

                                            <h3 className="comic-title text-xl md:text-2xl mb-3 leading-tight line-clamp-3">
                                                {winner.name}
                                            </h3>

                                            {winner.title && (
                                                <p className="comic-body text-sm text-gray-600 mb-4 line-clamp-3">
                                                    {winner.title}
                                                </p>
                                            )}

                                            <div className="mt-auto border-t-2 border-dashed border-gray-300 pt-4 w-full">
                                                <div className="comic-title text-3xl text-rose-700">
                                                    {winner.votes}
                                                </div>
                                                <div className="comic-body text-xs font-bold text-gray-500 uppercase">
                                                    VOTES
                                                </div>
                                                <div className="mt-3 text-xs text-gray-400 flex items-center justify-center gap-1">
                                                    <RotateCw className="w-3 h-3" /> Tap to flip
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- BACK SIDE --- */}
                                    <div
                                        className="comic-panel p-6 bg-white shadow-2xl flex flex-col"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden',
                                            transform: 'rotateY(180deg)'
                                        }}
                                    >
                                        <div className={`absolute -top-4 inset-x-0 mx-auto w-max px-4 py-1 border-2 border-black ${color} comic-title text-black text-sm uppercase tracking-wider shadow-sm transform -rotate-1 z-10`}>
                                            THE DETAILS
                                        </div>

                                        <div className="mt-6 flex-1 text-left space-y-4 overflow-y-auto min-h-0 pr-1">
                                            {/* Problem */}
                                            <div className="bg-rose-50 p-3 border-2 border-black relative mt-2">
                                                <div className="absolute -top-2 left-2 bg-black text-white text-[9px] font-bold px-1.5 uppercase">THE PROBLEM</div>
                                                <p className="comic-body text-xs leading-relaxed text-gray-900 mt-1">
                                                    {winner.problem || "No problem description available."}
                                                </p>
                                            </div>

                                            {/* Solution */}
                                            <div className="bg-green-50 p-3 border-2 border-black relative">
                                                <div className="absolute -top-2 left-2 bg-black text-white text-[9px] font-bold px-1.5 uppercase">THE FIX</div>
                                                <p className="comic-body text-xs leading-relaxed text-gray-900 mt-1">
                                                    {winner.solution || "No solution description available."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2 text-center shrink-0">
                                            <div className="text-xs text-gray-400 flex items-center justify-center gap-1 cursor-pointer hover:text-gray-600">
                                                <RotateCw className="w-3 h-3" /> Tap to flip back
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Leaderboard;
