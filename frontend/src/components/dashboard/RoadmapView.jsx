import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCourseStore from '../../store/courseStore';
import { CheckCircle2, PlayCircle, Lock, Zap, ChevronRight, BookOpen, ClipboardList, GraduationCap, Clock } from 'lucide-react';

const TYPE_CONFIG = {
    quiz:    { label: 'Quiz',   icon: ClipboardList, color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
    exam:    { label: 'Exam',   icon: GraduationCap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
    default: { label: 'Lesson', icon: BookOpen,       color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
};

const TypeBadge = ({ type }) => {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.default;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 ${cfg.bg} ${cfg.color} ${cfg.border} border px-2 py-0.5 rounded-md text-[10px] font-black`}>
            <Icon size={10} strokeWidth={2.5} />
            {cfg.label}
        </span>
    );
};

const RoadmapView = () => {
    const { courses, selectedCourseId, fetchCourseNodes, setSelectedNode, selectedNode } = useCourseStore();
    const course = courses.find(c => c.id === selectedCourseId);
    const [isLoadingNodes, setIsLoadingNodes] = useState(false);

    const courseId = course?.id;
    const hasNoNodes = course && (!course.nodes || course.nodes.length === 0);

    useEffect(() => {
        if (hasNoNodes && courseId) {
            const loadNodes = async () => {
                setIsLoadingNodes(true);
                await fetchCourseNodes(courseId);
                setIsLoadingNodes(false);
            };
            loadNodes();
        }
    }, [courseId, hasNoNodes, fetchCourseNodes]);

    if (!course) return (
        <div className="p-12 text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-slate-400 dark:text-white/40 font-medium">Select a course to view your learning path</p>
        </div>
    );

    if (isLoadingNodes) return (
        <div className="p-16 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-orange-500 border-r-amber-400 animate-spin" />
            <p className="text-sm text-slate-400 dark:text-white/40 font-medium">Loading learning path…</p>
        </div>
    );

    const nodes = course.nodes || [];
    const completedCount = nodes.filter(n => n.status === 'completed').length;
    const pct = nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0;

    return (
        <div className="p-4 sm:p-6">

            {/* ── Progress Bar ── */}
            <div className="mb-6 bg-slate-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200/60 dark:border-white/8">
                <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-white/50">
                        {completedCount} of {nodes.length} lessons completed
                    </span>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
                        pct === 100
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                    }`}>
                        {pct}%
                    </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        className={`h-full rounded-full relative ${
                            pct === 100
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                : 'bg-gradient-to-r from-orange-500 to-amber-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    >
                        {pct > 0 && pct < 100 && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                        )}
                    </motion.div>
                </div>
            </div>

            {/* ── Node List ── */}
            <div className="space-y-0 pb-4">
                <AnimatePresence initial={false}>
                    {nodes.map((node, index) => {
                        const isCompleted = node.status === 'completed';
                        const isCurrent   = node.status === 'current';
                        const isLocked    = node.status === 'locked';

                        const nodeId         = node._id || node.id;
                        const selectedNodeId = selectedNode?._id || selectedNode?.id;
                        const isSelected     = selectedNodeId === nodeId;

                        const lineTop    = index === 0 ? 'bg-transparent' : (isCompleted || isCurrent ? 'bg-orange-400/30 dark:bg-orange-500/20' : 'bg-slate-200 dark:bg-white/8');
                        const lineBottom = index === nodes.length - 1 ? 'bg-transparent' : (isCompleted ? 'bg-orange-400/30 dark:bg-orange-500/20' : 'bg-slate-200 dark:bg-white/8');

                        return (
                            <motion.div
                                key={nodeId}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: index * 0.04 }}
                                className="flex gap-3 items-stretch"
                            >
                                {/* ── Timeline column ── */}
                                <div className="flex flex-col items-center flex-shrink-0 w-10">
                                    <div className={`w-0.5 flex-1 min-h-[10px] transition-colors duration-500 ${lineTop}`} />

                                    <div className="relative my-1.5">
                                        {/* Glow ring for current node */}
                                        {isCurrent && (
                                            <span className="absolute -inset-1.5 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 opacity-35 blur-sm animate-pulse pointer-events-none" />
                                        )}

                                        <div className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                            border-b-2 shadow-sm transition-all duration-300 relative z-10
                                            ${isCompleted
                                                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-600 text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)]'
                                                : isCurrent
                                                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 border-orange-600 text-white shadow-[0_4px_14px_rgba(217,119,87,0.5)] scale-110'
                                                    : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20'
                                            }
                                        `}>
                                            {isCompleted && <CheckCircle2 size={18} strokeWidth={2.5} />}
                                            {isCurrent    && <PlayCircle  size={18} strokeWidth={2.5} className="animate-pulse" />}
                                            {isLocked     && <Lock        size={16} strokeWidth={2.5} />}
                                        </div>
                                    </div>

                                    <div className={`w-0.5 flex-1 min-h-[10px] transition-colors duration-500 ${lineBottom}`} />
                                </div>

                                {/* ── Content card ── */}
                                <motion.div
                                    onClick={() => !isLocked && setSelectedNode(node)}
                                    whileHover={!isLocked ? { scale: 1.012, y: -1, transition: { duration: 0.15 } } : {}}
                                    whileTap={!isLocked ? { scale: 0.985 } : {}}
                                    className={`
                                        relative my-2 rounded-2xl border transition-all duration-200
                                        flex items-center gap-3 text-left flex-1 overflow-hidden
                                        ${isLocked
                                            ? 'opacity-45 bg-slate-50/30 dark:bg-white/[0.01] border-slate-200/40 dark:border-white/5 border-dashed cursor-not-allowed px-4 py-3'
                                            : isSelected
                                                ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-400/50 shadow-md shadow-orange-500/8 cursor-pointer px-4 py-3'
                                                : isCurrent
                                                    ? 'bg-gradient-to-r from-orange-50/80 to-amber-50/40 dark:from-orange-500/[0.06] dark:to-amber-500/[0.02] border-orange-400/30 hover:border-orange-400/50 shadow-sm cursor-pointer px-4 py-3'
                                                    : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/15 hover:bg-slate-50 dark:hover:bg-white/[0.05] shadow-sm hover:shadow cursor-pointer px-4 py-3'
                                        }
                                    `}
                                >
                                    {/* Orange left accent bar for current/selected */}
                                    {(isCurrent || isSelected) && !isLocked && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-400 rounded-l-2xl" />
                                    )}

                                    {/* Node content */}
                                    <div className="min-w-0 flex-1 pl-1">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[9px] font-black text-slate-500 dark:text-white/40 flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <span className="text-slate-300 dark:text-white/10 text-[10px]">·</span>
                                            <TypeBadge type={node.type} />
                                        </div>
                                        <h4 className={`text-sm font-extrabold leading-snug truncate transition-colors ${
                                            isLocked
                                                ? 'text-slate-400 dark:text-white/20'
                                                : isSelected
                                                    ? 'text-orange-600 dark:text-orange-400'
                                                    : isCurrent
                                                        ? 'text-slate-800 dark:text-white'
                                                        : 'text-slate-700 dark:text-white/80'
                                        }`}>
                                            {node.title}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-500 dark:text-orange-400 bg-orange-500/8 dark:bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/10">
                                                <Zap size={9} strokeWidth={2.5} />
                                                +{node.xpReward || 150} XP
                                            </span>
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400 dark:text-white/30">
                                                <Clock size={9} strokeWidth={2.5} />
                                                {node.estimatedMinutes || 45}m
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right side action */}
                                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                        {isCompleted && (
                                            <>
                                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-black border border-emerald-500/15">
                                                    <CheckCircle2 size={12} strokeWidth={2.5} />
                                                    Done
                                                </span>
                                                {node.quizScore?.totalAnswerable > 0 && (() => {
                                                    const pct = Math.round((node.quizScore.correctCount / node.quizScore.totalAnswerable) * 100);
                                                    return (
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                                                            pct >= 70
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                                                                : 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/15'
                                                        }`}>
                                                            {pct}%
                                                        </span>
                                                    );
                                                })()}
                                            </>
                                        )}
                                        {isCurrent && !isLocked && (
                                            <button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 py-2 rounded-xl text-xs font-black shadow-[0_4px_12px_rgba(217,119,87,0.35)] hover:shadow-[0_4px_16px_rgba(217,119,87,0.5)] flex items-center gap-1 transition-all duration-200 whitespace-nowrap">
                                                Start
                                                <ChevronRight size={13} strokeWidth={3} />
                                            </button>
                                        )}
                                        {isLocked && (
                                            <Lock size={14} className="text-slate-300 dark:text-white/15 mr-1" strokeWidth={2.5} />
                                        )}
                                        {!isLocked && !isCompleted && !isCurrent && (
                                            <ChevronRight size={16} className="text-slate-300 dark:text-white/20 group-hover:text-orange-400 transition-colors" strokeWidth={2} />
                                        )}
                                    </div>

                                </motion.div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RoadmapView;
