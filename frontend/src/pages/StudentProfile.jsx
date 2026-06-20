import React from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import useCourseStore from '../store/courseStore';
import useAuthStore from '../store/authStore';
import useGamificationStore from '../store/gamificationStore';
import { AVATARS, TITLES, SHOP_ITEMS, FRAMES, THEMES, LEVEL_MILESTONES, QUEST_DEFINITIONS } from '../constants/gamification';
import { calculateLevel } from '../utils/gamification';
import Leaderboard from '../components/gamification/Leaderboard';
import StreakCalendar from '../components/gamification/StreakCalendar';
import BadgeDisplay from '../components/gamification/BadgeDisplay';
import { Trophy, Zap, Flame, Check, Lock, Sparkles, BookOpen, Target, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

const THEME_SWATCHES = {
    default:   ['#6366f1', '#8b5cf6', '#64748b'],
    arcade:    ['#10b981', '#84cc16', '#0f172a'],
    space:     ['#6366f1', '#8b5cf6', '#0ea5e9'],
    cyberpunk: ['#ec4899', '#06b6d4', '#0f172a'],
};

const StudentProfile = () => {
    const { user: courseUser } = useCourseStore();
    const { user: authUser } = useAuthStore();
    const user = { ...courseUser, ...authUser };

    const {
        activeAvatar, activeTitle, activeTheme, activeFrame,
        unlockedAvatars, unlockedTitles, unlockedThemes, unlockedFrames,
        selectAvatar, selectTitle, selectTheme, selectFrame,
        stats, coins, streakShields, xpBoosts, weekendFreezes,
        questsProgress, questsClaimed, claimQuestReward,
    } = useGamificationStore();

    const currentAvatar = AVATARS.concat(SHOP_ITEMS.avatars).find(a => a.id === activeAvatar) || { emoji: '🎓', name: 'Student' };
    const currentTitle  = TITLES.concat(SHOP_ITEMS.titles).find(t => t.id === activeTitle)   || { name: 'Beginner' };

    const totalXP           = user?.totalXP ?? stats.total_xp ?? 0;
    const level             = calculateLevel(totalXP);
    const progressToNext    = totalXP % 100;

    const displayQuests = [
        { category: 'Daily',     ...QUEST_DEFINITIONS.daily[0]     },
        { category: 'Weekly',    ...QUEST_DEFINITIONS.weekly[0]    },
        { category: 'Milestone', ...QUEST_DEFINITIONS.milestone[0] },
    ];

    const statCards = [
        { Icon: Trophy,        label: 'Level',           value: level,                        iconCls: 'text-amber-500',   bg: 'from-amber-500/10 to-yellow-500/5 border-amber-500/20'   },
        { Icon: Zap,           label: 'Total XP',        value: stats.total_xp || 0,          iconCls: 'text-indigo-500',  bg: 'from-indigo-500/10 to-blue-500/5 border-indigo-500/20'  },
        { Icon: Flame,         label: 'Day Streak',      value: stats.streak || 0,            iconCls: 'text-orange-500',  bg: 'from-orange-500/10 to-red-500/5 border-orange-500/20'   },
        { Icon: BookOpen,      label: 'Lessons',         value: stats.lessons_completed || 0, iconCls: 'text-emerald-500', bg: 'from-emerald-500/10 to-green-500/5 border-emerald-500/20' },
        { Icon: Target,        label: 'Perfect Quizzes', value: stats.perfect_quizzes || 0,   iconCls: 'text-rose-500',    bg: 'from-rose-500/10 to-pink-500/5 border-rose-500/20'       },
        { Icon: GraduationCap, label: 'Courses Done',    value: stats.courses_completed || 0, iconCls: 'text-violet-500',  bg: 'from-violet-500/10 to-purple-500/5 border-violet-500/20' },
    ];

    return (
        <StudentLayout title="Student Profile">
            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative z-[1] p-4 lg:p-6 max-w-[1600px] mx-auto flex flex-col gap-8 animate-fade-in">

                {/* Page Header */}
                <header>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-slate-800 dark:text-white drop-shadow-sm tracking-tight">Student Profile</h1>
                    <p className="text-indigo-600 dark:text-indigo-200 mt-1 font-medium">Your gaming identity, achievements, and learning stats.</p>
                </header>

                {/* ── HERO CARD ── */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl p-6 lg:p-8"
                    style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4c1d95 65%, #1e293b 100%)' }}>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/3 w-80 h-64 rounded-full bg-indigo-500/20 blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-64 h-56 rounded-full bg-purple-500/20 blur-3xl" />
                        <div className="absolute inset-0 dot-grid opacity-10" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-start lg:items-center">

                        {/* Avatar + Identity */}
                        <div className="flex items-center gap-5 flex-shrink-0">
                            <div className="relative">
                                <div className={`w-24 h-24 lg:w-28 lg:h-28 rounded-3xl bg-white/10 backdrop-blur border-2 border-white/20 flex items-center justify-center text-5xl lg:text-6xl select-none shadow-2xl avatar-frame-${activeFrame}`}>
                                    {currentAvatar.emoji}
                                </div>
                                <motion.div
                                    initial={{ scale: 0, rotate: -15 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                                    className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg border-2 border-amber-300/30"
                                >
                                    {level}
                                </motion.div>
                            </div>
                            <div>
                                <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight">{user?.name || 'Student'}</h2>
                                <span className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 rounded-full text-indigo-200 text-xs font-black uppercase tracking-widest">
                                    <Sparkles size={10} />
                                    {currentTitle.name}
                                </span>
                                <p className="text-white/40 text-xs mt-1.5">{user?.email}</p>
                            </div>
                        </div>

                        {/* XP Progress */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
                                    Level {level} · {user?.levelName || 'Scholar'}
                                </span>
                                <span className="text-indigo-300 text-xs font-black">{100 - progressToNext} XP to level {level + 1}</span>
                            </div>
                            <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden shadow-inner border border-white/5">
                                <motion.div
                                    className="h-full rounded-full relative overflow-hidden"
                                    style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${Math.max(2, progressToNext)}%` }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                                </motion.div>
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[10px] text-white/30 font-bold">{totalXP} XP total</span>
                                <span className="text-[10px] text-white/30 font-bold">Next at {level * 100} XP</span>
                            </div>

                            {/* Quick stat chips */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {[
                                    { Icon: Trophy,   label: `Level ${level}`,                    cls: 'text-amber-300  bg-amber-500/20  border-amber-500/30'  },
                                    { Icon: Zap,      label: `${stats.total_xp || 0} XP`,         cls: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30' },
                                    { Icon: Flame,    label: `${stats.streak || 0}d streak`,       cls: 'text-orange-300 bg-orange-500/20 border-orange-500/30' },
                                    { Icon: BookOpen, label: `${stats.lessons_completed || 0} lessons`, cls: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' },
                                ].map((chip) => (
                                    <span key={chip.label} className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${chip.cls}`}>
                                        <chip.Icon size={11} />
                                        {chip.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Economy / Inventory */}
                        <div className="flex-shrink-0">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">Inventory</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { emoji: '🪙', label: 'Coins',     value: coins,          cls: 'border-amber-500/30  bg-amber-500/10  text-amber-300'  },
                                    { emoji: '🛡️', label: 'Shields',   value: streakShields,  cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
                                    { emoji: '⚡', label: 'XP Boosts', value: xpBoosts,       cls: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' },
                                    { emoji: '🥶', label: 'Freezes',   value: weekendFreezes, cls: 'border-cyan-500/30   bg-cyan-500/10   text-cyan-300'   },
                                ].map(({ emoji, label, value, cls }) => (
                                    <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${cls}`}>
                                        <span className="text-lg leading-none">{emoji}</span>
                                        <div>
                                            <div className="text-base font-black leading-none">{value}</div>
                                            <div className="text-[9px] text-white/40 font-bold uppercase leading-tight">{label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {statCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -4, scale: 1.03 }}
                            className={`bg-gradient-to-br ${card.bg} border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm cursor-default`}
                        >
                            <card.Icon size={22} className={`${card.iconCls} mb-2`} />
                            <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{card.value}</span>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mt-1.5">{card.label}</span>
                        </motion.div>
                    ))}
                </div>

                {/* ── ACTIVE QUESTS ── */}
                <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="text-xl">⚔️</span> Active Quests
                            </h3>
                            <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-wider">Complete for bonus XP</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {displayQuests.map((quest) => {
                                const progress  = questsProgress?.[quest.id] ?? 0;
                                const isClaimed = questsClaimed?.includes(quest.id);
                                const isComplete = progress >= quest.target;
                                const pct = Math.min(100, Math.round((progress / quest.target) * 100));

                                return (
                                    <div key={quest.id} className={`p-4 rounded-2xl border transition-all ${
                                        isClaimed
                                            ? 'bg-slate-50/50 dark:bg-white/3 border-slate-200/50 dark:border-white/5 opacity-60'
                                            : isComplete
                                                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                                : 'bg-slate-50/50 dark:bg-black/20 border-slate-200/60 dark:border-white/5'
                                    }`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{quest.category}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-lg flex-shrink-0">{quest.icon}</span>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{quest.title}</p>
                                                </div>
                                            </div>
                                            <span className="flex-shrink-0 ml-2 text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                                                +{quest.xp} XP
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-white/40">
                                                <span>{progress} / {quest.target}</span>
                                                <span>{pct}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full ${isComplete ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                />
                                            </div>
                                        </div>
                                        {isComplete && !isClaimed && (
                                            <button
                                                onClick={() => claimQuestReward(quest.id)}
                                                className="mt-3 w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-black rounded-xl transition-colors"
                                            >
                                                Claim Reward ✓
                                            </button>
                                        )}
                                        {isClaimed && (
                                            <p className="mt-3 text-center text-xs font-black text-slate-400 dark:text-white/30">✓ Claimed</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── CUSTOMIZATION: Avatar & Title ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Avatar Picker */}
                    <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 pointer-events-none" />
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-6 relative z-10">Select Active Avatar</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-4 relative z-10">
                            {AVATARS.concat(SHOP_ITEMS.avatars).map(avatar => {
                                const isUnlocked = unlockedAvatars.includes(avatar.id) || (avatar.levelReq !== undefined && level >= avatar.levelReq);
                                const isActive   = activeAvatar === avatar.id;
                                return (
                                    <button
                                        key={avatar.id}
                                        onClick={() => isUnlocked && selectAvatar(avatar.id)}
                                        disabled={!isUnlocked}
                                        title={`${avatar.name}${avatar.levelReq ? ` (Level ${avatar.levelReq})` : ''}`}
                                        className={`h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all relative ${
                                            isActive
                                                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-transparent text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] scale-105'
                                                : isUnlocked
                                                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:scale-105'
                                                    : 'bg-slate-100/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-white/5 opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <span className="text-2xl select-none">{avatar.emoji}</span>
                                        {!isUnlocked && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800/80 text-white flex items-center justify-center border border-white/20">
                                                <Lock size={10} />
                                            </div>
                                        )}
                                        {isActive && <Check size={10} className="absolute top-1.5 right-1.5 stroke-[3] text-white/80" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title Picker */}
                    <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-6 relative z-10">Select Active Title</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 relative z-10">
                            {TITLES.concat(SHOP_ITEMS.titles).map(title => {
                                const isUnlocked = unlockedTitles.includes(title.id) || (title.levelReq !== undefined && level >= title.levelReq);
                                const isActive   = activeTitle === title.id;
                                return (
                                    <button
                                        key={title.id}
                                        onClick={() => isUnlocked && selectTitle(title.id)}
                                        disabled={!isUnlocked}
                                        className={`px-4 py-3 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 relative ${
                                            isActive
                                                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 border-transparent text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]'
                                                : isUnlocked
                                                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                                                    : 'bg-slate-100/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-white/20 opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <span>{title.name}</span>
                                        {!isUnlocked ? <Lock size={12} /> : isActive && <Check size={12} className="stroke-[3]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── CUSTOMIZATION: Themes & Frames ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Theme Picker */}
                    <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-6 relative z-10">Active Theme</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                            {THEMES.map(themeItem => {
                                const isUnlocked = unlockedThemes.includes(themeItem.id);
                                const isActive   = activeTheme === themeItem.id;
                                const swatches   = THEME_SWATCHES[themeItem.id] || [];
                                return (
                                    <button
                                        key={themeItem.id}
                                        onClick={() => isUnlocked && selectTheme(themeItem.id)}
                                        disabled={!isUnlocked}
                                        className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all relative p-2 ${
                                            isActive
                                                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 border-transparent text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]'
                                                : isUnlocked
                                                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                                                    : 'bg-slate-100/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-white/20 opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex gap-1">
                                            {swatches.map((color, i) => (
                                                <div key={i} className="w-3 h-3 rounded-full border border-white/20 shadow-sm" style={{ background: color }} />
                                            ))}
                                        </div>
                                        <span className="text-[11px] font-bold leading-tight text-center">{themeItem.name}</span>
                                        {!isUnlocked && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800/80 text-white flex items-center justify-center border border-white/20">
                                                <Lock size={10} />
                                            </div>
                                        )}
                                        {isActive && <Check size={10} className="absolute top-2 right-2 stroke-[3]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Frame Picker — live avatar preview */}
                    <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-6 relative z-10">Avatar Frame</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
                            {FRAMES.map(frameItem => {
                                const isUnlocked = unlockedFrames.includes(frameItem.id);
                                const isActive   = activeFrame === frameItem.id;
                                return (
                                    <button
                                        key={frameItem.id}
                                        onClick={() => isUnlocked && selectFrame(frameItem.id)}
                                        disabled={!isUnlocked}
                                        className={`h-24 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all relative ${
                                            isActive
                                                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 border-transparent shadow-[0_4px_12px_rgba(99,102,241,0.3)]'
                                                : isUnlocked
                                                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:scale-105'
                                                    : 'bg-slate-100/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-white/5 opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-100 dark:bg-slate-800 avatar-frame-${frameItem.id}`}>
                                            {currentAvatar.emoji}
                                        </div>
                                        <span className={`text-[10px] font-bold text-center leading-tight ${isActive ? 'text-white' : 'text-slate-600 dark:text-white/60'}`}>
                                            {frameItem.name}
                                        </span>
                                        {!isUnlocked && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800/80 text-white flex items-center justify-center border border-white/20">
                                                <Lock size={10} />
                                            </div>
                                        )}
                                        {isActive && <Check size={10} className="absolute top-2 right-2 stroke-[3] text-white" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── LEVEL ROADMAP ── */}
                <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />
                    <div className="relative z-10 mb-6">
                        <h3 className="font-display font-black text-xl sm:text-2xl text-slate-800 dark:text-white flex items-center gap-2">
                            <Trophy className="text-amber-500" />
                            Level Rewards Roadmap
                        </h3>
                        <p className="text-slate-500 dark:text-white/50 text-sm mt-0.5">Unlock exclusive avatars and titles as you level up.</p>
                    </div>

                    <div className="relative z-10 overflow-x-auto pb-2">
                        <div className="flex items-center min-w-max">
                            {LEVEL_MILESTONES.map((milestone, idx) => {
                                const isUnlocked     = level >= milestone.level;
                                const isNext         = !isUnlocked && (idx === 0 || level >= LEVEL_MILESTONES[idx - 1]?.level);
                                const connectorFilled = isUnlocked;

                                return (
                                    <React.Fragment key={milestone.level}>
                                        <div className={`relative flex flex-col items-center text-center w-36 p-4 rounded-2xl border-2 transition-all ${
                                            isUnlocked
                                                ? 'bg-gradient-to-b from-indigo-500/10 to-purple-500/5 border-indigo-500/30 text-slate-800 dark:text-white'
                                                : isNext
                                                    ? 'bg-gradient-to-b from-amber-500/10 to-orange-500/5 border-amber-500/40 text-slate-600 dark:text-white/60'
                                                    : 'bg-slate-50/30 dark:bg-slate-950/20 border-slate-200/30 dark:border-white/5 text-slate-400 dark:text-white/20'
                                        }`}>
                                            {isNext && (
                                                <div className="absolute inset-0 rounded-2xl bg-amber-500/5 animate-pulse pointer-events-none" />
                                            )}

                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black mb-3 shadow-sm ${
                                                isUnlocked
                                                    ? 'bg-indigo-600 text-white'
                                                    : isNext
                                                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                                        : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                                            }`}>
                                                Lvl {milestone.level}
                                            </div>

                                            <span className={`text-3xl mb-2 select-none transition-all ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                                                {milestone.emoji}
                                            </span>

                                            <p className="font-black text-xs">{milestone.avatar}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded ${
                                                isUnlocked
                                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                    : 'bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-white/20'
                                            }`}>
                                                {milestone.title}
                                            </p>

                                            <p className="text-[9px] text-slate-400 dark:text-white/30 mt-1.5">
                                                {milestone.level * 100} XP required
                                            </p>

                                            <div className="absolute top-2 right-2">
                                                {isUnlocked
                                                    ? <span className="text-emerald-500 text-xs font-black">✓</span>
                                                    : <Lock size={9} className="text-slate-400 dark:text-white/20" />
                                                }
                                            </div>
                                        </div>

                                        {idx < LEVEL_MILESTONES.length - 1 && (
                                            <div className={`h-1.5 w-8 mx-1 rounded-full flex-shrink-0 transition-all ${
                                                connectorFilled
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                                    : 'bg-slate-200 dark:bg-white/10'
                                            }`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Leaderboard & Badge Display ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col h-full"><Leaderboard /></div>
                    <div className="flex flex-col h-full"><BadgeDisplay /></div>
                </div>

                {/* ── Streak Calendar ── */}
                <div className="pb-10">
                    <StreakCalendar />
                </div>

            </div>
        </StudentLayout>
    );
};

export default StudentProfile;
