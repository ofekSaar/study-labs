import React, { useState, useEffect } from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import QuizEngine from '../components/quiz/QuizEngine';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../utils/api';

const LessonQuiz = () => {
    const { id } = useParams(); // This is the nodeId
    const navigate = useNavigate();
    const [quizData, setQuizData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const { data } = await api.get(`/api/quizzes/node/${id}`);
                setQuizData(data.questions || []);
            } catch (error) {
                console.error("Failed to load quiz", error);
                alert("Failed to load quiz data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    const handleComplete = async (score, answersData) => {
        try {
            // Note: answersData should be passed up from QuizEngine
            // format: { questionIndex: number, selectedOption?: number, openAnswer?: string }[]
            await api.post('/api/quizzes/submit', {
                nodeId: id,
                answers: answersData || [] // If QuizEngine is not returning answers yet, it'll just score 0 backend-side
            });
            alert(`Quiz Complete! You earned ${score} XP.`);
            navigate(-1);
        } catch (error) {
            alert(error.message || "Failed to submit quiz");
        }
    };

    if (isLoading) {
        return (
            <StudentLayout title="Lesson Quiz">
                <div className="flex justify-center p-20">
                    <div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="Lesson Quiz">
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Simple Header */}
                <div className="bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10 border-b border-gray-100">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="font-bold text-gray-900">Authentication & Authorization</h1>
                        <p className="text-xs text-gray-400">Security Basics • Lesson 1</p>
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
