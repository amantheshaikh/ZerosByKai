import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import IdeaCard from './IdeaCard';

export default function IdeaCarousel({
    ideas,
    user,
    isRealData,
    userVote,
    votingIdeaId,
    onVote,
    getVoteButtonProps
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const paginate = useCallback((newDirection) => {
        if (!ideas || ideas.length === 0) return;
        setDirection(newDirection);
        setCurrentIndex((prevIndex) => (prevIndex + newDirection + ideas.length) % ideas.length);
    }, [ideas?.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') paginate(-1);
            if (e.key === 'ArrowRight') paginate(1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [paginate]);

    if (!ideas || ideas.length === 0) return null;

    const getCardIndex = (offset) => {
        return (currentIndex + offset + ideas.length) % ideas.length;
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.8,
            filter: 'blur(4px)',
        }),
        center: {
            zIndex: 10,
            x: 0,
            opacity: 1,
            scale: 0.9,
            filter: 'blur(0px)',
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.8,
            filter: 'blur(4px)',
        }),
        left: {
            zIndex: 5,
            x: isMobile ? -140 : -240,
            opacity: 0.4,
            scale: isMobile ? 0.65 : 0.75,
            filter: 'blur(2px)',
        },
        right: {
            zIndex: 5,
            x: isMobile ? 140 : 240,
            opacity: 0.4,
            scale: isMobile ? 0.65 : 0.75,
            filter: 'blur(2px)',
        }
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset, velocity) => {
        return Math.abs(offset) * velocity;
    };

    const cardData = [
        { id: 'left', index: getCardIndex(-1), position: 'left' },
        { id: 'center', index: currentIndex, position: 'center' },
        { id: 'right', index: getCardIndex(1), position: 'right' }
    ];

    return (
        <div className="relative w-full max-w-5xl mx-auto px-4 py-4 overflow-visible">
            <div className="relative h-[600px] sm:h-[500px] flex items-center justify-center">
                <AnimatePresence initial={false} custom={direction}>
                    {cardData.map((card) => {
                        const idea = ideas[card.index];
                        const controls = useDragControls();

                        return (
                            <motion.div
                                key={`${card.index}-${card.id}`}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate={card.position}
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 },
                                    filter: { duration: 0.2 },
                                    scale: { duration: 0.2 }
                                }}
                                {...(card.position === 'center' && {
                                    drag: "x",
                                    dragControls: controls,
                                    dragListener: false,
                                    dragConstraints: { left: 0, right: 0 },
                                    dragElastic: 1,
                                    onDragEnd: (e, { offset, velocity }) => {
                                        const swipe = swipePower(offset.x, velocity.x);
                                        if (swipe < -swipeConfidenceThreshold) {
                                            paginate(1);
                                        } else if (swipe > swipeConfidenceThreshold) {
                                            paginate(-1);
                                        }
                                    }
                                })}
                                className="absolute w-full max-w-sm sm:max-w-md lg:max-w-lg cursor-default"
                                style={{ userSelect: 'text' }}
                            >
                                <IdeaCard
                                    idea={idea}
                                    index={card.index}
                                    isUserPick={user && isRealData && userVote === idea.id}
                                    btnProps={getVoteButtonProps(idea.id)}
                                    votingIdeaId={votingIdeaId}
                                    onVote={onVote}
                                    dragControls={controls}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="flex flex-col items-center mt-2 gap-6">
                {/* Dots / Progress */}
                <div className="flex gap-2">
                    {ideas.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setDirection(i > currentIndex ? 1 : -1);
                                setCurrentIndex(i);
                            }}
                            aria-label={`Go to slide ${i + 1}`}
                            className={`w-2.5 h-2.5 rounded-full border-2 border-black transition-all ${i === currentIndex ? 'bg-yellow-400 scale-110' : 'bg-white'
                                }`}
                        />
                    ))}
                </div>

                {/* Arrow Controls */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => paginate(-1)}
                        className="p-3 bg-white border-4 border-black comic-shadow hover:bg-yellow-100 transition-colors group active:translate-y-1"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="comic-panel px-4 py-1.5 bg-black text-yellow-400 border-2 border-black rotate-[-1deg]">
                        <span className="comic-title text-lg">
                            {currentIndex + 1} / {ideas.length}
                        </span>
                    </div>

                    <button
                        onClick={() => paginate(1)}
                        className="p-3 bg-white border-4 border-black comic-shadow hover:bg-yellow-100 transition-colors group active:translate-y-1"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <p className="comic-body text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                    Swipe or use arrows to shuffle
                </p>
            </div>
        </div>
    );
}
