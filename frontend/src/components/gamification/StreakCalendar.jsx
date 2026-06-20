import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import useGamificationStore from '../../store/gamificationStore';
import useCourseStore from '../../store/courseStore';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const STREAK_MILESTONES = [
    { days: 3,  label: '3 days',  icon: '🌱' },
    { days: 7,  label: '7 days',  icon: '⚡' },
    { days: 30, label: '30 days', icon: '🏆' },
];

const StreakCalendar = () => {
    const { activityLog } = useGamificationStore();
    const { user } = useCourseStore();

    const today = new Date();
    const days = Array.from({ length: 28 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (27 - i));
        const iso = d.toISOString().split('T')[0];
        return {
            iso,
            dayName: DAYS[d.getDay()],
            dayNum: d.getDate(),
            isToday: i === 27,
            isActive: activityLog.includes(iso),
        };
    });

    const streak = user?.streak ?? 0;

    const activeCount = days.filter(d => d.isActive).length;

    const bestStreak = useMemo(() => {
        if (!activityLog.length) return 0;
        const sorted = [...activityLog].sort();
        let best = 1, curr = 1;
        for (let i = 1; i < sorted.length; i++) {
            const prev = new Date(sorted[i - 1]);
            const cur  = new Date(sorted[i]);
            const diff = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
            curr = diff === 1 ? curr + 1 : 1;
            if (curr > best) best = curr;
        }
        return best;
    }, [activityLog]);

    const weeks = [
        days.slice(0,  7),
        days.slice(7,  14),
        days.slice(14, 21),
        days.slice(21, 28),
    ];

    return (
        <div className="glass-card rounded-3xl p-4 sm:p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">
                            Learning Streak
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-xl">
                                <Flame size={14} className="text-orange-500 fill-orange-500/40" />
                                <span className="text-sm font-black text-orange-500">{streak} days</span>
                            </div>
                            <span className="text-xs text-slate-400 dark:text-white/30 font-bold">
                                Best: {bestStreak}d
                            </span>
                            <span className="text-xs text-slate-400 dark:text-white/30 font-bold">
                                Active: {activeCount}/28
                            </span>
                        </div>
                    </div>

                    {/* Milestone chips */}
                    <div className="flex flex-wrap gap-1.5">
                        {STREAK_MILESTONES.map(m => (
                            <span
                                key={m.days}
                                className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${
                                    streak >= m.days
                                        ? 'bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400'
                                        : 'bg-slate-100/50 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-400 dark:text-white/30'
                                }`}
                            >
                                {m.icon} {m.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Day column headers */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                    {DAYS.map((d, i) => (
                        <div key={i} className="text-center text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-white/30">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="space-y-0.5 sm:space-y-1">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 gap-0.5 sm:gap-1">
                            {week.map((day, di) => {
                                const hasRightConnection = di < 6 && day.isActive && week[di + 1]?.isActive;

                                return (
                                    <div key={day.iso} className="relative aspect-square">
                                        {hasRightConnection && (
                                            <div className="absolute top-[18%] bottom-[18%] -right-[6px] w-[12px] bg-gradient-to-r from-orange-500 to-red-500 z-0 pointer-events-none" />
                                        )}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: (wi * 7 + di) * 0.015 }}
                                            title={day.iso}
                                            className={`
                                                w-full h-full rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold relative z-10 select-none transition-all duration-200
                                                ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-transparent' : ''}
                                                ${day.isActive
                                                    ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-[0_3px_8px_rgba(249,115,22,0.35)]'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 hover:bg-slate-200 dark:hover:bg-white/8'
                                                }
                                            `}
                                        >
                                            {day.dayNum}
                                            {day.isActive && day.isToday && (
                                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-white dark:border-slate-900" />
                                            )}
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 mt-3 justify-end">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-slate-200 dark:bg-white/10" />
                        <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold">Inactive</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-400 to-red-500" />
                        <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold">Active day</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StreakCalendar;
