/**
 * Centralized API client for the StudyLabs backend.
 * Handles JWT injection, base URL, and error formatting.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

/**
 * Get the stored JWT token.
 */
export const getToken = () => localStorage.getItem('studylabs_token');

/**
 * Set the JWT token.
 */
export const setToken = (token) => localStorage.setItem('studylabs_token', token);

/**
 * Remove the JWT token.
 */
export const removeToken = () => localStorage.removeItem('studylabs_token');

/**
 * Core fetch wrapper with auth headers and error handling.
 */
const apiFetch = async (endpoint, options = {}) => {
    const token = getToken();

    const config = {
        ...options,
        headers: {
            ...(options.headers || {}),
        },
    };

    // Add auth header if token exists
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add active role header if exists
    const activeRole = localStorage.getItem('active_role');
    if (activeRole) {
        config.headers['X-Active-Role'] = activeRole;
    }

    // Add JSON content-type for non-FormData bodies
    if (options.body && !(options.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
        if (typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
    }

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || 'Something went wrong');
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

// ── Convenience methods ─────────────────────────

export const api = {
    get: (endpoint) => apiFetch(endpoint, { method: 'GET' }),

    post: (endpoint, body) => apiFetch(endpoint, { method: 'POST', body }),

    put: (endpoint, body) => apiFetch(endpoint, { method: 'PUT', body }),

    delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),

    /**
     * Upload files via multipart/form-data.
     * @param {string} endpoint
     * @param {FormData} formData
     */
    upload: (endpoint, formData) => apiFetch(endpoint, { method: 'POST', body: formData }),
};

export default api;
