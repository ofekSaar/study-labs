import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, ChevronUp } from 'lucide-react';
import useGamificationStore from '../../store/gamificationStore';

const LEVEL_TITLES = [
    '', 'Rookie', 'Scholar', 'Explorer', 'Achiever', 'Challenger',
    'Expert', 'Master', 'Grandmaster', 'Legend', 'Prodigy'
];

const LevelUpModal = () => {
    const { showLevelUp, newLevel, dismissLevelUp, setTriggerConfetti } = useGamificationStore();
    const panelRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (showLevelUp) {
            setTriggerConfetti('level_up');
            previousFocusRef.current = document.activeElement;
            // Focus the panel so keyboard users can immediately interact
            setTimeout(() => panelRef.current?.focus(), 50);
        } else if (previousFocusRef.current) {
            previousFocusRef.current.focus();
        }
    }, [showLevelUp, setTriggerConfetti]);

    // Esc to dismiss + focus trap
    useEffect(() => {
        if (!showLevelUp) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') { dismissLevelUp(); return; }
            if (e.key !== 'Tab') return;
            const focusable = panelRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable?.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [showLevelUp, dismissLevelUp]);

    const title = LEVEL_TITLES[Math.min(newLevel, LEVEL_TITLES.length - 1)] || 'Legend+';
    const xpForLevel = (newLevel - 1) * 100;
    const xpForNext = newLevel * 100;

    return (
        <AnimatePresence>
            {showLevelUp && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[900] flex items-center justify-center bg-black/70 backdrop-blur-md"
                    onClick={dismissLevelUp}
                >
                    <motion.div
                        ref={panelRef}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="levelup-title"
                        initial={{ scale: 0.5, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                        onClick={e => e.stopPropagation()}
                        className="relative w-full max-w-sm mx-4 text-center overflow-hidden max-h-[90vh] overflow-y-auto outline-none"
                    >
                        {/* Card background */}
                        <div className="relative bg-gradient-to-b from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-3xl p-5 sm:p-8 shadow-[0_0_80px_rgba(99,102,241,0.3)]">
                            {/* Animated rings */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute w-48 h-48 rounded-full border border-indigo-400/30"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                                    className="absolute w-64 h-64 rounded-full border border-purple-400/20"
                                />
                            </div>

                            {/* Badge */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 15 }}
                                className="relative mx-auto mb-4 sm:mb-6 w-20 h-20 sm:w-28 sm:h-28"
                            >
                                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.6)]">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0 rounded-full border-4 border-dashed border-white/20"
                                    />
                                    <span className="text-4xl sm:text-5xl font-black text-white z-10 relative">{newLevel}</span>
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-slate-900"
                                >
                                    <ChevronUp size={16} className="text-slate-900 font-black" strokeWidth={3} />
                                </motion.div>
                            </motion.div>

                            {/* Text */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-1">Level Up!</p>
                                <h2 id="levelup-title" className="text-3xl sm:text-4xl font-black text-white mb-1">Level {newLevel}</h2>
                                <p className="text-purple-300 text-lg font-bold mb-6">{title}</p>
                            </motion.div>

                            {/* XP bar showing new level progress */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mb-6"
                            >
                                <div className="flex justify-between text-xs text-white/50 font-bold mb-1.5">
                                    <span>{xpForLevel} XP</span>
                                    <span>{xpForNext} XP</span>
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '5%' }}
                                        transition={{ delay: 0.6, duration: 0.8 }}
                                        className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full relative"
                                    >
                                        <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
                                    </motion.div>
                                </div>
                                <p className="text-xs text-white/40 mt-1.5 font-medium">{xpForNext - xpForLevel} XP to next level</p>
                            </motion.div>

                            {/* Stars decoration */}
                            <div className="absolute top-4 left-4 text-yellow-400/60">
                                <motion.div animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                    <Star size={16} fill="currentColor" />
                                </motion.div>
                            </div>
                            <div className="absolute top-6 right-8 text-purple-400/60">
                                <motion.div animate={{ rotate: [0, -20, 20, 0], scale: [1, 1.3, 1] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}>
                                    <Star size={12} fill="currentColor" />
                                </motion.div>
                            </div>

                            {/* Button */}
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                onClick={dismissLevelUp}
                                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2"
                            >
                                <Zap size={18} fill="currentColor" />
                                Awesome! Keep going!
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LevelUpModal;
