import { act } from 'react';
import useAuthStoreModule from '../store/authStore';

const useAuthStore = useAuthStoreModule.default || useAuthStoreModule;

jest.mock('../store/gamificationStore', () => {
    return {
        __esModule: true,
        default: {
            getState: () => ({
                fetchGamificationState: jest.fn(),
            }),
        },
    };
});

// Set up global fetch mock
beforeAll(() => {
    global.fetch = jest.fn();
});

const mockFetchResponse = (payload, ok = true, status = 200) => {
    return Promise.resolve({
        ok,
        status,
        headers: {
            get: (name) => {
                if (name.toLowerCase() === 'content-type') {
                    return 'application/json';
                }
                return null;
            },
        },
        json: () => Promise.resolve({ data: payload }),
    });
};

const mockFetchErrorResponse = (message, status = 400) => {
    return Promise.resolve({
        ok: false,
        status,
        headers: {
            get: (name) => {
                if (name.toLowerCase() === 'content-type') {
                    return 'application/json';
                }
                return null;
            },
        },
        json: () => Promise.resolve({ message }),
    });
};

describe('useAuthStore Zustand Store', () => {
    beforeEach(() => {
        global.fetch.mockReset();
        localStorage.clear();
        act(() => {
            useAuthStore.setState({
                user: null,
                role: null,
                isAuthenticated: false,
                isLoading: true,
                testRedirectUrl: null,
            });
        });
    });

    test('should verify initial state', () => {
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.role).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(true);
    });

    test('should initialize successfully when token exists and is valid', async () => {
        localStorage.setItem('studylabs_token', 'valid_token_123');
        const mockUser = { _id: 'u1', name: 'John Doe', role: 'student' };

        global.fetch.mockImplementationOnce(() => mockFetchResponse({ user: mockUser }));

        await act(async () => {
            await useAuthStore.getState().initialize();
        });

        const state = useAuthStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(mockUser);
        expect(state.role).toBe('student');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should fail initialization and clear token when token is invalid/expired', async () => {
        localStorage.setItem('studylabs_token', 'invalid_token');

        global.fetch.mockImplementationOnce(() => mockFetchErrorResponse('Unauthorized', 401));

        await act(async () => {
            await useAuthStore.getState().initialize();
        });

        const state = useAuthStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.role).toBeNull();
        expect(localStorage.getItem('studylabs_token')).toBeNull();
    });

    test('should keep the stored token when /me fails with a transient error (429)', async () => {
        localStorage.setItem('studylabs_token', 'still_valid_token');

        global.fetch.mockImplementationOnce(() => mockFetchErrorResponse('Too many requests', 429));

        await act(async () => {
            await useAuthStore.getState().initialize();
        });

        const state = useAuthStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(localStorage.getItem('studylabs_token')).toBe('still_valid_token');
    });

    test('should finish loading and remain unauthenticated when no token exists during initialization', async () => {
        await act(async () => {
            await useAuthStore.getState().initialize();
        });

        const state = useAuthStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle authentication callback successfully', async () => {
        const mockUser = { _id: 'u1', name: 'John Doe', role: 'instructor' };

        global.fetch.mockImplementationOnce(() => mockFetchResponse({ user: mockUser }));

        let userResult;
        await act(async () => {
            userResult = await useAuthStore.getState().handleAuthCallback('new_token_abc');
        });

        const state = useAuthStore.getState();
        expect(localStorage.getItem('studylabs_token')).toBe('new_token_abc');
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(mockUser);
        expect(state.role).toBe('instructor');
        expect(userResult).toEqual(mockUser);
    });

    test('should clear state on authentication callback failure', async () => {
        global.fetch.mockImplementationOnce(() => mockFetchErrorResponse('Auth error', 400));

        let userResult;
        await act(async () => {
            userResult = await useAuthStore.getState().handleAuthCallback('bad_token');
        });

        const state = useAuthStore.getState();
        expect(localStorage.getItem('studylabs_token')).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(userResult).toBeNull();
    });

    test('should set role for user with single role successfully', async () => {
        const mockUser = { _id: 'u1', name: 'John Doe', role: 'student' };

        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({ user: mockUser, token: 'updated_token' })
        );

        let userResult;
        await act(async () => {
            userResult = await useAuthStore.getState().setRole('student');
        });

        const state = useAuthStore.getState();
        expect(localStorage.getItem('studylabs_token')).toBe('updated_token');
        expect(state.user).toEqual(mockUser);
        expect(state.role).toBe('student');
        expect(userResult).toEqual(mockUser);
    });

    test('should set role for user with array role input successfully', async () => {
        const mockUser = { _id: 'u1', name: 'John Doe', role: 'student' };

        global.fetch.mockImplementationOnce(() => mockFetchResponse({ user: mockUser }));

        await act(async () => {
            await useAuthStore.getState().setRole(['student']);
        });

        const state = useAuthStore.getState();
        expect(state.role).toBe('student');
    });

    test('should throw error when setRole request fails', async () => {
        global.fetch.mockImplementationOnce(() =>
            mockFetchErrorResponse('Role update failed', 400)
        );

        await expect(async () => {
            await act(async () => {
                await useAuthStore.getState().setRole('student');
            });
        }).rejects.toThrow('Role update failed');
    });

    test('should redirect to Google OAuth on loginWithGoogle', () => {
        useAuthStore.getState().loginWithGoogle();
        const state = useAuthStore.getState();
        expect(state.testRedirectUrl).toContain('/api/auth/google');
    });

    test('should clear state on logout', () => {
        localStorage.setItem('studylabs_token', 'token_to_remove');
        act(() => {
            useAuthStore.setState({
                user: { _id: 'u1' },
                role: 'student',
                isAuthenticated: true,
            });
        });

        act(() => {
            useAuthStore.getState().logout();
        });

        const state = useAuthStore.getState();
        expect(localStorage.getItem('studylabs_token')).toBeNull();
        expect(state.user).toBeNull();
        expect(state.role).toBeNull();
        expect(state.isAuthenticated).toBe(false);
    });
});
