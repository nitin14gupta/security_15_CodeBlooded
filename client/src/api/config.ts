// might need to change bro
export const API_CONFIG = {
    BASE_URL: 'http://localhost:5000', // TODO: make this configurable
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
            SESSION: '/api/chat/sessions', // duplicate hai ye
            MESSAGES: '/api/chat/sessions',
        },
    },
};

// quick helper function to build URLs
export const getApiUrl = (endpoint: string) => {
    console.log('Building API URL for:', endpoint); // debg ke liye
    return `${API_CONFIG.BASE_URL}${endpoint}`;
};
