import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Star, Play, Trophy, Zap } from 'lucide-react';

const RoadmapNode = ({ node, onClick, alignment, isSelected }) => {
    const isCompleted = node.status === 'completed';
    const isCurrent = node.status === 'current';
    const isLocked = node.status === 'locked';

    // Node Variant Styles
    const getNodeStyles = () => {
        if (isCompleted) return 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white';
        if (isCurrent) return 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110 z-10 text-white';
        return 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20';
    };

    return (
        <div className="relative group flex flex-col items-center">
            {/* Connection line helpers */}
            {isCurrent && (
                <div className="absolute inset-0 -m-1.5 rounded-full bg-indigo-500/25 animate-ping pointer-events-none" />
            )}

            {/* Text Label - Absolute relative to the button center */}
            <div
                className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-56 transition-all duration-300 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-md ${
                    isSelected ? 'opacity-0 scale-95' : 'opacity-100 scale-100 group-hover:scale-[1.03]'
                } ${alignment === 'left' 
                    ? 'right-full mr-8 text-right group-hover:-translate-x-1' 
                    : 'left-full ml-8 text-left group-hover:translate-x-1'
                }`}
            >
                <h3 className={`font-black text-xs tracking-wider leading-relaxed transition-colors ${
                    isLocked 
                        ? 'text-slate-400 dark:text-white/20' 
                        : 'text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                }`}>
                    {node.title}
                </h3>
                <p className={`text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1.5 flex items-center gap-1 ${
                    alignment === 'left' ? 'justify-end' : 'justify-start'
                }`}>
                    {node.type === 'quiz' ? 'Quiz 📝' : node.type === 'exam' ? 'Exam 🏆' : 'Lesson 📖'}
                </p>
            </div>

            {/* The Node Itself */}
            <motion.button
                whileHover={!isLocked ? { scale: 1.15 } : {}}
                whileTap={!isLocked ? { scale: 0.95 } : {}}
                onClick={!isLocked ? onClick : undefined}
                className={`
                    relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-b-4 flex items-center justify-center transition-all duration-300 z-20
                    ${getNodeStyles()}
                `}
            >
                {/* Icon inside Node */}
                {isCompleted && <Check className="w-7 h-7 font-black" strokeWidth={4} />}
                {isLocked && <Lock className="w-6 h-6" />}
                {isCurrent && <Play className="w-6 h-6 fill-white ml-0.5" />}

                {/* Score Badge (if completed) */}
                {isCompleted && (() => {
                    const qs = node.quizScore;
                    if (qs && qs.totalAnswerable > 0) {
                        const pct = Math.round((qs.correctCount / qs.totalAnswerable) * 100);
                        const color = pct >= 70
                            ? 'text-emerald-500 border-emerald-200 dark:border-emerald-500/30'
                            : 'text-red-400 border-red-200 dark:border-red-500/30';
                        return (
                            <div className={`absolute -top-3.5 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full shadow-md border scale-90 font-black text-[9px] ${color}`}>
                                {qs.correctCount}/{qs.totalAnswerable}
                            </div>
                        );
                    }
                    return (
                        <div className="absolute -top-3.5 flex gap-0.5 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-full shadow-md border border-slate-100 dark:border-white/5 scale-90">
                            {[1, 2, 3].map(i => (
                                <Star key={i} size={8} className="fill-amber-400 text-amber-500" />
                            ))}
                        </div>
                    );
                })()}

                {/* XP Reward Badge */}
                {!isCompleted && !isLocked && (
                    <span className="absolute -bottom-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_8px_rgba(99,102,241,0.4)]">
                        +{node.xpReward || 150} XP
                    </span>
                )}
            </motion.button>

            {/* Mobile Title (Below Node) */}
            <div className="md:hidden absolute top-20 text-center max-w-[8rem] w-[40vw]">
                <h3 className={`font-black text-xs uppercase tracking-wider leading-tight ${
                    isLocked ? 'text-slate-400 dark:text-white/20' : 'text-slate-800 dark:text-white'
                }`}>
                    {node.title}
                </h3>
            </div>
        </div>
    );
};

export default RoadmapNode;
