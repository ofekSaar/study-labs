import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal, Award, TrendingUp, Zap, Users, BookOpen } from 'lucide-react';
import api from '../utils/api';
import AvatarDisplay from '../components/instructor/AvatarDisplay';
import useCourseStore from '../store/courseStore';
import useGamificationStore, { AVATARS } from '../store/gamificationStore';
import { io } from 'socket.io-client';

const RANK_STYLES = [
    {
        bg: 'from-amber-300 via-yellow-400 to-amber-500',
        text: 'text-amber-950',
        icon: <Crown size={14} className="animate-bounce" />,
        shadow: 'shadow-[0_4px_12px_rgba(245,158,11,0.45)]',
    },
    {
        bg: 'from-slate-200 via-slate-350 to-slate-400',
        text: 'text-slate-900',
        icon: <Medal size={13} />,
        shadow: 'shadow-[0_4px_10px_rgba(148,163,184,0.35)]',
    },
    {
        bg: 'from-orange-300 via-orange-400 to-amber-600',
        text: 'text-orange-950',
        icon: <Award size={13} />,
        shadow: 'shadow-[0_4px_10px_rgba(249,115,22,0.35)]',
    },
];

const PERIODS = [
    { id: 'weekly', label: 'This Week' },
    { id: 'monthly', label: 'This Month' },
    { id: 'allTime', label: 'All Time' },
];

const LeaderboardEntry = ({ entry, index }) => {
    const rankStyle = RANK_STYLES[entry.rank - 1] || null;
    return (
        <motion.div
            key={entry.name + entry.rank}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.035 }}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] ${
                entry.isYou
                    ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/8 to-transparent border-indigo-500/30 dark:border-indigo-400/40 shadow-md shadow-indigo-500/10'
                    : 'bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/8 border-slate-200/60 dark:border-white/8 shadow-sm hover:shadow'
            }`}
        >
            {/* Rank */}
            <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-black border-b-2 shadow transition-all ${
                    rankStyle
                        ? `bg-gradient-to-br ${rankStyle.bg} ${rankStyle.text} border-black/10 ${rankStyle.shadow}`
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40'
                }`}
            >
                {rankStyle ? rankStyle.icon : `#${entry.rank}`}
            </div>

            {/* Avatar — real profile picture, emoji, or initial */}
            <AvatarDisplay avatar={entry.avatar} name={entry.name} size="w-11 h-11" />

            {/* Name + You badge */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={`text-sm font-extrabold truncate ${
                            entry.isYou
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-800 dark:text-white/95'
                        }`}
                    >
                        {entry.name}
                    </span>
                    {entry.isYou && (
                        <span className="text-[9px] font-black text-white bg-indigo-500 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                            You
                        </span>
                    )}
                </div>
                {entry.level && (
                    <p className="text-[10px] text-slate-400 dark:text-white/35 font-medium mt-0.5">
                        Level {entry.level}
                    </p>
                )}
            </div>

            {/* XP */}
            <div className="flex items-center gap-1.5 bg-emerald-500/8 dark:bg-emerald-500/12 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex-shrink-0">
                <TrendingUp size={12} className="text-emerald-500" />
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    {entry.xp.toLocaleString()} XP
                </span>
            </div>
        </motion.div>
    );
};

const LeaderboardPage = () => {
    const [globalEntries, setGlobalEntries] = useState([]);
    const [period, setPeriod] = useState('weekly');
    const [activeTab, setActiveTab] = useState('global');
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [courseEntries, setCourseEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const { courses } = useCourseStore();
    const { activeAvatar } = useGamificationStore();

    const currentUserEmoji = AVATARS.find((a) => a.id === activeAvatar)?.emoji || '🎓';
    const enrolledCourses = (courses || []).filter(
        (c) => c.generationStatus === 'ready' || c.nodes?.length > 0
    );

    useEffect(() => {
        if (enrolledCourses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(enrolledCourses[0].id || enrolledCourses[0]._id);
        }
    }, [enrolledCourses.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Real-time leaderboard updates
    useEffect(() => {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
        const token = localStorage.getItem('studylabs_token');
        const socket = io(API_BASE_URL, { withCredentials: true, auth: { token } });
        socket.on('leaderboard_update', () => setRefreshKey((prev) => prev + 1));
        return () => socket.disconnect();
    }, []);

    // Fetch global leaderboard
    useEffect(() => {
        const fetchGlobal = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get(`/api/progress/leaderboard?period=${period}`);
                setGlobalEntries(
                    (data.leaderboard || []).map((e) => ({
                        ...e,
                        avatar: e.isYou ? currentUserEmoji : e.avatar,
                    }))
                );
            } catch {
                setGlobalEntries([]);
            } finally {
                setIsLoading(false);
            }
        };
        if (activeTab === 'global') fetchGlobal();
    }, [period, activeTab, currentUserEmoji, refreshKey]);

    // Fetch course leaderboard
    useEffect(() => {
        if (activeTab !== 'course' || !selectedCourseId) return;
        const fetchCourse = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get(
                    `/api/progress/course/${selectedCourseId}/leaderboard?period=${period}`
                );
                setCourseEntries(
                    (data.leaderboard || []).map((e) => ({
                        ...e,
                        avatar: e.isYou ? currentUserEmoji : e.avatar,
                    }))
                );
            } catch {
                setCourseEntries([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourse();
    }, [activeTab, selectedCourseId, period, currentUserEmoji, refreshKey]);

    const entries = activeTab === 'global' ? globalEntries : courseEntries;
    const myRank = entries.find((e) => e.isYou);

    return (
        <>
            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-50" />
                <div
                    className="absolute top-0 left-1/3 w-96 h-96 rounded-full pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                    }}
                />
            </div>

            <div className="relative z-[1] p-4 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
                {/* Header */}
                <header className="text-center">
                    <div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4"
                        style={{
                            background: 'linear-gradient(135deg, #F59E0B, #D97757)',
                            boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
                        }}
                    >
                        <Trophy size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-800 dark:text-white tracking-tight">
                        Leaderboard
                    </h1>
                    <p className="text-slate-500 dark:text-white/50 mt-1 font-medium">
                        See how you rank against your peers
                    </p>
                </header>

                {/* My Rank Banner */}
                {myRank && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden rounded-2xl p-4 border border-indigo-500/30 dark:border-indigo-400/25"
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(124,58,237,0.08) 100%)',
                        }}
                    >
                        <div
                            className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-30"
                            style={{
                                background:
                                    'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
                                filter: 'blur(20px)',
                                transform: 'translate(40%, -40%)',
                            }}
                        />
                        <div className="relative flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                                {currentUserEmoji}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                                    Your Rank
                                </p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">
                                    #{myRank.rank}
                                </p>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                                <Zap size={13} className="text-amber-500" />
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                    {myRank.xp.toLocaleString()} XP
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tabs: Global / Course */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('global')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all border ${
                            activeTab === 'global'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-amber-500/20 hover:text-amber-600'
                        }`}
                    >
                        <Users size={14} />
                        Global
                    </button>
                    {enrolledCourses.length > 0 && (
                        <button
                            onClick={() => setActiveTab('course')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all border ${
                                activeTab === 'course'
                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-indigo-500/20 hover:text-indigo-600'
                            }`}
                        >
                            <BookOpen size={14} />
                            By Course
                        </button>
                    )}
                </div>

                {/* Course selector (when tab = course) */}
                {activeTab === 'course' && enrolledCourses.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {enrolledCourses.map((course) => {
                            const cid = course.id || course._id;
                            return (
                                <button
                                    key={cid}
                                    onClick={() => setSelectedCourseId(cid)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                                        selectedCourseId === cid
                                            ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:border-indigo-500/20'
                                    }`}
                                >
                                    {course.title}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Period Toggle */}
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                        {entries.length} Players
                    </p>
                    <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1 gap-0.5 border border-slate-200/50 dark:border-white/8">
                        {PERIODS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                className={`text-[10px] font-black px-3 py-2 rounded-lg transition-all ${
                                    period === p.id
                                        ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                        : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Entries */}
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-[72px] rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse"
                                    style={{ animationDelay: `${i * 0.05}s` }}
                                />
                            ))
                        ) : entries.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-16 flex flex-col items-center gap-3 text-slate-400 dark:text-white/30"
                            >
                                <Trophy size={32} className="opacity-30" />
                                <p className="text-sm font-bold">No rankings yet</p>
                                <p className="text-[11px]">
                                    Complete lessons to earn XP and appear here!
                                </p>
                            </motion.div>
                        ) : (
                            entries.map((entry, i) => (
                                <LeaderboardEntry
                                    key={`${entry.name}-${entry.rank}`}
                                    entry={entry}
                                    index={i}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

export default LeaderboardPage;
