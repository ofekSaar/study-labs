import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ArrowRight, BrainCircuit, Loader2 } from 'lucide-react';
import ContentRenderer from '../common/ContentRenderer';
import { isRTL } from '../../utils/rtl';

const QuizEngine = ({ questions, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [openAnswer, setOpenAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [feedback, setFeedback] = useState(null); // { isCorrect: boolean, message: string }
    const [score, setScore] = useState(0);

    const currentQuestion = questions[currentIndex];
    // Determine type: default to 'mcq' if not specified, 'open' if checking explicit type
    const isOpenQuestion = currentQuestion.type === 'open';

    // Helper to detect RTL language (Hebrew/Arabic)


    const handleMCQSubmit = () => {
        if (selectedOption === null) return;

        const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
        setFeedback({
            isCorrect,
            message: currentQuestion.explanation || (isCorrect ? 'Correct!' : 'Incorrect.')
        });

        if (isCorrect) setScore(s => s + 100); // 100XP per question
        setIsSubmitted(true);
    };

    const handleOpenSubmit = async () => {
        if (!openAnswer.trim()) return;

        setIsEvaluating(true);

        // Mock AI Evaluation
        setTimeout(() => {
            setIsEvaluating(false);
            // Simple mock logic: length check for now
            const isGood = openAnswer.length > 20;
            setFeedback({
                isCorrect: isGood,
                message: isGood
                    ? "Excellent answer! You captured the key concepts well."
                    : "That's a bit brief. Try to elaborate on the core principles."
            });
            if (isGood) setScore(s => s + 150); // Weighted more
            setIsSubmitted(true);
        }, 2000);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            // Reset state
            setSelectedOption(null);
            setOpenAnswer('');
            setIsSubmitted(false);
            setFeedback(null);
        } else {
            onComplete(score);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 min-h-[500px] flex flex-col">
            {/* Progress Bar */}
            <div className="h-2 bg-gray-100">
                <div
                    className="h-full bg-studylabs-blue transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            <div className="p-8 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="bg-blue-50 text-studylabs-blue px-3 py-1 rounded-full text-xs font-bold">
                        {score} XP
                    </span>
                </div>

                {/* Question Text */}
                <div
                    className="text-2xl font-display font-bold text-gray-900 mb-8 leading-relaxed prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-p:my-0"
                >
                    <ContentRenderer content={currentQuestion.question} />
                </div>

                {/* Answer Area */}
                <div className="flex-1">
                    {currentQuestion.type === 'summary' ? (
                        // SUMMARY CARD RENDER
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <h3 className="text-xl font-bold text-studylabs-blue mb-4">Lesson Summary</h3>
                            <ContentRenderer content={currentQuestion.content} className="prose prose-blue max-w-none text-gray-700 leading-relaxed" />
                            <div className="mt-6 flex items-center gap-3 text-sm font-medium text-blue-600 bg-white p-3 rounded-lg border border-blue-100 shadow-sm w-fit">
                                <BrainCircuit size={18} />
                                <span>Read this carefully before starting the quiz!</span>
                            </div>
                        </div>
                    ) : !isOpenQuestion ? (
                        // MCQ RENDER
                        <div className="space-y-3">
                            {currentQuestion.options.map((opt, idx) => {
                                const isSelected = selectedOption === idx;
                                const showCorrect = isSubmitted && idx === currentQuestion.correctAnswerIndex;
                                const showWrong = isSubmitted && isSelected && !feedback.isCorrect;
                                const optDirection = isRTL(opt) ? 'rtl' : 'ltr';

                                let baseStyle = "w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ";

                                // Handle text alignment based on direction
                                baseStyle += optDirection === 'rtl' ? 'text-right flex-row-reverse' : 'text-left';

                                if (isSubmitted) {
                                    if (showCorrect) baseStyle += " border-green-500 bg-green-50 text-green-800";
                                    else if (showWrong) baseStyle += " border-red-500 bg-red-50 text-red-800";
                                    else baseStyle += " border-gray-100 opacity-50";
                                } else {
                                    if (isSelected) baseStyle += " border-studylabs-blue bg-blue-50 text-studylabs-blue font-medium";
                                    else baseStyle += " border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-600";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => !isSubmitted && setSelectedOption(idx)}
                                        disabled={isSubmitted}
                                        className={baseStyle}
                                        dir="auto"
                                    >
                                        <ContentRenderer inline content={opt} className="prose prose-sm max-w-none prose-p:my-0 prose-code:text-sm" />
                                        {showCorrect && <CheckCircle size={20} className="text-green-600 shrink-0 mx-2" />}
                                        {showWrong && <XCircle size={20} className="text-red-500 shrink-0 mx-2" />}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        // OPEN QUESTION RENDER
                        <div className="space-y-4">
                            <textarea
                                value={openAnswer}
                                onChange={(e) => setOpenAnswer(e.target.value)}
                                disabled={isSubmitted || isEvaluating}
                                placeholder="Type your answer here..."
                                dir="auto"
                                className="w-full h-48 p-4 rounded-xl border-2 border-gray-200 focus:border-studylabs-blue focus:ring-0 resize-none font-sans text-lg text-gray-800 placeholder:text-gray-300 transition-colors"
                            />
                            {isEvaluating && (
                                <div className="flex items-center gap-2 text-studylabs-blue font-medium animate-pulse">
                                    <BrainCircuit size={20} />
                                    <span>AI Evaluator is analyzing your response...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Feedback Section */}
                {feedback && (
                    <div
                        className={`mt-6 p-4 rounded-xl ${feedback.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} animate-fade-in`}
                    >
                        <p className="font-bold mb-1">{feedback.isCorrect ? "Well done!" : "Keep practicing."}</p>
                        <ContentRenderer content={feedback.message} className="prose prose-sm max-w-none prose-p:my-1 prose-code:text-sm" />
                    </div>
                )}

                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    {currentQuestion.type === 'summary' ? (
                        <button
                            onClick={handleNext}
                            className="bg-studylabs-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-studylabs-dark transition-colors flex items-center gap-2"
                        >
                            Start Quiz <ArrowRight size={20} />
                        </button>
                    ) : !isSubmitted ? (
                        <button
                            onClick={isOpenQuestion ? handleOpenSubmit : handleMCQSubmit}
                            disabled={(isOpenQuestion && !openAnswer) || (!isOpenQuestion && selectedOption === null && currentQuestion.type !== 'summary') || isEvaluating}
                            className="bg-studylabs-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-studylabs-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isEvaluating ? <Loader2 className="animate-spin" size={20} /> : 'Check Answer'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                            <ArrowRight size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizEngine;
