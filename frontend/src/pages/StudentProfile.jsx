import React from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import useCourseStore from '../store/courseStore';
import useGamificationStore from '../store/gamificationStore';
import { AVATARS, TITLES, SHOP_ITEMS } from '../constants/gamification';
import Leaderboard from '../components/gamification/Leaderboard';
import StreakCalendar from '../components/gamification/StreakCalendar';
import BadgeDisplay from '../components/gamification/BadgeDisplay';
import { Trophy, Zap, Flame, User, Mail, Shield, Check, Lock, Sparkles, Coins, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentProfile = () => {
    const { user } = useCourseStore();
    const {
        activeAvatar,
        activeTitle,
        unlockedAvatars,
        unlockedTitles,
        selectAvatar,
        selectTitle,
        stats,
    } = useGamificationStore();

    const currentAvatar = AVATARS.concat(SHOP_ITEMS.avatars).find(a => a.id === activeAvatar) || { emoji: '🎓', name: 'Student' };
    const currentTitle = TITLES.concat(SHOP_ITEMS.titles).find(t => t.id === activeTitle) || { name: 'Beginner' };

    const totalXP = user?.totalXP ?? stats.total_xp ?? 0;
    const level = Math.floor(totalXP / 100) + 1;
    const progressToNextLevel = totalXP % 100;

    return (
        <StudentLayout title="Student Profile">
            {/* Ambient background orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative z-[1] p-4 lg:p-6 max-w-[1600px] mx-auto flex flex-col gap-8 animate-fade-in">
                
                {/* ── Page Header ── */}
                <header>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-slate-800 dark:text-white drop-shadow-sm tracking-tight">Student Profile</h1>
                    <p className="text-indigo-600 dark:text-indigo-200 mt-1 font-medium">Manage your digital identity, view your achievements, and track your progress.</p>
                </header>

                {/* ── First Row: Profile Card & Gamification Stats ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Core Info & Avatar Identity */}
                    <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-40 pointer-events-none" />
                        
                        <div className="relative mb-4 mt-2">
                            <div className="w-24 h-24 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500 flex items-center justify-center text-5xl shadow-[0_8px_30px_rgba(99,102,241,0.2)] select-none transition-transform duration-300 group-hover:scale-105">
                                {currentAvatar.emoji}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-black shadow-sm">
                                ✓
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-slate-800 dark:text-white drop-shadow-sm">{user?.name || 'Student Name'}</h2>
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-black uppercase tracking-widest mt-1.5 shadow-inner">
                            {currentTitle.name}
                        </span>

                        <div className="w-full mt-6 space-y-3.5 bg-slate-50/50 dark:bg-black/20 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 text-left">
                            <div className="flex items-center gap-3 text-sm">
                                <User size={16} className="text-slate-400 dark:text-white/40 flex-shrink-0" />
                                <span className="text-slate-500 dark:text-white/50 w-14 font-bold">Name:</span>
                                <span className="text-slate-800 dark:text-white truncate font-medium">{user?.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Mail size={16} className="text-slate-400 dark:text-white/40 flex-shrink-0" />
                                <span className="text-slate-500 dark:text-white/50 w-14 font-bold">Email:</span>
                                <span className="text-slate-800 dark:text-white truncate font-medium">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Shield size={16} className="text-slate-400 dark:text-white/40 flex-shrink-0" />
                                <span className="text-slate-500 dark:text-white/50 w-14 font-bold">Role:</span>
                                <span className="text-slate-800 dark:text-white capitalize font-medium">Student</span>
                            </div>
                        </div>
                    </div>

                    {/* XP Progress & Stats Grid */}
                    <div className="lg:col-span-2 bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
                        
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">XP Progress & Stats</h3>
                                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black text-sm">
                                    <Sparkles size={16} />
                                    Level {level}
                                </span>
                            </div>

                            {/* Stats Cards grid */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-50/50 dark:bg-black/30 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center text-center shadow-inner">
                                    <Trophy size={22} className="text-yellow-500 mb-1.5" />
                                    <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{level}</span>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mt-1">Level</span>
                                </div>
                                <div className="bg-slate-50/50 dark:bg-black/30 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center text-center shadow-inner">
                                    <Zap size={22} className="text-indigo-500 mb-1.5" />
                                    <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{stats.total_xp || 0}</span>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mt-1">Total XP</span>
                                </div>
                                <div className="bg-slate-50/50 dark:bg-black/30 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center text-center shadow-inner">
                                    <Flame size={22} className="text-orange-500 mb-1.5 fill-orange-500/10" />
                                    <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{stats.streak || 0}</span>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mt-1">Streak</span>
                                </div>
                            </div>
                        </div>

                        {/* XP Progress Bar */}
                        <div className="bg-slate-50/50 dark:bg-black/30 p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-inner mt-auto">
                            <div className="flex justify-between items-end mb-2.5">
                                <span className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-wider">Leveling Progress</span>
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{100 - progressToNextLevel} XP to next level</span>
                            </div>
                            <div className="h-3 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
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

                </div>

                {/* ── Second Row: Customize Identity & Avatar Picker ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Avatar Picker Card */}
                    <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 pointer-events-none" />
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-6 relative z-10">Select Active Avatar</h3>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-4 relative z-10">
                            {AVATARS.concat(SHOP_ITEMS.avatars).map(avatar => {
                                const isUnlocked = unlockedAvatars.includes(avatar.id) || (avatar.levelReq !== undefined && level >= avatar.levelReq);
                                const isActive = activeAvatar === avatar.id;

                                return (
                                    <button
                                        key={avatar.id}
                                        onClick={() => isUnlocked && selectAvatar(avatar.id)}
                                        disabled={!isUnlocked}
                                        className={`h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all relative ${
                                            isActive
                                                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-transparent text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] scale-105'
                                                : isUnlocked
                                                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:scale-102'
                                                    : 'bg-slate-100/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-white/20 opacity-60 cursor-not-allowed'
                                        }`}
                                        title={`${avatar.name} ${avatar.levelReq !== undefined ? `(Requires Level ${avatar.levelReq})` : '(Shop Item)'}`}
                                    >
                                        <span className="text-2xl select-none">{avatar.emoji}</span>
                                        {!isUnlocked && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800/80 text-white flex items-center justify-center border border-white/20">
                                                <Lock size={10} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title Picker Card */}
                    <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-6 relative z-10">Select Active Title</h3>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 relative z-10">
                            {TITLES.concat(SHOP_ITEMS.titles).map(title => {
                                const isUnlocked = unlockedTitles.includes(title.id) || (title.levelReq !== undefined && level >= title.levelReq);
                                const isActive = activeTitle === title.id;

                                return (
                                    <button
                                        key={title.id}
                                        onClick={() => isUnlocked && selectTitle(title.id)}
                                        disabled={!isUnlocked}
                                        className={`px-4 py-3 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 relative ${
                                            isActive
                                                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 border-transparent text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] scale-102'
                                                : isUnlocked
                                                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                                                    : 'bg-slate-100/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-white/20 opacity-60 cursor-not-allowed'
                                        }`}
                                    >
                                        <span>{title.name}</span>
                                        {!isUnlocked ? (
                                            <Lock size={12} className="text-slate-400 dark:text-white/20" />
                                        ) : (
                                            isActive && <Check size={12} className="stroke-[3]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* ── Level Rewards Roadmap Timeline ── */}
                <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                    
                    <div className="relative z-10 mb-6">
                        <h3 className="font-display font-black text-xl sm:text-2xl text-slate-800 dark:text-white flex items-center gap-2">
                            <Trophy className="text-amber-500" />
                            Level Rewards Roadmap / מסלול פרסי עליית רמות
                        </h3>
                        <p className="text-slate-500 dark:text-white/50 text-sm mt-0.5">Track your level progression and the exclusive avatars and titles you unlock at each milestone.</p>
                    </div>

                    {/* Timeline row */}
                    <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {[
                            { level: 1, emoji: '🎓', avatar: 'Student', title: 'Beginner', desc: 'Initial Unlock' },
                            { level: 2, emoji: '📚', avatar: 'Scholar', title: 'Curious Learner', desc: 'Bronze Milestone' },
                            { level: 3, emoji: '🧠', avatar: 'Brainiac', title: 'Knowledge Seeker', desc: 'Silver Milestone' },
                            { level: 4, emoji: '⚡', avatar: 'Speed Demon', title: 'Speed Runner', desc: 'Gold Milestone' },
                            { level: 5, emoji: '🥷', avatar: 'Code Ninja', title: 'Code Ninja', desc: 'Platinum Milestone' },
                            { level: 6, emoji: '🧙‍♂️', avatar: 'AI Sorcerer', title: 'AI Sorcerer', desc: 'Emerald Milestone' },
                            { level: 8, emoji: '👑', avatar: 'Grandmaster', title: 'Grandmaster', desc: 'Legendary Milestone' }
                        ].map((milestone) => {
                            const isUnlocked = level >= milestone.level;
                            return (
                                <div 
                                    key={milestone.level} 
                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
                                        isUnlocked
                                            ? 'bg-gradient-to-b from-indigo-500/5 to-purple-500/5 border-indigo-500/20 text-slate-800 dark:text-white'
                                            : 'bg-slate-100/40 dark:bg-slate-950/20 border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-white/20'
                                    }`}
                                >
                                    {/* Level Badge */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black mb-3 ${
                                        isUnlocked 
                                            ? 'bg-indigo-600 text-white shadow-md' 
                                            : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                                    }`}>
                                        Lvl {milestone.level}
                                    </div>

                                    {/* Reward Avatar Emoji */}
                                    <span className={`text-3xl mb-2 select-none filter transition ${isUnlocked ? '' : 'grayscale opacity-40'}`}>
                                        {milestone.emoji}
                                    </span>

                                    {/* Reward details */}
                                    <p className={`font-black text-xs ${isUnlocked ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-white/20'}`}>
                                        {milestone.avatar}
                                    </p>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded ${
                                        isUnlocked 
                                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                                            : 'bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-white/10'
                                    }`}>
                                        {milestone.title}
                                    </p>
                                    
                                    <p className="text-[9px] text-slate-400 dark:text-white/30 mt-2 leading-tight">
                                        {milestone.desc}
                                    </p>

                                    {/* Status Icon Indicator */}
                                    <div className="absolute top-2 right-2">
                                        {isUnlocked ? (
                                            <span className="text-emerald-500 text-xs font-bold" title="Unlocked">✓</span>
                                        ) : (
                                            <Lock size={10} className="text-slate-400 dark:text-white/20" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Third Row: Leaderboard (Results Table) & Achievements Badge Display ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Leaderboard Panel */}
                    <div className="flex flex-col h-full">
                        <Leaderboard />
                    </div>

                    {/* Achievements Badge Gallery */}
                    <div className="flex flex-col h-full">
                        <BadgeDisplay />
                    </div>

                </div>

                {/* ── Bottom Row: Streak Calendar ── */}
                <div className="grid grid-cols-1 gap-8 pb-10">
                    <StreakCalendar />
                </div>

            </div>
        </StudentLayout>
    );
};

export default StudentProfile;
