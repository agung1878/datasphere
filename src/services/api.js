import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: 'http://172.15.2.55:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add bearer token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only redirect to login if we're not already on the login page
            // This prevents clearing error messages during failed login attempts
            const currentPath = window.location.pathname;
            if (currentPath !== '/login') {
                // Clear token and redirect to login on unauthorized
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Login with username and password
 * @param {string} username - User email
 * @param {string} password - User password
 * @returns {Promise} Response with bearer token
 */
export const login = async (username, password) => {
    // Create form-urlencoded data as required by the API
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('username', username);
    formData.append('password', password);
    formData.append('scope', '');
    formData.append('client_id', '');
    formData.append('client_secret', '');

    const response = await api.post('/auth/token', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    return response.data;
};

/**
 * Get dashboard data including summary and institutions
 * @returns {Promise} Response with dashboard data
 */
export const getDashboard = async () => {
    const response = await api.get('/dashboard');
    return response.data;
};

export default api;
