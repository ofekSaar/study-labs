import React, { useEffect, useState } from 'react';
import InstructorLayout from '../components/layout/InstructorLayout';
import ClassProgressChart from '../components/analytics/ClassProgressChart';
import { Users, BookOpen, Trophy, TrendingUp, Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../store/courseStore';
import api from '../utils/api';

const InstructorDashboard = () => {
    const navigate = useNavigate();
    const { courses, fetchAllCourses } = useCourseStore();
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAllCourses();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (courses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(courses[0].id);
        }
    }, [courses, selectedCourseId]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!selectedCourseId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const { data } = await api.get(`/api/courses/${selectedCourseId}/analytics`);
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, [selectedCourseId]);

    const metrics = analytics?.metrics || {
        totalStudents: 0,
        avgCompletion: 0,
        activeModules: 0,
        totalXP: 0
    };

    const atRisk = analytics?.atRiskStudents || [];
    const conceptMastery = analytics?.conceptMastery || [];
    const aiInsights = analytics?.aiInsights || [];
    const gamification = analytics?.gamification || {
        xpMultiplier: 1.0,
        leaderboardEnabled: true,
        bounties: [],
        customBadges: [],
        rewardsStore: []
    };

    return (
        <InstructorLayout title="Instructor Overview">
            {/* Ambient background orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(79,110,247,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative z-[1] space-y-8 p-6 md:p-8 pb-32 max-w-[1600px] mx-auto">

                {/* Actions Bar */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-display font-black text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md tracking-tight">Instructor Overview</h1>
                        <p className="text-slate-500 dark:text-white/60 text-lg mt-1 font-medium">Manage your courses and track student progress.</p>
                    </div>
                    <button
                        className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:bg-purple-500 transition-colors flex items-center gap-2"
                        onClick={() => navigate('/instructor/create')}
                    >
                        <span className="text-lg leading-none">+</span> New Course
                    </button>
                </div>

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        label="Total Students"
                        value={metrics.totalStudents}
                        icon={<Users size={24} className="text-indigo-600 dark:text-indigo-400 drop-shadow-sm dark:drop-shadow-md" />}
                        glowColor="rgba(99,102,241,0.5)"
                    />
                    <MetricCard
                        label="Avg. Completion"
                        value={`${Math.round(metrics.avgCompletion)}%`}
                        icon={<TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400 drop-shadow-sm dark:drop-shadow-md" />}
                        glowColor="rgba(16,185,129,0.5)"
                    />
                    <MetricCard
                        label="Active Modules"
                        value={metrics.activeModules}
                        icon={<BookOpen size={24} className="text-purple-600 dark:text-purple-400 drop-shadow-sm dark:drop-shadow-md" />}
                        glowColor="rgba(124,58,237,0.5)"
                    />
                    <MetricCard
                        label="Class XP"
                        value={metrics.totalXP}
                        icon={<Trophy size={24} className="text-orange-600 dark:text-orange-400 drop-shadow-sm dark:drop-shadow-md" />}
                        glowColor="rgba(245,158,11,0.5)"
                    />
                </div>

                {/* content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Chart Section */}
                    <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md">Class Progress</h3>
                            <select 
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-white shadow-inner focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                                style={{ WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238B5CF6\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                            >
                                {courses.map(c => (
                                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{c.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative z-10">
                            <ClassProgressChart data={analytics?.nodeProgress} isLoading={isLoading} />
                        </div>
                        <div className="mt-6 text-center text-sm text-slate-400 dark:text-white/40 font-medium relative z-10">
                            Distribution of students across modules
                        </div>
                    </div>

                    {/* Side Panel - At Risk */}
                    <div className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col h-full relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        
                        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-6 flex items-center justify-between relative z-10 drop-shadow-sm dark:drop-shadow-md">
                            At-Risk Students
                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 text-xs px-3 py-1 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.2)]">{atRisk.length}</span>
                        </h3>
                        <div className="flex-1 space-y-3 relative z-10">
                            {atRisk.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors group/item">
                                    <img src={item.student?.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-10 h-10 rounded-full bg-white/10 border border-white/10" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate drop-shadow-sm">{item.student?.name || 'Student'}</p>
                                        <p className="text-[11px] text-red-500 dark:text-red-400 font-medium mt-0.5">{item.issue}</p>
                                    </div>
                                    <button className="text-xs font-bold text-slate-700 dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200/50 dark:border-white/5 px-3 py-2 rounded-xl transition-colors shadow-inner">
                                        Message
                                    </button>
                                </div>
                            ))}
                            {atRisk.length === 0 && !isLoading && (
                                <div className="text-center text-slate-400 dark:text-white/40 py-10 font-medium flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                                        <Trophy size={20} className="text-emerald-500/50 dark:text-emerald-400/50" />
                                    </div>
                                    No students are currently at risk.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Concept Mastery Heatmap & AI Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Concept Mastery Heatmap */}
                    <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-6 relative z-10 drop-shadow-sm dark:drop-shadow-md flex items-center gap-2">
                            <Brain size={22} className="text-purple-600 dark:text-purple-400" />
                            Curriculum Concept Mastery
                        </h3>
                        <div className="relative z-10 space-y-4">
                            {conceptMastery.map((item, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate drop-shadow-sm">{item.topic}</p>
                                        <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full mt-2 overflow-hidden shadow-inner">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    item.masteryLevel > 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 
                                                    item.masteryLevel > 72 ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 
                                                    'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                                }`}
                                                style={{ width: `${item.masteryLevel}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{item.masteryLevel}%</span>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                                            item.status === 'Excellent' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' :
                                            item.status === 'Moderate' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' :
                                            'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {conceptMastery.length === 0 && !isLoading && (
                                <div className="text-center text-slate-400 dark:text-white/40 py-10 font-medium">
                                    No concept data available. Please generate course curriculum first.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Insights & Recommendations */}
                    <div className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col h-full relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-6 relative z-10 drop-shadow-sm dark:drop-shadow-md">
                            AI Tutor Insights
                        </h3>
                        <div className="flex-1 space-y-4 relative z-10">
                            {aiInsights.map((insight, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {insight.type === 'alert' ? (
                                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400">
                                                <AlertTriangle size={18} />
                                            </div>
                                        ) : (
                                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                <CheckCircle size={18} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1">
                                            {insight.type === 'alert' ? 'Recommendation' : 'System Note'}
                                        </p>
                                        <p className="text-sm font-medium text-slate-600 dark:text-white/80 leading-relaxed">
                                            {insight.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {aiInsights.length === 0 && !isLoading && (
                                <div className="text-center text-slate-400 dark:text-white/40 py-10 font-medium">
                                    No AI insights recorded. Class activity data is being synthesized.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Instructor Gamification Economy & Quest Board */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Active Class Bounties / Quest Board */}
                    <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                                <Trophy size={22} className="text-amber-500" />
                                Active Class Bounties & Quests
                            </h3>
                            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 rounded-full">
                                {gamification.bounties.length} Live Quests
                            </span>
                        </div>
                        <div className="relative z-10 space-y-4">
                            {gamification.bounties.map((quest, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all duration-300 flex items-start gap-4 group/quest">
                                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 group-hover/quest:scale-110 transition-transform">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{quest.title}</h4>
                                            <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg shrink-0">
                                                +{quest.xpReward} XP
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-white/60 mt-1 leading-relaxed">{quest.description}</p>
                                        <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-400 dark:text-white/40">
                                            <span>Max Winners: {quest.maxWinners}</span>
                                            <span>•</span>
                                            <span className="text-amber-600 dark:text-amber-400">Ends in 7 days</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {gamification.bounties.length === 0 && (
                                <div className="text-center text-slate-400 dark:text-white/40 py-10 font-medium">
                                    No quests created yet. Give your students a challenge!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Custom Badges & XP Rewards Store */}
                    <div className="flex flex-col gap-8">
                        
                        {/* Custom Badges Panel */}
                        <div className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-4 relative z-10 flex items-center gap-2">
                                <BookOpen size={20} className="text-indigo-500" />
                                Course Achievement Badges
                            </h3>
                            <div className="relative z-10 space-y-3">
                                {gamification.customBadges.map((badge, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                                            <Trophy size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{badge.title}</p>
                                                <span className="text-[10px] font-bold text-indigo-500">+{badge.xpReward} XP</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 dark:text-white/40 truncate mt-0.5">{badge.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* XP Rewards Store Configurator */}
                        <div className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-4 relative z-10 flex items-center gap-2">
                                <Users size={20} className="text-emerald-500" />
                                XP Rewards Store
                            </h3>
                            <div className="relative z-10 space-y-3">
                                {gamification.rewardsStore.map((reward, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                                        <div className="min-w-0 pr-2">
                                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{reward.title}</p>
                                            <p className="text-[9px] text-slate-400 dark:text-white/40 truncate mt-0.5">{reward.description}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg shrink-0 shadow-inner">
                                            {reward.xpCost} XP
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </InstructorLayout>
    );
};

// Premium MetricCard with gradient background and hover animation
const MetricCard = ({ label, value, icon, glowColor }) => (
    <div
        className="p-5 rounded-3xl flex flex-col justify-between h-36 cursor-default transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_16px_32px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_16px_32px_rgba(0,0,0,0.5)] bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 relative overflow-hidden group"
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}
    >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)` }} />
        <div className="flex justify-between items-start relative z-10">
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 shadow-inner">
                {icon}
            </div>
        </div>
        <div className="relative z-10">
            <p className="text-slate-400 dark:text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md">{value}</p>
        </div>
    </div>
);

export default InstructorDashboard;
