import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Award } from 'lucide-react';
import useGamificationStore from '../../store/gamificationStore';
import BADGES, { RARITY_STYLES } from '../../utils/badges';

const RARITY_TABS = ['all', 'common', 'uncommon', 'rare', 'legendary'];

const BadgeDisplay = () => {
    const { unlockedBadges, stats } = useGamificationStore();
    const [activeTab, setActiveTab] = useState('all');

    const filtered = activeTab === 'all' ? BADGES : BADGES.filter(b => b.rarity === activeTab);

    return (
        <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden h-full flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Award size={18} className="text-amber-500" />
                    <h3 className="text-xs font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                        Your Achievements
                    </h3>
                </div>
                <span className="text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                    {unlockedBadges.length} / {BADGES.length} Earned
                </span>
            </div>

            {/* Rarity filter tabs */}
            <div className="flex gap-1 mb-4 relative z-10 overflow-x-auto pb-0.5">
                {RARITY_TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-shrink-0 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all ${
                            activeTab === tab
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Badge Grid */}
            <div className="flex-1 overflow-y-auto max-h-[300px] pr-1.5 custom-scrollbar relative z-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filtered.map((badge, idx) => {
                        const isUnlocked = unlockedBadges.includes(badge.id);
                        const rarity     = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;
                        const statVal    = stats?.[badge.condition] ?? 0;
                        const progressPct = Math.min(100, Math.round((statVal / badge.threshold) * 100));

                        return (
                            <motion.div
                                key={badge.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: Math.min(idx * 0.04, 0.5) }}
                                whileHover={{ y: -4, scale: 1.02 }}
                                className={`relative p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 group cursor-default ${
                                    isUnlocked
                                        ? `${rarity.bg} ${rarity.border} ${rarity.glow} dark:shadow-none`
                                        : 'bg-slate-100/30 dark:bg-white/2 border-slate-200/50 dark:border-white/5 opacity-40 grayscale'
                                }`}
                            >
                                {!isUnlocked && (
                                    <div className="absolute top-2 right-2 text-slate-400/60 dark:text-white/10">
                                        <Lock size={10} />
                                    </div>
                                )}

                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-transform duration-300 group-hover:scale-110 select-none ${
                                    isUnlocked
                                        ? 'bg-white dark:bg-slate-800 shadow-md border border-white/20'
                                        : 'bg-slate-200/50 dark:bg-white/5'
                                }`}>
                                    {badge.icon}
                                </div>

                                <h4 className={`text-[10px] font-black uppercase tracking-wider mt-3 truncate w-full ${
                                    isUnlocked
                                        ? 'text-slate-800 dark:text-white'
                                        : 'text-slate-500 dark:text-white/30'
                                }`}>
                                    {badge.name}
                                </h4>

                                {/* Progress bar for locked badges */}
                                {!isUnlocked && (
                                    <div className="w-full mt-2 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-400/60 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                )}

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900 dark:bg-slate-950 text-white rounded-xl p-2.5 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-[100] text-center border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                        {rarity.label} Achievement
                                    </p>
                                    <p className="text-xs font-bold mt-1 text-white leading-snug">
                                        {badge.description}
                                    </p>
                                    {!isUnlocked && (
                                        <p className="text-[10px] text-white/50 mt-1.5">
                                            {statVal} / {badge.threshold} — {progressPct}%
                                        </p>
                                    )}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-950" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BadgeDisplay;
