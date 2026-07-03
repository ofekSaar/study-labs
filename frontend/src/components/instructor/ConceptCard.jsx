import React from 'react';
import MiniRing from './MiniRing';

/** Mastery-level card for a single course concept/topic. */
const ConceptCard = ({ item }) => {
    const ringColor =
        item.masteryLevel > 85 ? '#10b981' : item.masteryLevel > 72 ? '#f59e0b' : '#ef4444';
    const bgCls =
        item.masteryLevel > 85
            ? 'bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-500/15'
            : item.masteryLevel > 72
              ? 'bg-amber-50/60 dark:bg-amber-500/5 border-amber-200/50 dark:border-amber-500/15'
              : 'bg-red-50/60 dark:bg-red-500/5 border-red-200/50 dark:border-red-500/15';
    const chipCls =
        item.status === 'Excellent'
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
            : item.status === 'Moderate'
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
              : 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30';

    return (
        <div
            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all hover:scale-[1.02] ${bgCls}`}
        >
            <MiniRing pct={item.masteryLevel} size={72} stroke={7} color={ringColor} />
            <div className="text-center">
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight line-clamp-2 mb-2">
                    {item.topic}
                </p>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {item.masteryLevel}%
                    </span>
                    <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${chipCls}`}
                    >
                        {item.status}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ConceptCard;
