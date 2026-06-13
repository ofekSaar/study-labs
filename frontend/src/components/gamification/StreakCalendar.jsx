import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import useGamificationStore from '../../store/gamificationStore';
import useCourseStore from '../../store/courseStore';

const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

const StreakCalendar = () => {
    const { activityLog } = useGamificationStore();
    const { user } = useCourseStore();

    // Build the last 28 days
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

    // Calculate current streak
    const streak = user?.streak ?? 0;

    // Group into 4 weeks of 7 days
    const weeks = [
        days.slice(0, 7),
        days.slice(7, 14),
        days.slice(14, 21),
        days.slice(21, 28),
    ];

    return (
        <div className="glass-card rounded-3xl p-3 sm:p-5 relative overflow-hidden group" dir="rtl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">
                        Learning Streak
                    </p>
                    <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-xl">
                        <Flame size={14} className="text-orange-500 fill-orange-500/40" />
                        <span className="text-xs font-black text-orange-500">{streak} ימים</span>
                    </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                    {DAYS.map((d, index) => (
                        <div key={index} className="text-center text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-white/30">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="space-y-0.5 sm:space-y-1">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 gap-0.5 sm:gap-1">
                            {week.map((day, di) => {
                                // In RTL, the next day in calendar (di + 1) is to the left of the current day.
                                // If current day is active and the next day in the week is also active, draw a bridge.
                                const hasLeftConnection = di < 6 && day.isActive && week[di + 1]?.isActive;

                                return (
                                    <div key={day.iso} className="relative aspect-square">
                                        {hasLeftConnection && (
                                            <div className="absolute top-[18%] bottom-[18%] -left-[6px] w-[12px] bg-gradient-to-l from-orange-500 via-orange-550 to-red-500 z-0 pointer-events-none" />
                                        )}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: (wi * 7 + di) * 0.015 }}
                                            title={day.iso}
                                            className={`
                                                w-full h-full rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold relative z-10 select-none transition-all duration-255
                                                ${day.isToday
                                                    ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-transparent'
                                                    : ''
                                                }
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
                        <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold">ללא פעילות</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-400 to-red-500" />
                        <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold">יום פעיל</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StreakCalendar;
