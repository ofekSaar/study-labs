import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useGamificationStore = create(
    persist(
        (set, get) => ({
            // Level Up state
            showLevelUp: false,
            newLevel: 1,
            previousXP: 0,

            // Daily Challenge state
            dailyChallenge: null,
            dailyChallengeCompleted: false,
            lastChallengeDate: null,

            // Streak calendar – tracks last 28 days of activity
            activityLog: [], // array of ISO date strings

            // Leaderboard cache
            leaderboard: [],
            leaderboardFetchedAt: null,

            // Pending confetti trigger
            triggerConfetti: false,
            confettiReason: null, // 'perfect_score' | 'level_up' | 'streak'

            // ── Actions ──────────────────────────────────────
            triggerLevelUp: (newLevel) => set({ showLevelUp: true, newLevel }),
            dismissLevelUp: () => set({ showLevelUp: false }),

            setTriggerConfetti: (reason) => set({ triggerConfetti: true, confettiReason: reason }),
            clearConfetti: () => set({ triggerConfetti: false, confettiReason: null }),

            checkLevelUp: (previousXP, newXP) => {
                const oldLevel = Math.floor(previousXP / 100) + 1;
                const newLevel = Math.floor(newXP / 100) + 1;
                if (newLevel > oldLevel) {
                    set({ showLevelUp: true, newLevel, previousXP });
                    return true;
                }
                return false;
            },

            logActivity: () => {
                const today = new Date().toISOString().split('T')[0];
                const { activityLog } = get();
                if (!activityLog.includes(today)) {
                    // Keep only last 60 days
                    const pruned = [...activityLog, today]
                        .filter(d => {
                            const diff = (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);
                            return diff <= 60;
                        });
                    set({ activityLog: pruned });
                }
            },

            generateDailyChallenge: () => {
                const today = new Date().toISOString().split('T')[0];
                const { lastChallengeDate } = get();
                if (lastChallengeDate === today) return; // already generated today

                const challenges = [
                    { id: 'study_30', title: 'Study for 30 minutes', xp: 150, icon: '📚' },
                    { id: 'quiz_perfect', title: 'Score 100% on a quiz', xp: 300, icon: '🎯' },
                    { id: 'complete_lesson', title: 'Complete a lesson', xp: 200, icon: '✅' },
                    { id: 'streak_day', title: 'Maintain your streak today', xp: 100, icon: '🔥' },
                    { id: 'no_mistakes', title: 'Answer 5 questions without mistakes', xp: 250, icon: '⚡' },
                ];
                const challenge = challenges[Math.floor(Math.random() * challenges.length)];
                set({
                    dailyChallenge: { ...challenge, date: today },
                    dailyChallengeCompleted: false,
                    lastChallengeDate: today,
                });
            },

            completeChallenge: () => set({ dailyChallengeCompleted: true }),

            setLeaderboard: (data) => set({ leaderboard: data, leaderboardFetchedAt: Date.now() }),
        }),
        {
            name: 'studylabs-gamification',
            partialize: (state) => ({
                activityLog: state.activityLog,
                dailyChallenge: state.dailyChallenge,
                dailyChallengeCompleted: state.dailyChallengeCompleted,
                lastChallengeDate: state.lastChallengeDate,
                previousXP: state.previousXP,
            }),
        }
    )
);

export default useGamificationStore;
