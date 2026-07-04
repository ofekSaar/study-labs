import { act } from 'react';
import useSettingsStoreModule from '../store/settingsStore';

const useSettingsStore = useSettingsStoreModule.default || useSettingsStoreModule;

describe('useSettingsStore Zustand Store', () => {
    beforeEach(() => {
        act(() => {
            useSettingsStore.setState({
                theme: 'light',
                animationsEnabled: true,
                soundEnabled: true,
            });
        });
    });

    test('should verify initial settings state', () => {
        const state = useSettingsStore.getState();
        expect(state.theme).toBe('light');
        expect(state.animationsEnabled).toBe(true);
        expect(state.soundEnabled).toBe(true);
    });

    test('should set theme correctly', () => {
        act(() => {
            useSettingsStore.getState().setTheme('dark');
        });

        const state = useSettingsStore.getState();
        expect(state.theme).toBe('dark');
    });

    test('should toggle animations settings correctly', () => {
        act(() => {
            useSettingsStore.getState().toggleAnimations();
        });

        let state = useSettingsStore.getState();
        expect(state.animationsEnabled).toBe(false);

        act(() => {
            useSettingsStore.getState().toggleAnimations();
        });

        state = useSettingsStore.getState();
        expect(state.animationsEnabled).toBe(true);
    });

    test('should toggle sound effects correctly', () => {
        act(() => {
            useSettingsStore.getState().toggleSound();
        });

        let state = useSettingsStore.getState();
        expect(state.soundEnabled).toBe(false);

        act(() => {
            useSettingsStore.getState().toggleSound();
        });

        state = useSettingsStore.getState();
        expect(state.soundEnabled).toBe(true);
    });
});
