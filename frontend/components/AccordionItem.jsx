import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const accordionVariants = {
    open: { opacity: 1, height: "auto" },
    collapsed: { opacity: 0, height: 0 }
};

export default function AccordionItem({ question, answer, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="comic-panel bg-white overflow-hidden comic-shadow hover:scale-[1.01] transition-transform duration-200 border-2 border-black">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 bg-white hover:bg-yellow-50 transition-colors"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3 pr-4">
                    <span className="text-xl sm:text-2xl font-bold text-yellow-500">Q.</span>
                    <span className="comic-title text-base sm:text-lg text-black leading-tight">{question}</span>
                </div>
                {isOpen ?
                    <Minus className="w-5 h-5 flex-shrink-0 text-gray-400" /> :
                    <Plus className="w-5 h-5 flex-shrink-0 text-black transform hover:rotate-90 transition-transform duration-300" />
                }
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={accordionVariants}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        <div className="px-5 pb-5 pl-12 sm:pl-14">
                            <div className="comic-body text-sm sm:text-base text-gray-700 border-l-4 border-yellow-400 pl-4 py-1 leading-relaxed">
                                {answer}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
