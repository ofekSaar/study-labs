import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, CheckCircle2, Trophy } from 'lucide-react';
import useGamificationStore from '../../store/gamificationStore';

const DailyChallengeCard = () => {
    const { dailyChallenge, dailyChallengeCompleted, generateDailyChallenge } = useGamificationStore();
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        generateDailyChallenge();
    }, [generateDailyChallenge]);

    // Countdown to midnight
    useEffect(() => {
        const update = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - now;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!dailyChallenge) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card rounded-3xl p-3 sm:p-5 relative overflow-hidden group transition-all ${
                dailyChallengeCompleted ? 'opacity-75' : ''
            }`}
        >
            {/* Background glow */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                dailyChallengeCompleted
                    ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 opacity-100'
                    : 'bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100'
            }`} />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${
                            dailyChallengeCompleted ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                        }`}>
                            {dailyChallengeCompleted ? '✅' : dailyChallenge.icon}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">
                            Daily Challenge
                        </p>
                    </div>
                    {!dailyChallengeCompleted && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                            <Clock size={10} />
                            <span>{timeLeft}</span>
                        </div>
                    )}
                    {dailyChallengeCompleted && (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                    )}
                </div>

                {/* Challenge text */}
                <p className={`font-bold text-sm mb-3 ${
                    dailyChallengeCompleted
                        ? 'text-slate-400 dark:text-white/40 line-through'
                        : 'text-slate-800 dark:text-white'
                }`}>
                    {dailyChallenge.title}
                </p>

                {/* XP reward */}
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl border ${
                        dailyChallengeCompleted
                            ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                    }`}>
                        <Zap size={12} fill="currentColor" />
                        +{dailyChallenge.xp} XP
                    </div>
                    {dailyChallengeCompleted && (
                        <span className="text-xs text-emerald-500 font-bold">Completed!</span>
                    )}
                </div>

                {/* Progress bar for non-completed */}
                {!dailyChallengeCompleted && (
                    <div className="mt-3">
                        <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '40%' }}
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                            />
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default DailyChallengeCard;
