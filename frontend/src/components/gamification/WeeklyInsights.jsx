import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, AlertCircle, ArrowRight, Zap, Target } from 'lucide-react';
import useGamificationStore from '../../store/gamificationStore';

const WeeklyInsights = () => {
    const { stats } = useGamificationStore();

    // Construct highly personalized AI insights based on actual student gamification stats
    const getInsightContent = () => {
        const { lessons_completed = 0, streak = 0, fast_answers = 0, night_study = 0 } = stats;

        if (streak >= 3) {
            return {
                title: '🔥 Unstoppable Momentum!',
                description: `Outstanding! You are on a ${streak}-day study streak. Your consistency is legendary. Keep logging in daily to secure your Quest Multipliers and defend your leaderboard position!`,
                tip: 'Tip: Solve a quiz before midnight to secure your daily streak bonus!',
                color: 'from-orange-500/10 to-amber-500/5 border-orange-500/20 text-orange-800 dark:text-orange-300',
            };
        }

        if (fast_answers >= 4) {
            return {
                title: '⚡ Lightning Reflexes!',
                description: `You've achieved ${fast_answers} Speed Bonuses by answering under 5 seconds! While your quick thinking is incredible, consider taking an extra 20 seconds on open-ended assignments to guarantee maximum AI evaluation XP.`,
                tip: 'Tip: Slow down slightly on written essays to score a Perfect Quest +300 XP!',
                color: 'from-amber-500/10 to-yellow-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300',
            };
        }

        if (night_study >= 1) {
            return {
                title: '🦉 The Night Owl Scholar',
                description: `You did a midnight study session! Studying late shows immense dedication. Try to tackle a conceptual study guide early tomorrow morning when your focus is fresh to unlock the "Early Bird" rare badge.`,
                tip: 'Tip: Unlocking "Early Bird" grants a permanent +20% Streak XP multiplier!',
                color: 'from-purple-500/10 to-indigo-500/5 border-purple-500/20 text-purple-800 dark:text-purple-300',
            };
        }

        if (lessons_completed >= 5) {
            return {
                title: '📚 Academic Titan',
                description: `Incredible work! You've finished ${lessons_completed} lessons recently. Your academic velocity is excellent. Try to focus on scoring 100% on the upcoming quiz to secure a Milestone chest reward!`,
                tip: 'Tip: Review the summary guide carefully before hitting "Start Quiz"!',
                color: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300',
            };
        }

        // Default greeting
        return {
            title: '🎯 Ready for Lift-off?',
            description: `Welcome to your learning dashboard! Complete your first conceptual lesson today to secure a guaranteed +150 XP and start building your custom learning streak.`,
            tip: "Tip: Finish today's active quest for a fast Level 2 promotion!",
            color: 'from-indigo-500/10 to-purple-500/5 border-indigo-500/20 text-indigo-800 dark:text-indigo-300',
        };
    };

    const insight = getInsightContent();

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden h-full flex flex-col justify-between border ${insight.color}`}
        >
            <div className="absolute inset-0 bg-white/5 dark:bg-black/5 opacity-40 pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Brain
                            size={18}
                            className="text-indigo-500 dark:text-indigo-400 animate-pulse"
                        />
                        <h3 className="text-xs font-black text-slate-500 dark:text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                            AI Weekly Insights
                            <Sparkles size={12} className="text-indigo-500 animate-bounce" />
                        </h3>
                    </div>
                </div>

                {/* Insight Body */}
                <div className="space-y-3">
                    <h4 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                        {insight.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {insight.description}
                    </p>
                </div>
            </div>

            {/* Insight Actionable Tip */}
            <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-white/5 flex items-start gap-2.5 relative z-10">
                <AlertCircle size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-xs font-black tracking-wide text-indigo-600 dark:text-indigo-400">
                    {insight.tip}
                </p>
            </div>
        </motion.div>
    );
};

export default WeeklyInsights;
