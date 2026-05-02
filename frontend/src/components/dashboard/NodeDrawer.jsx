import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlayCircle, BookOpen, Clock, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';

const NodeDrawer = () => {
    const navigate = useNavigate();
    const { selectedNode, closeDrawer } = useCourseStore();

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
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <span className="text-xs font-bold text-studylabs-blue uppercase tracking-wider">{selectedNode.type}</span>
                                <h2 className="text-2xl font-bold text-gray-900 mt-1">{selectedNode.title}</h2>
                            </div>
                            <button onClick={closeDrawer} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="bg-blue-50 p-4 rounded-xl mb-6">
                                <p className="text-blue-800 text-sm font-medium leading-relaxed">
                                    In this module, you will master the core concepts of {selectedNode.title}.
                                    Get ready to challenge yourself!
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-gray-700">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Clock size={20} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Estimated Time</p>
                                        <p className="text-xs text-gray-500">{selectedNode.estimatedMinutes || 45} Minutes</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-gray-700">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <BookOpen size={20} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Prerequisites</p>
                                        <p className="text-xs text-gray-500">None</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-gray-700">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Trophy size={20} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Reward</p>
                                        <p className="text-xs text-gray-500">{selectedNode.xpReward || 150} XP + Badge</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer / CTA */}
                        <div className="p-6 pb-10 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => {
                                    closeDrawer();
                                    // Route to the combined lesson summary + quiz page
                                    const nodeId = selectedNode._id || selectedNode.id;
                                    const courseId = selectedNode.course || selectedNode.courseId;
                                    navigate(`/course/${courseId}/lesson/${nodeId}`);
                                }}
                                className="w-full py-4 bg-studylabs-blue hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                <PlayCircle size={24} />
                                Start {selectedNode.type === 'quiz' ? 'Quiz' : 'Lesson'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NodeDrawer;
