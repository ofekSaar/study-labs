import { create } from 'zustand';
import api, { getToken, setToken, removeToken } from '../utils/api.js';
import useGamificationStore from './gamificationStore.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const useAuthStore = create((set) => ({
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: true, // Start loading until we check token
    testRedirectUrl: null,

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
            const storedRole = localStorage.getItem('active_role');
            const userRoles = data.user.roles || (data.user.role ? [data.user.role] : []);
            const activeRole = (storedRole && userRoles.includes(storedRole)) ? storedRole : data.user.role;

            set({
                user: data.user,
                role: activeRole,
                isAuthenticated: true,
                isLoading: false,
            });
            useGamificationStore.getState().fetchGamificationState();
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
            const storedRole = localStorage.getItem('active_role');
            const userRoles = data.user.roles || (data.user.role ? [data.user.role] : []);
            const activeRole = (storedRole && userRoles.includes(storedRole)) ? storedRole : data.user.role;

            set({
                user: data.user,
                role: activeRole,
                isAuthenticated: true,
                isLoading: false,
            });
            useGamificationStore.getState().fetchGamificationState();
            return data.user;
        } catch {
            removeToken();
            set({ user: null, role: null, isAuthenticated: false, isLoading: false });
            return null;
        }
    },

    /**
     * Set role for first-time users.
     * Can accept either a single role string or an array of roles.
     */
    setRole: async (roleInput) => {
        try {
            // Support both single role and array of roles
            const payload = Array.isArray(roleInput)
                ? { roles: roleInput }
                : { role: roleInput };

            const { data } = await api.put('/api/auth/role', payload);
            // Update token with new role
            if (data.token) {
                setToken(data.token);
            }
            
            const userRoles = data.user.roles || (data.user.role ? [data.user.role] : []);
            const activeRole = userRoles.includes('instructor') ? 'instructor' : 'student';
            localStorage.setItem('active_role', activeRole);

            set({
                user: data.user,
                role: activeRole,
            });
            return data.user;
        } catch (error) {
            // Re-throw with better error message
            const message = error.data?.message || error.message || 'Failed to set role';
            throw new Error(message);
        }
    },

    /**
     * Switch active role locally in the frontend (for multi-role users).
     */
    switchRole: (newRole) => {
        set((state) => {
            const userRoles = state.user?.roles || (state.user?.role ? [state.user.role] : []);
            if (userRoles.includes(newRole)) {
                localStorage.setItem('active_role', newRole);
                return { role: newRole };
            }
            return {};
        });
    },

    /**
     * Redirect to Google OAuth.
     */
    loginWithGoogle: () => {
        const redirectUrl = `${API_BASE}/api/auth/google`;
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
            set({ testRedirectUrl: redirectUrl });
            return;
        }
        window.location.assign(redirectUrl);
    },

    /**
     * Logout and clear state.
     */
    logout: () => {
        removeToken();
        localStorage.removeItem('active_role');
        set({
            user: null,
            role: null,
            isAuthenticated: false,
        });
    },
}));

export default useAuthStore;
