import { API_CONFIG, STORAGE_KEYS, ApiResponse, AuthResponse, User } from './config';

class ApiService {
    private baseURL: string;
    private timeout: number;

    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    private getAuthToken(): string | null {
        try {
            if (typeof window !== 'undefined') {
                return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            }
            return null;
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    private setAuthToken(token: string): void {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            }
        } catch (error) {
            console.error('Error setting auth token:', error);
        }
    }

    private removeAuthToken(): void {
        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            }
        } catch (error) {
            console.error('Error removing auth token:', error);
        }
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const token = this.getAuthToken();

            const headers = {
                ...API_CONFIG.DEFAULT_HEADERS,
                ...options.headers,
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || `HTTP ${response.status}: ${response.statusText}`,
                };
            }

            return {
                success: true,
                data,
                message: data.message,
            };
        } catch (error: any) {
            console.error('API request error:', error);

            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Request timeout. Please check your connection.',
                };
            }

            return {
                success: false,
                error: error.message || 'Network error. Please check your connection.',
            };
        }
    }

    // Auth methods
    async register(email: string, password: string, onboardingData?: any): Promise<ApiResponse<AuthResponse>> {
        const response = await this.makeRequest<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify({
                username,
                email,
                password,
                onboarding_data: onboardingData,
            }),
        });

        if (response.success && response.data?.token) {
            this.setAuthToken(response.data.token);
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
            }
        }

        return response;
    }

    async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
        const response = await this.makeRequest<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.success && response.data?.token) {
            this.setAuthToken(response.data.token);
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
            }
        }

        return response;
    }

    async loginWithGoogle(idToken: string): Promise<ApiResponse<AuthResponse>> {
        const response = await this.makeRequest<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.GOOGLE, {
            method: 'POST',
            body: JSON.stringify({ id_token: idToken }),
        });

        if (response.success && response.data?.token) {
            this.setAuthToken(response.data.token);
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
            }
        }

        return response;
    }

    async forgotPassword(email: string): Promise<ApiResponse> {
        return this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPasswordWithCode(email: string, code: string, password: string): Promise<ApiResponse> {
        return this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
            method: 'POST',
            body: JSON.stringify({ email, code, new_password: password }),
        });
    }

    async verifyToken(): Promise<ApiResponse<{ valid: boolean; user: User }>> {
        const token = this.getAuthToken();
        if (!token) {
            return {
                success: false,
                error: 'No authentication token found',
            };
        }

        return this.makeRequest<{ valid: boolean; user: User }>(API_CONFIG.ENDPOINTS.AUTH.VERIFY_TOKEN, {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    async logout(): Promise<void> {
        this.removeAuthToken();
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        }
    }

    // User methods
    async getCurrentUser(): Promise<User | null> {
        try {
            if (typeof window !== 'undefined') {
                const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
                return userData ? JSON.parse(userData) : null;
            }
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    async updateOnboardingData(data: any): Promise<ApiResponse> {
        return this.makeRequest(API_CONFIG.ENDPOINTS.USER.ONBOARDING_DATA, {
            method: 'PUT',
            body: JSON.stringify({ onboarding_data: data }),
        });
    }

    // Health check
    async healthCheck(): Promise<ApiResponse> {
        return this.makeRequest(API_CONFIG.ENDPOINTS.HEALTH);
    }

    // Utility methods
    async isAuthenticated(): Promise<boolean> {
        const token = this.getAuthToken();
        if (!token) return false;

        const response = await this.verifyToken();
        return response.success && response.data?.valid === true;
    }

    async refreshUserData(): Promise<User | null> {
        const response = await this.verifyToken();
        if (response.success && response.data?.user) {
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
            }
            return response.data.user;
        }
        return null;
    }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;