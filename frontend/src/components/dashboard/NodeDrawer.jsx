import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlayCircle, BookOpen, Clock, Trophy, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import sounds from '../../utils/soundManager';

const NodeDrawer = () => {
    const navigate = useNavigate();
    const { selectedNode, closeDrawer } = useCourseStore();

    const handleStart = () => {
        sounds.click();
        closeDrawer();
        const nodeId = selectedNode._id || selectedNode.id;
        const courseId = selectedNode.course || selectedNode.courseId;
        navigate(`/course/${courseId}/lesson/${nodeId}`);
    };

    return (
        <AnimatePresence>
            {selectedNode && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeDrawer}
                        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-[calc(100vw-2rem)] sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/5 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/1">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                                        {selectedNode.type || 'Lesson'}
                                    </span>
                                    {selectedNode.isMaterialGrounded === false && (
                                        <span className="text-[9px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 uppercase px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                            ⚠️ AI-Generated (No slide source)
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-1 leading-tight">
                                    {selectedNode.title}
                                </h2>
                            </div>
                            <button 
                                onClick={() => { sounds.click(); closeDrawer(); }} 
                                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-slate-500 dark:text-white/60"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            
                            {/* XP Reward card with gradient glow */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.25)] text-white group">
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">XP Reward</p>
                                        <h3 className="text-3xl font-black mt-1 flex items-baseline gap-1">
                                            +{selectedNode.xpReward || 150} <span className="text-xs font-bold text-white/80">XP</span>
                                        </h3>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                                        <Zap size={22} className="text-amber-300 fill-amber-300" />
                                    </div>
                                </div>
                                <p className="text-xs text-indigo-100 mt-4 leading-relaxed font-bold">
                                    Complete this module to secure your reward, unlock subsequent nodes, and advance your rank on the leaderboard!
                                </p>
                            </div>

                            {/* Metrics section */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">Module Info</h4>
                                
                                <div className="bg-slate-50 dark:bg-white/3 rounded-2xl p-4 border border-slate-100 dark:border-white/5 space-y-4">
                                    <div className="flex items-center gap-4 text-slate-700 dark:text-white/80">
                                        <div className="w-9 h-9 bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 dark:text-white/40">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black">Estimated Duration</p>
                                            <p className="text-[11px] text-slate-500 dark:text-white/40 mt-0.5">{selectedNode.estimatedMinutes || 45} minutes</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-slate-700 dark:text-white/80">
                                        <div className="w-9 h-9 bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 dark:text-white/40">
                                            <BookOpen size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black">Structure</p>
                                            <p className="text-[11px] text-slate-500 dark:text-white/40 mt-0.5">Study Guide + Timed Quiz Assessment</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-slate-700 dark:text-white/80">
                                        <div className="w-9 h-9 bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 dark:text-white/40">
                                            <Trophy size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black">Badge Unlock</p>
                                            <p className="text-[11px] text-slate-500 dark:text-white/40 mt-0.5">"First Steps" or corresponding rarity award</p>
                                        </div>
                                    </div>

                                    {/* Quiz score row — only for completed nodes with attempt data */}
                                    {selectedNode.status === 'completed' && selectedNode.quizScore?.totalAnswerable > 0 && (() => {
                                        const { correctCount, totalAnswerable } = selectedNode.quizScore;
                                        const pct = Math.round((correctCount / totalAnswerable) * 100);
                                        const passed = pct >= 70;
                                        return (
                                            <div className="flex items-start gap-4 text-slate-700 dark:text-white/80">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${passed ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500' : 'bg-red-100 dark:bg-red-500/20 text-red-400'}`}>
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs font-black">Quiz Score</p>
                                                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-1">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <p className={`text-[11px] font-bold ${passed ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-400'}`}>
                                                        {correctCount} / {totalAnswerable} correct{passed ? ' ✓ Passed' : ' — Keep Practicing'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Footer / CTA */}
                        <div className="p-4 sm:p-6 pb-6 sm:pb-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                            {selectedNode.status === 'completed' ? (
                                <button
                                    onClick={handleStart}
                                    className="w-full py-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 dark:from-slate-700 dark:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700 text-white rounded-2xl font-black text-lg shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <PlayCircle size={22} />
                                    Review {selectedNode.type === 'quiz' ? 'Quiz' : 'Lesson'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleStart}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2"
                                >
                                    <PlayCircle size={22} />
                                    Start {selectedNode.type === 'quiz' ? 'Quiz' : 'Lesson'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NodeDrawer;
