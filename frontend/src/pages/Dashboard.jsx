import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import StudentLayout from '../components/layout/StudentLayout';
import RoadmapView from '../components/dashboard/RoadmapView';
import NodeDrawer from '../components/dashboard/NodeDrawer';
import useCourseStore from '../store/courseStore';
import useGamificationStore from '../store/gamificationStore';
import { Trophy, Flame, Zap, Award, Target, BookOpen } from 'lucide-react';
import DailyChallengeCard from '../components/gamification/DailyChallengeCard';
import LevelUpModal from '../components/gamification/LevelUpModal';
import ConfettiEffect from '../components/gamification/ConfettiEffect';
import LeaguesPanel from '../components/gamification/LeaguesPanel';
import QuestPanel from '../components/gamification/QuestPanel';
import XPMultiplierBanner from '../components/gamification/XPMultiplierBanner';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';

const Dashboard = () => {
    const { courses, fetchCourses, fetchStats, isLoading, user, selectedCourseId } = useCourseStore();
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
                {/* Ambient background orbs visible during skeleton load */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 dot-grid opacity-60" />
                    <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                    <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                </div>
                <div className="relative z-[1] p-4 lg:p-6 max-w-[1600px] mx-auto flex flex-col gap-6">
                    {/* Header skeleton */}
                    <div className="flex justify-between items-center">
                        <LoadingSkeleton rows={2} heights={['h-8', 'h-4']} className="w-64" />
                        <div className="shimmer h-12 w-36 rounded-2xl" />
                    </div>
                    {/* Bento skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 glass-card rounded-3xl p-6 min-h-[480px]">
                            <LoadingSkeleton rows={6} heights={['h-5', 'h-4', 'h-4', 'h-4', 'h-4', 'h-4']} />
                        </div>
                        <div className="lg:col-span-4 flex flex-col gap-5">
                            <div className="glass-card rounded-3xl p-5">
                                <LoadingSkeleton rows={4} heights={['h-5', 'h-20', 'h-4', 'h-8']} />
                            </div>
                            <div className="glass-card rounded-3xl p-5">
                                <LoadingSkeleton rows={3} heights={['h-5', 'h-4', 'h-10']} />
                            </div>
                        </div>
                    </div>
                    {/* Quests skeleton */}
                    <div className="glass-card rounded-3xl p-5">
                        <LoadingSkeleton rows={4} heights={['h-5', 'h-16', 'h-16', 'h-16']} />
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (!isLoading && courses.length === 0) {
        return (
            <StudentLayout title="Dashboard">
                <div className="p-4 lg:p-12 max-w-xl mx-auto pt-24">
                    <EmptyState
                        icon={BookOpen}
                        title="No courses yet"
                        description="Browse available courses and enroll to start earning XP and levelling up."
                        action={{ label: 'Browse Courses', onClick: () => window.location.href = '/courses' }}
                    />
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
                        <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white drop-shadow-sm">
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

                {/* XP Multiplier Banner */}
                <XPMultiplierBanner />

                {/* ── Main bento grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Roadmap (8 cols) */}
                    <div className="lg:col-span-8 glass-card rounded-3xl shadow-lg flex flex-col overflow-hidden relative group/roadmap min-h-[480px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 pointer-events-none opacity-50 transition-opacity group-hover/roadmap:opacity-100 duration-1000" />
                        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-black/20 flex justify-between items-center z-10 backdrop-blur-md">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Target size={20} className="text-indigo-500 dark:text-indigo-400" />
                                Learning Path: {courses.find(c => c.id === selectedCourseId)?.title || 'Current Path'}
                            </h2>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar relative z-0">
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

                        {/* Side Panel: Daily Challenge & Leagues */}
                        <div className="space-y-5">
                            <DailyChallengeCard />
                            <LeaguesPanel />
                        </div>

                    </div>
                </div>

                {/* ── Middle Row: Quests (100%) for clean visibility ── */}
                <div className="grid grid-cols-1 gap-6 mt-6 pb-10">
                    {/* Active Learning Quests */}
                    <QuestPanel />
                </div>

            </div>

            <NodeDrawer />
        </StudentLayout>
    );
};

export default Dashboard;
