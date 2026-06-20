import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Crown } from 'lucide-react';
import api from '../../utils/api';
import useCourseStore from '../../store/courseStore';
import useGamificationStore, { AVATARS } from '../../store/gamificationStore';
import { io } from 'socket.io-client';

const RANK_STYLES = [
    { bg: 'from-amber-300 via-yellow-400 to-amber-500', text: 'text-amber-950', icon: <Crown size={14} className="animate-bounce" />, shadow: 'shadow-[0_4px_12px_rgba(245,158,11,0.45)]' },
    { bg: 'from-slate-200 via-slate-350 to-slate-400', text: 'text-slate-900', icon: <Medal size={13} />, shadow: 'shadow-[0_4px_10px_rgba(148,163,184,0.35)]' },
    { bg: 'from-orange-300 via-orange-400 to-amber-600', text: 'text-orange-950', icon: <Award size={13} />, shadow: 'shadow-[0_4px_10px_rgba(249,115,22,0.35)]' },
];

const MOCK_EMOJIS = ['🥷', '🦄', '🧠', '🎓', '🦊', '🦁'];

const Leaderboard = ({ courseId }) => {
    const [entries, setEntries] = useState([]);
    const [period, setPeriod] = useState('weekly');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const { user: currentUser } = useCourseStore();
    const { activeAvatar } = useGamificationStore();
    
    const currentUserEmoji = AVATARS.find(a => a.id === activeAvatar)?.emoji || '🎓';

    // Socket.io updates for real-time leaderboards
    useEffect(() => {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
        const socket = io(API_BASE_URL, {
            withCredentials: true
        });

        socket.on('leaderboard_update', (data) => {
            if (!courseId || data.courseId === courseId) {
                setRefreshKey(prev => prev + 1);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [courseId]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const endpoint = courseId
                    ? `/api/progress/course/${courseId}/leaderboard?period=${period}`
                    : `/api/progress/leaderboard?period=${period}`;
                const { data } = await api.get(endpoint);
                
                // Map avatars/emojis if not present
                const mapped = (data.leaderboard || []).map((e, idx) => ({
                    ...e,
                    avatar: e.isYou ? currentUserEmoji : (MOCK_EMOJIS[idx % MOCK_EMOJIS.length])
                }));
                setEntries(mapped);
            } catch {
                // Mock leaderboard when API not yet implemented
                setEntries([
                    { rank: 1, name: 'Alex K.', xp: 1850, avatar: '🥷', isYou: false },
                    { rank: 2, name: 'Sarah M.', xp: 1620, avatar: '🦄', isYou: false },
                    { rank: 3, name: 'David L.', xp: 1410, avatar: '🧠', isYou: false },
                    { rank: 4, name: 'You', xp: currentUser?.totalXP || 0, avatar: currentUserEmoji, isYou: true },
                    { rank: 5, name: 'Emma R.', xp: 980, avatar: '🦊', isYou: false },
                    { rank: 6, name: 'Tom B.', xp: 760, avatar: '🦁', isYou: false },
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboard();
    }, [courseId, period, currentUserEmoji, currentUser?.totalXP, refreshKey]);

    return (
        <div className="glass-card rounded-3xl p-3 sm:p-5 relative overflow-hidden group h-full flex flex-col" dir="rtl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-3 sm:mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Trophy size={16} className="text-amber-500 fill-amber-500/25" />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white">Leaderboard</h3>
                </div>
                {/* Period toggle */}
                <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-0.5 gap-0.5 border border-slate-200/50 dark:border-white/5">
                    {['weekly', 'monthly'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`text-[10px] font-black px-3 py-2.5 rounded-lg transition-all ${
                                period === p
                                    ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200/20 dark:border-white/5'
                                    : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60'
                            }`}
                        >
                            {p === 'weekly' ? 'Weekly' : 'Monthly'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Entries */}
            <div className="relative z-10 flex-1 space-y-2">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-12 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                        ))
                    ) : (
                        entries.map((entry, i) => {
                            const rankStyle = RANK_STYLES[entry.rank - 1] || null;
                            return (
                                <motion.div
                                    key={entry.name + entry.rank}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ delay: i * 0.04 }}
                                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border ${
                                        entry.isYou
                                            ? 'bg-gradient-to-l from-indigo-500/10 via-purple-500/10 to-transparent border-indigo-500/30 dark:border-indigo-400/40 shadow-md shadow-indigo-500/5'
                                            : 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-white/3 border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow'
                                    }`}
                                >
                                    {/* Rank badge / Medal */}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black border-b-2 shadow-sm transition-all duration-300 ${
                                        rankStyle
                                            ? `bg-gradient-to-br ${rankStyle.bg} ${rankStyle.text} border-black/10 ${rankStyle.shadow}`
                                            : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40'
                                    }`}>
                                        {rankStyle ? rankStyle.icon : entry.rank}
                                    </div>

                                    {/* Avatar Emoji */}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border transition-all duration-300 ${
                                        entry.isYou
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-600 shadow-md'
                                            : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/70 border-slate-200/60 dark:border-white/10 shadow-sm'
                                    }`}>
                                        {entry.avatar || '🎓'}
                                    </div>

                                    {/* Name */}
                                    <span className={`text-xs font-extrabold flex-1 truncate ${
                                        entry.isYou
                                            ? 'text-indigo-600 dark:text-indigo-400 font-black'
                                            : 'text-slate-800 dark:text-white/95'
                                    }`}>
                                        {entry.name}
                                        {entry.isYou && (
                                            <span className="mr-1.5 text-[9px] font-black text-white bg-indigo-500/80 dark:bg-indigo-500/90 px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-[0_2px_4px_rgba(99,102,241,0.2)]">
                                                You
                                            </span>
                                        )}
                                    </span>

                                    {/* XP Reward count */}
                                    <div className="flex items-center gap-1 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 dark:border-emerald-500/20 px-2 py-1 rounded-xl text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                        <TrendingUp size={11} className="text-emerald-500" />
                                        <span>{entry.xp.toLocaleString()} XP</span>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Leaderboard;
