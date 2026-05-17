import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useCourseStore from '../../store/courseStore';
import { CheckCircle2, PlayCircle, Lock, Zap, BookOpen, Target, ChevronLeft } from 'lucide-react';

const RoadmapView = () => {
    const { courses, selectedCourseId, fetchCourseNodes, setSelectedNode, selectedNode } = useCourseStore();
    const course = courses.find(c => c.id === selectedCourseId);
    const [isLoadingNodes, setIsLoadingNodes] = useState(false);

    useEffect(() => {
        if (course && (!course.nodes || course.nodes.length === 0)) {
            const loadNodes = async () => {
                setIsLoadingNodes(true);
                await fetchCourseNodes(course.id);
                setIsLoadingNodes(false);
            };
            loadNodes();
        }
    }, [course?.id, fetchCourseNodes]);

    // Safety check
    if (!course) return (
        <div className="p-12 text-center" dir="rtl">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-slate-400 dark:text-white/40 font-medium">אנא בחר קורס כדי לצפות בנתיב הלמידה</p>
        </div>
    );

    if (isLoadingNodes) return (
        <div className="p-16 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
            <p className="text-sm text-slate-400 dark:text-white/40 font-medium">טוען את נתיב הלמידה...</p>
        </div>
    );

    const nodes = course.nodes || [];

    return (
        <div className="p-5" dir="rtl">
            {/* Header section (Compact) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-slate-200/60 dark:border-white/10 text-right">
                <div>
                    <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-md">נתיב למידה פעיל</span>
                    <h3 className="text-xl font-display font-black text-slate-800 dark:text-white mt-2 leading-tight">{course.title}</h3>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-white/50 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                        רמה: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{course.level || 'מתחיל'}</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-white/50 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                        <span className="text-slate-800 dark:text-white font-extrabold">{nodes.length}</span> שיעורים
                    </span>
                </div>
            </div>

            {/* Compact List of Lessons */}
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 pl-1 custom-scrollbar">
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
                            case 'quiz': return 'בוחן 📝';
                            case 'exam': return 'מבחן 🏆';
                            default: return 'שיעור 📖';
                        }
                    };

                    return (
                        <motion.div
                            key={nodeId}
                            onClick={() => !isLocked && setSelectedNode(node)}
                            whileHover={!isLocked ? { scale: 1.01, y: -1 } : {}}
                            whileTap={!isLocked ? { scale: 0.99 } : {}}
                            className={`
                                relative p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 text-right
                                ${isLocked 
                                    ? 'opacity-60 bg-slate-50/50 dark:bg-white/2 border-slate-200/40 dark:border-white/5 cursor-not-allowed'
                                    : isActiveSelected
                                        ? 'bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/5 cursor-pointer'
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
                                        הושלם
                                    </span>
                                )}
                                {isCurrent && !isLocked && (
                                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-[0_0_12px_rgba(99,102,241,0.35)] flex items-center gap-1 transition-colors">
                                        התחל למידה
                                        <ChevronLeft size={14} strokeWidth={3} />
                                    </button>
                                )}
                                {isLocked && (
                                    <span className="hidden sm:inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 px-3 py-1.5 rounded-xl text-xs font-black border border-slate-200/50 dark:border-white/5">
                                        נעול
                                    </span>
                                )}
                            </div>

                            {/* Right Side: Step Icon + Text details */}
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                {/* State Circle Icon */}
                                <div className={`
                                    w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border-b-2 shadow-sm transition-all duration-300
                                    ${isCompleted
                                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-600 text-white'
                                        : isCurrent
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-700 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)] scale-105'
                                            : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20'
                                    }
                                `}>
                                    {isCompleted && <CheckCircle2 size={18} strokeWidth={2.5} />}
                                    {isCurrent && <PlayCircle size={18} strokeWidth={2.5} className="animate-pulse" />}
                                    {isLocked && <Lock size={16} strokeWidth={2.5} />}
                                </div>

                                {/* Texts */}
                                <div className="min-w-0 flex-1">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest leading-none">שיעור {index + 1}</span>
                                    <h4 className={`text-sm font-extrabold truncate leading-tight mt-1 transition-colors ${
                                        isLocked 
                                            ? 'text-slate-400 dark:text-white/20' 
                                            : isActiveSelected
                                                ? 'text-indigo-600 dark:text-indigo-400 font-black'
                                                : 'text-slate-800 dark:text-white group-hover:text-indigo-500'
                                    }`}>
                                        {node.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-400 dark:text-white/40">
                                        <span>{getTypeBadge()}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5 text-indigo-500 dark:text-indigo-400">
                                            <Zap size={10} className="fill-indigo-500/15" />
                                            +{node.xpReward || 150} XP
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default RoadmapView;
