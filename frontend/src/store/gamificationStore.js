import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import BADGES, { checkBadges } from '../utils/badges';
import useToastStore from './toastStore';
import sounds from '../utils/soundManager';
import api from '../utils/api.js';
import { AVATARS, INSTRUCTOR_AVATARS, TITLES, QUEST_DEFINITIONS, SHOP_ITEMS, FRAMES, THEMES } from '../constants/gamification';

export { AVATARS, INSTRUCTOR_AVATARS, TITLES, QUEST_DEFINITIONS, SHOP_ITEMS, FRAMES, THEMES };

const notifyNewBadges = (badgeIds) => {
    if (!badgeIds?.length) return;
    setTimeout(() => {
        badgeIds.forEach(badgeId => {
            const b = BADGES.find(x => x.id === badgeId);
            if (b) useToastStore.getState().badge(b.name, b.icon);
        });
        sounds.badge();
    }, 500);
};

const useGamificationStore = create(
    persist(
        (set, get) => {
        const makeSelectAction = (stateKey, payloadKey) => async (id) => {
            set({ [stateKey]: id });
            try {
                await api.put('/api/progress/gamification/active', { [payloadKey]: id });
            } catch (err) {
                console.error(`[Gamification Store] Failed to save active ${payloadKey}:`, err);
            }
        };
        return ({
            // Shop & Economy state
            coins: 100,
            streakShields: 0,
            xpBoosts: 0,
            weekendFreezes: 0,

            // Level Up state
            showLevelUp: false,
            newLevel: 1,
            previousXP: 0,

            // Avatar & Custom Titles state
            activeAvatar: 'default',
            activeTitle: 'beginner',
            unlockedAvatars: ['default'],
            unlockedTitles: ['beginner'],

            // Themes & Avatar Frames state
            activeTheme: 'default',
            unlockedThemes: ['default'],
            activeFrame: 'default',
            unlockedFrames: ['default'],

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

            // Purchase history
            purchaseHistory: [],

            // ── Actions ──────────────────────────────────────
            fetchGamificationState: async () => {
                try {
                    const res = await api.get('/api/progress/gamification');
                    if (res && res.data) {
                        set({
                            coins: res.data.coins ?? 100,
                            streakShields: res.data.streakShields ?? 0,
                            xpBoosts: res.data.xpBoosts ?? 0,
                            weekendFreezes: res.data.weekendFreezes ?? 0,
                            activeAvatar: res.data.activeAvatar ?? 'default',
                            activeTitle: res.data.activeTitle ?? 'beginner',
                            unlockedAvatars: res.data.unlockedAvatars ?? ['default'],
                            unlockedTitles: res.data.unlockedTitles ?? ['beginner'],
                            activeTheme: res.data.activeTheme ?? 'default',
                            unlockedThemes: res.data.unlockedThemes ?? ['default'],
                            activeFrame: res.data.activeFrame ?? 'default',
                            unlockedFrames: res.data.unlockedFrames ?? ['default'],
                            unlockedBadges: res.data.unlockedBadges ?? [],
                            stats: res.data.stats ?? get().stats,
                            questsProgress: res.data.questsProgress ?? {},
                            questsClaimed: res.data.questsClaimed ?? [],
                            dailyChallengeCompleted: res.data.dailyChallengeCompleted ?? false,
                            lastChallengeDate: res.data.lastChallengeDate ?? null,
                            activityLog: res.data.activityLog ?? [],
                        });
                        // Fetch purchase history separately (not in main gamification state)
                        try {
                            const histRes = await api.get('/api/progress/gamification/purchase-history');
                            if (histRes?.data?.purchaseHistory) {
                                set({ purchaseHistory: histRes.data.purchaseHistory });
                            }
                        } catch { /* non-critical */ }
                    }
                } catch (error) {
                    console.error('[Gamification Store] Failed to fetch state:', error.message);
                }
            },

            syncGamificationState: async () => {
                try {
                    const state = get();
                    const payload = {
                        coins: state.coins,
                        streakShields: state.streakShields,
                        xpBoosts: state.xpBoosts,
                        weekendFreezes: state.weekendFreezes,
                        unlockedBadges: state.unlockedBadges,
                        stats: state.stats,
                        questsProgress: state.questsProgress,
                        questsClaimed: state.questsClaimed,
                        dailyChallengeCompleted: state.dailyChallengeCompleted,
                        lastChallengeDate: state.lastChallengeDate,
                        activityLog: state.activityLog,
                        activeAvatar: state.activeAvatar,
                        activeTitle: state.activeTitle,
                        unlockedAvatars: state.unlockedAvatars,
                        unlockedTitles: state.unlockedTitles,
                        activeTheme: state.activeTheme,
                        unlockedThemes: state.unlockedThemes,
                        activeFrame: state.activeFrame,
                        unlockedFrames: state.unlockedFrames
                    };
                    await api.put('/api/progress/gamification/sync', payload);
                } catch (error) {
                    console.error('[Gamification Store] Failed to sync state:', error.message);
                }
            },

            selectAvatar: makeSelectAction('activeAvatar', 'activeAvatar'),
            selectTitle: makeSelectAction('activeTitle', 'activeTitle'),
            selectTheme: makeSelectAction('activeTheme', 'activeTheme'),
            selectFrame: makeSelectAction('activeFrame', 'activeFrame'),

            triggerLevelUp: (newLevel) => {
                set({ showLevelUp: true, newLevel });
                sounds.levelUp();
            },
            
            dismissLevelUp: () => set({ showLevelUp: false }),

             getXPMultiplier: () => {
                const { stats, xpBoosts } = get();
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

                // 3. XP Boost Powerup
                if (xpBoosts > 0) {
                    multiplier *= 2.0;
                    reasons.push('XP Boost Token Active (2.0x)');
                }

                return { multiplier, reasons };
            },


            setTriggerConfetti: (reason) => set({ triggerConfetti: true, confettiReason: reason }),
            clearConfetti: () => set({ triggerConfetti: false, confettiReason: null }),

            checkLevelUp: (previousXP, newXP) => {
                const oldLevel = Math.floor(previousXP / 100) + 1;
                const newLevel = Math.floor(newXP / 100) + 1;

                // NOTE: coins are minted server-side (gamificationService) — the
                // client no longer mints them here. This function now only drives
                // the level-up celebration + cosmetic unlocks.
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

            /**
             * Adopt the authoritative reward result returned by the server
             * (from POST /complete-node or /quests/:id/claim). The server owns
             * XP, level, coins and badge unlocks — the client just renders the
             * outcome (level-up modal, cosmetic unlocks, badge + confetti).
             */
            applyServerReward: (result) => {
                if (!result) return;

                const prevLevel = get().stats.level || 1;
                const newLevel = result.newLevel ?? prevLevel;

                set(state => ({
                    coins: result.newCoins ?? state.coins,
                    stats: {
                        ...state.stats,
                        total_xp: result.userTotalXp ?? state.stats.total_xp,
                        level: newLevel,
                    },
                    unlockedBadges: result.newBadges?.length
                        ? [...new Set([...state.unlockedBadges, ...result.newBadges])]
                        : state.unlockedBadges,
                }));

                // Cosmetic unlocks gated by the new level
                const newlyUnlockedAvatars = AVATARS.filter(a => a.levelReq <= newLevel && !get().unlockedAvatars.includes(a.id)).map(a => a.id);
                const newlyUnlockedTitles = TITLES.filter(t => t.levelReq <= newLevel && !get().unlockedTitles.includes(t.id)).map(t => t.id);
                if (newlyUnlockedAvatars.length > 0 || newlyUnlockedTitles.length > 0) {
                    set(state => ({
                        unlockedAvatars: [...state.unlockedAvatars, ...newlyUnlockedAvatars],
                        unlockedTitles: [...state.unlockedTitles, ...newlyUnlockedTitles],
                    }));
                }

                // Badge toasts for server-granted badges
                notifyNewBadges(result.newBadges);
                if (result.newBadges?.length) setTimeout(() => get().setTriggerConfetti('badge_unlock'), 500);

                // Level-up celebration
                if (result.leveledUp || newLevel > prevLevel) {
                    set({ showLevelUp: true, newLevel });
                    sounds.levelUp();
                    get().setTriggerConfetti('level_up');
                }
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
                get().syncGamificationState();
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
                get().syncGamificationState();
            },

            completeChallenge: () => {
                if (get().dailyChallengeCompleted) return;
                set({ dailyChallengeCompleted: true });
                get().updateStat('daily_challenges', (get().stats.daily_challenges || 0) + 1);
                sounds.streak();
                get().syncGamificationState();
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
                        notifyNewBadges(newlyEarned);
                        setTimeout(() => get().setTriggerConfetti('badge_unlock'), 500);

                        return {
                            stats: updatedStats,
                            unlockedBadges: [...state.unlockedBadges, ...newlyEarned]
                        };
                    }

                    return { stats: updatedStats };
                });
                get().syncGamificationState();
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
                get().syncGamificationState();
            },

            incrementQuestProgress: (actionType, amount = 1) => {
                const { activeQuests, questsClaimed } = get();
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
                get().syncGamificationState();
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

                // Optimistically mark claimed for snappy UI
                set(state => ({
                    questsClaimed: [...state.questsClaimed, questId]
                }));

                // Reward notification (optimistic)
                setTimeout(() => {
                    useToastStore.getState().xp(quest.xp, `Quest Reward: ${quest.title}`);
                    sounds.perfectScore();
                    get().setTriggerConfetti('quest_complete');
                }, 100);

                // The server validates progress and grants the canonical XP/coins.
                // Adopt its authoritative result; roll back the claim on failure.
                api.post(`/api/progress/quests/${questId}/claim`)
                    .then(res => {
                        if (res?.data) get().applyServerReward(res.data);
                    })
                    .catch(err => {
                        console.error('[Gamification Store] Quest claim failed:', err.message);
                        set(state => ({
                            questsClaimed: state.questsClaimed.filter(id => id !== questId)
                        }));
                    });
            },
            buyItem: async (itemType, itemId, cost) => {
                const { coins, unlockedAvatars, unlockedTitles, unlockedThemes, unlockedFrames } = get();
                if (coins < cost) {
                    useToastStore.getState().success(
                        'Insufficient Coins!',
                        `You need ${cost} Study Coins to buy this item, but you only have ${coins}.`,
                        3500
                    );
                    return false;
                }

                // Check if already unlocked (for avatars and titles)
                if (itemType === 'avatars' && unlockedAvatars.includes(itemId)) {
                    useToastStore.getState().success('Already Owned', 'You already own this avatar!', 3000);
                    return false;
                }
                if (itemType === 'titles' && unlockedTitles.includes(itemId)) {
                    useToastStore.getState().success('Already Owned', 'You already own this title!', 3000);
                    return false;
                }
                if (itemType === 'themes' && unlockedThemes.includes(itemId)) {
                    useToastStore.getState().success('Already Owned', 'You already own this theme!', 3000);
                    return false;
                }
                if (itemType === 'frames' && unlockedFrames.includes(itemId)) {
                    useToastStore.getState().success('Already Owned', 'You already own this frame!', 3000);
                    return false;
                }

                try {
                    const res = await api.post('/api/progress/gamification/shop/buy', { category: itemType, itemId });
                    if (res && res.data) {
                        set(state => ({
                            coins: res.data.coins,
                            streakShields: res.data.streakShields,
                            xpBoosts: res.data.xpBoosts,
                            weekendFreezes: res.data.weekendFreezes,
                            unlockedAvatars: res.data.unlockedAvatars,
                            unlockedTitles: res.data.unlockedTitles,
                            unlockedThemes: res.data.unlockedThemes,
                            unlockedFrames: res.data.unlockedFrames,
                            purchaseHistory: res.data.purchaseHistory ?? state.purchaseHistory,
                        }));

                        if (itemType === 'avatars') {
                            const item = SHOP_ITEMS.avatars.find(x => x.id === itemId);
                            useToastStore.getState().success('Purchase Successful!', `Unlocked Avatar: ${item.emoji} ${item.name}`, 4000);
                        } else if (itemType === 'titles') {
                            const item = SHOP_ITEMS.titles.find(x => x.id === itemId);
                            useToastStore.getState().success('Purchase Successful!', `Unlocked Title: ${item.name}`, 4000);
                        } else if (itemType === 'themes') {
                            const item = SHOP_ITEMS.themes.find(x => x.id === itemId);
                            useToastStore.getState().success('Purchase Successful!', `Unlocked Theme: ${item.name}`, 4000);
                        } else if (itemType === 'frames') {
                            const item = SHOP_ITEMS.frames.find(x => x.id === itemId);
                            useToastStore.getState().success('Purchase Successful!', `Unlocked Frame: ${item.name}`, 4000);
                        } else if (itemType === 'powerups') {
                            if (itemId === 'streak_shield') {
                                useToastStore.getState().success('Purchase Successful!', 'Acquired 1 Streak Shield 🛡️', 4000);
                            } else if (itemId === 'xp_boost') {
                                useToastStore.getState().success('Purchase Successful!', 'Acquired 1 XP Boost Token (2x) ⚡', 4000);
                            } else if (itemId === 'weekend_freeze') {
                                useToastStore.getState().success('Purchase Successful!', 'Acquired 1 Weekend Freeze 🥶', 4000);
                            }
                        }

                        sounds.badge();
                        get().setTriggerConfetti('quest_complete');
                        return true;
                    }
                } catch (err) {
                    console.error('[Gamification Store] Purchase failed:', err);
                    useToastStore.getState().success('Purchase Failed', err.message || 'Server error', 3000);
                }
                return false;
            }
        });
        },
        {
            name: 'studylabs-gamification',
            partialize: (state) => ({
                coins: state.coins,
                streakShields: state.streakShields,
                xpBoosts: state.xpBoosts,
                weekendFreezes: state.weekendFreezes,
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
                unlockedTitles: state.unlockedTitles,
                activeTheme: state.activeTheme,
                unlockedThemes: state.unlockedThemes,
                activeFrame: state.activeFrame,
                unlockedFrames: state.unlockedFrames
            }),
        }
    )
);

export default useGamificationStore;
