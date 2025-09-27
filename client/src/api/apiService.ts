import { API_CONFIG, getApiUrl } from './config';

// interfaces for API
export interface LoginRequest {
    email: string;
    password: string;
}

export interface OnboardingData {
    morningPreference: string;
    dayColor: string;
    moodEmoji: string;
    lifeGenre: string;
    weeklyGoal: string;
    favoriteApp: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    user_type: 'user' | 'admin';
    onboarding?: OnboardingData;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        user_type: 'user' | 'admin';
        created_at: string;
        // Onboarding fields
        morning_preference?: string;
        day_color?: string;
        mood_emoji?: string;
        life_genre?: string;
        weekly_goal?: string;
        favorite_app?: string;
        onboarding_completed?: boolean;
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
    mood?: 'neutral' | 'happy' | 'sad' | 'curious' | 'supportive';
    response_type?: 'normal' | 'educational' | 'redirect' | 'supportive';
    context_data?: any;
    created_at: string;
}

export interface SessionWithMessages {
    session: ChatSession;
    messages: ChatMessage[];
}

// New interfaces for mood-based system
export interface MoodAnalysis {
    mood: 'neutral' | 'happy' | 'sad' | 'curious' | 'supportive';
    confidence: number;
    scores: Record<string, number>;
    indicators: string[];
    context: any;
    mood_transition: any;
    timestamp: string;
}

export interface ProcessingResults {
    mood_analysis: MoodAnalysis;
    response_guidance: any;
    should_redirect: boolean;
    redirect_suggestions: string[];
    context_summary: any;
    warnings: string[];
}

export interface EnhancedChatResponse {
    user_message: ChatMessage;
    ai_response: ChatMessage;
    processing_results: ProcessingResults;
}

export interface ConversationContext {
    context_summary: any;
    mood_history: Array<{
        mood: string;
        message_type: string;
        timestamp: string;
    }>;
    recent_messages: ChatMessage[];
    session_id: string;
}

export interface CollaborationSummary {
    id: string;
    session_id: string;
    user_id: string;
    summary_title: string;
    summary_content: string;
    key_insights: string[];
    mood_analysis: {
        patterns?: string;
        trends?: string;
        [key: string]: any;
    };
    recommendations: string[];
    generated_at: string;
    created_at: string;
    chat_sessions?: {
        id: string;
        title: string;
        created_at: string;
    };
}

export interface CollaborationSummaryResponse {
    message: string;
    summary: CollaborationSummary;
}

export interface CollaborationSummariesResponse {
    summaries: CollaborationSummary[];
}

export interface SessionTimer {
    id: string;
    session_id: string;
    user_id: string;
    start_time: string;
    end_time?: string;
    total_seconds: number;
    is_active: boolean;
    current_elapsed_seconds?: number;
    created_at: string;
    updated_at: string;
}

export interface TimerResponse {
    message: string;
    timer: SessionTimer;
}

export interface DailyTimerTotal {
    daily_total_seconds: number;
    daily_total_minutes: number;
    daily_total_hours: number;
}

export interface MoodAnalysisResponse {
    session_id: string;
    mood_analysis: {
        trend: string;
        primary_mood: string;
        mood_changes: number;
        mood_distribution: Record<string, number>;
        total_messages: number;
        recommendations: string[];
    };
    message_count: number;
}

class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        console.log('ApiService initialized with base URL:', this.baseUrl); // debug ke liye
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = getApiUrl(endpoint);
        const token = localStorage.getItem('auth_token');

        console.log('Making request to:', url); // debug ke liye

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
            console.log('Using auth token for request'); // debug ke liye
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

            console.log('Request failed:', errorMessage); // debug ke liye

            // For guardrails errors, include the full error data
            if (response.status === 400 && errorData.warnings) {
                throw new Error(JSON.stringify(errorData));
            }

            throw new Error(errorMessage);
        }

        return response.json();
    }

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        console.log('Attempting login for:', credentials.email); // debug ke liye
        return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        console.log('Registering new user:', userData.email); // debug ke liye
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
        console.log('Sending message to Gemini:', message.message.substring(0, 50) + '...'); // deb
        return this.request<ChatResponse>(API_CONFIG.ENDPOINTS.GEMINI.CHAT, {
            method: 'POST',
            body: JSON.stringify(message),
        });
    }

    async checkGeminiHealth(): Promise<{ status: string; model: string; configured: boolean }> {
        console.log('Checking Gemini wkk...');
        return this.request<{ status: string; model: string; configured: boolean }>(API_CONFIG.ENDPOINTS.GEMINI.HEALTH);
    }

    async getChatSessions(): Promise<{ sessions: ChatSession[] }> {
        console.log('Fetching chat sessions...');
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

    //adding session checking
    async addMessageToSession(sessionId: string, messageType: 'user' | 'ai', content: string): Promise<{ message: ChatMessage }> {
        console.log('Adding message to session:', sessionId, 'type:', messageType); // debug ke liye
        return this.request<{ message: ChatMessage }>(`${API_CONFIG.ENDPOINTS.CHAT.MESSAGES}/${sessionId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
                message_type: messageType,
                content: content,
            }),
        });
    }

    // New enhanced chat methods
    async processUserMessage(sessionId: string, message: string): Promise<EnhancedChatResponse> {
        console.log('Processing user message with mood analysis:', message.substring(0, 50) + '...');
        return this.request<EnhancedChatResponse>(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}/process-message`, {
            method: 'POST',
            body: JSON.stringify({ message }),
        });
    }

    async getConversationContext(sessionId: string): Promise<ConversationContext> {
        console.log('Getting conversation context for session:', sessionId);
        return this.request<ConversationContext>(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}/context`);
    }

    async getMoodAnalysis(sessionId: string): Promise<MoodAnalysisResponse> {
        console.log('Getting mood analysis for session:', sessionId);
        return this.request<MoodAnalysisResponse>(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}/mood-analysis`);
    }

    // Collaboration Summary methods
    async generateCollaborationSummary(sessionId: string): Promise<CollaborationSummaryResponse> {
        console.log('Generating collaboration summary for session:', sessionId);
        return this.request<CollaborationSummaryResponse>('/api/chat/generate-collaboration-summary', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId })
        });
    }

    async getCollaborationSummaries(): Promise<CollaborationSummariesResponse> {
        console.log('Getting collaboration summaries');
        return this.request<CollaborationSummariesResponse>('/api/chat/collaboration-summaries');
    }

    async getCollaborationSummary(summaryId: string): Promise<CollaborationSummaryResponse> {
        console.log('Getting collaboration summary:', summaryId);
        return this.request<CollaborationSummaryResponse>(`/api/chat/collaboration-summary/${summaryId}`);
    }

    // Session Timer methods
    async startSessionTimer(sessionId: string): Promise<TimerResponse> {
        console.log('Starting session timer for:', sessionId);
        return this.request<TimerResponse>('/api/chat/session-timer/start', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId })
        });
    }

    async stopSessionTimer(sessionId: string): Promise<TimerResponse> {
        console.log('Stopping session timer for:', sessionId);
        return this.request<TimerResponse>('/api/chat/session-timer/stop', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId })
        });
    }

    async getSessionTimer(sessionId: string): Promise<{ timer: SessionTimer | null }> {
        console.log('Getting session timer for:', sessionId);
        return this.request<{ timer: SessionTimer | null }>(`/api/chat/session-timer/${sessionId}`);
    }

    async getDailyTimerTotal(): Promise<DailyTimerTotal> {
        console.log('Getting daily timer total');
        return this.request<DailyTimerTotal>('/api/chat/session-timer/daily-total');
    }

    // Admin Dashboard methods
    async getAdminDashboardAnalytics(): Promise<any> {
        console.log('Getting admin dashboard analytics');
        return this.request<any>('/api/admin/dashboard/analytics');
    }

    async getAdminDashboardCharts(): Promise<any> {
        console.log('Getting admin dashboard charts');
        return this.request<any>('/api/admin/dashboard/charts');
    }

    // User Management
    async getAdminUsers(page: number = 1, limit: number = 20, userType?: string, search?: string): Promise<any> {
        console.log('Getting admin users');
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(userType && { user_type: userType }),
            ...(search && { search })
        });
        return this.request<any>(`/api/admin/users?${params}`);
    }

    async getAdminUserDetails(userId: string): Promise<any> {
        console.log('Getting admin user details:', userId);
        return this.request<any>(`/api/admin/users/${userId}`);
    }

    async toggleUserStatus(userId: string, isActive: boolean): Promise<any> {
        console.log('Toggling user status:', userId, isActive);
        return this.request<any>(`/api/admin/users/${userId}/toggle-status`, {
            method: 'PUT',
            body: JSON.stringify({ is_active: isActive })
        });
    }

    async banUser(userId: string, reason: string): Promise<any> {
        console.log('Banning user:', userId, reason);
        return this.request<any>(`/api/admin/users/${userId}/ban`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    // Security Management
    async getSecurityAlerts(page: number = 1, limit: number = 20, severity?: string, resolved?: boolean, alertType?: string): Promise<any> {
        console.log('Getting security alerts');
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(severity && { severity }),
            ...(resolved !== undefined && { resolved: resolved.toString() }),
            ...(alertType && { alert_type: alertType })
        });
        return this.request<any>(`/api/admin/security/alerts?${params}`);
    }

    async resolveSecurityAlert(alertId: string, resolutionNotes: string): Promise<any> {
        console.log('Resolving security alert:', alertId);
        return this.request<any>(`/api/admin/security/alerts/${alertId}/resolve`, {
            method: 'PUT',
            body: JSON.stringify({ resolution_notes: resolutionNotes })
        });
    }

    // Analytics
    async getMessageAnalytics(page: number = 1, limit: number = 50, userId?: string, sessionId?: string, piiDetected?: boolean, toxicityThreshold?: number): Promise<any> {
        console.log('Getting message analytics');
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(userId && { user_id: userId }),
            ...(sessionId && { session_id: sessionId }),
            ...(piiDetected !== undefined && { pii_detected: piiDetected.toString() }),
            ...(toxicityThreshold && { toxicity_threshold: toxicityThreshold.toString() })
        });
        return this.request<any>(`/api/admin/analytics/messages?${params}`);
    }

    async getToxicityAnalytics(): Promise<any> {
        console.log('Getting toxicity analytics');
        return this.request<any>('/api/admin/analytics/toxicity');
    }

    // System Monitoring
    async getSystemHealth(): Promise<any> {
        console.log('Getting system health');
        return this.request<any>('/api/admin/system/health');
    }

    async recordSystemMetric(metricName: string, metricValue: number, metricUnit?: string, metadata?: any): Promise<any> {
        console.log('Recording system metric:', metricName);
        return this.request<any>('/api/admin/system/metrics', {
            method: 'POST',
            body: JSON.stringify({
                metric_name: metricName,
                metric_value: metricValue,
                metric_unit: metricUnit,
                metadata
            })
        });
    }

    // Audit and Logging
    async getAuditLogs(page: number = 1, limit: number = 50, action?: string, userId?: string, dateFrom?: string, dateTo?: string): Promise<any> {
        console.log('Getting audit logs');
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(action && { action }),
            ...(userId && { user_id: userId }),
            ...(dateFrom && { date_from: dateFrom }),
            ...(dateTo && { date_to: dateTo })
        });
        return this.request<any>(`/api/admin/audit/logs?${params}`);
    }

    async getAdminActions(page: number = 1, limit: number = 50, actionType?: string, adminId?: string): Promise<any> {
        console.log('Getting admin actions');
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(actionType && { action_type: actionType }),
            ...(adminId && { admin_id: adminId })
        });
        return this.request<any>(`/api/admin/audit/admin-actions?${params}`);
    }

    // Reports and Exports
    async exportUsersReport(): Promise<any> {
        console.log('Exporting users report');
        return this.request<any>('/api/admin/reports/users');
    }

    async exportSecurityReport(): Promise<any> {
        console.log('Exporting security report');
        return this.request<any>('/api/admin/reports/security');
    }

    async exportActivityReport(userId?: string, dateFrom?: string, dateTo?: string): Promise<any> {
        console.log('Exporting activity report');
        const params = new URLSearchParams({
            ...(userId && { user_id: userId }),
            ...(dateFrom && { date_from: dateFrom }),
            ...(dateTo && { date_to: dateTo })
        });
        return this.request<any>(`/api/admin/reports/activity?${params}`);
    }
}

// create singleton instance
export const apiService = new ApiService();
