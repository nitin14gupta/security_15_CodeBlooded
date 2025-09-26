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
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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
}

export const apiService = new ApiService();
