import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, CheckCircle2, Award, Clock } from 'lucide-react';
import useGamificationStore from '../../store/gamificationStore';
import sounds from '../../utils/soundManager';

const QuestPanel = () => {
    const { activeQuests, questsProgress, questsClaimed, claimQuestReward, initializeQuests } =
        useGamificationStore();
    const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'weekly' | 'milestone'

    useEffect(() => {
        initializeQuests();
    }, [initializeQuests]);

    const quests = activeQuests[activeTab] || [];

    const handleClaim = (questId) => {
        sounds.perfectScore();
        claimQuestReward(questId);
    };

    return (
        <div className="glass-card rounded-3xl p-4 sm:p-6 shadow-lg relative overflow-hidden h-full flex flex-col min-h-[420px]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-2">
                    <Target size={18} className="text-indigo-500" />
                    <h3 className="text-xs font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                        Learning Quests
                    </h3>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl mb-5 relative z-10">
                {['daily', 'weekly', 'milestone'].map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => {
                                sounds.click();
                                setActiveTab(tab);
                            }}
                            className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                isActive
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-white/5'
                                    : 'text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/80'
                            }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Quest List */}
            <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar relative z-10 space-y-3 max-h-[300px]">
                <AnimatePresence mode="popLayout">
                    {quests.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12 text-slate-400 dark:text-white/30 text-xs font-bold"
                        >
                            No active quests in this category.
                        </motion.div>
                    ) : (
                        quests.map((quest) => {
                            const progress = questsProgress[quest.id] ?? 0;
                            const isCompleted = progress >= quest.target;
                            const isClaimed = questsClaimed.includes(quest.id);

                            return (
                                <motion.div
                                    key={quest.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 group relative overflow-hidden ${
                                        isClaimed
                                            ? 'bg-slate-50/50 dark:bg-black/10 border-slate-100 dark:border-white/5 opacity-60'
                                            : isCompleted
                                              ? 'bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/30 dark:border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                                              : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
                                    }`}
                                >
                                    {/* Reward particles underglow if completed but not claimed */}
                                    {isCompleted && !isClaimed && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 animate-pulse pointer-events-none" />
                                    )}

                                    <div className="flex items-start justify-between gap-3 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl select-none ${
                                                    isClaimed
                                                        ? 'bg-slate-200/50 dark:bg-white/5'
                                                        : isCompleted
                                                          ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-inner'
                                                          : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80'
                                                }`}
                                            >
                                                {isClaimed ? '✅' : quest.icon}
                                            </div>
                                            <div>
                                                <h4
                                                    className={`text-xs sm:text-sm font-black leading-tight ${
                                                        isClaimed
                                                            ? 'text-slate-400 dark:text-white/30 line-through'
                                                            : 'text-slate-800 dark:text-white'
                                                    }`}
                                                >
                                                    {quest.title}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-wider mt-1">
                                                    Action: {quest.action.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                                                isClaimed
                                                    ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20'
                                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                                            }`}
                                        >
                                            <Zap
                                                size={10}
                                                fill={isClaimed ? 'none' : 'currentColor'}
                                            />
                                            <span>+{quest.xp} XP</span>
                                        </div>
                                    </div>

                                    {/* Progress Tracker Row */}
                                    <div className="flex items-center justify-between mt-1.5 relative z-10">
                                        <div className="flex-1 mr-4">
                                            <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${(progress / quest.target) * 100}%`,
                                                    }}
                                                    transition={{ type: 'spring', stiffness: 80 }}
                                                    className={`h-full rounded-full ${
                                                        isClaimed
                                                            ? 'bg-slate-300 dark:bg-white/10'
                                                            : isCompleted
                                                              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                                              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                                    }`}
                                                />
                                            </div>
                                        </div>

                                        <div className="text-[10px] font-black text-slate-500 dark:text-white/40 tracking-wider">
                                            {progress} / {quest.target}
                                        </div>
                                    </div>

                                    {/* Claim Reward Button */}
                                    {isCompleted && !isClaimed && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleClaim(quest.id)}
                                            className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 relative z-10"
                                        >
                                            <Award size={14} />
                                            Claim Reward!
                                        </motion.button>
                                    )}

                                    {isClaimed && (
                                        <div className="w-full mt-2 py-2 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1 pointer-events-none relative z-10">
                                            <CheckCircle2
                                                size={12}
                                                className="text-slate-400 dark:text-white/20"
                                            />
                                            Reward Claimed
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QuestPanel;
