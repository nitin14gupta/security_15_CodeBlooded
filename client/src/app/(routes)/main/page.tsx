"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiService, ChatSession, ChatMessage } from '@/api/apiService';

interface LocalChatMessage {
    id: string;
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
}

export default function MainDashboard() {
    const { user, isAuthenticated, loading, logout } = useAuth();
    const { success, error } = useToast();
    const router = useRouter();

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<LocalChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Session state
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [showNewSessionModal, setShowNewSessionModal] = useState(false);
    const [newSessionTitle, setNewSessionTitle] = useState('');

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (user?.user_type === 'admin') {
            router.push('/adminMain');
        }
    }, [user, router]);

    // Load sessions on mount
    useEffect(() => {
        if (isAuthenticated) {
            loadSessions();
        }
    }, [isAuthenticated]);

    const handleLogout = async () => {
        try {
            await logout();
            success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Session management functions
    const loadSessions = async () => {
        try {
            const response = await apiService.getChatSessions();
            setSessions(response.sessions);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        }
    };

    const createNewSession = async () => {
        if (!newSessionTitle.trim()) return;

        try {
            const response = await apiService.createChatSession(newSessionTitle.trim());
            setSessions(prev => [response.session, ...prev]);
            setCurrentSession(response.session);
            setMessages([]);
            setNewSessionTitle('');
            setShowNewSessionModal(false);
            success('New chat session created');
        } catch (err) {
            error('Failed to create session', 'Please try again');
            console.error('Create session error:', err);
        }
    };

    const loadSession = async (sessionId: string) => {
        try {
            const response = await apiService.getChatSession(sessionId);
            setCurrentSession(response.session);

            // Convert database messages to local format
            const localMessages: LocalChatMessage[] = response.messages.map(msg => ({
                id: msg.id,
                type: msg.message_type,
                message: msg.content,
                timestamp: new Date(msg.created_at)
            }));

            setMessages(localMessages);
        } catch (err) {
            error('Failed to load session', 'Please try again');
            console.error('Load session error:', err);
        }
    };

    const deleteSession = async (sessionId: string) => {
        try {
            await apiService.deleteChatSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));

            if (currentSession?.id === sessionId) {
                setCurrentSession(null);
                setMessages([]);
            }

            success('Session deleted');
        } catch (err) {
            error('Failed to delete session', 'Please try again');
            console.error('Delete session error:', err);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isTyping) return;

        // Create new session if none exists
        let sessionId = currentSession?.id;
        if (!sessionId) {
            try {
                const response = await apiService.createChatSession('New Chat');
                setSessions(prev => [response.session, ...prev]);
                setCurrentSession(response.session);
                sessionId = response.session.id;
            } catch (err) {
                error('Failed to create session', 'Please try again');
                return;
            }
        }

        const userMessage: LocalChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            message: inputMessage.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        try {
            // Save user message to database
            await apiService.addMessageToSession(sessionId, 'user', inputMessage.trim());

            // Get AI response
            const response = await apiService.chatWithGemini({ message: inputMessage.trim() });

            const aiMessage: LocalChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                message: response.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);

            // Save AI message to database
            await apiService.addMessageToSession(sessionId, 'ai', response.response);
        } catch (err: any) {
            // Handle guardrails errors specifically
            if (err.message && err.message.includes('warnings')) {
                try {
                    const errorData = JSON.parse(err.message);
                    if (errorData.warnings && errorData.warnings.length > 0) {
                        error('Message blocked by security filters', errorData.warnings.join(', '));
                    } else {
                        error('Message blocked', 'Your message contains content that violates our security policies');
                    }
                } catch {
                    error('Message blocked', 'Your message contains content that violates our security policies');
                }
            } else {
                error('Failed to get AI response', 'Please try again later');
            }
            console.error('Chat error:', err);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white/10 backdrop-blur-lg border-r border-white/20 flex flex-col`}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-white/20">
                    <div className="flex items-center justify-between">
                        {sidebarOpen && (
                            <h1 className="text-xl font-bold text-white">
                                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                    SecurityApp
                                </span>
                            </h1>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                        >
                            {sidebarOpen ? '←' : '☰'}
                        </button>
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 p-4">
                    {sidebarOpen && (
                        <div className="space-y-4">
                            {/* User Info */}
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{user?.name}</p>
                                        <p className="text-gray-300 text-sm">{user?.email}</p>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                                            {user?.user_type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* New Session Button */}
                            <button
                                onClick={() => setShowNewSessionModal(true)}
                                className="w-full p-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 flex items-center space-x-3"
                            >
                                <span>➕</span>
                                <span>New Chat</span>
                            </button>

                            {/* Chat Sessions */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Chat Sessions</h3>
                                <div className="max-h-64 overflow-y-auto space-y-1">
                                    {sessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className={`p-3 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-between group ${currentSession?.id === session.id
                                                ? 'bg-pink-500/20 text-white'
                                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                                }`}
                                            onClick={() => loadSession(session.id)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{session.title}</p>
                                                <p className="text-xs opacity-70">
                                                    {new Date(session.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSession(session.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all duration-300"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <div className="p-4 border-t border-white/20">
                    <button
                        onClick={handleLogout}
                        className="w-full p-3 text-white hover:bg-red-500/20 rounded-lg transition-all duration-300 flex items-center space-x-3"
                    >
                        <span>🚪</span>
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">AI Security Assistant</h2>
                        <div className="flex items-center space-x-4">
                            <div className="text-white">
                                Welcome, <span className="font-semibold">{user?.name}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Chat Interface */}
                <div className="flex-1 flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-300 mt-20">
                                <div className="text-6xl mb-4">🤖</div>
                                <h3 className="text-2xl font-semibold mb-2">Welcome to AI Security Assistant</h3>
                                <p className="text-lg">Ask me anything about security, technology, or get help with your tasks!</p>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-3xl p-4 rounded-2xl ${message.type === 'user'
                                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                                            : 'bg-white/10 backdrop-blur-lg text-white border border-white/20'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap">{message.message}</p>
                                        <p className="text-xs opacity-70 mt-2">
                                            {message.timestamp.toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-2xl p-4">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-6 border-t border-white/20">
                        <div className="flex space-x-4">
                            <div className="flex-1 relative">
                                <textarea
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask me anything about security, technology, or get help..."
                                    className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                                    rows={1}
                                    style={{ minHeight: '60px', maxHeight: '120px' }}
                                />
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isTyping}
                                className="px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-2xl hover:from-pink-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Session Modal */}
            {showNewSessionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20">
                        <h3 className="text-xl font-semibold text-white mb-4">Create New Chat Session</h3>
                        <input
                            type="text"
                            value={newSessionTitle}
                            onChange={(e) => setNewSessionTitle(e.target.value)}
                            placeholder="Enter session title..."
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-4"
                            onKeyPress={(e) => e.key === 'Enter' && createNewSession()}
                        />
                        <div className="flex space-x-3">
                            <button
                                onClick={createNewSession}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewSessionModal(false);
                                    setNewSessionTitle('');
                                }}
                                className="flex-1 py-3 px-4 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
