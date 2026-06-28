import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, PlayCircle } from 'lucide-react';
import { clickableProps } from '../../utils/a11y';

const CourseSidebarItem = ({ course, isSelected, onClick }) => {
    return (
        <motion.div
            layout
            {...clickableProps(onClick, `Select course ${course.title}`)}
            aria-pressed={isSelected}
            className={`cursor-pointer group relative p-3 rounded-xl transition-all duration-300 ${isSelected
                    ? 'bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-indigo-500/30 shadow-lg dark:shadow-indigo-500/10'
                    : 'hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'
                }`}
        >
            <div className="flex items-center gap-3">
                {/* Icon Container */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${
                    isSelected ? `${course.color || 'bg-indigo-600'} text-white` : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/80'
                }`}>
                    <span className="font-bold text-sm">{course.title.substring(0, 2).toUpperCase()}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/70 group-hover:text-slate-800 group-hover:dark:text-white/90'}`}>
                        {course.title}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-white/40 font-medium mt-0.5">
                        {course.level}
                        {course.nodes && course.nodes.length > 0 && (
                            <> • <span className="text-indigo-600 dark:text-indigo-300">{course.nodes.filter(n => n.status === 'completed').length}/{course.nodes.length} Stages</span></>
                        )}
                    </p>
                </div>

                {/* Arrow */}
                {isSelected && (
                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
                        <ChevronRight size={16} className="text-indigo-400" />
                    </motion.div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mt-3 bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${course.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full ${course.color}`}
                />
            </div>

            {/* Current Stage Indicator */}
            {isSelected && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10"
                >
                    {(() => {
                        const activeNode = course.nodes.find(n => n.status === 'active') || course.nodes.find(n => n.status !== 'completed');
                        if (activeNode) {
                            return (
                                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-2 border border-indigo-100 dark:border-indigo-500/20">
                                    <PlayCircle size={14} className="shrink-0" />
                                    <span className="truncate">Up Next: {activeNode.title}</span>
                                </div>
                            );
                        }
                        return (
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-2 border border-emerald-100 dark:border-emerald-500/20">
                                <span className="truncate">🎉 Course Completed!</span>
                            </div>
                        );
                    })()}
                </motion.div>
            )}
        </motion.div>
    );
};

export default CourseSidebarItem;
