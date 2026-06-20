import React, { useState, useEffect } from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import QuizEngine from '../components/quiz/QuizEngine';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, BookOpen, GraduationCap, ArrowRight, Trophy, Zap, Clock, Star, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContentRenderer from '../components/common/ContentRenderer';
import api from '../utils/api';
import useCourseStore from '../store/courseStore';
import useGamificationStore from '../store/gamificationStore';
import ConfettiEffect from '../components/gamification/ConfettiEffect';
import LevelUpModal from '../components/gamification/LevelUpModal';

const LessonQuiz = () => {
    const { courseId, id } = useParams();
    const navigate = useNavigate();
    const [quizData, setQuizData] = useState([]);
    const [nodeData, setNodeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState('summary');
    const [showReward, setShowReward] = useState(null);

    // Gamification
    const { setTriggerConfetti, applyServerReward, logActivity, completeChallenge, dailyChallenge } = useGamificationStore();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const nodeRes = await api.get(`/api/courses/${courseId}/nodes/${id}/content`);
                setNodeData(nodeRes.data);
                try {
                    const quizRes = await api.get(`/api/quizzes/node/${id}`);
                    setQuizData(quizRes.data.questions || []);
                } catch {
                    setQuizData([]);
                }
            } catch (error) {
                console.error('Failed to load lesson data', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, courseId]);

    const { courses, fetchCourseNodes } = useCourseStore();

    const handleComplete = async (score, answersData, isPerfectScore, correctCount, totalAnswerable) => {
        try {
            await api.post('/api/quizzes/submit', {
                nodeId: id,
                answers: answersData || []
            });

            let progressResult = null;
            try {
                const res = await api.post('/api/progress/complete-node', {
                    courseId: courseId,
                    nodeId: id
                });
                progressResult = res?.data || null;
            } catch (progressErr) {
                console.warn('Progress update skipped:', progressErr.message);
            }

            await fetchCourseNodes(courseId);

            const course = courses.find(c => c._id === courseId || c.id === courseId);
            let nextNode = null;
            if (course && course.nodes) {
                const currentIndex = course.nodes.findIndex(n => n._id === id);
                if (currentIndex !== -1 && currentIndex < course.nodes.length - 1) {
                    nextNode = course.nodes[currentIndex + 1];
                }
            }

            // Log activity for streak calendar
            logActivity();

            // Check for perfect score confetti
            const isPerfect = isPerfectScore === true;
            if (isPerfect) {
                setTriggerConfetti('perfect_score');
            }

            // Check for daily challenge completion
            if (dailyChallenge?.id === 'complete_lesson' || (isPerfect && dailyChallenge?.id === 'quiz_perfect')) {
                completeChallenge();
            }

            // Adopt the authoritative reward from the server (XP, coins, level,
            // badges). The server already applied the multiplier to the graded
            // score — the client only renders the outcome.
            if (progressResult) {
                applyServerReward(progressResult);
            }

            const awardedXp = progressResult?.xpAwarded ?? score;
            const multiplier = progressResult?.multiplier ?? 1;

            setShowReward({
                score: awardedXp,
                multiplier,
                nextNodeId: nextNode ? nextNode._id : null,
                isPerfect,
                correctCount: correctCount ?? 0,
                totalAnswerable: totalAnswerable ?? 0,
            });

        } catch (error) {
            alert(error.message || 'Failed to submit quiz');
        }
    };

    if (isLoading) {
        return (
            <StudentLayout title="Loading Lesson...">
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 p-4 sm:p-8 md:p-12">
                    <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                    <p className="text-slate-500 dark:text-white/40 font-medium">Preparing your lesson materials...</p>
                </div>
            </StudentLayout>
        );
    }

    // ── Reward Overlay ──
    if (showReward) {
        const pct = showReward.totalAnswerable > 0
            ? Math.round((showReward.correctCount / showReward.totalAnswerable) * 100)
            : 0;
        const passed = pct >= 70;

        return (
            <StudentLayout title="Quiz Complete">
                <ConfettiEffect />
                <LevelUpModal />
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 14 }}
                        className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-5 sm:p-8 max-w-sm w-full mx-4 text-center shadow-[0_0_60px_rgba(99,102,241,0.25)] relative overflow-hidden"
                    >
                        {/* Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/15 blur-3xl rounded-full pointer-events-none" />

                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] mb-5 relative z-10 ${
                                showReward.isPerfect
                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                    : passed
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                                        : 'bg-gradient-to-br from-slate-600 to-slate-700'
                            }`}
                        >
                            {showReward.isPerfect
                                ? <Star size={48} className="text-white fill-white drop-shadow-md" />
                                : passed
                                    ? <Trophy size={48} className="text-white drop-shadow-md" />
                                    : <RefreshCw size={48} className="text-white drop-shadow-md" />
                            }
                        </motion.div>

                        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 relative z-10">
                            {showReward.isPerfect ? '🎉 Perfect Score!' : passed ? 'Awesome Job!' : 'Keep Practicing!'}
                        </h2>
                        {showReward.totalAnswerable > 0 && (
                            <p className={`font-bold text-sm mb-3 relative z-10 ${showReward.isPerfect ? 'text-yellow-400' : passed ? 'text-indigo-400' : 'text-slate-400'}`}>
                                {showReward.correctCount} / {showReward.totalAnswerable} correct ({pct}%)
                            </p>
                        )}

                        {/* XP earned */}
                        <div className="flex items-center justify-center gap-2 mb-6 relative z-10">
                            <span className="text-slate-400 font-medium">You earned</span>
                            <motion.span
                                initial={{ scale: 0.5 }}
                                animate={{ scale: [0.5, 1.3, 1] }}
                                transition={{ delay: 0.4 }}
                                className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                            >
                                +{showReward.score} XP
                            </motion.span>
                            <Zap size={18} className="text-emerald-400 fill-emerald-400/30" />
                        </div>

                        {showReward.multiplier > 1 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.55, type: 'spring', stiffness: 220 }}
                                className="inline-flex items-center gap-1.5 mb-6 -mt-3 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 relative z-10"
                            >
                                <Zap size={14} className="text-amber-400 fill-amber-400/40" />
                                <span className="text-sm font-bold text-amber-300">
                                    {showReward.multiplier}x Bonus applied!
                                </span>
                            </motion.div>
                        )}

                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            onClick={() => {
                                if (showReward.nextNodeId) {
                                    navigate(`/course/${courseId}/lesson/${showReward.nextNodeId}`);
                                    setStep('summary');
                                    setShowReward(null);
                                } else {
                                    navigate(`/course/${courseId}`);
                                }
                            }}
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 relative z-10"
                        >
                            {showReward.nextNodeId ? (
                                <><ArrowRight size={20} /> Continue to Next Lesson</>
                            ) : (
                                <><Trophy size={20} /> Back to Map</>
                            )}
                        </motion.button>
                    </motion.div>
                </div>
            </StudentLayout>
        );
    }

    // ── Summary Step ──
    if (step === 'summary') {
        return (
            <StudentLayout title={nodeData?.title || 'Lesson'}>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
                    <div className="bg-white dark:bg-slate-900 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 border-b border-slate-200 dark:border-white/10">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition text-slate-600 dark:text-white">
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="font-bold text-slate-900 dark:text-white" dir="auto">{nodeData?.title || 'Lesson Summary'}</h1>
                            <p className="text-xs text-slate-400 dark:text-white/40">Read the summary carefully before the quiz</p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-12">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-white/10 overflow-hidden">
                            <div className="bg-indigo-500/5 dark:bg-indigo-500/10 px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                                    <BookOpen size={20} />
                                </div>
                                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Study Guide</h2>
                            </div>
                            <div className="p-4 sm:p-8 md:p-10 prose prose-slate dark:prose-invert max-w-none">
                                {nodeData?.content ? (
                                    <ContentRenderer content={nodeData.content} className="text-slate-700 dark:text-slate-300 leading-relaxed" />
                                ) : (
                                    <p className="text-slate-400 italic">No summary available for this lesson.</p>
                                )}
                            </div>

                            <div className="p-4 sm:p-8 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Ready for the test?</p>
                                        <p className="text-xs text-slate-500 dark:text-white/40">{quizData.length} questions • Earn up to 200 XP</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep('quiz')}
                                    className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white px-8 py-3 rounded-2xl font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)] transition flex items-center justify-center gap-2"
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

    // ── Quiz Step ──
    return (
        <StudentLayout title="Quiz">
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
                <div className="bg-white dark:bg-slate-900 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 border-b border-slate-100 dark:border-white/10">
                    <button onClick={() => setStep('summary')} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition text-slate-600 dark:text-white">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="font-bold text-slate-900 dark:text-white">{nodeData?.title} • Quiz</h1>
                        <p className="text-xs text-slate-400 dark:text-white/40">Score at least 70% to pass</p>
                    </div>
                    {/* XP badge */}
                    <div className="flex items-center gap-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-400/30 px-3 py-1.5 rounded-xl">
                        <Zap size={14} className="text-indigo-500 dark:text-indigo-400 fill-indigo-500/20" />
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">Up to 200 XP</span>
                    </div>
                </div>

                <div className="flex-1 p-4 sm:p-6 md:p-12">
                    {quizData.length > 0 ? (
                        <QuizEngine questions={quizData} onComplete={handleComplete} />
                    ) : (
                        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-white/10 text-slate-500 dark:text-white/40">
                            No quiz questions available for this node.
                        </div>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
};

export default LessonQuiz;
