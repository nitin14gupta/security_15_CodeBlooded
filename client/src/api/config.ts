// API Configuration
export const API_CONFIG = {
    BASE_URL: 'http://localhost:5000',

    ENDPOINTS: {
        // Auth endpoints
        AUTH: {
            REGISTER: '/api/auth/register',
            LOGIN: '/api/auth/login',
            GOOGLE: '/api/auth/google',
            APPLE: '/api/auth/apple',
            FORGOT_PASSWORD: '/api/auth/forgot-password',
            RESET_PASSWORD: '/api/auth/reset-password',
            VERIFY_TOKEN: '/api/auth/verify-token'
        },

        // User endpoints
        USER: {
            PROFILE: '/api/user/profile',
            UPDATE_PROFILE: '/api/user/profile',
            ONBOARDING_DATA: '/api/user/onboarding',
        },

        // Health check
        HEALTH: '/api/health',
    },

    // Request timeout (in milliseconds)
    TIMEOUT: 10000,

    // Default headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
};

// Storage keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'zenflow_auth_token',
    USER_DATA: 'zenflow_user_data',
    ONBOARDING_DATA: 'zenflow_onboarding_data',
};

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: {
        id: string;
        email: string;
        is_verified: boolean;
        onboarding_data?: any;
    };
}

export interface User {
    id: string;
    email: string;
    is_verified: boolean;
    onboarding_data?: any;
    created_at?: string;
    updated_at?: string;
}
