import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
    persist(
        (set) => ({
            theme: 'light', // 'light' | 'dark' | 'system'
            animationsEnabled: true,
            soundEnabled: true,

            setTheme: (theme) => set({ theme }),
            toggleAnimations: () =>
                set((state) => ({ animationsEnabled: !state.animationsEnabled })),
            toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
        }),
        {
            name: 'studylabs-settings',
        }
    )
);

export default useSettingsStore;
