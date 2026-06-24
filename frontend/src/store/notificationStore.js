import { create } from 'zustand';

const useNotificationStore = create((set) => ({
    notifications: [],

    addNotification: (notification) =>
        set((state) => ({
            notifications: [
                { ...notification, id: `${Date.now()}-${Math.random()}`, read: false },
                ...state.notifications,
            ].slice(0, 50), // keep at most 50
        })),

    markAllRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

    clearAll: () => set({ notifications: [] }),
}));

export default useNotificationStore;
