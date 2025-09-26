export const API_CONFIG = {
    BASE_URL: 'http://localhost:5000',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            LOGOUT: '/api/auth/logout',
            VERIFY: '/api/auth/verify',
        },
        GEMINI: {
            CHAT: '/api/gemini/chat',
            HEALTH: '/api/gemini/health',
        },
        CHAT: {
            SESSIONS: '/api/chat/sessions',
            SESSION: '/api/chat/sessions',
            MESSAGES: '/api/chat/sessions',
        },
    },
};

export const getApiUrl = (endpoint: string) => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
};
