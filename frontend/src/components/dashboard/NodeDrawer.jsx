import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    PlayCircle,
    BookOpen,
    Clock,
    Trophy,
    Zap,
    CheckCircle2,
    Star,
    ArrowRight,
    Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import sounds from '../../utils/soundManager';
import ProgressBar from '../common/ProgressBar';

const StarRating = ({ pct }) => {
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((i) => (
                <Star
                    key={i}
                    size={14}
                    strokeWidth={1.5}
                    className={
                        i <= stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 dark:text-white/10'
                    }
                />
            ))}
        </div>
    );
};

const ProgressRing = ({ index, total }) => {
    if (total === 0) return null;
    const r = 10;
    const circ = 2 * Math.PI * r;
    const ringPct = (index + 1) / total;
    return (
        <div className="relative flex-shrink-0 w-7 h-7 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" className="absolute inset-0 -rotate-90">
                <circle
                    cx="14"
                    cy="14"
                    r={r}
                    fill="none"
                    strokeWidth="2.5"
                    className="stroke-slate-200 dark:stroke-white/10"
                />
                <circle
                    cx="14"
                    cy="14"
                    r={r}
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - ringPct)}
                    className="stroke-orange-500 transition-all duration-700"
                />
            </svg>
            <span className="text-[9px] font-black text-slate-600 dark:text-white/60 z-10 relative">
                {index + 1}
            </span>
        </div>
    );
};

const NodeDrawer = () => {
    const navigate = useNavigate();
    const { selectedNode, closeDrawer, courses, selectedCourseId } = useCourseStore();

    const course = courses.find((c) => c.id === selectedCourseId);
    const nodes = course?.nodes || [];
    const nodeIndex = selectedNode
        ? nodes.findIndex((n) => (n._id || n.id) === (selectedNode._id || selectedNode.id))
        : -1;
    const nextNode = nodeIndex >= 0 && nodeIndex < nodes.length - 1 ? nodes[nodeIndex + 1] : null;
    const totalNodes = nodes.length;

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
                        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/1">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                {totalNodes > 0 && nodeIndex >= 0 && (
                                    <ProgressRing index={nodeIndex} total={totalNodes} />
                                )}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                                            {selectedNode.type || 'Lesson'}
                                        </span>
                                        {totalNodes > 0 && nodeIndex >= 0 && (
                                            <span className="text-[10px] font-bold text-slate-300 dark:text-white/20">
                                                {nodeIndex + 1} of {totalNodes}
                                            </span>
                                        )}
                                        {selectedNode.isMaterialGrounded === false && (
                                            <span className="text-[9px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 uppercase px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                                ⚠️ AI-Generated
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-1 leading-tight">
                                        {selectedNode.title}
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    sounds.click();
                                    closeDrawer();
                                }}
                                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-slate-500 dark:text-white/60 flex-shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 custom-scrollbar">
                            {/* XP Reward */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-[0_0_16px_rgba(99,102,241,0.2)] text-white group">
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                                            XP Reward
                                        </p>
                                        <h3 className="text-2xl font-black mt-0.5 flex items-baseline gap-1">
                                            +{selectedNode.xpReward || 150}{' '}
                                            <span className="text-xs font-bold text-white/80">
                                                XP
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                                        <Zap size={18} className="text-amber-300 fill-amber-300" />
                                    </div>
                                </div>
                            </div>

                            {/* Module Info */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">
                                    Module Info
                                </h4>
                                <div className="bg-slate-50 dark:bg-white/3 rounded-2xl p-3 border border-slate-100 dark:border-white/5 space-y-3">
                                    <div className="flex items-center gap-3 text-slate-700 dark:text-white/80">
                                        <div className="w-8 h-8 bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 dark:text-white/40 shrink-0">
                                            <Clock size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black">Estimated Duration</p>
                                            <p className="text-[11px] text-slate-500 dark:text-white/40">
                                                {selectedNode.estimatedMinutes || 45} minutes
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-700 dark:text-white/80">
                                        <div className="w-8 h-8 bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 dark:text-white/40 shrink-0">
                                            <BookOpen size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black">Structure</p>
                                            <p className="text-[11px] text-slate-500 dark:text-white/40">
                                                Study Guide + Timed Quiz Assessment
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-700 dark:text-white/80">
                                        <div className="w-8 h-8 bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 dark:text-white/40 shrink-0">
                                            <Trophy size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black">Badge Unlock</p>
                                            <p className="text-[11px] text-slate-500 dark:text-white/40">
                                                "First Steps" or corresponding rarity award
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quiz score with star rating */}
                                    {selectedNode.status === 'completed' &&
                                        selectedNode.quizScore?.totalAnswerable > 0 &&
                                        (() => {
                                            const { correctCount, totalAnswerable } =
                                                selectedNode.quizScore;
                                            const scorePct = Math.round(
                                                (correctCount / totalAnswerable) * 100
                                            );
                                            const passed = scorePct >= 70;
                                            return (
                                                <div className="flex items-start gap-4 text-slate-700 dark:text-white/80">
                                                    <div
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${passed ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500' : 'bg-red-100 dark:bg-red-500/20 text-red-400'}`}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <p className="text-xs font-black">
                                                                Quiz Score
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <StarRating pct={scorePct} />
                                                                <span
                                                                    className={`text-xs font-black px-2 py-0.5 rounded-lg ${passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}
                                                                >
                                                                    {scorePct}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ProgressBar
                                                            value={scorePct}
                                                            variant={passed ? 'done' : 'fail'}
                                                            height="sm"
                                                            animated={false}
                                                            className="mb-1"
                                                        />
                                                        <p
                                                            className={`text-[11px] font-bold ${passed ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-400'}`}
                                                        >
                                                            {correctCount} / {totalAnswerable}{' '}
                                                            correct
                                                            {passed
                                                                ? ' ✓ Passed'
                                                                : ' — Keep Practicing'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                </div>
                            </div>

                            {/* Up Next */}
                            {nextNode && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">
                                        Up Next
                                    </h4>
                                    <div className="bg-slate-50 dark:bg-white/3 rounded-2xl p-3 border border-slate-100 dark:border-white/5 flex items-center gap-3">
                                        <div
                                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                nextNode.status === 'locked'
                                                    ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-white/20'
                                                    : 'bg-orange-100 dark:bg-orange-500/20 text-orange-500'
                                            }`}
                                        >
                                            {nextNode.status === 'locked' ? (
                                                <Lock size={14} />
                                            ) : (
                                                <ArrowRight size={14} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={`text-xs font-black truncate ${
                                                    nextNode.status === 'locked'
                                                        ? 'text-slate-400 dark:text-white/25'
                                                        : 'text-slate-700 dark:text-white/80'
                                                }`}
                                            >
                                                {nextNode.title}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-white/25 capitalize">
                                                {nextNode.type || 'lesson'} · +
                                                {nextNode.xpReward || 150} XP
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / CTA */}
                        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
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
