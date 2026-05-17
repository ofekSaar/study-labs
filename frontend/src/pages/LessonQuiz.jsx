import React, { useState, useEffect } from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import QuizEngine from '../components/quiz/QuizEngine';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, BookOpen, GraduationCap, ArrowRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContentRenderer from '../components/common/ContentRenderer';
import api from '../utils/api';
import useCourseStore from '../store/courseStore';

const LessonQuiz = () => {
    const { courseId, id } = useParams(); // id is the nodeId
    const navigate = useNavigate();
    const [quizData, setQuizData] = useState([]);
    const [nodeData, setNodeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState('summary'); // 'summary' or 'quiz'
    const [showReward, setShowReward] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Node Info (Summary)
                const nodeRes = await api.get(`/api/courses/${courseId}/nodes/${id}/content`);
                setNodeData(nodeRes.data); // Backend returns { data: { ... } }, api utility unwraps to just the JSON body

                // 2. Fetch Quiz Questions
                try {
                    const quizRes = await api.get(`/api/quizzes/node/${id}`);
                    setQuizData(quizRes.data.questions || []);
                } catch (quizErr) {
                    console.log("No quiz data available for this node, or fetch failed:", quizErr.message);
                    setQuizData([]);
                }
            } catch (error) {
                console.error("Failed to load lesson data", error);
                // If it's just the quiz failing, we might still have a summary
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const { courses, fetchCourseNodes } = useCourseStore();

    const handleComplete = async (score, answersData) => {
        try {
            await api.post('/api/quizzes/submit', {
                nodeId: id,
                answers: answersData || []
            });
            
            // Mark node as completed in the student's progress
            try {
                await api.post('/api/progress/complete-node', {
                    courseId: courseId,
                    nodeId: id
                });
            } catch (progressErr) {
                console.log("Progress update skipped (instructor preview or already completed):", progressErr.message);
            }

            // Refresh course map data so the sidebar updates instantly
            await fetchCourseNodes(courseId);

            // Find next lesson
            const course = courses.find(c => c._id === courseId || c.id === courseId);
            let nextNode = null;
            if (course && course.nodes) {
                const currentIndex = course.nodes.findIndex(n => n._id === id);
                if (currentIndex !== -1 && currentIndex < course.nodes.length - 1) {
                    nextNode = course.nodes[currentIndex + 1];
                }
            }

            // Show Gamified Reward Overlay
            setShowReward({ score, nextNodeId: nextNode ? nextNode._id : null });
            
        } catch (error) {
            alert(error.message || "Failed to submit quiz");
        }
    };

    if (isLoading) {
        return (
            <StudentLayout title="Loading Lesson...">
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div>
                    <p className="text-gray-500 font-medium">Preparing your lesson materials...</p>
                </div>
            </StudentLayout>
        );
    }

    // Step 0: Gamification Reward Overlay
    if (showReward) {
        return (
            <StudentLayout title="Quiz Complete">
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="bg-gray-900 border border-indigo-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(99,102,241,0.2)] relative overflow-hidden"
                    >
                        {/* Gamification particles/glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/20 blur-3xl rounded-full" />
                        
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)] mb-6 relative z-10"
                        >
                            <Trophy size={48} className="text-white drop-shadow-md" />
                        </motion.div>
                        
                        <h2 className="text-3xl font-black text-white mb-2 relative z-10">Awesome Job!</h2>
                        
                        <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
                            <span className="text-gray-400 font-medium">You earned</span>
                            <span className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">+{showReward.score} XP</span>
                        </div>
                        
                        <button
                            onClick={() => {
                                if (showReward.nextNodeId) {
                                    navigate(`/course/${courseId}/lesson/${showReward.nextNodeId}`);
                                    setStep('summary');
                                    setShowReward(null);
                                } else {
                                    navigate(`/course/${courseId}`);
                                }
                            }}
                            className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors relative z-10"
                        >
                            {showReward.nextNodeId ? 'Continue to Next Lesson' : 'Back to Map'}
                        </button>
                    </motion.div>
                </div>
            </StudentLayout>
        );
    }

    // Step 1: Lesson Summary
    if (step === 'summary') {
        return (
            <StudentLayout title={nodeData?.title || "Lesson"}>
                <div className="min-h-screen bg-gray-50 flex flex-col">
                    <div className="bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10 border-b border-gray-100">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition">
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="font-bold text-gray-900" dir="auto">{nodeData?.title || "Lesson Summary"}</h1>
                            <p className="text-xs text-gray-400">Read the summary carefully before the quiz</p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-3xl mx-auto w-full p-6 md:p-12">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-studylabs-blue/5 px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-studylabs-blue rounded-xl flex items-center justify-center text-white">
                                    <BookOpen size={20} />
                                </div>
                                <h2 className="text-xl font-display font-bold text-gray-900">Study Guide</h2>
                            </div>
                            
                            <div className="p-8 md:p-10 prose prose-slate max-w-none">
                                {nodeData?.content ? (
                                    <ContentRenderer content={nodeData.content} className="text-gray-700 leading-relaxed" />
                                ) : (
                                    <p className="text-gray-400 italic">No summary available for this lesson.</p>
                                )}
                            </div>

                            <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Ready for the test?</p>
                                        <p className="text-xs text-gray-500">{quizData.length} questions • Earn up to 200 XP</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep('quiz')}
                                    className="w-full md:w-auto bg-studylabs-blue text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-studylabs-dark transition flex items-center justify-center gap-2"
                                >
                                    Start Quiz <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    // Step 2: Quiz
    return (
        <StudentLayout title="Quiz">
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10 border-b border-gray-100">
                    <button onClick={() => setStep('summary')} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="font-bold text-gray-900">{nodeData?.title} • Quiz</h1>
                        <p className="text-xs text-gray-400">Score at least 70% to pass</p>
                    </div>
                </div>

                <div className="flex-1 p-6 md:p-12">
                    {quizData.length > 0 ? (
                        <QuizEngine questions={quizData} onComplete={handleComplete} />
                    ) : (
                        <div className="text-center p-10 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500">
                            No quiz questions available for this node.
                        </div>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
};

export default LessonQuiz;
