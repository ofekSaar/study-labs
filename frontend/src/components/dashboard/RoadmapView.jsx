import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import {
    CheckCircle2, PlayCircle, Lock, Zap, ChevronDown, ChevronRight,
    BookOpen, ClipboardList, GraduationCap, Clock, Star, ArrowRight, Trophy
} from 'lucide-react';

const TYPE_CONFIG = {
    quiz:    { label: 'Quiz',   icon: ClipboardList,  color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
    exam:    { label: 'Exam',   icon: GraduationCap,  color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
    default: { label: 'Lesson', icon: BookOpen,        color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
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

const CurrentNodeHero = ({ node, index, onStart }) => {
    const cfg = TYPE_CONFIG[node.type] || TYPE_CONFIG.default;
    const Icon = cfg.icon;
    return (
        <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="relative mb-6 overflow-hidden rounded-3xl shadow-[0_8px_30px_rgba(217,119,87,0.3)]"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.18)_0%,_transparent_60%)]" />
            <div className="absolute top-2 right-3 w-28 h-28 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-100/70">
                            Continue Learning
                        </span>
                        <span className="text-orange-200/40">·</span>
                        <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-black border border-white/20">
                            <Icon size={9} strokeWidth={2.5} />
                            {cfg.label}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-orange-100/50">Step {index + 1}</span>
                </div>

                <h3 className="text-lg font-black text-white leading-tight mb-3 drop-shadow-sm">
                    {node.title}
                </h3>

                <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-xl text-xs font-black text-white border border-white/15">
                        <Zap size={11} className="fill-amber-300 text-amber-300" />
                        +{node.xpReward || 150} XP
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-orange-100/70 text-xs font-bold">
                        <Clock size={11} />
                        {node.estimatedMinutes || 45} min
                    </span>
                </div>

                <motion.button
                    onClick={onStart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 bg-white text-orange-600 rounded-2xl font-black text-sm shadow-[0_4px_14px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
                >
                    <PlayCircle size={18} strokeWidth={2.5} />
                    Start Now
                    <ArrowRight size={16} strokeWidth={2.5} />
                </motion.button>
            </div>
        </motion.div>
    );
};

const MilestoneMarker = ({ number, allComplete }) => (
    <motion.div
        initial={{ opacity: 0, scaleX: 0.7 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex items-center gap-3 my-3 px-1"
    >
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black whitespace-nowrap ${
            allComplete
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/8 text-slate-400 dark:text-white/30'
        }`}>
            {allComplete
                ? <Star size={10} className="fill-emerald-500 text-emerald-500 flex-shrink-0" />
                : <Trophy size={10} className="flex-shrink-0" />
            }
            Checkpoint {number}{allComplete ? ' ✓' : ''}
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
    </motion.div>
);

const ExpandedPanel = ({ node, nodesUntilCurrent, onStart }) => {
    const isLocked    = node.status === 'locked';
    const isCompleted = node.status === 'completed';

    const quizPct = isCompleted && node.quizScore?.totalAnswerable > 0
        ? Math.round((node.quizScore.correctCount / node.quizScore.totalAnswerable) * 100)
        : null;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
        >
            <div className={`mb-2 px-4 py-3 rounded-b-2xl border border-t-0 ${
                isLocked
                    ? 'bg-slate-50/50 dark:bg-white/[0.01] border-slate-200/40 dark:border-white/5'
                    : 'bg-slate-50 dark:bg-white/[0.03] border-orange-400/50'
            }`}>
                {isLocked ? (
                    <div className="flex items-center gap-2 text-slate-400 dark:text-white/25">
                        <Lock size={13} strokeWidth={2.5} className="flex-shrink-0" />
                        <p className="text-xs font-bold">
                            {nodesUntilCurrent > 0
                                ? `Complete ${nodesUntilCurrent} more ${nodesUntilCurrent === 1 ? 'lesson' : 'lessons'} to unlock`
                                : 'Complete previous lessons to unlock'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-sm font-black text-orange-500 dark:text-orange-400">
                                <Zap size={13} strokeWidth={2.5} />
                                +{node.xpReward || 150} XP
                            </span>
                            <span className="text-slate-200 dark:text-white/10 select-none">|</span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 dark:text-white/35">
                                <Clock size={12} />
                                {node.estimatedMinutes || 45} min
                            </span>
                            {quizPct !== null && (
                                <>
                                    <span className="text-slate-200 dark:text-white/10 select-none">|</span>
                                    <span className={`inline-flex items-center gap-1 text-xs font-black ${quizPct >= 70 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-400'}`}>
                                        <Star size={11} className={quizPct >= 70 ? 'fill-emerald-500 text-emerald-500' : 'fill-red-400 text-red-400'} strokeWidth={0} />
                                        {quizPct}%
                                    </span>
                                </>
                            )}
                        </div>

                        <motion.button
                            onClick={onStart}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all ${
                                isCompleted
                                    ? 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500 shadow-sm'
                                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-[0_4px_12px_rgba(217,119,87,0.35)]'
                            }`}
                        >
                            <PlayCircle size={16} strokeWidth={2.5} />
                            {isCompleted ? 'Review' : 'Start'}
                            <ChevronRight size={14} strokeWidth={2.5} />
                        </motion.button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const RoadmapView = () => {
    const { courses, selectedCourseId, fetchCourseNodes } = useCourseStore();
    const navigate = useNavigate();
    const course = courses.find(c => c.id === selectedCourseId);
    const [isLoadingNodes, setIsLoadingNodes] = useState(false);
    const [expandedNodeId, setExpandedNodeId] = useState(null);

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
    const currentNodeIndex = nodes.findIndex(n => n.status === 'current');
    const currentNode = currentNodeIndex >= 0 ? nodes[currentNodeIndex] : null;

    const CHECKPOINT_EVERY = 5;

    const handleToggleExpand = (nodeId) => {
        setExpandedNodeId(prev => (prev === nodeId ? null : nodeId));
    };

    const handleStart = (node) => {
        const nodeId    = node._id || node.id;
        const nCourseId = node.course || node.courseId || selectedCourseId;
        navigate(`/course/${nCourseId}/lesson/${nodeId}`);
    };

    return (
        <div className="p-4 sm:p-6">

            {/* ── Progress Bar ── */}
            <div className="mb-5 bg-slate-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200/60 dark:border-white/8">
                <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-white/50">
                        {completedCount} of {nodes.length} completed
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

            {/* ── Current Node Hero ── */}
            {currentNode && (
                <CurrentNodeHero
                    node={currentNode}
                    index={currentNodeIndex}
                    onStart={() => handleStart(currentNode)}
                />
            )}

            {/* ── Node List ── */}
            <div className="space-y-0 pb-4">
                <AnimatePresence initial={false}>
                    {nodes.map((node, index) => {
                        const isCompleted = node.status === 'completed';
                        const isCurrent   = node.status === 'current';
                        const isLocked    = node.status === 'locked';

                        const nodeId     = node._id || node.id;
                        const isExpanded = expandedNodeId === nodeId;

                        const nodesUntilCurrent = isLocked && currentNodeIndex >= 0
                            ? index - currentNodeIndex
                            : 0;

                        const lineTop    = index === 0 ? 'bg-transparent' : (isCompleted || isCurrent ? 'bg-orange-400/30 dark:bg-orange-500/20' : 'bg-slate-200 dark:bg-white/8');
                        const lineBottom = index === nodes.length - 1 ? 'bg-transparent' : (isCompleted ? 'bg-orange-400/30 dark:bg-orange-500/20' : 'bg-slate-200 dark:bg-white/8');

                        const showCheckpoint       = index > 0 && index % CHECKPOINT_EVERY === 0;
                        const checkpointNum        = index / CHECKPOINT_EVERY;
                        const checkpointAllComplete = showCheckpoint
                            ? nodes.slice(index - CHECKPOINT_EVERY, index).every(n => n.status === 'completed')
                            : false;

                        return (
                            <React.Fragment key={nodeId}>
                                {showCheckpoint && (
                                    <MilestoneMarker number={checkpointNum} allComplete={checkpointAllComplete} />
                                )}

                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.5) }}
                                >
                                    <div className="flex gap-3 items-stretch">

                                        {/* ── Timeline column ── */}
                                        <div className="flex flex-col items-center flex-shrink-0 w-10">
                                            <div className={`w-0.5 flex-1 min-h-[10px] transition-colors duration-500 ${lineTop}`} />

                                            <div className="relative my-1.5">
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
                                                    {isCurrent    && <PlayCircle   size={18} strokeWidth={2.5} className="animate-pulse" />}
                                                    {isLocked     && (
                                                        <div className="relative">
                                                            <Lock size={16} strokeWidth={2.5} />
                                                            {nodesUntilCurrent > 0 && nodesUntilCurrent <= 5 && (
                                                                <span className="absolute -top-2.5 -right-2.5 w-4 h-4 bg-slate-400 dark:bg-white/20 rounded-full text-[8px] font-black text-white flex items-center justify-center leading-none">
                                                                    {nodesUntilCurrent}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`w-0.5 flex-1 min-h-[10px] transition-colors duration-500 ${lineBottom}`} />
                                        </div>

                                        {/* ── Card column ── */}
                                        <div className="flex-1 min-w-0">
                                            <motion.div
                                                onClick={() => handleToggleExpand(nodeId)}
                                                whileHover={{ scale: 1.01, y: -1, transition: { duration: 0.15 } }}
                                                whileTap={{ scale: 0.985 }}
                                                className={`
                                                    relative my-2 transition-all duration-200
                                                    flex items-center gap-3 text-left overflow-hidden cursor-pointer px-4 py-3
                                                    ${isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'}
                                                    ${isLocked
                                                        ? 'opacity-50 bg-slate-50/30 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/5'
                                                        : isExpanded
                                                            ? 'bg-orange-50 dark:bg-orange-500/10 border border-orange-400/50 border-b-0 shadow-md shadow-orange-500/8'
                                                            : isCurrent
                                                                ? 'bg-gradient-to-r from-orange-50/80 to-amber-50/40 dark:from-orange-500/[0.06] dark:to-amber-500/[0.02] border border-orange-400/30 hover:border-orange-400/50 shadow-sm'
                                                                : 'bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/15 hover:bg-slate-50 dark:hover:bg-white/[0.05] shadow-sm hover:shadow'
                                                    }
                                                `}
                                            >
                                                {/* Left accent bar */}
                                                {(isCurrent || isExpanded) && !isLocked && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-400 rounded-l-2xl" />
                                                )}

                                                {/* Content */}
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
                                                            : isExpanded
                                                                ? 'text-orange-600 dark:text-orange-400'
                                                                : isCurrent
                                                                    ? 'text-slate-800 dark:text-white'
                                                                    : 'text-slate-700 dark:text-white/80'
                                                    }`}>
                                                        {node.title}
                                                    </h4>
                                                    {!isExpanded && (
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
                                                    )}
                                                </div>

                                                {/* Right: status badge + chevron */}
                                                <div className="flex-shrink-0 flex items-center gap-2">
                                                    {isCompleted && !isExpanded && (
                                                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-xl text-xs font-black border border-emerald-500/15">
                                                            <CheckCircle2 size={11} strokeWidth={2.5} />
                                                            Done
                                                        </span>
                                                    )}
                                                    {isCompleted && !isExpanded && node.quizScore?.totalAnswerable > 0 && (() => {
                                                        const score = Math.round((node.quizScore.correctCount / node.quizScore.totalAnswerable) * 100);
                                                        return (
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                                                                score >= 70
                                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                                                                    : 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/15'
                                                            }`}>
                                                                {score}%
                                                            </span>
                                                        );
                                                    })()}
                                                    <motion.div
                                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <ChevronDown
                                                            size={16}
                                                            className={`transition-colors ${
                                                                isLocked
                                                                    ? 'text-slate-200 dark:text-white/10'
                                                                    : isExpanded
                                                                        ? 'text-orange-400'
                                                                        : 'text-slate-300 dark:text-white/25'
                                                            }`}
                                                            strokeWidth={2}
                                                        />
                                                    </motion.div>
                                                </div>
                                            </motion.div>

                                            {/* ── Inline expand panel ── */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <ExpandedPanel
                                                        node={node}
                                                        nodesUntilCurrent={nodesUntilCurrent}
                                                        onStart={() => handleStart(node)}
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </div>

                                    </div>
                                </motion.div>
                            </React.Fragment>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RoadmapView;
