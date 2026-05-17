import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Crown } from 'lucide-react';
import api from '../../utils/api';
import useCourseStore from '../../store/courseStore';

const RANK_STYLES = [
    { bg: 'from-yellow-400 to-amber-500', text: 'text-amber-900', icon: <Crown size={12} />, shadow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]' },
    { bg: 'from-slate-300 to-slate-400', text: 'text-slate-700', icon: <Medal size={12} />, shadow: 'shadow-[0_0_8px_rgba(148,163,184,0.3)]' },
    { bg: 'from-orange-400 to-amber-600', text: 'text-orange-900', icon: <Award size={12} />, shadow: 'shadow-[0_0_8px_rgba(249,115,22,0.3)]' },
];

const Leaderboard = ({ courseId }) => {
    const [entries, setEntries] = useState([]);
    const [period, setPeriod] = useState('weekly');
    const [isLoading, setIsLoading] = useState(true);
    const { user: currentUser } = useCourseStore();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const endpoint = courseId
                    ? `/api/courses/${courseId}/leaderboard?period=${period}`
                    : `/api/progress/leaderboard?period=${period}`;
                const { data } = await api.get(endpoint);
                setEntries(data.leaderboard || []);
            } catch {
                // Mock leaderboard when API not yet implemented
                setEntries([
                    { rank: 1, name: 'Alex K.', xp: 1850, avatar: null, isYou: false },
                    { rank: 2, name: 'Sarah M.', xp: 1620, avatar: null, isYou: false },
                    { rank: 3, name: 'David L.', xp: 1410, avatar: null, isYou: false },
                    { rank: 4, name: 'You', xp: currentUser?.totalXP || 0, avatar: null, isYou: true },
                    { rank: 5, name: 'Emma R.', xp: 980, avatar: null, isYou: false },
                    { rank: 6, name: 'Tom B.', xp: 760, avatar: null, isYou: false },
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboard();
    }, [courseId, period]);

    return (
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden group h-full flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500 fill-amber-500/30" />
                    <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">
                        Leaderboard
                    </p>
                </div>
                {/* Period toggle */}
                <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-0.5 gap-0.5">
                    {['weekly', 'monthly'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg transition-all ${
                                period === p
                                    ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                    : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/50'
                            }`}
                        >
                            {p === 'weekly' ? 'Week' : 'Month'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Entries */}
            <div className="relative z-10 flex-1 space-y-2">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                    ))
                ) : (
                    entries.map((entry, i) => {
                        const rankStyle = RANK_STYLES[entry.rank - 1] || null;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all ${
                                    entry.isYou
                                        ? 'bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-400/30'
                                        : 'bg-slate-50 dark:bg-white/3 hover:bg-slate-100 dark:hover:bg-white/8 border border-transparent'
                                }`}
                            >
                                {/* Rank badge */}
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                                    rankStyle
                                        ? `bg-gradient-to-br ${rankStyle.bg} ${rankStyle.text} ${rankStyle.shadow}`
                                        : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'
                                }`}>
                                    {rankStyle ? rankStyle.icon : entry.rank}
                                </div>

                                {/* Avatar */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    entry.isYou
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                                        : 'bg-slate-200 dark:bg-white/15 text-slate-600 dark:text-white/70'
                                }`}>
                                    {entry.name.charAt(0)}
                                </div>

                                {/* Name */}
                                <span className={`text-xs font-bold flex-1 truncate ${
                                    entry.isYou
                                        ? 'text-indigo-600 dark:text-indigo-300'
                                        : 'text-slate-700 dark:text-white/80'
                                }`}>
                                    {entry.name}
                                    {entry.isYou && <span className="ml-1 text-[9px] font-black text-indigo-400 uppercase">(you)</span>}
                                </span>

                                {/* XP */}
                                <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 dark:text-white/40">
                                    <TrendingUp size={10} className="text-emerald-500" />
                                    <span>{entry.xp.toLocaleString()} XP</span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
