import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin } from '../services/api';

export const useAuthStore = defineStore('auth', () => {
    // State
    const token = ref(localStorage.getItem('auth_token') || null);
    const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
    const loading = ref(false);
    const error = ref(null);

    // Getters
    const isAuthenticated = computed(() => !!token.value);
    const currentUser = computed(() => user.value);

    // Actions
    const login = async (username, password) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await apiLogin(username, password);

            // Store token
            token.value = response.access_token;
            localStorage.setItem('auth_token', response.access_token);

            // Store user info if available in response
            if (response.user) {
                user.value = response.user;
                localStorage.setItem('user', JSON.stringify(response.user));
            } else {
                // If no user info in response, store basic info
                user.value = { username };
                localStorage.setItem('user', JSON.stringify({ username }));
            }

            loading.value = false;
            return { success: true };
        } catch (err) {
            loading.value = false;
            error.value = err.response?.data?.detail || 'Login failed. Please check your credentials.';
            return { success: false, error: error.value };
        }
    };

    const logout = () => {
        token.value = null;
        user.value = null;
        error.value = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    };

    const initializeAuth = () => {
        // This is called on app mount to restore auth state from localStorage
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');

        if (storedToken) {
            token.value = storedToken;
        }

        if (storedUser) {
            try {
                user.value = JSON.parse(storedUser);
            } catch (e) {
                console.error('Failed to parse stored user data:', e);
                logout();
            }
        }
    };

    return {
        // State
        token,
        user,
        loading,
        error,
        // Getters
        isAuthenticated,
        currentUser,
        // Actions
        login,
        logout,
        initializeAuth,
    };
});
