import { API_CONFIG, getApiUrl } from './config';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    user_type: 'user' | 'admin';
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        user_type: 'user' | 'admin';
        created_at: string;
    };
}

export interface ChatRequest {
    message: string;
}

export interface ChatResponse {
    response: string;
    model: string;
}

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    user_id: string;
    message_type: 'user' | 'ai';
    content: string;
    created_at: string;
}

export interface SessionWithMessages {
    session: ChatSession;
    messages: ChatMessage[];
}

class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = getApiUrl(endpoint);
        const token = localStorage.getItem('auth_token');

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;

            // For guardrails errors, include the full error data
            if (response.status === 400 && errorData.warnings) {
                throw new Error(JSON.stringify(errorData));
            }

            throw new Error(errorMessage);
        }

        return response.json();
    }

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async logout(): Promise<void> {
        return this.request<void>(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
            method: 'POST',
        });
    }

    async verifyToken(): Promise<AuthResponse['user']> {
        return this.request<AuthResponse['user']>(API_CONFIG.ENDPOINTS.AUTH.VERIFY);
    }

    async chatWithGemini(message: ChatRequest): Promise<ChatResponse> {
        return this.request<ChatResponse>(API_CONFIG.ENDPOINTS.GEMINI.CHAT, {
            method: 'POST',
            body: JSON.stringify(message),
        });
    }

    async checkGeminiHealth(): Promise<{ status: string; model: string; configured: boolean }> {
        return this.request<{ status: string; model: string; configured: boolean }>(API_CONFIG.ENDPOINTS.GEMINI.HEALTH);
    }

    // Chat Session Methods
    async getChatSessions(): Promise<{ sessions: ChatSession[] }> {
        return this.request<{ sessions: ChatSession[] }>(API_CONFIG.ENDPOINTS.CHAT.SESSIONS);
    }

    async createChatSession(title: string): Promise<{ session: ChatSession }> {
        return this.request<{ session: ChatSession }>(API_CONFIG.ENDPOINTS.CHAT.SESSIONS, {
            method: 'POST',
            body: JSON.stringify({ title }),
        });
    }

    async getChatSession(sessionId: string): Promise<SessionWithMessages> {
        return this.request<SessionWithMessages>(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}`);
    }

    async updateChatSession(sessionId: string, title: string): Promise<{ session: ChatSession }> {
        return this.request<{ session: ChatSession }>(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}`, {
            method: 'PUT',
            body: JSON.stringify({ title }),
        });
    }

    async deleteChatSession(sessionId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}`, {
            method: 'DELETE',
        });
    }

    async addMessageToSession(sessionId: string, messageType: 'user' | 'ai', content: string): Promise<{ message: ChatMessage }> {
        return this.request<{ message: ChatMessage }>(`${API_CONFIG.ENDPOINTS.CHAT.MESSAGES}/${sessionId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
                message_type: messageType,
                content: content,
            }),
        });
    }
}

export const apiService = new ApiService();
