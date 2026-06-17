import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useCourseStore from '../../store/courseStore';
import { CheckCircle2, PlayCircle, Lock, Zap, BookOpen, Target, ChevronLeft, ChevronRight } from 'lucide-react';

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

    // Safety check
    if (!course) return (
        <div className="p-12 text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-slate-400 dark:text-white/40 font-medium">Please select a course to view the learning path</p>
        </div>
    );

    if (isLoadingNodes) return (
        <div className="p-16 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
            <p className="text-sm text-slate-400 dark:text-white/40 font-medium">Loading learning path...</p>
        </div>
    );

    const nodes = course.nodes || [];
    const completedNodes = nodes.filter(n => n.status === 'completed').length;
    const totalNodes = nodes.length;
    const progressPercentage = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

    return (
        <div className="p-3 sm:p-5">
            {/* Header section (Compact) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-slate-200/60 dark:border-white/10 text-left">
                <div>
                    <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-md">Active learning path</span>
                    <h3 className="text-xl font-display font-black text-slate-800 dark:text-white mt-2 leading-tight">{course.title}</h3>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-white/50 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                        Level: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{course.level || 'Beginner'}</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-white/50 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                        <span className="text-slate-800 dark:text-white font-extrabold">{nodes.length}</span> lessons
                    </span>
                </div>
            </div>

            {/* Sleek Course Progress Bar */}
            <div className="mb-6 bg-slate-50/50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200/60 dark:border-white/10">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-white/60">Learning path progress</span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded-md">{progressPercentage}% Completed</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner relative">
                    <motion.div 
                        className="h-full bg-gradient-to-l from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                </div>
            </div>

            {/* Compact List of Lessons */}
            <div className="space-y-0 max-h-[400px] overflow-y-auto pr-1 pl-1 custom-scrollbar">
                {nodes.map((node, index) => {
                    const isCompleted = node.status === 'completed';
                    const isCurrent = node.status === 'current';
                    const isLocked = node.status === 'locked';

                    const nodeId = node._id || node.id;
                    const selectedNodeId = selectedNode?._id || selectedNode?.id;
                    const isActiveSelected = selectedNodeId === nodeId;

                    // Text for lesson types
                    const getTypeBadge = () => {
                        switch (node.type) {
                            case 'quiz': 
                                return (
                                    <span className="flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-md text-[10px] font-black border border-blue-500/20">
                                        Quiz 📝
                                    </span>
                                );
                            case 'exam': 
                                return (
                                    <span className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-md text-[10px] font-black border border-amber-500/20">
                                        Exam 🏆
                                    </span>
                                );
                            default: 
                                return (
                                    <span className="flex items-center gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-md text-[10px] font-black border border-purple-500/20">
                                        Lesson 📖
                                    </span>
                                );
                        }
                    };

                    const topLineColor = isCompleted || isCurrent 
                        ? 'bg-indigo-500/40 dark:bg-indigo-500/30' 
                        : 'bg-slate-200 dark:bg-white/10';
                    const bottomLineColor = isCompleted
                        ? 'bg-indigo-500/40 dark:bg-indigo-500/30' 
                        : 'bg-slate-200 dark:bg-white/10';

                    return (
                        <div key={nodeId} className="flex gap-4 items-stretch">
                            {/* Timeline Column */}
                            <div className="flex flex-col items-center flex-shrink-0 w-12">
                                {/* Top line */}
                                <div className={`w-0.5 flex-1 min-h-[12px] ${index === 0 ? 'bg-transparent' : topLineColor}`} />
                                
                                {/* Icon container with pulse effect */}
                                <div className="relative my-1">
                                    {isCurrent && (
                                        <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-40 blur-sm animate-pulse" />
                                    )}
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-b-2 shadow-sm transition-all duration-300 relative z-10
                                        ${isCompleted
                                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]'
                                            : isCurrent
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-700 text-white shadow-[0_4px_15px_rgba(99,102,241,0.45)] scale-105'
                                                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20'
                                        }
                                    `}>
                                        {isCompleted && <CheckCircle2 size={20} strokeWidth={2.5} />}
                                        {isCurrent && <PlayCircle size={20} strokeWidth={2.5} className="animate-pulse" />}
                                        {isLocked && <Lock size={18} strokeWidth={2.5} />}
                                    </div>
                                </div>

                                {/* Bottom line */}
                                <div className={`w-0.5 flex-1 min-h-[12px] ${index === nodes.length - 1 ? 'bg-transparent' : bottomLineColor}`} />
                            </div>

                            {/* Content Card */}
                            <motion.div
                                onClick={() => !isLocked && setSelectedNode(node)}
                                whileHover={!isLocked ? { scale: 1.015, y: -1 } : {}}
                                whileTap={!isLocked ? { scale: 0.99 } : {}}
                                className={`
                                    relative p-4 my-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 text-left flex-1
                                    ${isLocked 
                                        ? 'opacity-50 bg-slate-50/30 dark:bg-white/[0.01] border-slate-200/40 dark:border-white/5 border-dashed cursor-not-allowed'
                                        : isActiveSelected
                                            ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/5 cursor-pointer'
                                            : isCurrent
                                                ? 'bg-indigo-50/10 dark:bg-indigo-500/[0.02] border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 shadow-sm cursor-pointer'
                                                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/50 dark:hover:bg-white/3 shadow-sm hover:shadow cursor-pointer'
                                    }
                                `}
                            >
                                {/* Inner active border highlight */}
                                {isCurrent && !isLocked && (
                                    <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-r-2xl" />
                                )}

                                {/* Left Side: Actions/Status Badges */}
                                <div className="flex items-center gap-3">
                                    {isCompleted && (
                                        <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-black border border-emerald-500/20">
                                            Completed
                                        </span>
                                    )}
                                    {isCurrent && !isLocked && (
                                        <button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.45)] flex items-center gap-1 transition-all duration-300">
                                            Start learning
                                            <ChevronRight size={14} strokeWidth={3} />
                                        </button>
                                    )}
                                    {isLocked && (
                                        <span className="hidden sm:inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 px-3 py-1.5 rounded-xl text-xs font-black border border-slate-200/50 dark:border-white/5">
                                            Locked
                                        </span>
                                    )}
                                </div>

                                {/* Right Side: Text details */}
                                <div className="min-w-0 flex-1">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest leading-none">Lesson {index + 1}</span>
                                    <h4 className={`text-sm font-extrabold truncate leading-tight mt-1 transition-colors ${
                                        isLocked 
                                            ? 'text-slate-400 dark:text-white/20' 
                                            : isActiveSelected
                                                ? 'text-indigo-600 dark:text-indigo-400 font-black'
                                                : 'text-slate-800 dark:text-white group-hover:text-indigo-500'
                                    }`}>
                                        {node.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        {getTypeBadge()}
                                        <span className="text-slate-300 dark:text-white/10 text-xs">•</span>
                                        <span className="flex items-center gap-0.5 text-indigo-500 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/10 text-[10px] font-bold">
                                            <Zap size={10} className="fill-indigo-500/15" />
                                            +{node.xpReward || 150} XP
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RoadmapView;
