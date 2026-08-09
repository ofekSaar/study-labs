import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HOUR_LATE_NIGHT_END,
    HOUR_MORNING_END,
    HOUR_AFTERNOON_END,
    HOUR_EVENING_END,
} from '../constants/config';
import RoadmapView from '../components/dashboard/RoadmapView';
import NodeDrawer from '../components/dashboard/NodeDrawer';
import useCourseStore from '../store/courseStore';
import useGamificationStore from '../store/gamificationStore';
import {
    Trophy,
    Flame,
    Zap,
    BookOpen,
    Target,
    Star,
    ArrowRight,
    CheckCircle,
    Clock,
    TrendingUp,
    Coins,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import DailyChallengeCard from '../components/gamification/DailyChallengeCard';
import LevelUpModal from '../components/gamification/LevelUpModal';
import ConfettiEffect from '../components/gamification/ConfettiEffect';
import LeaguesPanel from '../components/gamification/LeaguesPanel';
import QuestPanel from '../components/gamification/QuestPanel';
import XPMultiplierBanner from '../components/gamification/XPMultiplierBanner';
import XpHistoryChart from '../components/gamification/XpHistoryChart';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ProgressBar from '../components/common/ProgressBar';
import Button from '../components/common/Button';
import StatCard from '../components/common/StatCard';
import { clickableProps } from '../utils/a11y';
import { calculateLevel } from '../utils/gamification';
import { XP_PER_LEVEL } from '../constants/gamification';

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < HOUR_LATE_NIGHT_END) return 'Still up?';
    if (h < HOUR_MORNING_END) return 'Good morning';
    if (h < HOUR_AFTERNOON_END) return 'Good afternoon';
    if (h < HOUR_EVENING_END) return 'Good evening';
    return 'Good night';
};

const CourseProgressCard = ({ courses, navigate }) => {
    if (!courses.length) return null;

    return (
        <div className="glass-card rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-orange-400" />
                    My Courses
                </h3>
                <button
                    onClick={() => navigate('/my-courses')}
                    className="text-[11px] font-bold text-orange-500 dark:text-orange-300 hover:text-orange-600 dark:hover:text-orange-200 flex items-center gap-1 transition-colors"
                >
                    View all <ArrowRight size={12} />
                </button>
            </div>

            <div className="space-y-3">
                {courses.slice(0, 3).map((course) => {
                    const pct = Math.round(course.progress ?? 0);
                    const isDone = pct >= 100;
                    return (
                        <motion.div
                            key={course.id || course._id}
                            whileHover={{ x: 3 }}
                            className="group/course cursor-pointer"
                            {...clickableProps(
                                () => navigate(`/course/${course.id || course._id}`),
                                `Open course ${course.title}`
                            )}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-slate-700 dark:text-white/80 truncate max-w-[160px] group-hover/course:text-orange-500 dark:group-hover/course:text-orange-300 transition-colors">
                                    {course.title}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isDone ? (
                                        <CheckCircle size={13} className="text-emerald-500" />
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-400 dark:text-white/40">
                                            {pct}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ProgressBar
                                value={pct}
                                variant={isDone ? 'done' : 'progress'}
                                height="sm"
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const {
        courses,
        fetchCourses,
        fetchStats,
        isLoading,
        user,
        selectedCourseId,
        setSelectedCourse,
    } = useCourseStore();
    const { logActivity, generateDailyChallenge, stats, unlockedBadges, coins } =
        useGamificationStore();
    const [isRoadmapCollapsed, setIsRoadmapCollapsed] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchCourses();
        logActivity();
        generateDailyChallenge();
    }, []); // eslint-disable-line

    // Derive level/XP from the same source as the profile so the two screens stay in sync.
    const totalXP = stats?.total_xp ?? user?.totalXP ?? 0;
    const level = stats?.level || calculateLevel(totalXP);
    const progressToNextLevel = totalXP % XP_PER_LEVEL;

    // ── Loading skeleton ──
    if (isLoading && courses.length === 0) {
        return (
            <>
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 dot-grid opacity-60" />
                    <div
                        className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
                        style={{
                            background:
                                'radial-gradient(circle, rgba(217,119,87,0.12) 0%, transparent 70%)',
                            filter: 'blur(40px)',
                        }}
                    />
                </div>
                <div className="relative z-[1] p-4 lg:p-6 max-w-[1600px] mx-auto flex flex-col gap-6">
                    <LoadingSkeleton rows={2} heights={['h-8', 'h-4']} className="w-72" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="shimmer h-24 rounded-2xl" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 glass-card rounded-3xl p-6 min-h-[480px]">
                            <LoadingSkeleton
                                rows={6}
                                heights={['h-5', 'h-4', 'h-4', 'h-4', 'h-4', 'h-4']}
                            />
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
                </div>
            </>
        );
    }

    // ── Empty state ──
    if (!isLoading && courses.length === 0) {
        return (
            <>
                <div className="p-4 lg:p-12 max-w-xl mx-auto pt-24">
                    <EmptyState
                        icon={BookOpen}
                        title="No courses yet"
                        description="Browse available courses and enroll to start earning XP and levelling up."
                        action={{ label: 'Browse Courses', onClick: () => navigate('/my-courses') }}
                    />
                </div>
            </>
        );
    }

    const currentCourse = courses.find((c) => (c.id || c._id) === selectedCourseId) || courses[0];
    const inProgressCourses = courses.filter(
        (c) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100
    );
    const completedCourses = courses.filter((c) => (c.progress ?? 0) >= 100);

    return (
        <>
            <ConfettiEffect />
            <LevelUpModal />

            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div
                    className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(217,119,87,0.12) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="absolute top-1/2 -right-32 w-80 h-80 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            <div className="relative z-[1] p-4 lg:p-6 max-w-[1600px] mx-auto flex flex-col gap-6">
                {/* ── Header ── */}
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                >
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white drop-shadow-sm">
                                {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'} 👋
                            </h1>
                            {user?.levelName && (
                                <span
                                    className="text-xs font-black px-3 py-1 rounded-full shrink-0"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, rgba(217,119,87,0.12), rgba(124,58,237,0.08))',
                                        border: '1px solid rgba(217,119,87,0.3)',
                                        color: '#D97757',
                                    }}
                                >
                                    ⚡ {user.levelName}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 dark:text-orange-200/70 mt-0.5 font-medium text-sm">
                            {inProgressCourses.length > 0
                                ? `You have ${inProgressCourses.length} course${inProgressCourses.length > 1 ? 's' : ''} in progress — keep it up!`
                                : completedCourses.length > 0
                                  ? `You've completed ${completedCourses.length} course${completedCourses.length > 1 ? 's' : ''}. Ready for more?`
                                  : 'Ready to start your learning journey?'}
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate('/my-courses')}
                        icon={BookOpen}
                        iconAfter={ArrowRight}
                        className="shrink-0"
                    >
                        Browse Courses
                    </Button>
                </motion.header>

                {/* ── Stats Strip ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
                >
                    <StatCard
                        icon={Trophy}
                        value={level}
                        label="Level"
                        color="bg-amber-500"
                        glow="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    />
                    <StatCard
                        icon={Zap}
                        value={(user?.totalXP ?? 0).toLocaleString()}
                        label="Total XP"
                        color="bg-orange-500"
                        glow="text-orange-500 fill-orange-500/20 drop-shadow-[0_0_8px_rgba(217,119,87,0.6)]"
                    />
                    <StatCard
                        icon={Flame}
                        value={user?.streak ?? 0}
                        label="Day Streak"
                        color="bg-orange-500"
                        glow="text-orange-500 fill-orange-500/20 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                    />
                    <StatCard
                        icon={BookOpen}
                        value={courses.length}
                        label="Enrolled"
                        color="bg-teal-500"
                        glow="text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]"
                    />
                    <StatCard
                        icon={Star}
                        value={unlockedBadges?.length ?? 0}
                        label="Badges"
                        color="bg-purple-500"
                        glow="text-purple-500 fill-purple-500/10 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                    />
                </motion.div>

                {/* XP Multiplier Banner */}
                <XPMultiplierBanner />

                {/* ── Main Bento Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* ── Learning Path (8 cols) ── */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className={`${isRoadmapCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} glass-card rounded-3xl shadow-lg flex flex-col overflow-hidden relative group/roadmap`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 to-amber-500/4 pointer-events-none opacity-50 transition-opacity group-hover/roadmap:opacity-100 duration-1000" />

                        {/* Roadmap header with course selector */}
                        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-black/20 z-10 backdrop-blur-md">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Target
                                        size={18}
                                        className="text-orange-500 dark:text-orange-400"
                                    />
                                    Learning Path
                                </h2>
                                {courses.length > 1 && (
                                    <select
                                        value={selectedCourseId || ''}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer max-w-[200px] truncate"
                                    >
                                        {courses.map((c) => (
                                            <option key={c.id || c._id} value={c.id || c._id}>
                                                {c.title}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <div className="flex items-center gap-2 ml-auto">
                                    {currentCourse && (
                                        <div className="flex items-center gap-2">
                                            <ProgressBar
                                                value={Math.round(currentCourse.progress ?? 0)}
                                                variant="progress"
                                                height="sm"
                                                className="w-24"
                                                animated={false}
                                            />
                                            <span className="text-[11px] font-black text-slate-500 dark:text-white/50">
                                                {Math.round(currentCourse.progress ?? 0)}%
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsRoadmapCollapsed((v) => !v)}
                                        className="w-7 h-7 rounded-xl bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300/70 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-white/50 transition-colors"
                                        title={isRoadmapCollapsed ? 'Expand' : 'Collapse'}
                                        aria-label={
                                            isRoadmapCollapsed
                                                ? 'Expand learning path'
                                                : 'Collapse learning path'
                                        }
                                        aria-expanded={!isRoadmapCollapsed}
                                    >
                                        {isRoadmapCollapsed ? (
                                            <ChevronDown size={14} />
                                        ) : (
                                            <ChevronUp size={14} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {!isRoadmapCollapsed && (
                                <motion.div
                                    key="roadmap-body"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="overflow-auto custom-scrollbar relative z-0 min-h-[380px]">
                                        <RoadmapView />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ── Right Column (4 cols) ── */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                        className={`${isRoadmapCollapsed ? 'lg:col-span-12 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' : 'lg:col-span-4 flex flex-col'} gap-4`}
                    >
                        {/* XP Progress Card */}
                        {/* shrink-0: overflow-hidden zeroes the automatic min-height, so without it
                            this card absorbs all the column's flex shrink and clips the coins row */}
                        <div className="glass-card rounded-3xl p-5 shadow-lg relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/4 to-amber-500/4 pointer-events-none" />
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                                    XP Progress
                                </h3>
                                <span className="text-xs font-black text-orange-500 dark:text-orange-300 flex items-center gap-1">
                                    <Zap size={12} className="fill-orange-500/30" />
                                    Level {level}
                                </span>
                            </div>
                            <div className="h-3 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner mb-2">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width:
                                            progressToNextLevel === 0 && totalXP > 0
                                                ? '2%'
                                                : `${progressToNextLevel}%`,
                                    }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                                </motion.div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-white/30">
                                <span>{totalXP} XP total</span>
                                <span>
                                    {XP_PER_LEVEL - progressToNextLevel} XP to Level {level + 1}
                                </span>
                            </div>
                            {/* Coins row */}
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-amber-500">
                                    <Coins size={14} className="fill-amber-500/20" />
                                    <span className="text-sm font-black">
                                        {(coins ?? 0).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wide">
                                        Coins
                                    </span>
                                </div>
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="text-[11px] font-bold text-orange-500 dark:text-orange-300 hover:text-orange-600 flex items-center gap-1 transition-colors"
                                >
                                    Shop <ArrowRight size={11} />
                                </button>
                            </div>
                        </div>

                        {/* Course Progress */}
                        <CourseProgressCard courses={courses} navigate={navigate} />

                        {/* Daily Challenge */}
                        <DailyChallengeCard />

                        {/* Quick achievements */}
                        {(stats?.lessons_completed > 0 || stats?.perfect_quizzes > 0) && (
                            <div className="glass-card rounded-3xl p-4 shadow-sm">
                                <h3 className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-3">
                                    Achievements
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-100 dark:bg-black/30 rounded-2xl p-3 text-center border border-slate-200/50 dark:border-white/5">
                                        <Clock size={14} className="text-teal-500 mx-auto mb-1" />
                                        <div className="text-lg font-black text-slate-800 dark:text-white leading-none">
                                            {stats?.lessons_completed ?? 0}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wide mt-0.5">
                                            Lessons
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-black/30 rounded-2xl p-3 text-center border border-slate-200/50 dark:border-white/5">
                                        <Star
                                            size={14}
                                            className="text-amber-500 mx-auto mb-1 fill-amber-500/20"
                                        />
                                        <div className="text-lg font-black text-slate-800 dark:text-white leading-none">
                                            {stats?.perfect_quizzes ?? 0}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wide mt-0.5">
                                            Perfect Quizzes
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Leagues */}
                        <LeaguesPanel />
                    </motion.div>
                </div>

                {/* ── Quests ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="pb-10"
                >
                    <QuestPanel />

                    {/* XP History Chart */}
                    <XpHistoryChart />
                </motion.div>
            </div>

            <NodeDrawer />
        </>
    );
};

export default Dashboard;
