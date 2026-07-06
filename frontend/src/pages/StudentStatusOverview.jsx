import React, { useEffect, useState, useMemo } from 'react';
import {
    Users,
    BookOpen,
    Trophy,
    TrendingUp,
    Brain,
    AlertTriangle,
    Zap,
    Star,
    CheckCircle,
    Search,
    Flame,
} from 'lucide-react';
import useCourseStore from '../store/courseStore';
import useToastStore from '../store/toastStore';
import api from '../utils/api';
import { calculateLevel } from '../utils/gamification';
import ClassHealthScore from '../components/instructor/ClassHealthScore';
import TopPerformers from '../components/instructor/TopPerformers';
import AvatarDisplay from '../components/instructor/AvatarDisplay';
import ConceptCard from '../components/instructor/ConceptCard';
import MetricCard from '../components/instructor/MetricCard';
import SortableHeader from '../components/instructor/SortableHeader';
import PanelEmptyState from '../components/instructor/PanelEmptyState';
import { TableSkeleton, CardSkeleton } from '../components/common/Skeletons';
import {
    difficultyFromPct,
    relativeTime,
    studentBadge,
    completionBarGradient,
    issueConfig,
    RANK_MEDAL,
} from '../utils/studentStatus';
import logger from '../utils/logger';

// ── main component ─────────────────────────────────────────────────────────────

const StudentStatusOverview = () => {
    const { courses, fetchAllCourses } = useCourseStore();
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Students
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [sortField, setSortField] = useState('completion');
    const [sortDir, setSortDir] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Leaderboard
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [leaderboardPeriod, setLeaderboardPeriod] = useState('allTime');

    useEffect(() => {
        fetchAllCourses();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (courses.length > 0 && !selectedCourseId) setSelectedCourseId(courses[0].id);
    }, [courses, selectedCourseId]);

    // Fetch analytics + students eagerly when course changes
    useEffect(() => {
        if (!selectedCourseId) return;
        setSearchQuery('');
        setStatusFilter('all');

        async function fetchAnalytics() {
            setIsLoading(true);
            try {
                const res = await api.get(`/api/courses/${selectedCourseId}/analytics`);
                setAnalytics(res.data);
            } catch (e) {
                logger.error('Failed to fetch analytics', e);
                useToastStore
                    .getState()
                    .error('Failed to load analytics', 'Please try selecting the course again.');
            } finally {
                setIsLoading(false);
            }
        }

        async function fetchStudents() {
            setStudents([]);
            setStudentsLoading(true);
            try {
                const res = await api.get(`/api/courses/${selectedCourseId}/students`);
                setStudents(res.data?.students || []);
            } catch (e) {
                logger.error('Failed to fetch students', e);
                useToastStore
                    .getState()
                    .error('Failed to load students', 'Please try selecting the course again.');
            } finally {
                setStudentsLoading(false);
            }
        }

        fetchAnalytics();
        fetchStudents();
    }, [selectedCourseId]);

    // Re-fetch leaderboard whenever course or period changes
    useEffect(() => {
        if (!selectedCourseId) return;

        async function fetchLeaderboard() {
            setLeaderboardLoading(true);
            try {
                const res = await api.get(
                    `/api/progress/course/${selectedCourseId}/leaderboard?period=${leaderboardPeriod}`
                );
                setLeaderboard(res.data || []);
            } catch (e) {
                logger.error('Failed to fetch leaderboard', e);
                useToastStore
                    .getState()
                    .error('Failed to load leaderboard', 'Please try again in a moment.');
            } finally {
                setLeaderboardLoading(false);
            }
        }

        fetchLeaderboard();
    }, [selectedCourseId, leaderboardPeriod]);

    const toggleSort = (field) => {
        if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            let av, bv;
            if (sortField === 'name') {
                av = a.student?.name?.toLowerCase() ?? '';
                bv = b.student?.name?.toLowerCase() ?? '';
            } else if (sortField === 'lastActivityDate') {
                av = a.lastActivityDate ? new Date(a.lastActivityDate).getTime() : 0;
                bv = b.lastActivityDate ? new Date(b.lastActivityDate).getTime() : 0;
            } else {
                av = a[sortField] ?? 0;
                bv = b[sortField] ?? 0;
            }
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [students, sortField, sortDir]);

    const filteredStudents = useMemo(() => {
        return sortedStudents.filter((s) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                !q ||
                s.student?.name?.toLowerCase().includes(q) ||
                s.student?.email?.toLowerCase().includes(q);
            const badge = studentBadge(s);
            const matchesFilter = statusFilter === 'all' || badge.label === statusFilter;
            return matchesSearch && matchesFilter;
        });
    }, [sortedStudents, searchQuery, statusFilter]);

    const metrics = useMemo(
        () =>
            analytics?.metrics || {
                totalStudents: 0,
                avgCompletion: 0,
                activeModules: 0,
                totalXP: 0,
            },
        [analytics]
    );
    const atRisk = useMemo(() => analytics?.atRiskStudents || [], [analytics]);
    const conceptMastery = useMemo(() => analytics?.conceptMastery || [], [analytics]);

    const sortedConcepts = useMemo(
        () => [...conceptMastery].sort((a, b) => a.masteryLevel - b.masteryLevel),
        [conceptMastery]
    );

    const conceptStats = useMemo(() => {
        if (!conceptMastery.length) return null;
        const avg = Math.round(
            conceptMastery.reduce((s, c) => s + c.masteryLevel, 0) / conceptMastery.length
        );
        const excellent = conceptMastery.filter((c) => c.masteryLevel > 85).length;
        const moderate = conceptMastery.filter(
            (c) => c.masteryLevel > 72 && c.masteryLevel <= 85
        ).length;
        const poor = conceptMastery.filter((c) => c.masteryLevel <= 72).length;
        return { avg, excellent, moderate, poor };
    }, [conceptMastery]);

    const avgStreak = useMemo(() => {
        if (!students.length) return 0;
        return Math.round(students.reduce((sum, s) => sum + (s.streak || 0), 0) / students.length);
    }, [students]);

    const retentionHealth = useMemo(
        () => (metrics.totalStudents > 0 ? (1 - atRisk.length / metrics.totalStudents) * 100 : 100),
        [metrics, atRisk]
    );

    const healthScore = useMemo(() => {
        if (!analytics) return 0;
        return Math.round(metrics.avgCompletion * 0.6 + retentionHealth * 0.4);
    }, [analytics, metrics, retentionHealth]);

    const aiInsights = useMemo(
        () => analytics?.aiInsights || { alerts: [], successes: [] },
        [analytics]
    );
    const hasInsights =
        (aiInsights.alerts?.length ?? 0) > 0 || (aiInsights.successes?.length ?? 0) > 0;

    const TABS = [
        {
            id: 'overview',
            label: 'Overview',
            icon: TrendingUp,
            badge: atRisk.length > 0 ? atRisk.length : null,
            badgeCls: 'bg-red-500 text-white',
        },
        {
            id: 'students',
            label: 'Students',
            icon: Users,
            badge: metrics.totalStudents || null,
            badgeCls: 'bg-indigo-500 text-white',
        },
        {
            id: 'concepts',
            label: 'Concepts',
            icon: Brain,
            badge: conceptMastery.length || null,
            badgeCls: 'bg-purple-500 text-white',
        },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    ];

    const topXP = leaderboard.length > 0 ? leaderboard[0].xp || 1 : 1;

    return (
        <>
            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div
                    className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(79,110,247,0.10) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            <div className="relative z-[1] space-y-8 p-4 sm:p-6 md:p-8 pb-32 max-w-[1600px] mx-auto">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md tracking-tight">
                            Student Status Overview
                        </h1>
                        <p className="text-slate-600 dark:text-white/70 text-lg mt-2 font-medium leading-relaxed max-w-2xl">
                            Track your students' progress, engagement, and mastery levels at a
                            glance.
                        </p>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full md:min-w-[280px] bg-gradient-to-r from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-lg dark:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 appearance-none cursor-pointer transition-all"
                            style={{
                                WebkitAppearance: 'none',
                                backgroundImage:
                                    "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238B5CF6' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'left 1rem center',
                                backgroundSize: '1.2em',
                            }}
                        >
                            {courses.map((c) => (
                                <option
                                    key={c.id}
                                    value={c.id}
                                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                                >
                                    {c.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── Metric cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    <MetricCard
                        label="Total Students"
                        value={metrics.totalStudents}
                        subtitle={`${atRisk.length} at risk`}
                        icon={<Users size={26} className="text-indigo-600 dark:text-indigo-400" />}
                        glowColor="rgba(99,102,241,0.5)"
                        trend={metrics.totalStudents > 0 ? 'up' : 'neutral'}
                    />
                    <MetricCard
                        label="Avg. Completion"
                        value={`${Math.round(metrics.avgCompletion)}%`}
                        subtitle={metrics.avgCompletion >= 60 ? 'On track' : 'Needs focus'}
                        icon={
                            <TrendingUp
                                size={26}
                                className="text-emerald-600 dark:text-emerald-400"
                            />
                        }
                        glowColor="rgba(16,185,129,0.5)"
                        trend={metrics.avgCompletion >= 50 ? 'up' : 'down'}
                    />
                    <MetricCard
                        label="Avg. Streak"
                        value={`${avgStreak}d`}
                        subtitle="days active in a row"
                        icon={<Flame size={26} className="text-orange-500 dark:text-orange-400" />}
                        glowColor="rgba(249,115,22,0.5)"
                        trend={avgStreak >= 3 ? 'up' : avgStreak > 0 ? 'neutral' : 'down'}
                    />
                    <MetricCard
                        label="Class XP"
                        value={(metrics.totalXP || 0).toLocaleString()}
                        subtitle={`Avg Lv.${calculateLevel(metrics.totalStudents > 0 ? Math.round(metrics.totalXP / metrics.totalStudents) : 0)}`}
                        icon={<Zap size={26} className="text-amber-500 dark:text-amber-400" />}
                        glowColor="rgba(245,158,11,0.5)"
                        trend={metrics.totalXP > 0 ? 'up' : 'neutral'}
                        badge="⚡ XP"
                    />
                </div>

                {/* ── Tab switcher ── */}
                <div className="overflow-x-auto pb-1">
                    <div className="flex gap-2 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-white/5 dark:to-black/20 border border-slate-200/60 dark:border-white/10 p-2 rounded-3xl w-fit min-w-max backdrop-blur-sm">
                        {TABS.map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'bg-gradient-to-r from-white to-slate-50/80 dark:from-white/15 dark:to-white/5 text-slate-900 dark:text-white shadow-lg dark:shadow-xl border border-slate-200/40 dark:border-white/20'
                                            : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 hover:bg-white/30 dark:hover:bg-white/5 transition-colors'
                                    }`}
                                >
                                    <TabIcon size={18} />
                                    {tab.label}
                                    {tab.badge != null && (
                                        <span
                                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${tab.badgeCls}`}
                                        >
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Class Health Score */}
                        <ClassHealthScore
                            score={isLoading ? 0 : healthScore}
                            avgCompletion={metrics.avgCompletion}
                            retentionHealth={retentionHealth}
                            atRiskCount={atRisk.length}
                            totalStudents={metrics.totalStudents}
                            isLoading={isLoading}
                        />

                        {/* AI Insights */}
                        {(isLoading || hasInsights) && (
                            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-6 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                                    <div className="p-1.5 rounded-xl bg-violet-100 dark:bg-violet-500/10">
                                        <Star
                                            size={18}
                                            className="text-violet-600 dark:text-violet-400"
                                        />
                                    </div>
                                    AI Insights
                                </h3>
                                <div className="space-y-2 relative z-10">
                                    {isLoading ? (
                                        <>
                                            <div className="h-10 rounded-xl bg-slate-200 dark:bg-white/10 animate-pulse" />
                                            <div className="h-10 rounded-xl bg-slate-200 dark:bg-white/10 animate-pulse w-4/5" />
                                        </>
                                    ) : (
                                        <>
                                            {aiInsights.alerts?.map((msg, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-500/8 border border-amber-200/60 dark:border-amber-500/20"
                                                >
                                                    <AlertTriangle
                                                        size={15}
                                                        className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                                                    />
                                                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                                        {msg}
                                                    </p>
                                                </div>
                                            ))}
                                            {aiInsights.successes?.map((msg, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/8 border border-emerald-200/60 dark:border-emerald-500/20"
                                                >
                                                    <CheckCircle
                                                        size={15}
                                                        className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5"
                                                    />
                                                    <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                                                        {msg}
                                                    </p>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Class Progress + right column */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Class Progress table */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-8 relative z-10 drop-shadow-sm dark:drop-shadow-md flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10">
                                        <BookOpen
                                            size={24}
                                            className="text-purple-600 dark:text-purple-400"
                                        />
                                    </div>
                                    Class Progress
                                </h3>
                                <div className="relative z-10">
                                    {isLoading ? (
                                        <TableSkeleton cols={4} rows={5} />
                                    ) : !analytics?.nodeProgress?.length ? (
                                        <PanelEmptyState
                                            icon={<BookOpen size={24} />}
                                            title="No modules yet"
                                            subtitle="Create course modules to see progress here."
                                        />
                                    ) : (
                                        <div className="overflow-x-auto overflow-y-auto rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 w-full max-h-[380px]">
                                            <table className="w-full text-right text-sm border-collapse">
                                                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-bold text-[11px] uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-5 py-3 text-right">
                                                            Module / Lesson
                                                        </th>
                                                        <th className="px-5 py-3 text-right whitespace-nowrap">
                                                            Class Progress
                                                        </th>
                                                        <th className="px-5 py-3 text-right whitespace-nowrap">
                                                            Completed
                                                        </th>
                                                        <th className="px-5 py-3 text-right whitespace-nowrap">
                                                            Difficulty
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                                                    {analytics.nodeProgress.map((item, idx) => {
                                                        const total = metrics.totalStudents || 0;
                                                        const completed = item.students || 0;
                                                        const percentage =
                                                            total > 0
                                                                ? Math.min(
                                                                      Math.round(
                                                                          (completed / total) * 100
                                                                      ),
                                                                      100
                                                                  )
                                                                : 0;
                                                        const diff = difficultyFromPct(percentage);
                                                        const barGrad =
                                                            completionBarGradient(percentage);
                                                        return (
                                                            <tr
                                                                key={idx}
                                                                className="hover:bg-slate-100/30 dark:hover:bg-white/3 transition-colors"
                                                            >
                                                                <td className="px-5 py-4 font-bold text-slate-800 dark:text-white drop-shadow-sm max-w-[220px]">
                                                                    <p
                                                                        className="truncate"
                                                                        title={item.name}
                                                                    >
                                                                        {item.name}
                                                                    </p>
                                                                </td>
                                                                <td className="px-5 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center gap-3 justify-end">
                                                                        <div className="w-24 bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden shadow-inner">
                                                                            <div
                                                                                className={`bg-gradient-to-r ${barGrad} h-full rounded-full`}
                                                                                style={{
                                                                                    width: `${percentage}%`,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-xs font-black text-slate-700 dark:text-white/80 w-8 text-right">
                                                                            {percentage}%
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4 font-medium text-slate-600 dark:text-white/70 whitespace-nowrap">
                                                                    {completed} of {total}
                                                                </td>
                                                                <td className="px-5 py-4 whitespace-nowrap">
                                                                    <span
                                                                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${diff.color}`}
                                                                    >
                                                                        {diff.label}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-6 text-center text-xs text-slate-400 dark:text-white/40 font-bold relative z-10 uppercase tracking-wider">
                                    Difficulty reflects actual class completion rate
                                </p>
                            </div>

                            {/* Right column: Top Performers + At-Risk */}
                            <div className="space-y-6">
                                <TopPerformers
                                    leaderboard={leaderboard}
                                    loading={leaderboardLoading}
                                />

                                {/* At-Risk Panel */}
                                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-6 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex flex-col relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center justify-between relative z-10">
                                        <span className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-xl bg-red-100 dark:bg-red-500/10">
                                                <AlertTriangle
                                                    size={18}
                                                    className="text-red-600 dark:text-red-400"
                                                />
                                            </div>
                                            At-Risk Students
                                        </span>
                                        <span className="bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/30 text-xs font-black px-3 py-1 rounded-full">
                                            {atRisk.length}
                                        </span>
                                    </h3>
                                    <div className="flex-1 space-y-2 relative z-10 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                                        {isLoading ? (
                                            <CardSkeleton rows={3} />
                                        ) : atRisk.length === 0 ? (
                                            <PanelEmptyState
                                                icon={
                                                    <Star
                                                        size={18}
                                                        className="text-emerald-500/60"
                                                    />
                                                }
                                                title="All clear!"
                                                subtitle="No students at risk."
                                                compact
                                            />
                                        ) : (
                                            atRisk.map((item, i) => {
                                                const iss = issueConfig(item.issue);
                                                return (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors"
                                                    >
                                                        <AvatarDisplay
                                                            avatar={item.student?.avatar}
                                                            size="w-9 h-9"
                                                            name={item.student?.name}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p
                                                                    className="text-sm font-bold text-slate-800 dark:text-white break-words leading-tight"
                                                                    title={
                                                                        item.student?.name ||
                                                                        'Student'
                                                                    }
                                                                >
                                                                    {item.student?.name ||
                                                                        'Student'}
                                                                </p>
                                                                <span
                                                                    className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${iss.cls}`}
                                                                >
                                                                    {iss.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 dark:text-white/40 mt-0.5">
                                                                {item.completion}% complete
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                item.student?.email &&
                                                                window.open(
                                                                    `mailto:${item.student.email}`
                                                                )
                                                            }
                                                            disabled={!item.student?.email}
                                                            title={
                                                                item.student?.email || 'No email'
                                                            }
                                                            className="text-xs font-bold text-slate-700 dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200/50 dark:border-white/5 px-2.5 py-1.5 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            Message
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ STUDENTS TAB ══════════════════════════════════════════════════════ */}
                {activeTab === 'students' && (
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white drop-shadow-sm flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/10">
                                    <Users
                                        size={24}
                                        className="text-indigo-600 dark:text-indigo-400"
                                    />
                                </div>
                                All Students
                            </h3>
                            {students.length > 0 && (
                                <span className="text-xs font-black text-slate-400 dark:text-white/40 uppercase tracking-wider">
                                    {students.length} enrolled
                                </span>
                            )}
                        </div>

                        {/* Search + filter toolbar */}
                        {students.length > 0 && (
                            <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
                                <div className="relative flex-1">
                                    <Search
                                        size={14}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email…"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                                    />
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {['all', 'On Track', 'At Risk', 'Not Started'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setStatusFilter(f)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                                statusFilter === f
                                                    ? f === 'At Risk'
                                                        ? 'bg-red-500 text-white shadow-sm'
                                                        : f === 'On Track'
                                                          ? 'bg-emerald-500 text-white shadow-sm'
                                                          : f === 'Not Started'
                                                            ? 'bg-slate-500 text-white shadow-sm'
                                                            : 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10'
                                            }`}
                                        >
                                            {f === 'all' ? 'All' : f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="relative z-10">
                            {studentsLoading ? (
                                <TableSkeleton cols={9} rows={6} />
                            ) : students.length === 0 ? (
                                <PanelEmptyState
                                    icon={<Users size={24} />}
                                    title="No students enrolled"
                                    subtitle="Students will appear here once they join."
                                />
                            ) : filteredStudents.length === 0 ? (
                                <PanelEmptyState
                                    icon={<Search size={24} />}
                                    title="No results"
                                    subtitle="Try a different search or filter."
                                />
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                                    <table className="w-full text-sm border-collapse">
                                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-bold text-[11px] uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 text-right whitespace-nowrap w-12">
                                                    #
                                                </th>
                                                <SortableHeader
                                                    field="name"
                                                    label="Student"
                                                    current={sortField}
                                                    dir={sortDir}
                                                    onSort={toggleSort}
                                                    align="left"
                                                />
                                                <th className="px-4 py-3 text-right whitespace-nowrap">
                                                    Level
                                                </th>
                                                <SortableHeader
                                                    field="completion"
                                                    label="Completion"
                                                    current={sortField}
                                                    dir={sortDir}
                                                    onSort={toggleSort}
                                                />
                                                <SortableHeader
                                                    field="totalXP"
                                                    label="XP"
                                                    current={sortField}
                                                    dir={sortDir}
                                                    onSort={toggleSort}
                                                />
                                                <SortableHeader
                                                    field="completedNodes"
                                                    label="Lessons"
                                                    current={sortField}
                                                    dir={sortDir}
                                                    onSort={toggleSort}
                                                />
                                                <SortableHeader
                                                    field="streak"
                                                    label="Streak"
                                                    current={sortField}
                                                    dir={sortDir}
                                                    onSort={toggleSort}
                                                />
                                                <SortableHeader
                                                    field="lastActivityDate"
                                                    label="Last Active"
                                                    current={sortField}
                                                    dir={sortDir}
                                                    onSort={toggleSort}
                                                />
                                                <th className="px-4 py-3 text-right whitespace-nowrap">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                                            {filteredStudents.map((s, i) => {
                                                const badge = studentBadge(s);
                                                const rank = sortedStudents.indexOf(s) + 1;
                                                const isTop3 = rank <= 3;
                                                const isAtRisk = badge.label === 'At Risk';
                                                const level = calculateLevel(s.totalXP);
                                                const barGrad = completionBarGradient(s.completion);
                                                const rowCls = isTop3
                                                    ? 'bg-amber-50/30 dark:bg-amber-500/5'
                                                    : isAtRisk
                                                      ? 'bg-red-50/20 dark:bg-red-500/4'
                                                      : '';
                                                return (
                                                    <tr
                                                        key={i}
                                                        className={`hover:bg-slate-100/30 dark:hover:bg-white/3 transition-colors ${rowCls}`}
                                                    >
                                                        {/* Rank */}
                                                        <td className="px-4 py-4 text-right">
                                                            {rank <= 3 ? (
                                                                <span className="text-lg select-none">
                                                                    {RANK_MEDAL[rank - 1]}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-bold text-slate-400 dark:text-white/30">
                                                                    #{rank}
                                                                </span>
                                                            )}
                                                        </td>
                                                        {/* Name + avatar */}
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <AvatarDisplay
                                                                    avatar={s.student?.avatar}
                                                                    size="w-8 h-8"
                                                                    name={s.student?.name}
                                                                />
                                                                <div>
                                                                    <p className="font-bold text-slate-800 dark:text-white leading-tight">
                                                                        {s.student?.name ||
                                                                            'Unknown'}
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-400 dark:text-white/40 leading-tight">
                                                                        {s.student?.email || '—'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {/* Level */}
                                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                                            <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/25 px-2 py-0.5 rounded-lg">
                                                                Lv.{level}
                                                            </span>
                                                        </td>
                                                        {/* Completion */}
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3 justify-end">
                                                                <div className="w-20 bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden shadow-inner">
                                                                    <div
                                                                        className={`bg-gradient-to-r ${barGrad} h-full rounded-full`}
                                                                        style={{
                                                                            width: `${s.completion}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-black text-slate-700 dark:text-white/80 w-9 text-right">
                                                                    {s.completion}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        {/* XP */}
                                                        <td className="px-4 py-4 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap">
                                                            <span className="text-amber-600 dark:text-amber-400">
                                                                ⚡
                                                            </span>{' '}
                                                            {(s.totalXP || 0).toLocaleString()}
                                                        </td>
                                                        {/* Lessons */}
                                                        <td className="px-4 py-4 text-right text-slate-600 dark:text-white/70 whitespace-nowrap font-medium">
                                                            {s.completedNodes} / {s.totalNodes}
                                                        </td>
                                                        {/* Streak */}
                                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                                            <span
                                                                className={`text-xs font-bold ${(s.streak || 0) > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-white/30'}`}
                                                            >
                                                                {(s.streak || 0) > 0
                                                                    ? `🔥 ${s.streak}d`
                                                                    : '—'}
                                                            </span>
                                                        </td>
                                                        {/* Last active */}
                                                        <td className="px-4 py-4 text-right text-slate-500 dark:text-white/50 whitespace-nowrap text-xs font-medium">
                                                            {relativeTime(s.lastActivityDate)}
                                                        </td>
                                                        {/* Status badge */}
                                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                                            <span
                                                                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${badge.color}`}
                                                            >
                                                                {badge.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══ CONCEPTS TAB ══════════════════════════════════════════════════════ */}
                {activeTab === 'concepts' && (
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        {/* Header + aggregate stats */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2 relative z-10">
                            <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10">
                                    <Brain
                                        size={24}
                                        className="text-purple-600 dark:text-purple-400"
                                    />
                                </div>
                                Curriculum Concept Mastery
                            </h3>
                            {conceptStats && (
                                <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                                    <span className="text-slate-500 dark:text-white/50 mr-1">
                                        Avg:{' '}
                                        <span className="text-slate-900 dark:text-white">
                                            {conceptStats.avg}%
                                        </span>
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        ✓ {conceptStats.excellent} excellent
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        ~ {conceptStats.moderate} moderate
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
                                        ✗ {conceptStats.poor} poor
                                    </span>
                                </div>
                            )}
                        </div>
                        {conceptStats && (
                            <p className="text-xs text-slate-400 dark:text-white/40 font-medium mb-6 relative z-10 pl-1">
                                Sorted by mastery — weakest concepts first
                            </p>
                        )}

                        <div className="relative z-10">
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="p-5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 flex flex-col items-center gap-3"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                                            <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse w-3/4" />
                                            <div className="h-4 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse w-1/2" />
                                        </div>
                                    ))}
                                </div>
                            ) : sortedConcepts.length === 0 ? (
                                <PanelEmptyState
                                    icon={<Brain size={24} />}
                                    title="No concept data yet"
                                    subtitle="Generate a course curriculum to see mastery breakdown."
                                />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sortedConcepts.map((item, idx) => (
                                        <ConceptCard key={idx} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══ LEADERBOARD TAB ═══════════════════════════════════════════════════ */}
                {activeTab === 'leaderboard' && (
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                            <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/10">
                                    <Trophy
                                        size={24}
                                        className="text-amber-600 dark:text-amber-400"
                                    />
                                </div>
                                Course Leaderboard
                            </h3>
                            {/* Period selector */}
                            <div className="flex gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-1.5 rounded-2xl w-fit">
                                {[
                                    { id: 'weekly', label: 'Weekly' },
                                    { id: 'monthly', label: 'Monthly' },
                                    { id: 'allTime', label: 'All Time' },
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setLeaderboardPeriod(p.id)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                            leaderboardPeriod === p.id
                                                ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-md border border-slate-200/60 dark:border-white/20'
                                                : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative z-10">
                            {leaderboardLoading ? (
                                <TableSkeleton cols={5} rows={8} />
                            ) : leaderboard.length === 0 ? (
                                <PanelEmptyState
                                    icon={<Trophy size={24} />}
                                    title="No leaderboard data"
                                    subtitle="Students need to earn XP for this period."
                                />
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.map((s, i) => {
                                        const rank = s.rank || i + 1;
                                        const isTop3 = rank <= 3;
                                        const level = s.level || calculateLevel(s.xp);
                                        const xpBarWidth = Math.round(((s.xp || 0) / topXP) * 100);
                                        const borderCls =
                                            rank === 1
                                                ? 'border-amber-300/60 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/8'
                                                : rank === 2
                                                  ? 'border-slate-300/60 dark:border-slate-400/25 bg-slate-50/80 dark:bg-white/5'
                                                  : rank === 3
                                                    ? 'border-orange-300/50 dark:border-orange-500/20 bg-orange-50/30 dark:bg-orange-500/5'
                                                    : 'border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-black/10';
                                        return (
                                            <div
                                                key={s.userId || i}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.005] ${borderCls}`}
                                            >
                                                {/* Rank */}
                                                <div className="w-10 text-center flex-shrink-0">
                                                    {isTop3 ? (
                                                        <span className="text-2xl select-none">
                                                            {RANK_MEDAL[rank - 1]}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm font-black text-slate-400 dark:text-white/30">
                                                            #{rank}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Avatar */}
                                                <AvatarDisplay
                                                    avatar={s.avatar}
                                                    size="w-10 h-10"
                                                    name={s.name}
                                                />
                                                {/* Name + XP bar */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <p className="font-bold text-slate-800 dark:text-white truncate leading-tight">
                                                            {s.name || 'Student'}
                                                        </p>
                                                        <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/25 px-1.5 py-0.5 rounded flex-shrink-0">
                                                            Lv.{level}
                                                        </span>
                                                        {s.isYou && (
                                                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 px-1.5 py-0.5 rounded flex-shrink-0">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full bg-gradient-to-r ${
                                                                rank === 1
                                                                    ? 'from-amber-400 to-yellow-300'
                                                                    : rank === 2
                                                                      ? 'from-slate-400 to-slate-300'
                                                                      : rank === 3
                                                                        ? 'from-orange-500 to-amber-400'
                                                                        : 'from-purple-500 to-indigo-400'
                                                            }`}
                                                            style={{
                                                                width: `${xpBarWidth}%`,
                                                                boxShadow: isTop3
                                                                    ? '0 0 8px rgba(251,191,36,0.4)'
                                                                    : 'none',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* XP */}
                                                <div className="text-right flex-shrink-0">
                                                    <p className="font-black text-slate-900 dark:text-white text-sm">
                                                        <span className="text-amber-500 dark:text-amber-400">
                                                            ⚡
                                                        </span>{' '}
                                                        {(s.xp || 0).toLocaleString()}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 dark:text-white/40 font-medium">
                                                        XP
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default StudentStatusOverview;
