import React, { useState, useEffect } from 'react';
import { Shield, Trophy, ArrowUpCircle, ArrowDownCircle, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import useCourseStore from '../../store/courseStore';
import useGamificationStore from '../../store/gamificationStore';

const LEAGUES = [
    { name: 'ליגת הארד', color: 'from-amber-600 to-amber-700', shieldColor: '#cd7f32', border: 'border-amber-500/20' },
    { name: 'ליגת הכסף', color: 'from-slate-300 to-slate-400', shieldColor: '#c0c0c0', border: 'border-slate-350/20' },
    { name: 'ליגת הזהב', color: 'from-yellow-400 to-amber-500', shieldColor: '#ffd700', border: 'border-amber-400/30' },
    { name: 'ליגת הפלטינה', color: 'from-indigo-400 to-purple-500', shieldColor: '#a855f7', border: 'border-purple-400/30' },
    { name: 'ליגת היהלום', color: 'from-cyan-400 via-blue-500 to-indigo-600', shieldColor: '#22d3ee', border: 'border-cyan-400/40' }
];

const LeaguesPanel = () => {
    const { user: currentUser } = useCourseStore();
    const { stats } = useGamificationStore();

    const xp = currentUser?.totalXP ?? stats.total_xp ?? 0;
    
    // Dynamically calculate which league the user is in based on level
    const userLevel = stats.level || 1;
    const leagueIndex = Math.min(Math.floor((userLevel - 1) / 2), LEAGUES.length - 1);
    const activeLeague = LEAGUES[leagueIndex];
    const nextLeagueName = leagueIndex < LEAGUES.length - 1 ? LEAGUES[leagueIndex + 1].name : null;
    const prevLeagueName = leagueIndex > 0 ? LEAGUES[leagueIndex - 1].name : null;

    // Local countdown timer mockup
    const [timeLeft, setTimeLeft] = useState('נותרו: 3 ימים, 11 שעות');

    // Create league competitors where user is dynamically positioned based on their XP
    const baseCompetitors = [
        { name: 'ליאור כהן', xp: 2150, avatar: '🥷' },
        { name: 'נועה לוי', xp: 1980, avatar: '🦄' },
        { name: 'עידו מזרחי', xp: 1720, avatar: '🧠' },
        { name: 'שירה אלבז', xp: 1250, avatar: '🦊' },
        { name: 'אמיר אברהם', xp: 950, avatar: '🦁' },
        { name: 'מיכל יוסף', xp: 810, avatar: '🐼' }
    ];

    const allParticipants = [
        ...baseCompetitors,
        { name: 'אתה (משתמש)', xp: xp, avatar: '🎓', isYou: true }
    ].sort((a, b) => b.xp - a.xp);

    // Map ranks after sort
    const rankedList = allParticipants.map((p, idx) => ({ ...p, rank: idx + 1 }));

    return (
        <div className="glass-card rounded-3xl p-5 shadow-lg relative overflow-hidden group flex flex-col h-full font-medium" dir="rtl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Header / Active League Shield Banner */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 pb-5 border-b border-slate-200/60 dark:border-white/10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeLeague.color} flex items-center justify-center text-white shadow-md border-b-2 border-black/10 flex-shrink-0 animate-pulse`}>
                    <Shield size={32} fill="rgba(255,255,255,0.25)" className="stroke-[2]" />
                </div>
                <div className="text-center sm:text-right flex-1 min-w-0">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                        <span>הליגה השבועית שלך:</span>
                        <span className={`bg-gradient-to-r ${activeLeague.color} bg-clip-text text-transparent`}>
                            {activeLeague.name}
                        </span>
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-white/40 mt-1 flex items-center justify-center sm:justify-start gap-1">
                        <Clock size={12} />
                        <span>סבב הליגה מסתיים בעוד 3 ימים • התקדם כדי לעלות לדרגה הבאה</span>
                    </p>
                </div>
            </div>

            {/* Competitors List */}
            <div className="relative z-10 flex-1 space-y-2.5 mt-4 overflow-y-auto max-h-[320px] custom-scrollbar">
                {rankedList.map((entry, idx) => {
                    const isPromotionZone = entry.rank <= 3;
                    const isDemotionZone = entry.rank >= rankedList.length - 1;
                    
                    return (
                        <div
                            key={entry.name}
                            className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border ${
                                entry.isYou
                                    ? 'bg-gradient-to-l from-indigo-500/10 via-purple-500/10 to-transparent border-indigo-500/30 dark:border-indigo-400/40 shadow-md shadow-indigo-500/5'
                                    : 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-white/3 border-slate-200/50 dark:border-white/5 shadow-sm'
                            }`}
                        >
                            {/* Rank Indicator and Zone Arrows */}
                            <div className="w-8 flex flex-col items-center justify-center flex-shrink-0">
                                <span className={`text-xs font-black ${entry.isYou ? 'text-indigo-500 font-extrabold' : 'text-slate-500 dark:text-white/40'}`}>
                                    #{entry.rank}
                                </span>
                                {isPromotionZone && (
                                    <ArrowUpCircle size={12} className="text-emerald-500 mt-0.5" title="אזור עלייה" />
                                )}
                                {isDemotionZone && prevLeagueName && (
                                    <ArrowDownCircle size={12} className="text-rose-500 mt-0.5" title="אזור ירידה" />
                                )}
                            </div>

                            {/* User Avatar */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border transition-all duration-300 ${
                                entry.isYou
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-600 shadow-md'
                                    : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/70 border-slate-200/60 dark:border-white/10 shadow-sm'
                            }`}>
                                {entry.avatar}
                            </div>

                            {/* User Name */}
                            <span className={`text-xs font-bold flex-1 truncate text-right ${
                                entry.isYou
                                    ? 'text-indigo-600 dark:text-indigo-400 font-black'
                                    : 'text-slate-800 dark:text-white/95'
                            }`}>
                                {entry.isYou ? currentUser?.name || 'אתה' : entry.name}
                                {entry.isYou && (
                                    <span className="mr-1.5 text-[8px] font-black text-white bg-indigo-500/80 dark:bg-indigo-500/90 px-1.5 py-0.5 rounded-md uppercase shadow-sm">
                                        אתה
                                    </span>
                                )}
                            </span>

                            {/* Score Display */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 px-2.5 py-1 rounded-xl text-[10px] font-black text-slate-600 dark:text-white/70">
                                <Trophy size={11} className="text-amber-500 fill-amber-500/10" />
                                <span>{entry.xp.toLocaleString()} XP</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Promotion/Demotion Zone Legend */}
            <div className="relative z-10 grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-200/60 dark:border-white/10 text-xs">
                <div className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <ArrowUpCircle size={14} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-bold">טופ 3: אזור עלייה</p>
                        <p className="text-[10px] text-slate-400 dark:text-white/30">עליה ל{nextLeagueName || 'הדרגה העליונה'}</p>
                    </div>
                </div>
                {prevLeagueName && (
                    <div className="flex items-start gap-1.5 text-rose-500 dark:text-rose-400">
                        <ArrowDownCircle size={14} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold">בוטום 2: אזור סכנה</p>
                            <p className="text-[10px] text-slate-400 dark:text-white/30">ירידה ל{prevLeagueName}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaguesPanel;
