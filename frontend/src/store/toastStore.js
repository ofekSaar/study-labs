import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set, get) => ({
    toasts: [],

    addToast: ({ type = 'info', title, message, duration = 3500, icon = null }) => {
        const id = ++toastId;
        set((state) => ({
            toasts: [...state.toasts, { id, type, title, message, duration, icon }],
        }));
        setTimeout(() => get().removeToast(id), duration + 400);
        return id;
    },

    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

    // Convenience helpers
    success: (title, message, duration) =>
        get().addToast({ type: 'success', title, message, duration }),
    error: (title, message, duration) =>
        get().addToast({ type: 'error', title, message, duration }),
    info: (title, message, duration) => get().addToast({ type: 'info', title, message, duration }),
    xp: (amount, reason) =>
        get().addToast({
            type: 'xp',
            title: `+${amount} XP`,
            message: reason || 'Keep it up!',
            duration: 3000,
        }),
    badge: (badgeName, icon) =>
        get().addToast({
            type: 'badge',
            title: 'Badge Unlocked!',
            message: badgeName,
            duration: 5000,
            icon,
        }),
}));

export default useToastStore;
