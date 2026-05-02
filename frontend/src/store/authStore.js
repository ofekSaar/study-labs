import { create } from 'zustand';
import api, { getToken, setToken, removeToken } from '../utils/api.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const useAuthStore = create((set, get) => ({
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: true, // Start loading until we check token

    /**
     * Initialize auth state from stored JWT.
     * Called on app mount.
     */
    initialize: async () => {
        const token = getToken();
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }

        try {
            const { data } = await api.get('/api/auth/me');
            set({
                user: data.user,
                role: data.user.role,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch {
            removeToken();
            set({ user: null, role: null, isAuthenticated: false, isLoading: false });
        }
    },

    /**
     * Handle OAuth callback — store token and fetch user.
     */
    handleAuthCallback: async (token) => {
        setToken(token);
        try {
            const { data } = await api.get('/api/auth/me');
            set({
                user: data.user,
                role: data.user.role,
                isAuthenticated: true,
                isLoading: false,
            });
            return data.user;
        } catch {
            removeToken();
            set({ user: null, role: null, isAuthenticated: false, isLoading: false });
            return null;
        }
    },

    /**
     * Set role for first-time users.
     */
    setRole: async (role) => {
        const { data } = await api.put('/api/auth/role', { role });
        // Update token with new role
        if (data.token) {
            setToken(data.token);
        }
        set({
            user: data.user,
            role: data.user.role,
        });
        return data.user;
    },

    /**
     * Redirect to Google OAuth.
     */
    loginWithGoogle: () => {
        window.location.href = `${API_BASE}/api/auth/google`;
    },

    /**
     * Logout and clear state.
     */
    logout: () => {
        removeToken();
        set({
            user: null,
            role: null,
            isAuthenticated: false,
        });
    },
}));

export default useAuthStore;
