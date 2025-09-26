'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { apiService, ChatSession, ChatMessage } from '@/api/apiService'

interface LocalChatMessage {
    id: string;
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
}

export default function CareCompanionPage() {
    const { user, isAuthenticated, loading, logout } = useAuth()
    const { showSuccess, showError } = useToast()
    const router = useRouter()

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Original CareCompanion state
    const [inputValue, setInputValue] = useState('')
    const [sessionTime, setSessionTime] = useState(0)
    const [isTimerRunning, setIsTimerRunning] = useState(false)

    // Chat state - managing the conversation
    const [messages, setMessages] = useState<LocalChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    // Session state - for managing chat sessions
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
    const [showNewSessionModal, setShowNewSessionModal] = useState(false)
    const [newSessionTitle, setNewSessionTitle] = useState('')

    // Auth and session management
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            console.log('User not authenticated, redirecting to home')
            router.push('/')
        }
    }, [isAuthenticated, loading, router])

    useEffect(() => {
        if (user?.user_type === 'admin') {
            console.log('Admin user detected, redirecting to admin dashboard')
            router.push('/adminMain')
        }
    }, [user, router])

    // Load sessions on mount
    useEffect(() => {
        if (isAuthenticated) {
            console.log('User authenticated, loading sessions...')
            loadSessions()
        }
    }, [isAuthenticated])

    // Auto-increment timer every minute when running
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isTimerRunning) {
            interval = setInterval(() => {
                setSessionTime(prev => prev + 1)
            }, 60000) // 60 seconds = 1 minute
        }
        return () => clearInterval(interval)
    }, [isTimerRunning])

    const handleLogout = async () => {
        try {
            console.log('Logging out user...')
            await logout()
            showSuccess('Logged out successfully')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    // Session management functions
    const loadSessions = async () => {
        try {
            console.log('Loading chat sessions...')
            const response = await apiService.getChatSessions()
            setSessions(response.sessions)
            console.log('Loaded sessions:', response.sessions.length)
        } catch (err) {
            console.error('Failed to load sessions:', err)
        }
    }

    const createNewSession = async () => {
        if (!newSessionTitle.trim()) return

        try {
            console.log('Creating new session:', newSessionTitle.trim())
            const response = await apiService.createChatSession(newSessionTitle.trim())
            setSessions(prev => [response.session, ...prev])
            setCurrentSession(response.session)
            setMessages([])
            setNewSessionTitle('')
            setShowNewSessionModal(false)
            showSuccess('New chat session created')
        } catch (err) {
            showError('Failed to create session', 'Please try again')
            console.error('Create session error:', err)
        }
    }

    const loadSession = async (sessionId: string) => {
        try {
            console.log('Loading session:', sessionId)
            const response = await apiService.getChatSession(sessionId)
            setCurrentSession(response.session)

            // Convert database messages to local format
            const localMessages: LocalChatMessage[] = response.messages.map(msg => ({
                id: msg.id,
                type: msg.message_type,
                message: msg.content,
                timestamp: new Date(msg.created_at)
            }))

            setMessages(localMessages)
            console.log('Loaded messages:', localMessages.length)
        } catch (err) {
            showError('Failed to load session', 'Please try again')
            console.error('Load session error:', err)
        }
    }

    const deleteSession = async (sessionId: string) => {
        try {
            console.log('Deleting session:', sessionId)
            await apiService.deleteChatSession(sessionId)
            setSessions(prev => prev.filter(s => s.id !== sessionId))

            if (currentSession?.id === sessionId) {
                setCurrentSession(null)
                setMessages([])
            }

            showSuccess('Session deleted')
        } catch (err) {
            showError('Failed to delete session', 'Please try again')
            console.error('Delete session error:', err)
        }
    }

    const sendMessage = async () => {
        if (!inputMessage.trim() || isTyping) return

        console.log('Sending message:', inputMessage.substring(0, 50) + '...')

        // Create new session if none exists
        let sessionId = currentSession?.id
        if (!sessionId) {
            try {
                console.log('No current session, creating new one...')
                const response = await apiService.createChatSession('New Chat')
                setSessions(prev => [response.session, ...prev])
                setCurrentSession(response.session)
                sessionId = response.session.id
            } catch (err) {
                showError('Failed to create session', 'Please try again')
                return
            }
        }

        const userMessage: LocalChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            message: inputMessage.trim(),
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInputMessage('')
        setIsTyping(true)

        try {
            // Save user message to db
            await apiService.addMessageToSession(sessionId, 'user', inputMessage.trim())

            const response = await apiService.chatWithGemini({ message: inputMessage.trim() })

            const aiMessage: LocalChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                message: response.response,
                timestamp: new Date(),
            }

            setMessages(prev => [...prev, aiMessage])

            // Save AI message to database
            await apiService.addMessageToSession(sessionId, 'ai', response.response)
        } catch (err: any) {
            // Handle guardrail errors specifically
            if (err.message && err.message.includes('warnings')) {
                try {
                    const errorData = JSON.parse(err.message)
                    if (errorData.warnings && errorData.warnings.length > 0) {
                        showError('Message blocked by security filters', errorData.warnings.join(', '))
                    } else {
                        showError('Message blocked', 'Your message contains content that violates our security policies')
                    }
                } catch {
                    showError('Message blocked', 'Your message contains content that violates our security policies')
                }
            } else {
                showError('Failed to get AI response', 'Please try again later')
            }
            console.error('Chat error:', err)
        } finally {
            setIsTyping(false)
        }
    }

    const handleSend = () => {
        if (inputValue.trim()) {
            console.log('Sending message:', inputValue)
            setInputValue('')
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend()
        }
    }

    const handleKeyPressMessage = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            console.log('Enter key pressed, sending message')
            sendMessage()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-black/40 backdrop-blur-lg border-r border-gray-700/50 flex flex-col`}>
                <div className="p-4 border-b border-gray-700/50">
                    <div className="flex items-center justify-between">
                        {sidebarOpen && (
                            <h1 className="text-xl font-bold text-white">
                                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                    CareCompanion
                                </span>
                            </h1>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 text-white hover:bg-gray-700/30 rounded-lg transition-all duration-300"
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
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
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

                            {/* New Session */}
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
                                                ? 'bg-gray-700/50 text-white border border-gray-600/50'
                                                : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
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
                                                    e.stopPropagation()
                                                    deleteSession(session.id)
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
                <div className="p-4 border-t border-gray-700/50">
                    <button
                        onClick={handleLogout}
                        className="w-full p-3 text-white hover:bg-red-900/30 rounded-lg transition-all duration-300 flex items-center space-x-3"
                    >
                        <span>🚪</span>
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">

                {/* Main Content Area */}
                <div className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Interaction Area */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* AI Companion Chat Area */}
                            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 space-y-4 border border-gray-700/50">
                                {/* CareCompanion Profile */}
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">CC</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">CareCompanion</h3>
                                        <p className="text-gray-300 text-sm">Mood: neutral</p>
                                    </div>
                                </div>

                                {/* Status/Mode */}
                                <div className="text-gray-300 text-sm">
                                    Balance Mode • Usage nudges enabled
                                </div>

                                {/* Chat Messages */}
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-gray-300 py-8">
                                            <div className="text-4xl mb-4">🤖</div>
                                            <h3 className="text-xl font-semibold mb-2">Welcome to CareCompanion</h3>
                                            <p className="text-lg">Start a conversation — CareCompanion will gently suggest breaks and real-world steps when needed.</p>
                                        </div>
                                    ) : (
                                        messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-3xl p-4 rounded-2xl ${message.type === 'user'
                                                        ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white border border-gray-600/50'
                                                        : 'bg-black/40 backdrop-blur-lg text-white border border-gray-700/50'
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
                                            <div className="bg-black/40 backdrop-blur-lg text-white border border-gray-700/50 rounded-2xl p-4">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Field */}
                                <div className="space-y-3">
                                    <div className="flex space-x-3">
                                        <textarea
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={handleKeyPressMessage}
                                            placeholder="How are you feeling? Ask or share something..."
                                            className="flex-1 bg-black/40 border border-gray-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                                            rows={1}
                                            style={{ minHeight: '60px', maxHeight: '120px' }}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!inputMessage.trim() || isTyping}
                                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Send
                                        </button>
                                    </div>

                                    {/* Session Status */}
                                    <div className="text-gray-400 text-sm">
                                        Session timer: {sessionTime}m • Break suggestion: after 25 min
                                    </div>
                                </div>

                                {/* Wellbeing Nudges Section */}
                                <div className="space-y-3">
                                    <h4 className="text-white font-semibold">Wellbeing Nudges</h4>
                                    <p className="text-gray-300 text-sm">
                                        Automatic nudges when the system detects extended sessions or signs of dependency.
                                    </p>
                                    <ul className="text-gray-300 text-sm space-y-1 ml-4">
                                        <li>• Gentle break prompt after continuous usage</li>
                                        <li>• Reality Check reminders (every N messages)</li>
                                        <li>• Suggest local activities or social meetups</li>
                                    </ul>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-3 pt-4">
                                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                                        Generate Collaboration Summary
                                    </button>
                                    <button className="bg-gray-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                                        Explore Community
                                    </button>
                                    <button className="bg-gray-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                                        Run Sanitize Tests
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Informational Cards */}
                        <div className="space-y-4">
                            {/* Session Today Stats */}
                            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-gray-700/50">
                                <h3 className="text-white font-semibold">Session Today</h3>
                                <div className="text-2xl font-bold text-white">
                                    {sessions.length} sessions • {sessionTime} minutes
                                </div>
                            </div>

                            {/* Adaptive Emotional Intelligence Card */}
                            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-gray-700/50">
                                <h3 className="text-white font-semibold">Adaptive Emotional Intelligence</h3>
                                <p className="text-gray-300 text-sm">
                                    We detect mood trends and personalize coping strategies.
                                </p>
                                <div className="space-y-2">
                                    <div className="text-gray-300 text-sm">Mood: neutral</div>
                                    <div className="text-gray-400 text-xs">Last check: a few minutes ago</div>
                                </div>
                                <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                                    View Insights
                                </button>
                            </div>

                            {/* Community Card */}
                            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-gray-700/50">
                                <h3 className="text-white font-semibold">Community (Opt-in)</h3>
                                <p className="text-gray-300 text-sm">
                                    Join moderated peer groups — AI + human moderation ensures safety.
                                </p>
                                <div className="text-gray-300 text-sm">
                                    No groups yet — create a moderated circle.
                                </div>
                                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                                    Create a new safe circle
                                </button>
                            </div>

                            {/* Session Health Card */}
                            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-gray-700/50">
                                <h3 className="text-white font-semibold">Session Health</h3>
                                <div className="space-y-2">
                                    <div className="text-gray-300 text-sm">Active minutes today</div>
                                    <div className="text-2xl font-bold text-white">{sessionTime} min</div>
                                    <div className="text-gray-400 text-xs">Keep balanced — take a break if you exceed 60 minutes.</div>
                                </div>
                            </div>

                            {/* Safety & Privacy Card */}
                            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-gray-700/50">
                                <h3 className="text-white font-semibold">Safety & Privacy</h3>
                                <p className="text-gray-300 text-sm">
                                    On-device memory controls • PII scrubber • Human review opt-in
                                </p>
                                <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                                    Manage Privacy
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-gray-400 text-sm">
                        Built for professionals — includes wellbeing nudges, adaptive mood detection, opt-in moderated community, and human-AI collaboration summaries for therapists or trusted contacts.
                    </div>
                </div>
            </div>

            {/* New Session Modal */}
            {showNewSessionModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-gray-700/50">
                        <h3 className="text-xl font-semibold text-white mb-4">Create New Chat Session</h3>
                        <input
                            type="text"
                            value={newSessionTitle}
                            onChange={(e) => setNewSessionTitle(e.target.value)}
                            placeholder="Enter session title..."
                            className="w-full p-3 bg-black/40 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent mb-4"
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
                                    setShowNewSessionModal(false)
                                    setNewSessionTitle('')
                                }}
                                className="flex-1 py-3 px-4 text-white border border-gray-700/50 rounded-lg hover:bg-gray-800/50 transition-all duration-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
