import React from 'react';
import { Medal, Zap } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';
import PanelEmptyState from './PanelEmptyState';
import { CardSkeleton } from '../common/Skeletons';
import { calculateLevel } from '../../utils/gamification';
import { RANK_MEDAL } from '../../utils/studentStatus';

/** Podium card showing the top three students by XP. */
const TopPerformers = ({ leaderboard, loading }) => {
    const top3 = leaderboard.slice(0, 3);
    return (
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-6 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-500/10">
                    <Medal size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                Top Performers
            </h3>
            <div className="space-y-2 relative z-10">
                {loading ? (
                    <CardSkeleton rows={3} />
                ) : top3.length === 0 ? (
                    <PanelEmptyState icon={<Medal size={18} />} title="No data yet" compact />
                ) : (
                    top3.map((s, i) => (
                        <div
                            key={s.userId || i}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                                i === 0
                                    ? 'bg-amber-50/60 border-amber-200/60 dark:bg-amber-500/8 dark:border-amber-500/20'
                                    : i === 1
                                      ? 'bg-slate-100/60 border-slate-200/60 dark:bg-white/5 dark:border-white/10'
                                      : 'bg-orange-50/40 border-orange-200/40 dark:bg-orange-500/5 dark:border-orange-500/15'
                            }`}
                        >
                            <span className="text-2xl w-8 text-center flex-shrink-0 select-none">
                                {RANK_MEDAL[i]}
                            </span>
                            <AvatarDisplay
                                photoUrl={s.photoUrl}
                                avatar={s.avatar}
                                size="w-9 h-9"
                                name={s.name}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">
                                    {s.name || 'Student'}
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-white/40 font-medium">
                                    Lv.{s.level || calculateLevel(s.xp)} ·{' '}
                                    {(s.xp || 0).toLocaleString()} XP
                                </p>
                            </div>
                            <span className="text-amber-500 dark:text-amber-400 flex-shrink-0">
                                <Zap size={14} />
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TopPerformers;
