import { act } from 'react';
import useGamificationStoreModule from '../store/gamificationStore';
import { AVATARS, TITLES } from '../constants/gamification';
import BADGES from '../utils/badges';
import soundsModule from '../utils/soundManager';
import useToastStoreModule from '../store/toastStore';

const useGamificationStore = useGamificationStoreModule.default || useGamificationStoreModule;
const sounds = soundsModule.default || soundsModule;
const useToastStore = useToastStoreModule.default || useToastStoreModule;

describe('useGamificationStore Zustand Store', () => {
    const originalDate = global.Date;
    const originalConsoleError = console.error;
    let mockToastState;

    beforeAll(() => {
        console.error = jest.fn();

        // Spy on soundManager methods
        jest.spyOn(sounds, 'levelUp').mockImplementation(() => {});
        jest.spyOn(sounds, 'badge').mockImplementation(() => {});
        jest.spyOn(sounds, 'streak').mockImplementation(() => {});
        jest.spyOn(sounds, 'perfectScore').mockImplementation(() => {});

        // Spy on toastStore methods
        mockToastState = useToastStore.getState();
        jest.spyOn(mockToastState, 'success').mockImplementation(() => {});
        jest.spyOn(mockToastState, 'badge').mockImplementation(() => {});
        jest.spyOn(mockToastState, 'xp').mockImplementation(() => {});
    });

    afterAll(() => {
        console.error = originalConsoleError;
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.useFakeTimers();
        mockToastState = useToastStore.getState();

        sounds.levelUp.mockClear();
        sounds.badge.mockClear();
        sounds.streak.mockClear();
        sounds.perfectScore.mockClear();

        mockToastState.success.mockClear();
        mockToastState.badge.mockClear();
        mockToastState.xp.mockClear();

        // Reset the store state before each test run
        act(() => {
            useGamificationStore.setState({
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
                activeAvatar: 'default',
                activeTitle: 'beginner',
                unlockedAvatars: ['default'],
                unlockedTitles: ['beginner'],
                unlockedBadges: [],
                showLevelUp: false,
                newLevel: 1,
                previousXP: 0,
                dailyChallenge: null,
                dailyChallengeCompleted: false,
                lastChallengeDate: null,
                activityLog: [],
                leaderboard: [],
                leaderboardFetchedAt: null,
                triggerConfetti: false,
                confettiReason: null,
                activeQuests: { daily: [], weekly: [], milestone: [] },
                questsProgress: {},
                questsClaimed: []
            });
        });
    });

    afterEach(() => {
        global.Date = originalDate;
        jest.useRealTimers();
    });

    const setMockTime = (hours) => {
        const mockDateInstance = new originalDate(2026, 4, 17, hours, 0, 0);
        mockDateInstance.toISOString = () => '2026-05-17T12:00:00.000Z';
        global.Date = jest.fn((...args) => {
            if (args.length > 0) return new originalDate(...args);
            return mockDateInstance;
        });
        global.Date.now = () => mockDateInstance.getTime();
    };

    test('verifies initial state is loaded correctly', () => {
        const state = useGamificationStore.getState();
        expect(state.stats.level).toBe(1);
        expect(state.stats.total_xp).toBe(0);
        expect(state.stats.streak).toBe(0);
        expect(state.activeAvatar).toBe('default');
        expect(state.activeTitle).toBe('beginner');
        expect(state.unlockedAvatars).toContain('default');
        expect(state.unlockedTitles).toContain('beginner');
    });

    test('selects and updates avatar and title selection correctly', () => {
        act(() => {
            useGamificationStore.getState().selectAvatar('scholar');
            useGamificationStore.getState().selectTitle('curious');
        });

        const state = useGamificationStore.getState();
        expect(state.activeAvatar).toBe('scholar');
        expect(state.activeTitle).toBe('curious');
    });

    test('calculates correct XP streak multipliers', () => {
        // Test with 0 streak (should be 1.0x)
        let boost = useGamificationStore.getState().getXPMultiplier();
        expect(boost.multiplier).toBe(1.0);

        // Test with 3-day streak (should be 1.2x)
        act(() => {
            useGamificationStore.setState({
                stats: { ...useGamificationStore.getState().stats, streak: 3 }
            });
        });
        boost = useGamificationStore.getState().getXPMultiplier();
        expect(boost.multiplier).toBe(1.2);
        expect(boost.reasons).toContain('3+ Day Streak (1.2x)');

        // Test with 5-day streak (should be 1.5x)
        act(() => {
            useGamificationStore.setState({
                stats: { ...useGamificationStore.getState().stats, streak: 5 }
            });
        });
        boost = useGamificationStore.getState().getXPMultiplier();
        expect(boost.multiplier).toBe(1.5);
        expect(boost.reasons).toContain('5+ Day Streak (1.5x)');
    });

    test('calculates correct hour multipliers (Night Owl / Early Bird)', () => {
        // Night Owl Hour (1 AM)
        setMockTime(1);
        let boost = useGamificationStore.getState().getXPMultiplier();
        expect(boost.multiplier).toBe(1.5);
        expect(boost.reasons).toContain('Night Owl Hour (1.5x)');

        // Early Bird Hour (6 AM)
        setMockTime(6);
        boost = useGamificationStore.getState().getXPMultiplier();
        expect(boost.multiplier).toBe(1.3);
        expect(boost.reasons).toContain('Early Bird Hour (1.3x)');
    });

    test('handles checkLevelUp and automatically unlocks avatars & titles programmatically', () => {
        // Previous XP was 0, new XP is 150 (Level = Math.floor(150 / 100) + 1 = Level 2)
        let result;
        act(() => {
            result = useGamificationStore.getState().checkLevelUp(0, 150);
        });

        const state = useGamificationStore.getState();
        expect(result).toBe(true);
        expect(state.stats.level).toBe(2);
        expect(state.showLevelUp).toBe(true);
        expect(state.newLevel).toBe(2);
        expect(state.triggerConfetti).toBe(true);
        expect(state.confettiReason).toBe('level_up');
        expect(sounds.levelUp).toHaveBeenCalledTimes(1);

        // Level 2 customizable unlocks should be unlocked automatically
        expect(state.unlockedAvatars).toContain('scholar');
        expect(state.unlockedTitles).toContain('curious');

        // Check avatar unlock toast trigger
        act(() => {
            jest.advanceTimersByTime(600);
        });
        expect(mockToastState.success).toHaveBeenCalledWith(
            'New Avatar Unlocked!',
            expect.any(String),
            4500
        );
    });

    test('checkLevelUp returns false if level remains the same', () => {
        let result;
        act(() => {
            result = useGamificationStore.getState().checkLevelUp(0, 50);
        });
        expect(result).toBe(false);
        expect(useGamificationStore.getState().showLevelUp).toBe(false);
    });

    test('dismisses Level Up modal state correctly', () => {
        act(() => {
            useGamificationStore.setState({ showLevelUp: true });
            useGamificationStore.getState().dismissLevelUp();
        });

        const state = useGamificationStore.getState();
        expect(state.showLevelUp).toBe(false);
    });

    test('triggerLevelUp sets correct values', () => {
        act(() => {
            useGamificationStore.getState().triggerLevelUp(5);
        });
        const state = useGamificationStore.getState();
        expect(state.showLevelUp).toBe(true);
        expect(state.newLevel).toBe(5);
        expect(sounds.levelUp).toHaveBeenCalled();
    });

    test('confetti controls work correctly', () => {
        act(() => {
            useGamificationStore.getState().setTriggerConfetti('perfect_score');
        });
        let state = useGamificationStore.getState();
        expect(state.triggerConfetti).toBe(true);
        expect(state.confettiReason).toBe('perfect_score');

        act(() => {
            useGamificationStore.getState().clearConfetti();
        });
        state = useGamificationStore.getState();
        expect(state.triggerConfetti).toBe(false);
        expect(state.confettiReason).toBeNull();
    });

    test('logs activity correctly for Night study, Early study, and daily pruning', () => {
        // Test Night study (1 AM)
        setMockTime(1);
        act(() => {
            useGamificationStore.getState().logActivity();
        });
        let state = useGamificationStore.getState();
        expect(state.stats.night_study).toBe(1);
        expect(state.activityLog.length).toBe(1);

        // Test Early study (6 AM) on same day -> activityLog shouldn't double-add same day
        setMockTime(6);
        act(() => {
            useGamificationStore.getState().logActivity();
        });
        state = useGamificationStore.getState();
        expect(state.stats.early_study).toBe(1);
        expect(state.activityLog.length).toBe(1);

        // Test date pruning of items >60 days old
        act(() => {
            useGamificationStore.setState({
                activityLog: ['2020-01-01', '2026-05-18']
            });
        });
        // Mock current date to 2026-05-19
        const mockToday = new originalDate(2026, 4, 19, 12, 0, 0);
        mockToday.toISOString = () => '2026-05-19T12:00:00.000Z';
        global.Date = jest.fn((...args) => {
            if (args.length > 0) return new originalDate(...args);
            return mockToday;
        });
        global.Date.now = () => mockToday.getTime();

        act(() => {
            useGamificationStore.getState().logActivity();
        });
        state = useGamificationStore.getState();
        // The old date '2020-01-01' should be pruned
        expect(state.activityLog).toContain('2026-05-19');
        expect(state.activityLog).not.toContain('2020-01-01');
    });

    test('generates daily challenge only once per day', () => {
        const mockToday = new originalDate(2026, 4, 19, 12, 0, 0);
        mockToday.toISOString = () => '2026-05-19T12:00:00.000Z';
        global.Date = jest.fn((...args) => {
            if (args.length > 0) return new originalDate(...args);
            return mockToday;
        });
        global.Date.now = () => mockToday.getTime();

        act(() => {
            useGamificationStore.getState().generateDailyChallenge();
        });
        let state = useGamificationStore.getState();
        expect(state.dailyChallenge).not.toBeNull();
        expect(state.dailyChallengeCompleted).toBe(false);
        expect(state.lastChallengeDate).toBe('2026-05-19');

        const initialChallenge = state.dailyChallenge;

        // Run again on the same day -> should return immediately without replacing
        act(() => {
            useGamificationStore.getState().generateDailyChallenge();
        });
        state = useGamificationStore.getState();
        expect(state.dailyChallenge).toEqual(initialChallenge);
    });

    test('completes daily challenge correctly', () => {
        act(() => {
            useGamificationStore.setState({ dailyChallengeCompleted: false });
            useGamificationStore.getState().completeChallenge();
        });
        let state = useGamificationStore.getState();
        expect(state.dailyChallengeCompleted).toBe(true);
        expect(state.stats.daily_challenges).toBe(1);
        expect(sounds.streak).toHaveBeenCalled();

        // Complete again -> should be no-op
        sounds.streak.mockClear();
        act(() => {
            useGamificationStore.getState().completeChallenge();
        });
        state = useGamificationStore.getState();
        expect(state.stats.daily_challenges).toBe(1);
        expect(sounds.streak).not.toHaveBeenCalled();
    });

    test('sets leaderboard cache successfully', () => {
        const mockLeaderboard = [{ name: 'Alice', xp: 500 }];
        act(() => {
            useGamificationStore.getState().setLeaderboard(mockLeaderboard);
        });
        const state = useGamificationStore.getState();
        expect(state.leaderboard).toEqual(mockLeaderboard);
        expect(state.leaderboardFetchedAt).not.toBeNull();
    });

    test('updates stats and triggers badge unlock if earned', () => {
        act(() => {
            useGamificationStore.getState().updateStat('perfect_quizzes', 1);
        });

        const state = useGamificationStore.getState();
        expect(state.stats.perfect_quizzes).toBe(1);
        expect(state.unlockedBadges).toContain('first_perfect');

        // Advance timers by 500ms to verify toast and sound triggers
        act(() => {
            jest.advanceTimersByTime(600);
        });

        const stateAfterTimer = useGamificationStore.getState();
        expect(mockToastState.badge).toHaveBeenCalledWith('Sharpshooter', '🎯');
        expect(sounds.badge).toHaveBeenCalled();
        expect(stateAfterTimer.triggerConfetti).toBe(true);
        expect(stateAfterTimer.confettiReason).toBe('badge_unlock');
    });

    test('incrementStat updates stats and maps to quest increments', () => {
        // Spy on incrementQuestProgress
        const store = useGamificationStore.getState();
        const originalIncrementQuestProgress = store.incrementQuestProgress;
        const mockIncrementQuestProgress = jest.fn();
        act(() => {
            useGamificationStore.setState({ incrementQuestProgress: mockIncrementQuestProgress });
        });

        act(() => {
            useGamificationStore.getState().incrementStat('lessons_completed', 2);
        });
        expect(useGamificationStore.getState().stats.lessons_completed).toBe(2);
        expect(mockIncrementQuestProgress).toHaveBeenCalledWith('complete_lesson', 2);

        act(() => {
            useGamificationStore.getState().incrementStat('perfect_quizzes', 1);
        });
        expect(mockIncrementQuestProgress).toHaveBeenCalledWith('perfect_quiz', 1);

        act(() => {
            useGamificationStore.getState().incrementStat('fast_answers', 3);
        });
        expect(mockIncrementQuestProgress).toHaveBeenCalledWith('speed_bonus', 3);

        // Restore
        act(() => {
            useGamificationStore.setState({ incrementQuestProgress: originalIncrementQuestProgress });
        });
    });

    test('quest system: initialize and update quest progress', () => {
        const mockToday = new originalDate(2026, 4, 19, 12, 0, 0);
        mockToday.toISOString = () => '2026-05-19T12:00:00.000Z';
        global.Date = jest.fn((...args) => {
            if (args.length > 0) return new originalDate(...args);
            return mockToday;
        });
        global.Date.now = () => mockToday.getTime();

        act(() => {
            useGamificationStore.getState().initializeQuests();
        });

        let state = useGamificationStore.getState();
        expect(state.activeQuests.daily.length).toBeGreaterThan(0);
        expect(state.activeQuests.daily[0].date).toBe('2026-05-19');

        // Try initialization again -> should be no-op for same date
        const initialDailies = state.activeQuests.daily;
        act(() => {
            useGamificationStore.getState().initializeQuests();
        });
        expect(useGamificationStore.getState().activeQuests.daily).toBe(initialDailies);

        // Test incrementQuestProgress additions
        act(() => {
            useGamificationStore.getState().incrementQuestProgress('complete_lesson', 1);
        });
        state = useGamificationStore.getState();
        // Since first daily quest (or any quest) is probably 'complete_lesson' (with ID daily_1)
        const matchedQuest = state.activeQuests.daily.find(q => q.action === 'complete_lesson');
        if (matchedQuest) {
            expect(state.questsProgress[matchedQuest.id]).toBe(1);

            // Increment past target (say target is 1, let's complete it)
            act(() => {
                useGamificationStore.getState().incrementQuestProgress('complete_lesson', 1);
            });
            
            // Advance timers by 400ms to check toast
            act(() => {
                jest.advanceTimersByTime(500);
            });
            expect(mockToastState.success).toHaveBeenCalledWith('Quest Completed!', expect.any(String), 4000);
            expect(sounds.streak).toHaveBeenCalled();
        }

        // Test absolute quest progress for 'level' action type
        const levelQuest = state.activeQuests.milestone.find(q => q.action === 'level');
        if (levelQuest) {
            act(() => {
                useGamificationStore.getState().incrementQuestProgress('level', 5);
            });
            state = useGamificationStore.getState();
            expect(state.questsProgress[levelQuest.id]).toBe(5);
        }
    });

    test('quest system: claim quest reward successfully', () => {
        const testQuest = { id: 'q_test', title: 'Test Quest', action: 'complete_lesson', target: 2, xp: 500 };
        act(() => {
            useGamificationStore.setState({
                activeQuests: { daily: [testQuest], weekly: [], milestone: [] },
                questsProgress: { q_test: 2 },
                questsClaimed: []
            });
        });

        act(() => {
            useGamificationStore.getState().claimQuestReward('q_test');
        });

        let state = useGamificationStore.getState();
        expect(state.questsClaimed).toContain('q_test');

        act(() => {
            jest.advanceTimersByTime(200);
        });
        
        const stateAfterReward = useGamificationStore.getState();
        expect(mockToastState.xp).toHaveBeenCalledWith(500, expect.stringContaining('Test Quest'));
        expect(sounds.perfectScore).toHaveBeenCalled();
        expect(stateAfterReward.triggerConfetti).toBe(true);
        expect(stateAfterReward.confettiReason).toBe('quest_complete');

        // Claiming already claimed quest -> should be no-op
        mockToastState.xp.mockClear();
        act(() => {
            useGamificationStore.getState().claimQuestReward('q_test');
        });
        expect(mockToastState.xp).not.toHaveBeenCalled();
    });

    test('quest system: claim reward failing validation', () => {
        const testQuest = { id: 'q_test', title: 'Test Quest', action: 'complete_lesson', target: 2, xp: 500 };
        
        // 1. Quest progress not enough
        act(() => {
            useGamificationStore.setState({
                activeQuests: { daily: [testQuest], weekly: [], milestone: [] },
                questsProgress: { q_test: 1 },
                questsClaimed: []
            });
        });

        act(() => {
            useGamificationStore.getState().claimQuestReward('q_test');
        });
        expect(useGamificationStore.getState().questsClaimed).not.toContain('q_test');

        act(() => {
            useGamificationStore.getState().claimQuestReward('non_existent');
        });
        expect(useGamificationStore.getState().questsClaimed).not.toContain('non_existent');
    });

    test('shop system: buyItem fails on insufficient balance', () => {
        act(() => {
            useGamificationStore.setState({ coins: 50, unlockedAvatars: ['default'] });
        });

        const success = useGamificationStore.getState().buyItem('avatars', 'wizard_scholar', 150);
        expect(success).toBe(false);
        expect(useGamificationStore.getState().coins).toBe(50);
        expect(mockToastState.success).toHaveBeenCalledWith('Insufficient Coins!', expect.any(String), 3500);
    });

    test('shop system: buyItem fails on already owned item', () => {
        act(() => {
            useGamificationStore.setState({ coins: 200, unlockedAvatars: ['default', 'wizard_scholar'] });
        });

        const success = useGamificationStore.getState().buyItem('avatars', 'wizard_scholar', 150);
        expect(success).toBe(false);
        expect(useGamificationStore.getState().coins).toBe(200);
        expect(mockToastState.success).toHaveBeenCalledWith('Already Owned', expect.any(String), 3000);
    });

    test('shop system: buyItem successfully unlocks avatar', () => {
        act(() => {
            useGamificationStore.setState({ coins: 200, unlockedAvatars: ['default'] });
        });

        const success = useGamificationStore.getState().buyItem('avatars', 'wizard_scholar', 150);
        expect(success).toBe(true);
        expect(useGamificationStore.getState().coins).toBe(50);
        expect(useGamificationStore.getState().unlockedAvatars).toContain('wizard_scholar');
        expect(sounds.badge).toHaveBeenCalled();
        expect(useGamificationStore.getState().triggerConfetti).toBe(true);
        expect(useGamificationStore.getState().confettiReason).toBe('quest_complete');
    });

    test('shop system: buyItem successfully unlocks title', () => {
        act(() => {
            useGamificationStore.setState({ coins: 200, unlockedTitles: ['beginner'] });
        });

        const success = useGamificationStore.getState().buyItem('titles', 'knowledge_alchemist', 100);
        expect(success).toBe(true);
        expect(useGamificationStore.getState().coins).toBe(100);
        expect(useGamificationStore.getState().unlockedTitles).toContain('knowledge_alchemist');
    });

    test('shop system: buyItem successfully purchases streak shield', () => {
        act(() => {
            useGamificationStore.setState({ coins: 100, streakShields: 0 });
        });

        const success = useGamificationStore.getState().buyItem('powerups', 'streak_shield', 75);
        expect(success).toBe(true);
        expect(useGamificationStore.getState().coins).toBe(25);
        expect(useGamificationStore.getState().streakShields).toBe(1);
    });

    test('shop system: buyItem successfully purchases xp boost and getXPMultiplier applies it', () => {
        act(() => {
            useGamificationStore.setState({ coins: 200, xpBoosts: 0, stats: { streak: 0 } });
        });

        const success = useGamificationStore.getState().buyItem('powerups', 'xp_boost', 120);
        expect(success).toBe(true);
        expect(useGamificationStore.getState().coins).toBe(80);
        expect(useGamificationStore.getState().xpBoosts).toBe(1);

        const { multiplier, reasons } = useGamificationStore.getState().getXPMultiplier();
        expect(multiplier).toBe(2.0);
        expect(reasons).toContain('XP Boost Token Active (2.0x)');
    });
});
