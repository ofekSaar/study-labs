import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, ArrowRight, BrainCircuit, Loader2, Clock, Zap, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContentRenderer from '../common/ContentRenderer';
import { isRTL } from '../../utils/rtl';
import sounds from '../../utils/soundManager';
import useGamificationStore from '../../store/gamificationStore';

const QuizEngine = ({ questions, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [openAnswer, setOpenAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [feedback, setFeedback] = useState(null); // { isCorrect: boolean, message: string }
    const [score, setScore] = useState(0);
    
    // Gamified Timer and Speed Bonus States
    const [timeLeft, setTimeLeft] = useState(30);
    const [speedBonusActive, setSpeedBonusActive] = useState(false);
    const [isTimeUp, setIsTimeUp] = useState(false);

    const { incrementStat } = useGamificationStore();

    const currentQuestion = questions[currentIndex];
    const isOpenQuestion = currentQuestion.type === 'open';
    const isSummaryQuestion = currentQuestion.type === 'summary';

    // Timer effect
    useEffect(() => {
        if (isSubmitted || isSummaryQuestion || isEvaluating) return;

        setTimeLeft(30);
        setIsTimeUp(false);
        setSpeedBonusActive(false);

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleTimeUp();
                    return 0;
                }
                
                // Play warning tick sound if 5 seconds or less left
                if (prev <= 6) {
                    sounds.timeLow();
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentIndex, isSubmitted, isSummaryQuestion, isEvaluating]);

    const handleTimeUp = () => {
        setIsTimeUp(true);
        sounds.timeUp();
        setFeedback({
            isCorrect: false,
            message: '⌛ Time expired! Try to answer faster on the next question.'
        });
        setIsSubmitted(true);
        incrementStat('no_mistake_streak', 0); // reset streak
    };

    const handleMCQSubmit = () => {
        if (selectedOption === null || isSubmitted) return;

        const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
        const timeTaken = 30 - timeLeft;
        const gotSpeedBonus = isCorrect && timeTaken <= 5;

        setFeedback({
            isCorrect,
            message: currentQuestion.explanation || (isCorrect ? 'Correct!' : 'Incorrect.')
        });

        if (isCorrect) {
            const { multiplier } = useGamificationStore.getState().getXPMultiplier();
            const gainedXP = Math.round((gotSpeedBonus ? 200 : 100) * multiplier);
            setScore(s => s + gainedXP);
            sounds.correct();
            setSpeedBonusActive(gotSpeedBonus);
            
            // Gamification stats
            if (gotSpeedBonus) {
                incrementStat('fast_answers');
            }
            incrementStat('no_mistake_streak', prev => prev + 1);
        } else {
            sounds.wrong();
            incrementStat('no_mistake_streak', 0); // reset streak
        }

        setIsSubmitted(true);
    };

    const handleOpenSubmit = async () => {
        if (!openAnswer.trim() || isSubmitted) return;

        setIsEvaluating(true);

        // Mock AI Evaluation
        setTimeout(() => {
            setIsEvaluating(false);
            const isGood = openAnswer.length > 20;
            const timeTaken = 30 - timeLeft;
            const gotSpeedBonus = isGood && timeTaken <= 10; // slightly longer speed window for writing

            setFeedback({
                isCorrect: isGood,
                message: isGood
                    ? "Excellent answer! You captured the key concepts well."
                    : "That's a bit brief. Try to elaborate on the core principles."
            });

            if (isGood) {
                const { multiplier } = useGamificationStore.getState().getXPMultiplier();
                const gainedXP = Math.round((gotSpeedBonus ? 300 : 150) * multiplier);
                setScore(s => s + gainedXP);
                sounds.correct();
                setSpeedBonusActive(gotSpeedBonus);
                
                if (gotSpeedBonus) {
                    incrementStat('fast_answers');
                }
                incrementStat('no_mistake_streak', prev => prev + 1);
            } else {
                sounds.wrong();
                incrementStat('no_mistake_streak', 0);
            }
            setIsSubmitted(true);
        }, 1500);
    };

    const handleNext = () => {
        sounds.click();
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setOpenAnswer('');
            setIsSubmitted(false);
            setFeedback(null);
            setIsTimeUp(false);
            setSpeedBonusActive(false);
        } else {
            sounds.quizComplete();
            
            // Update stats when finishing
            incrementStat('lessons_completed');
            if (score >= questions.length * 100) {
                incrementStat('perfect_quizzes');
            }
            
            onComplete(score);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-white/5 min-h-[520px] flex flex-col transition-all duration-300">
            {/* Progress Bar */}
            <div className="h-2 bg-slate-100 dark:bg-white/5">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                />
            </div>

            <div className="p-8 flex-1 flex flex-col relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 z-10">
                    <span className="text-xs font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">
                        Question {currentIndex + 1} of {questions.length}
                    </span>

                    {/* Timer Circle */}
                    {!isSummaryQuestion && !isSubmitted && (
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-sm transition-colors ${
                            timeLeft <= 5 
                                ? 'bg-red-500/10 text-red-500 animate-pulse' 
                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60'
                        }`}>
                            <Clock size={16} className={timeLeft <= 5 ? 'animate-spin' : ''} />
                            <span>{timeLeft}s</span>
                        </div>
                    )}

                    <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                        <Zap size={12} fill="currentColor" />
                        {score} XP
                    </span>
                </div>

                {/* Question Text */}
                <div className="text-2xl font-display font-black text-slate-900 dark:text-white mb-8 leading-relaxed prose prose-slate dark:prose-invert max-w-none prose-p:my-0 z-10">
                    <ContentRenderer content={currentQuestion.question} />
                </div>

                {/* Answer Area */}
                <div className="flex-1 z-10">
                    {isSummaryQuestion ? (
                        // SUMMARY CARD RENDER
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-500/5 dark:bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/10 dark:border-indigo-500/20"
                        >
                            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">Lesson Summary</h3>
                            <ContentRenderer content={currentQuestion.content} className="prose prose-indigo dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed" />
                            <div className="mt-6 flex items-center gap-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-500/10 shadow-sm w-fit">
                                <BrainCircuit size={16} />
                                <span>Read this carefully before starting the quiz!</span>
                            </div>
                        </motion.div>
                    ) : !isOpenQuestion ? (
                        // MCQ RENDER
                        <div className="space-y-3">
                            {currentQuestion.options.map((opt, idx) => {
                                const isSelected = selectedOption === idx;
                                const showCorrect = isSubmitted && idx === currentQuestion.correctAnswerIndex;
                                const showWrong = isSubmitted && isSelected && !feedback.isCorrect;
                                const optDirection = isRTL(opt) ? 'rtl' : 'ltr';

                                let baseStyle = "w-full p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group shadow-sm text-sm font-bold ";
                                baseStyle += optDirection === 'rtl' ? 'text-right flex-row-reverse' : 'text-left';

                                if (isSubmitted) {
                                    if (showCorrect) baseStyle += " border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
                                    else if (showWrong) baseStyle += " border-red-500 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300";
                                    else baseStyle += " border-slate-100 dark:border-white/5 opacity-40";
                                } else {
                                    if (isSelected) baseStyle += " border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-md";
                                    else baseStyle += " border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/3 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-white/8 text-slate-700 dark:text-white/80";
                                }

                                return (
                                    <motion.button
                                        key={idx}
                                        onClick={() => { sounds.click(); !isSubmitted && setSelectedOption(idx); }}
                                        disabled={isSubmitted}
                                        whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                                        whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                                        className={baseStyle}
                                        dir="auto"
                                    >
                                        <ContentRenderer inline content={opt} className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0" />
                                        {showCorrect && <CheckCircle size={20} className="text-emerald-500 shrink-0 mx-2" />}
                                        {showWrong && <XCircle size={20} className="text-red-500 shrink-0 mx-2" />}
                                    </motion.button>
                                );
                            })}
                        </div>
                    ) : (
                        // OPEN QUESTION RENDER
                        <div className="space-y-4">
                            <textarea
                                value={openAnswer}
                                onChange={(e) => setOpenAnswer(e.target.value)}
                                disabled={isSubmitted || isEvaluating || isTimeUp}
                                placeholder="Type your answer here..."
                                dir="auto"
                                className="w-full h-48 p-4 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/3 text-slate-800 dark:text-white placeholder:text-slate-300 focus:border-indigo-500 focus:ring-0 resize-none font-sans text-lg transition-all shadow-inner"
                            />
                            {isEvaluating && (
                                <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-bold text-sm animate-pulse">
                                    <BrainCircuit size={18} className="animate-spin" />
                                    <span>AI Evaluator is analyzing your response...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Feedback Section */}
                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-6 p-4 rounded-2xl border flex flex-col gap-1 ${
                                feedback.isCorrect 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
                                    : isTimeUp 
                                        ? 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300'
                                        : 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-black text-sm">
                                {feedback.isCorrect ? (
                                    <>
                                        <CheckCircle size={16} />
                                        <span>Well done!</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={16} />
                                        <span>{isTimeUp ? 'Time Up!' : 'Keep practicing.'}</span>
                                    </>
                                )}
                                {speedBonusActive && (
                                    <span className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm animate-bounce">
                                        <Zap size={8} fill="currentColor" /> Speed Bonus +100 XP
                                    </span>
                                )}
                            </div>
                            <ContentRenderer content={feedback.message} className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end z-10">
                    {isSummaryQuestion ? (
                        <button
                            onClick={handleNext}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2"
                        >
                            Start Quiz <ArrowRight size={20} />
                        </button>
                    ) : !isSubmitted ? (
                        <button
                            onClick={isOpenQuestion ? handleOpenSubmit : handleMCQSubmit}
                            disabled={(isOpenQuestion && !openAnswer) || (!isOpenQuestion && selectedOption === null) || isEvaluating || isTimeUp}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                        >
                            {isEvaluating ? <Loader2 className="animate-spin" size={20} /> : 'Check Answer'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-2"
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

