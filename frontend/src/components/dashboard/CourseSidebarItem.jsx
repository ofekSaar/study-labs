import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, PlayCircle } from 'lucide-react';

const CourseSidebarItem = ({ course, isSelected, onClick }) => {
    return (
        <motion.div
            layout
            onClick={onClick}
            className={`cursor-pointer group relative p-3 rounded-xl transition-all duration-300 ${isSelected
                    ? 'bg-blue-50 border border-blue-100 shadow-sm'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
        >
            <div className="flex items-center gap-3">
                {/* Icon Container */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm ${course.color} transition-transform group-hover:scale-105`}>
                    {/* Simplified Icon based on course title or passed icon */}
                    <span className="font-bold text-sm">{course.title.substring(0, 2).toUpperCase()}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                        {course.title}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">
                        {course.level} • {course.nodes.filter(n => n.status === 'completed').length}/{course.nodes.length} Stages
                    </p>
                </div>

                {/* Arrow */}
                {isSelected && (
                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
                        <ChevronRight size={16} className="text-studylabs-blue" />
                    </motion.div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mt-3 bg-gray-100 rounded-full h-1.5 overflow-hidden">
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
                    className="mt-3 pt-3 border-t border-blue-100/50"
                >
                    {(() => {
                        const activeNode = course.nodes.find(n => n.status === 'active') || course.nodes.find(n => n.status !== 'completed');
                        if (activeNode) {
                            return (
                                <div className="flex items-center gap-2 text-xs font-bold text-studylabs-blue bg-blue-50/50 rounded-lg p-2">
                                    <PlayCircle size={14} className="shrink-0" />
                                    <span className="truncate">Up Next: {activeNode.title}</span>
                                </div>
                            );
                        }
                        return (
                            <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50/50 rounded-lg p-2">
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
