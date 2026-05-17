import { act } from 'react';
import useGamificationStoreModule from '../store/gamificationStore';
import { AVATARS, TITLES } from '../constants/gamification';

const useGamificationStore = useGamificationStoreModule.default || useGamificationStoreModule;

// Mock the soundManager utility to prevent Web Audio/Tone.js crashes in Jest
jest.mock('../utils/soundManager', () => ({
    __esModule: true,
    default: {
        click: jest.fn(),
        correct: jest.fn(),
        wrong: jest.fn(),
        levelUp: jest.fn(),
        badge: jest.fn(),
        quest: jest.fn(),
        quizComplete: jest.fn()
    }
}));

// Mock the toastStore to track gamified alerts in testing
jest.mock('../store/toastStore', () => ({
    __esModule: true,
    default: {
        getState: jest.fn(() => ({
            success: jest.fn(),
            badge: jest.fn(),
            xp: jest.fn()
        }))
    }
}));

// Mock badges utility to isolate Zustand store tests
jest.mock('../utils/badges', () => ({
    __esModule: true,
    default: [
        { id: 'first_quiz', name: 'First Quiz', icon: '📝', description: 'Solve your first quiz' }
    ],
    checkBadges: jest.fn(() => [])
}));

describe('useGamificationStore Zustand Store', () => {
    beforeEach(() => {
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
                showLevelUp: false,
                newLevel: 1,
                triggerConfetti: false,
                confettiReason: null
            });
        });
    });

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
        // Mock Date to midnight (01:00 AM) - Night Owl boost hour
        const mockDate = new Date(2026, 4, 17, 1, 0, 0);
        const originalDate = global.Date;
        global.Date = class extends Date {
            constructor(...args) {
                if (args.length > 0) return super(...args);
                return mockDate;
            }
            getHours() {
                return 1;
            }
        };

        const boost = useGamificationStore.getState().getXPMultiplier();
        expect(boost.multiplier).toBe(1.5);
        expect(boost.reasons).toContain('Night Owl Hour (1.5x)');

        // Restore original Date
        global.Date = originalDate;
    });

    test('handles checkLevelUp and automatically unlocks avatars & titles programmatically', () => {
        // Previous XP was 0, new XP is 150 (Level = Math.floor(150 / 100) + 1 = Level 2)
        act(() => {
            useGamificationStore.getState().checkLevelUp(0, 150);
        });

        const state = useGamificationStore.getState();
        
        // Stats level should be updated to Level 2
        expect(state.stats.level).toBe(2);
        
        // Level up modal should be triggered
        expect(state.showLevelUp).toBe(true);
        expect(state.newLevel).toBe(2);
        expect(state.triggerConfetti).toBe(true);
        expect(state.confettiReason).toBe('level_up');

        // Level 2 customizable unlocks should be unlocked automatically
        expect(state.unlockedAvatars).toContain('scholar');
        expect(state.unlockedTitles).toContain('curious');
    });

    test('dismisses Level Up modal state correctly', () => {
        act(() => {
            useGamificationStore.setState({ showLevelUp: true });
            useGamificationStore.getState().dismissLevelUp();
        });

        const state = useGamificationStore.getState();
        expect(state.showLevelUp).toBe(false);
    });
});
