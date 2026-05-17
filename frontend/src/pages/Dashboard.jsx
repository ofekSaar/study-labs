import React, { useEffect } from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import RoadmapView from '../components/dashboard/RoadmapView';
import NodeDrawer from '../components/dashboard/NodeDrawer';
import useCourseStore from '../store/courseStore';
import { Trophy, Flame, Zap, Award, Target } from 'lucide-react';

const Dashboard = () => {
    const { courses, fetchCourses, fetchStats, isLoading, user } = useCourseStore();

    useEffect(() => {
        fetchStats();
        fetchCourses();
    }, []); 

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

            <div className="relative z-[1] p-4 lg:p-6 max-w-[1600px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
                <header className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                    <div>
                        <h1 className="text-3xl font-display font-black text-white drop-shadow-md">Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
                        <p className="text-indigo-200 mt-1 font-medium">Ready to conquer your next challenge?</p>
                    </div>
                </header>
                
                {/* Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                    
                    {/* Main Tile: Roadmap (8 cols) */}
                    <div className="lg:col-span-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative group/roadmap">
                        {/* Inner glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 pointer-events-none opacity-50 transition-opacity group-hover/roadmap:opacity-100 duration-1000" />
                        
                        <div className="p-4 sm:p-5 border-b border-white/10 bg-black/20 flex justify-between items-center z-10 backdrop-blur-md">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2 drop-shadow-md">
                                <Target size={20} className="text-indigo-400" />
                                Current Learning Path
                            </h2>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
                            <RoadmapView />
                        </div>
                    </div>

                    {/* Side Tiles (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar lg:pr-2 pb-6">
                        
                        {/* Stats Bento Tile */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none" />
                            
                            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4 drop-shadow-md">Your Progress</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* Level */}
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 hover:bg-black/60 duration-300 shadow-inner">
                                    <Trophy size={28} className="text-emerald-400 mb-2 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                                    <div className="text-3xl font-black text-white leading-none">{level}</div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">Level</div>
                                </div>
                                {/* Streak */}
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 hover:bg-black/60 duration-300 shadow-inner">
                                    <Flame size={28} className="text-orange-400 mb-2 drop-shadow-[0_0_12px_rgba(251,146,60,0.8)] fill-orange-400/20" />
                                    <div className="text-3xl font-black text-white leading-none">{user?.streak ?? 0}</div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">Day Streak</div>
                                </div>
                            </div>
                            
                            {/* XP Progress Bar */}
                            <div className="mt-4 bg-black/40 rounded-2xl p-4 border border-white/5 shadow-inner">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5 drop-shadow-md">
                                        <Zap size={16} className="text-indigo-400 fill-indigo-400/20" />
                                        <span className="font-bold text-white text-sm">{user?.totalXP ?? 0} XP</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40">{100 - progressToNextLevel} to next level</span>
                                </div>
                                <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative"
                                        style={{ width: `${progressToNextLevel}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Achievements Bento Tile */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden flex-1">
                            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4 drop-shadow-md">Recent Achievements</h3>
                            
                            <div className="space-y-3">
                                {/* Mock Badges - Future proofed for real data */}
                                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group/badge cursor-default">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover/badge:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <Award size={20} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white drop-shadow-sm">First Steps</h4>
                                        <p className="text-[11px] text-white/50 leading-tight mt-0.5">Started your learning journey.</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group/badge cursor-default">
                                    <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 group-hover/badge:scale-110 transition-transform shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                        <Flame size={20} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white drop-shadow-sm">On Fire</h4>
                                        <p className="text-[11px] text-white/50 leading-tight mt-0.5">Logged in for multiple days.</p>
                                    </div>
                                </div>
                                
                                {/* Locked badge silhouette */}
                                <div className="flex items-center gap-4 bg-black/10 p-3 rounded-2xl border border-white/5 opacity-50 grayscale cursor-not-allowed">
                                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                        <Trophy size={20} className="text-white/40" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white/60">Mastermind</h4>
                                        <p className="text-[11px] text-white/40 leading-tight mt-0.5">Reach Level 5 (Locked)</p>
                                    </div>
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
