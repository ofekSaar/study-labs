import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import BADGES, { checkBadges } from '../utils/badges';
import useToastStore from './toastStore';
import sounds from '../utils/soundManager';
import { AVATARS, TITLES, QUEST_DEFINITIONS } from '../constants/gamification';

export { AVATARS, TITLES, QUEST_DEFINITIONS };

const useGamificationStore = create(
    persist(
        (set, get) => ({
            // Level Up state
            showLevelUp: false,
            newLevel: 1,
            previousXP: 0,

            // Avatar & Custom Titles state
            activeAvatar: 'default',
            activeTitle: 'beginner',
            unlockedAvatars: ['default'],
            unlockedTitles: ['beginner'],

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
            confettiReason: null, // 'perfect_score' | 'level_up' | 'streak' | 'badge_unlock' | 'quest_complete'

            // Badges state
            unlockedBadges: [],
            stats: {
                lessons_completed: 0,
                perfect_quizzes: 0,
                streak: 0,
                fast_answers: 0,
                no_mistake_streak: 0,
                level: 1,
                total_xp: 0,
                night_study: 0,
                early_study: 0,
                daily_challenges: 0,
                courses_completed: 0
            },

            // Quest System state
            activeQuests: { daily: [], weekly: [], milestone: [] },
            questsProgress: {}, // maps questId -> current number
            questsClaimed: [], // array of claimed questIds

            // ── Actions ──────────────────────────────────────
            selectAvatar: (avatarId) => set({ activeAvatar: avatarId }),
            selectTitle: (titleId) => set({ activeTitle: titleId }),

            triggerLevelUp: (newLevel) => {
                set({ showLevelUp: true, newLevel });
                sounds.levelUp();
            },
            
            dismissLevelUp: () => set({ showLevelUp: false }),

            getXPMultiplier: () => {
                const { stats } = get();
                const streak = stats.streak || 0;
                
                let multiplier = 1.0;
                let reasons = [];

                // 1. Streak Multiplier
                if (streak >= 5) {
                    multiplier = 1.5;
                    reasons.push('5+ Day Streak (1.5x)');
                } else if (streak >= 3) {
                    multiplier = 1.2;
                    reasons.push('3+ Day Streak (1.2x)');
                }

                // 2. Hour Multiplier (Night Owl / Early Bird)
                const hour = new Date().getHours();
                if (hour >= 0 && hour < 4) {
                    if (multiplier < 1.5) {
                        multiplier = 1.5;
                        reasons.push('Night Owl Hour (1.5x)');
                    }
                } else if (hour >= 5 && hour < 7) {
                    if (multiplier < 1.3) {
                        multiplier = 1.3;
                        reasons.push('Early Bird Hour (1.3x)');
                    }
                }

                return { multiplier, reasons };
            },


            setTriggerConfetti: (reason) => set({ triggerConfetti: true, confettiReason: reason }),
            clearConfetti: () => set({ triggerConfetti: false, confettiReason: null }),

            checkLevelUp: (previousXP, newXP) => {
                const oldLevel = Math.floor(previousXP / 100) + 1;
                const newLevel = Math.floor(newXP / 100) + 1;
                
                get().updateStat('total_xp', newXP);
                get().updateStat('level', newLevel);

                // Increment active level milestone quest progress
                get().incrementQuestProgress('level', newLevel);

                // Check and unlock new avatars/titles based on level requirement
                const newlyUnlockedAvatars = AVATARS.filter(a => a.levelReq <= newLevel && !get().unlockedAvatars.includes(a.id)).map(a => a.id);
                const newlyUnlockedTitles = TITLES.filter(t => t.levelReq <= newLevel && !get().unlockedTitles.includes(t.id)).map(t => t.id);

                if (newlyUnlockedAvatars.length > 0 || newlyUnlockedTitles.length > 0) {
                    set(state => ({
                        unlockedAvatars: [...state.unlockedAvatars, ...newlyUnlockedAvatars],
                        unlockedTitles: [...state.unlockedTitles, ...newlyUnlockedTitles]
                    }));

                    newlyUnlockedAvatars.forEach(avId => {
                        const av = AVATARS.find(x => x.id === avId);
                        if (av) {
                            setTimeout(() => {
                                useToastStore.getState().success(
                                    'New Avatar Unlocked!',
                                    `${av.emoji} "${av.name}" is now available in your profile!`,
                                    4500
                                );
                            }, 500);
                        }
                    });
                }

                if (newLevel > oldLevel) {
                    set({ showLevelUp: true, newLevel, previousXP });
                    sounds.levelUp();
                    get().setTriggerConfetti('level_up');
                    return true;
                }
                return false;
            },

            logActivity: () => {
                const today = new Date().toISOString().split('T')[0];
                const { activityLog } = get();
                
                const hour = new Date().getHours();
                if (hour >= 0 && hour < 4) {
                    get().updateStat('night_study', 1);
                } else if (hour >= 5 && hour < 7) {
                    get().updateStat('early_study', 1);
                }

                if (!activityLog.includes(today)) {
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
                if (lastChallengeDate === today) return;

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

                // Also initialize/regenerate daily/weekly quests
                get().initializeQuests();
            },

            completeChallenge: () => {
                if (get().dailyChallengeCompleted) return;
                set({ dailyChallengeCompleted: true });
                get().updateStat('daily_challenges', (get().stats.daily_challenges || 0) + 1);
                sounds.streak();
            },

            setLeaderboard: (data) => set({ leaderboard: data, leaderboardFetchedAt: Date.now() }),

            // Stats and badge unlocking actions
            updateStat: (statName, valueOrFn) => {
                set(state => {
                    const prevValue = state.stats[statName] ?? 0;
                    const newValue = typeof valueOrFn === 'function' ? valueOrFn(prevValue) : valueOrFn;
                    
                    const updatedStats = {
                        ...state.stats,
                        [statName]: newValue
                    };

                    const newlyEarned = checkBadges(updatedStats, state.unlockedBadges);
                    
                    if (newlyEarned.length > 0) {
                        setTimeout(() => {
                            newlyEarned.forEach(badgeId => {
                                const b = BADGES.find(x => x.id === badgeId);
                                if (b) {
                                    useToastStore.getState().badge(b.name, b.icon);
                                }
                            });
                            sounds.badge();
                            get().setTriggerConfetti('badge_unlock');
                        }, 500);

                        return {
                            stats: updatedStats,
                            unlockedBadges: [...state.unlockedBadges, ...newlyEarned]
                        };
                    }

                    return { stats: updatedStats };
                });
            },

            incrementStat: (statName, amount = 1) => {
                get().updateStat(statName, prev => prev + amount);
                
                // Map stats updates to active quest actions
                if (statName === 'lessons_completed') {
                    get().incrementQuestProgress('complete_lesson', amount);
                } else if (statName === 'perfect_quizzes') {
                    get().incrementQuestProgress('perfect_quiz', amount);
                } else if (statName === 'fast_answers') {
                    get().incrementQuestProgress('speed_bonus', amount);
                }
            },

            // ── Quest System Actions ──────────────────────────
            initializeQuests: () => {
                const today = new Date().toISOString().split('T')[0];
                const { activeQuests } = get();

                // If quests already set up for today, skip
                if (activeQuests.daily.length > 0 && activeQuests.daily[0]?.date === today) return;

                // Pick daily quests
                const dailies = QUEST_DEFINITIONS.daily.map(q => ({ ...q, date: today }));
                
                // Keep milestone quests persistent
                const milestones = QUEST_DEFINITIONS.milestone;

                // Simple weekly setup
                const weeklies = QUEST_DEFINITIONS.weekly;

                set({
                    activeQuests: {
                        daily: dailies,
                        weekly: weeklies,
                        milestone: milestones
                    }
                });
            },

            incrementQuestProgress: (actionType, amount = 1) => {
                const { activeQuests, questsProgress, questsClaimed } = get();
                const allActive = [
                    ...activeQuests.daily,
                    ...activeQuests.weekly,
                    ...activeQuests.milestone
                ];

                set(state => {
                    const newProgress = { ...state.questsProgress };
                    
                    allActive.forEach(quest => {
                        if (quest.action === actionType && !questsClaimed.includes(quest.id)) {
                            const current = newProgress[quest.id] ?? 0;
                            // Level action tracks absolute values rather than additions
                            const targetVal = actionType === 'level' ? amount : current + amount;
                            
                            newProgress[quest.id] = Math.min(targetVal, quest.target);

                            // Trigger complete notification
                            if (newProgress[quest.id] === quest.target && current < quest.target) {
                                setTimeout(() => {
                                    useToastStore.getState().success(
                                        'Quest Completed!',
                                        `"${quest.title}" is ready to claim!`,
                                        4000
                                    );
                                    sounds.streak();
                                }, 400);
                            }
                        }
                    });

                    return { questsProgress: newProgress };
                });
            },

            claimQuestReward: (questId) => {
                const { questsClaimed, activeQuests, questsProgress } = get();
                if (questsClaimed.includes(questId)) return;

                const allActive = [
                    ...activeQuests.daily,
                    ...activeQuests.weekly,
                    ...activeQuests.milestone
                ];
                const quest = allActive.find(q => q.id === questId);
                if (!quest) return;

                const progress = questsProgress[questId] ?? 0;
                if (progress < quest.target) return; // not completed yet

                // Claim reward
                set(state => ({
                    questsClaimed: [...state.questsClaimed, questId]
                }));

                // Reward standard XP notification
                setTimeout(() => {
                    useToastStore.getState().xp(quest.xp, `Quest Reward: ${quest.title}`);
                    sounds.perfectScore();
                    get().setTriggerConfetti('quest_complete');
                }, 100);
            }
        }),
        {
            name: 'studylabs-gamification',
            partialize: (state) => ({
                activityLog: state.activityLog,
                dailyChallenge: state.dailyChallenge,
                dailyChallengeCompleted: state.dailyChallengeCompleted,
                lastChallengeDate: state.lastChallengeDate,
                previousXP: state.previousXP,
                unlockedBadges: state.unlockedBadges,
                stats: state.stats,
                activeQuests: state.activeQuests,
                questsProgress: state.questsProgress,
                questsClaimed: state.questsClaimed,
                activeAvatar: state.activeAvatar,
                activeTitle: state.activeTitle,
                unlockedAvatars: state.unlockedAvatars,
                unlockedTitles: state.unlockedTitles
            }),
        }
    )
);

export default useGamificationStore;
