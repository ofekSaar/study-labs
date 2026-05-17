import React, { useEffect } from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import RoadmapView from '../components/dashboard/RoadmapView';
import NodeDrawer from '../components/dashboard/NodeDrawer';
import useCourseStore from '../store/courseStore';
import useGamificationStore from '../store/gamificationStore';
import { Trophy, Flame, Zap, Award, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import DailyChallengeCard from '../components/gamification/DailyChallengeCard';
import StreakCalendar from '../components/gamification/StreakCalendar';
import Leaderboard from '../components/gamification/Leaderboard';
import LevelUpModal from '../components/gamification/LevelUpModal';
import ConfettiEffect from '../components/gamification/ConfettiEffect';

const Dashboard = () => {
    const { courses, fetchCourses, fetchStats, isLoading, user } = useCourseStore();
    const { logActivity, generateDailyChallenge } = useGamificationStore();

    useEffect(() => {
        fetchStats();
        fetchCourses();
        logActivity();
        generateDailyChallenge();
    }, []); // eslint-disable-line

    if (isLoading && courses.length === 0) {
        return (
            <StudentLayout title="Dashboard">
                <div className="flex justify-center p-20">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                </div>
            </StudentLayout>
        );
    }

    const level = user?.totalXP ? Math.floor(user.totalXP / 100) + 1 : 1;
    const progressToNextLevel = user?.totalXP ? (user.totalXP % 100) : 0;

    return (
        <StudentLayout title="Dashboard">
            {/* Global gamification overlays */}
            <ConfettiEffect />
            <LevelUpModal />

            {/* Ambient background orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative z-[1] p-4 lg:p-6 max-w-[1600px] mx-auto flex flex-col gap-6">
                {/* ── Header ── */}
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                    <div>
                        <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white drop-shadow-sm">
                            Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋
                        </h1>
                        <p className="text-indigo-600 dark:text-indigo-200 mt-1 font-medium">Ready to conquer your next challenge?</p>
                    </div>
                    {/* Quick XP badge */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2 shadow-sm">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                                {level}
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">Level</p>
                                <p className="text-xs font-black text-slate-800 dark:text-white">{user?.totalXP || 0} XP</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-1" />
                            <Flame size={16} className="text-orange-500 fill-orange-500/30" />
                            <span className="text-sm font-black text-orange-500">{user?.streak || 0}</span>
                        </div>
                    </div>
                </header>

                {/* ── Main bento grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Roadmap (8 cols) */}
                    <div className="lg:col-span-8 glass-card rounded-3xl shadow-lg flex flex-col overflow-hidden relative group/roadmap min-h-[480px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 pointer-events-none opacity-50 transition-opacity group-hover/roadmap:opacity-100 duration-1000" />
                        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-black/20 flex justify-between items-center z-10 backdrop-blur-md">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Target size={20} className="text-indigo-500 dark:text-indigo-400" />
                                Current Learning Path
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
                            <RoadmapView />
                        </div>
                    </div>

                    {/* Right column (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-5">

                        {/* ── Stats Tile ── */}
                        <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none" />
                            <h3 className="text-xs font-black text-slate-500 dark:text-white/50 uppercase tracking-widest mb-4">Your Progress</h3>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Level */}
                                <div className="bg-slate-100 dark:bg-black/40 rounded-2xl p-4 border border-slate-200/50 dark:border-white/5 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 duration-300 shadow-inner">
                                    <Trophy size={26} className="text-emerald-500 dark:text-emerald-400 mb-1.5 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]" />
                                    <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">{level}</div>
                                    <div className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mt-1">Level</div>
                                </div>
                                {/* Streak */}
                                <div className="bg-slate-100 dark:bg-black/40 rounded-2xl p-4 border border-slate-200/50 dark:border-white/5 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 duration-300 shadow-inner">
                                    <Flame size={26} className="text-orange-500 dark:text-orange-400 mb-1.5 drop-shadow-[0_0_12px_rgba(251,146,60,0.3)] fill-orange-500/20 dark:fill-orange-400/20" />
                                    <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">{user?.streak ?? 0}</div>
                                    <div className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mt-1">Day Streak</div>
                                </div>
                            </div>

                            {/* Animated XP Bar */}
                            <div className="mt-3 bg-slate-100 dark:bg-black/40 rounded-2xl p-4 border border-slate-200/50 dark:border-white/5 shadow-inner">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Zap size={16} className="text-indigo-500 dark:text-indigo-400 fill-indigo-500/20 dark:fill-indigo-400/20" />
                                        <span className="font-bold text-slate-900 dark:text-white text-sm">{user?.totalXP ?? 0} XP</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-white/40">{100 - progressToNextLevel} to next level</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressToNextLevel}%` }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                        {/* ── Daily Challenge ── */}
                        <DailyChallengeCard />

                    </div>
                </div>

                {/* ── Bottom row: Streak Calendar + Leaderboard + Achievements ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-10">

                    {/* Streak Calendar */}
                    <StreakCalendar />

                    {/* Leaderboard */}
                    <Leaderboard />

                    {/* Recent Achievements */}
                    <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
                        <h3 className="text-xs font-black text-slate-500 dark:text-white/50 uppercase tracking-widest mb-4">Recent Achievements</h3>

                        <div className="space-y-3">
                            {[
                                { icon: <Award size={20} className="text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30', title: 'First Steps', desc: 'Started your learning journey.' },
                                { icon: <Flame size={20} className="text-orange-600 dark:text-orange-400 fill-orange-500/20" />, bg: 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/20 dark:border-orange-500/30', title: 'On Fire', desc: 'Logged in for multiple days.' },
                            ].map((a, i) => (
                                <div key={i} className="flex items-center gap-4 bg-slate-100/50 dark:bg-black/20 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors group/badge cursor-default">
                                    <div className={`w-12 h-12 rounded-full ${a.bg} border flex items-center justify-center flex-shrink-0 group-hover/badge:scale-110 transition-transform`}>
                                        {a.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{a.title}</h4>
                                        <p className="text-[11px] text-slate-500 dark:text-white/50 leading-tight mt-0.5">{a.desc}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Locked */}
                            <div className="flex items-center gap-4 bg-slate-100/30 dark:bg-black/10 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 opacity-50 grayscale cursor-not-allowed">
                                <div className="w-12 h-12 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                                    <Trophy size={20} className="text-slate-400 dark:text-white/40" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 dark:text-white/60">Mastermind</h4>
                                    <p className="text-[11px] text-slate-400 dark:text-white/40 leading-tight mt-0.5">Reach Level 5 (Locked)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <NodeDrawer />
        </StudentLayout>
    );
};

export default Dashboard;
