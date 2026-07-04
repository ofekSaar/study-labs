import { act } from 'react';
import useToastStoreModule from '../store/toastStore';

const useToastStore = useToastStoreModule.default || useToastStoreModule;

describe('useToastStore Zustand Store', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        act(() => {
            useToastStore.setState({ toasts: [] });
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should initial state have empty toasts', () => {
        const state = useToastStore.getState();
        expect(state.toasts).toEqual([]);
    });

    test('should add a toast and automatically remove it after duration', () => {
        let toastId;
        act(() => {
            toastId = useToastStore.getState().addToast({
                type: 'info',
                title: 'Test Notification',
                message: 'Hello World',
                duration: 2000,
            });
        });

        let state = useToastStore.getState();
        expect(state.toasts.length).toBe(1);
        expect(state.toasts[0].title).toBe('Test Notification');
        expect(state.toasts[0].id).toBe(toastId);

        // Advance timers by duration + buffer (2000 + 400 = 2400)
        act(() => {
            jest.advanceTimersByTime(2400);
        });

        state = useToastStore.getState();
        expect(state.toasts.length).toBe(0);
    });

    test('should support manual toast removal', () => {
        let toastId;
        act(() => {
            toastId = useToastStore.getState().success('Success!', 'Operation completed');
        });

        let state = useToastStore.getState();
        expect(state.toasts.length).toBe(1);

        act(() => {
            useToastStore.getState().removeToast(toastId);
        });

        state = useToastStore.getState();
        expect(state.toasts.length).toBe(0);
    });

    test('should support convenience helpers', () => {
        act(() => {
            useToastStore.getState().success('Done', 'Completed');
            useToastStore.getState().error('Error', 'Failed');
            useToastStore.getState().info('Info', 'Hint');
            useToastStore.getState().xp(50, 'Daily quiz');
            useToastStore.getState().badge('Master', '👑');
        });

        const state = useToastStore.getState();
        expect(state.toasts.length).toBe(5);
        expect(state.toasts[0].type).toBe('success');
        expect(state.toasts[1].type).toBe('error');
        expect(state.toasts[2].type).toBe('info');
        expect(state.toasts[3].type).toBe('xp');
        expect(state.toasts[3].title).toBe('+50 XP');
        expect(state.toasts[4].type).toBe('badge');
        expect(state.toasts[4].icon).toBe('👑');
    });
});
