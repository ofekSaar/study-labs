import React, { useState, useEffect } from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import QuizEngine from '../components/quiz/QuizEngine';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../utils/api';
import useCourseStore from '../store/courseStore';

const LessonQuiz = () => {
    const { courseId, id } = useParams(); // id is the nodeId
    const navigate = useNavigate();
    const [quizData, setQuizData] = useState([]);
    const [nodeData, setNodeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState('summary'); // 'summary' or 'quiz'

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

            alert(`Quiz Complete! You earned ${score} XP.`);
            
            // Find next lesson
            const course = courses.find(c => c._id === courseId || c.id === courseId);
            if (course && course.nodes) {
                const currentIndex = course.nodes.findIndex(n => n._id === id);
                if (currentIndex !== -1 && currentIndex < course.nodes.length - 1) {
                    const nextNode = course.nodes[currentIndex + 1];
                    navigate(`/course/${courseId}/lesson/${nextNode._id}`);
                    setStep('summary');
                    return;
                }
            }
            navigate(`/course/${courseId}`); // Fallback to map
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
                            <h1 className="font-bold text-gray-900">{nodeData?.title || "Lesson Summary"}</h1>
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
                                    <div
                                        dir={(() => {
                                            const rtlChar = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F]/;
                                            return rtlChar.test(nodeData.content) ? 'rtl' : 'ltr';
                                        })()}
                                        className={`text-gray-700 leading-relaxed ${
                                            (/[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F]/.test(nodeData.content)) ? 'text-right' : 'text-left'
                                        }`}
                                    >
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {nodeData.content}
                                        </ReactMarkdown>
                                    </div>
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
