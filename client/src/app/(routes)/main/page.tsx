'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { apiService, ChatSession, ChatMessage, EnhancedChatResponse, MoodAnalysis, ConversationContext, CollaborationSummary, SessionTimer, DailyTimerTotal } from '@/api/apiService'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface LocalChatMessage {
    id: string;
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
    mood?: 'neutral' | 'happy' | 'sad' | 'curious' | 'supportive';
    response_type?: 'normal' | 'educational' | 'redirect' | 'supportive';
}

export default function CareCompanionPage() {
    const { user, isAuthenticated, loading, logout } = useAuth()
    const { showSuccess, showError } = useToast()
    const router = useRouter()

    const [sidebarOpen, setSidebarOpen] = useState(false)

    const [inputValue, setInputValue] = useState('')
    const [sessionTime, setSessionTime] = useState(0)
    const [isTimerRunning, setIsTimerRunning] = useState(false)
    const [dailySessionTime, setDailySessionTime] = useState(0)
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
    const [currentSessionTimer, setCurrentSessionTimer] = useState<SessionTimer | null>(null)

    const [messages, setMessages] = useState<LocalChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
    const [isListening, setIsListening] = useState(false)
    const [recognition, setRecognition] = useState<any>(null)

    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
    const [showNewSessionModal, setShowNewSessionModal] = useState(false)
    const [newSessionTitle, setNewSessionTitle] = useState('')

    const [currentMood, setCurrentMood] = useState<'neutral' | 'happy' | 'sad' | 'curious' | 'supportive'>('neutral')
    const [moodHistory, setMoodHistory] = useState<Array<{ mood: string, timestamp: string }>>([])
    const [conversationContext, setConversationContext] = useState<ConversationContext | null>(null)
    const [shouldRedirect, setShouldRedirect] = useState(false)
    const [redirectSuggestions, setRedirectSuggestions] = useState<string[]>([])

    const [showAnalytics, setShowAnalytics] = useState(false)
    const [analyticsData, setAnalyticsData] = useState<Array<{ message: number, mood: string, moodValue: number, timestamp: string }>>([])

    const [showCollaborationSummary, setShowCollaborationSummary] = useState(false)
    const [collaborationSummaries, setCollaborationSummaries] = useState<CollaborationSummary[]>([])
    const [selectedSummary, setSelectedSummary] = useState<CollaborationSummary | null>(null)
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

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

    useEffect(() => {
        if (isAuthenticated) {
            console.log('User authenticated, loading sessions...')
            loadSessions()
            loadDailySessionTime()
            loadCollaborationSummaries()
        }
    }, [isAuthenticated])

    // Initialize text-to-speech and speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setSpeechSynthesis(window.speechSynthesis)
        }

        // Initialize speech recognition
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            const recognitionInstance = new SpeechRecognition()
            
            recognitionInstance.continuous = false
            recognitionInstance.interimResults = false
            recognitionInstance.lang = 'en-US'
            
            recognitionInstance.onstart = () => {
                setIsListening(true)
            }
            
            recognitionInstance.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript
                setInputMessage(prev => prev + (prev ? ' ' : '') + transcript)
                setIsListening(false)
            }
            
            recognitionInstance.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error)
                setIsListening(false)
                if (event.error === 'not-allowed') {
                    showError('Microphone Access Denied', 'Please allow microphone access to use speech-to-text')
                } else if (event.error === 'no-speech') {
                    showError('No Speech Detected', 'Please try speaking again')
                }
            }
            
            recognitionInstance.onend = () => {
                setIsListening(false)
            }
            
            setRecognition(recognitionInstance)
        }
    }, [])

    // Auto-increment timer every second when running
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isTimerRunning) {
            interval = setInterval(() => {
                setSessionTime(prev => {
                    const newTime = prev + 1
                    // Update daily session time every 60 seconds (1 minute)
                    if (newTime % 60 === 0) {
                        updateDailySessionTime(1)
                    }
                    return newTime
                })
            }, 1000) // 1 second
        }
        return () => clearInterval(interval)
    }, [isTimerRunning, dailySessionTime])

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

    const loadDailySessionTime = async () => {
        try {
            // Load from database first
            await loadDailyTimerTotal()

            // Fallback to localStorage if database fails
            const today = new Date().toDateString()
            const storedTime = localStorage.getItem(`dailySessionTime_${today}`)
            if (storedTime && dailySessionTime === 0) {
                setDailySessionTime(parseInt(storedTime))
            }
        } catch (err) {
            console.error('Failed to load daily session time:', err)
            // Fallback to localStorage
            const today = new Date().toDateString()
            const storedTime = localStorage.getItem(`dailySessionTime_${today}`)
            if (storedTime) {
                setDailySessionTime(parseInt(storedTime))
            }
        }
    }

    const updateDailySessionTime = (additionalMinutes: number) => {
        try {
            const today = new Date().toDateString()
            const newTotal = dailySessionTime + (additionalMinutes * 60) // Convert minutes to seconds
            setDailySessionTime(newTotal)
            localStorage.setItem(`dailySessionTime_${today}`, newTotal.toString())
        } catch (err) {
            console.error('Failed to update daily session time:', err)
        }
    }

    // Database timer functions
    const startDatabaseTimer = async (sessionId: string) => {
        try {
            console.log('Starting database timer for session:', sessionId)
            const response = await apiService.startSessionTimer(sessionId)
            setCurrentSessionTimer(response.timer)
            console.log('Database timer started:', response.timer.id)
        } catch (err) {
            console.error('Failed to start database timer:', err)
        }
    }

    const stopDatabaseTimer = async (sessionId: string) => {
        try {
            console.log('Stopping database timer for session:', sessionId)
            await apiService.stopSessionTimer(sessionId)
            setCurrentSessionTimer(null)
            console.log('Database timer stopped')
        } catch (err) {
            console.error('Failed to stop database timer:', err)
        }
    }

    const loadSessionTimer = async (sessionId: string) => {
        try {
            console.log('Loading session timer for:', sessionId)
            const response = await apiService.getSessionTimer(sessionId)
            if (response.timer) {
                setCurrentSessionTimer(response.timer)
                if (response.timer.is_active && response.timer.current_elapsed_seconds) {
                    setSessionTime(response.timer.current_elapsed_seconds)
                    setIsTimerRunning(true)
                }
            }
        } catch (err) {
            console.error('Failed to load session timer:', err)
        }
    }

    const loadDailyTimerTotal = async () => {
        try {
            console.log('Loading daily timer total...')
            const response = await apiService.getDailyTimerTotal()
            setDailySessionTime(response.daily_total_seconds)
        } catch (err) {
            console.error('Failed to load daily timer total:', err)
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

            // Start timer for new session
            setSessionTime(0)
            setIsTimerRunning(true)
            setSessionStartTime(new Date())

            // Start database timer
            await startDatabaseTimer(response.session.id)

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
                timestamp: new Date(msg.created_at),
                mood: msg.mood,
                response_type: msg.response_type
            }))

            setMessages(localMessages)
            console.log('Loaded messages:', localMessages.length)

            // Load existing timer for session
            await loadSessionTimer(sessionId)

            // If no active timer, start a new one
            if (!currentSessionTimer || !currentSessionTimer.is_active) {
                setSessionTime(0)
                setIsTimerRunning(true)
                setSessionStartTime(new Date())
                await startDatabaseTimer(sessionId)
            }

            // Load conversation context and mood analysis
            await loadConversationContext(sessionId)
        } catch (err) {
            showError('Failed to load session', 'Please try again')
            console.error('Load session error:', err)
        }
    }

    const loadConversationContext = async (sessionId: string) => {
        try {
            console.log('Loading conversation context for session:', sessionId)
            const context = await apiService.getConversationContext(sessionId)
            setConversationContext(context)

            // Update mood history
            if (context.mood_history) {
                setMoodHistory(context.mood_history)
                // Set current mood from the latest entry
                if (context.mood_history.length > 0) {
                    const latestMood = context.mood_history[context.mood_history.length - 1]
                    setCurrentMood(latestMood.mood as any)
                }
            }

            // Check if conversation should be redirected
            if (context.context_summary?.should_redirect) {
                setShouldRedirect(true)
                setRedirectSuggestions(context.context_summary.redirect_suggestions || [])
            } else {
                setShouldRedirect(false)
                setRedirectSuggestions([])
            }
        } catch (err) {
            console.error('Failed to load conversation context:', err)
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

        console.log('Sending message with mood analysis:', inputMessage.substring(0, 50) + '...')

        // Create new session if none exists
        let sessionId = currentSession?.id
        if (!sessionId) {
            try {
                console.log('No current session, creating new one...')
                const response = await apiService.createChatSession('New Chat')
                setSessions(prev => [response.session, ...prev])
                setCurrentSession(response.session)
                sessionId = response.session.id

                // Start timer for auto-created session
                setSessionTime(0)
                setIsTimerRunning(true)
                setSessionStartTime(new Date())

                // Start database timer
                await startDatabaseTimer(sessionId)
            } catch (err) {
                showError('Failed to create session', 'Please try again')
                return
            }
        }

        const userMessage: LocalChatMessage = {
            id: `user_${Date.now()}`,
            type: 'user',
            message: inputMessage.trim(),
            timestamp: new Date(),
        }

        setMessages(prev => {
            console.log('Adding user message immediately:', userMessage)
            console.log('Current messages count:', prev.length)
            return [...prev, userMessage]
        })
        setInputMessage('')
        setIsTyping(true)

        try {
            const response = await apiService.processUserMessage(sessionId, inputMessage.trim())

            if (response.processing_results.pii_scrubbed) {
                console.log('🔒 PII Scrubbing Debug:')
                console.log('Original message:', inputMessage.trim())
                console.log('Processed message:', response.processing_results.processed_message)
                console.log('PII scrubbed:', response.processing_results.pii_scrubbed)

                setMessages(prev => prev.map(msg =>
                    msg.id === userMessage.id
                        ? { ...msg, message: response.processing_results.processed_message }
                        : msg
                ))
            }

            const aiMessage: LocalChatMessage = {
                id: response.ai_response.id,
                type: response.ai_response.message_type,
                message: response.ai_response.content,
                timestamp: new Date(response.ai_response.created_at),
                mood: response.ai_response.mood,
                response_type: response.ai_response.response_type
            }

            setMessages(prev => [...prev, aiMessage])

            const processingResults = response.processing_results
            if (processingResults.mood_analysis) {
                setCurrentMood(processingResults.mood_analysis.mood)
                setMoodHistory(prev => [...prev, {
                    mood: processingResults.mood_analysis.mood,
                    timestamp: new Date().toISOString()
                }])
            }

            if (processingResults.should_redirect && processingResults.redirect_suggestions.length > 0) {
                setShouldRedirect(true)
                setRedirectSuggestions(processingResults.redirect_suggestions)
                showSuccess('I notice you might benefit from a change of topic. Here are some suggestions!')
            } else {
                setShouldRedirect(false)
                setRedirectSuggestions([])
            }

            if (processingResults.mood_analysis?.mood === 'curious' && processingResults.response_guidance?.approach === 'educational') {
                showSuccess('I\'m here to help you learn! Let me provide some educational context.')
            }

            if (processingResults.warnings && processingResults.warnings.length > 0) {
                const warningMessages = processingResults.warnings.join(', ')
                showError('Content Warning', `Your message contains: ${warningMessages}. Please be mindful of the content you share.`)
            }

            if (processingResults.pii_scrubbed) {
                showSuccess('Privacy Protection', 'Your message contained personal information that has been automatically protected. The sensitive data has been replaced with [REDACTED] for your privacy.')
            }

        } catch (err: any) {
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

    // Text-to-Speech functions
    const speakText = () => {
        if (!speechSynthesis || !inputMessage.trim()) return

        // Stop any current speech
        speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(inputMessage.trim())

        // Configure voice settings for better quality
        utterance.rate = 0.9 // Slightly slower for better comprehension
        utterance.pitch = 1.0 // Normal pitch
        utterance.volume = 0.8 // Good volume level

        // Try to use a high-quality voice if available
        const voices = speechSynthesis.getVoices()
        const preferredVoices = [
            'Microsoft Zira Desktop - English (United States)',
            'Microsoft David Desktop - English (United States)',
            'Google US English',
            'Alex',
            'Samantha'
        ]

        const selectedVoice = voices.find(voice =>
            preferredVoices.includes(voice.name)
        ) || voices.find(voice => voice.lang.startsWith('en'))

        if (selectedVoice) {
            utterance.voice = selectedVoice
        }

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        speechSynthesis.speak(utterance)
    }

    const stopSpeaking = () => {
        if (speechSynthesis) {
            speechSynthesis.cancel()
            setIsSpeaking(false)
        }
    }

    // Speech-to-Text functions
    const startListening = () => {
        if (!recognition) {
            showError('Speech Recognition Not Available', 'Your browser does not support speech recognition')
            return
        }

        if (isListening) {
            recognition.stop()
            setIsListening(false)
        } else {
            try {
                recognition.start()
            } catch (error) {
                console.error('Error starting speech recognition:', error)
                showError('Speech Recognition Error', 'Unable to start speech recognition')
            }
        }
    }

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop()
            setIsListening(false)
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

    const handleRedirectSuggestion = async (suggestion: string) => {
        // Send the suggestion as a message to the AI
        setShouldRedirect(false)
        setRedirectSuggestions([])
        showSuccess('Great choice! Let\'s explore that topic together.')

        // Create new session if none exists
        let sessionId = currentSession?.id
        if (!sessionId) {
            try {
                console.log('No current session, creating new one...')
                const response = await apiService.createChatSession('New Chat')
                setSessions(prev => [response.session, ...prev])
                setCurrentSession(response.session)
                sessionId = response.session.id

                // Start timer for auto-created session
                setSessionTime(0)
                setIsTimerRunning(true)
                setSessionStartTime(new Date())

                // Start database timer
                await startDatabaseTimer(sessionId)
            } catch (err) {
                showError('Failed to create session', 'Please try again')
                return
            }
        }

        // Add user message immediately to show in chat
        const userMessage: LocalChatMessage = {
            id: `user_${Date.now()}`,
            type: 'user',
            message: suggestion,
            timestamp: new Date(),
        }

        setMessages(prev => {
            console.log('Adding user message immediately (Redirect):', userMessage)
            console.log('Current messages count:', prev.length)
            return [...prev, userMessage]
        })
        setIsTyping(true)

        try {
            // Use the new enhanced message processing with mood analysis
            const response = await apiService.processUserMessage(sessionId, suggestion)

            // Update user message if PII was scrubbed
            if (response.processing_results.pii_scrubbed) {
                console.log('🔒 PII Scrubbing Debug (Redirect):')
                console.log('Original message:', suggestion)
                console.log('Processed message:', response.processing_results.processed_message)
                console.log('PII scrubbed:', response.processing_results.pii_scrubbed)

                // Update the user message with scrubbed content
                setMessages(prev => prev.map(msg =>
                    msg.id === userMessage.id
                        ? { ...msg, message: response.processing_results.processed_message }
                        : msg
                ))
            }

            // Convert response to local format
            const aiMessage: LocalChatMessage = {
                id: response.ai_response.id,
                type: response.ai_response.message_type,
                message: response.ai_response.content,
                timestamp: new Date(response.ai_response.created_at),
                mood: response.ai_response.mood,
                response_type: response.ai_response.response_type
            }

            setMessages(prev => [...prev, aiMessage])

            // Update mood and context from processing results
            const processingResults = response.processing_results
            if (processingResults.mood_analysis) {
                setCurrentMood(processingResults.mood_analysis.mood)
                setMoodHistory(prev => [...prev, {
                    mood: processingResults.mood_analysis.mood,
                    timestamp: new Date().toISOString()
                }])
            }

            // Handle redirect suggestions
            if (processingResults.should_redirect && processingResults.redirect_suggestions.length > 0) {
                setShouldRedirect(true)
                setRedirectSuggestions(processingResults.redirect_suggestions)
                showSuccess('I notice you might benefit from a change of topic. Here are some suggestions!')
            } else {
                setShouldRedirect(false)
                setRedirectSuggestions([])
            }

            // Show educational response notification if applicable
            if (processingResults.mood_analysis?.mood === 'curious' && processingResults.response_guidance?.approach === 'educational') {
                showSuccess('I\'m here to help you learn! Let me provide some educational context.')
            }

            // Show warnings for restricted/toxic content detection
            if (processingResults.warnings && processingResults.warnings.length > 0) {
                const warningMessages = processingResults.warnings.join(', ')
                showError('Content Warning', `Your message contains: ${warningMessages}. Please be mindful of the content you share.`)
            }

            // Show PII scrubbing notification
            if (processingResults.pii_scrubbed) {
                showSuccess('Privacy Protection', 'Your message contained personal information that has been automatically protected. The sensitive data has been replaced with [REDACTED] for your privacy.')
            }

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

    // Analytics functions
    const generateAnalyticsData = () => {
        if (!currentSession || messages.length === 0) return

        const moodValueMap = {
            'sad': 0,
            'curious': 1,
            'neutral': 2,
            'supportive': 3,
            'happy': 4
        }

        const analyticsData = messages
            .filter(msg => msg.mood) // Only messages with mood data
            .map((msg, index) => ({
                message: index + 1,
                mood: msg.mood!,
                moodValue: moodValueMap[msg.mood as keyof typeof moodValueMap] || 2,
                timestamp: msg.timestamp.toLocaleTimeString()
            }))

        setAnalyticsData(analyticsData)
    }

    const openAnalytics = () => {
        if (!currentSession) {
            showError('No active session', 'Please start a chat session first')
            return
        }
        generateAnalyticsData()
        setShowAnalytics(true)
    }

    // Collaboration Summary functions
    const generateCollaborationSummary = async () => {
        if (!currentSession) {
            showError('No active session', 'Please start a chat session first')
            return
        }

        setIsGeneratingSummary(true)
        try {
            console.log('Generating collaboration summary for session:', currentSession.id)
            const response = await apiService.generateCollaborationSummary(currentSession.id)
            showSuccess('Collaboration summary generated successfully!')

            await loadCollaborationSummaries()

            setSelectedSummary(response.summary)
            setShowCollaborationSummary(true)
        } catch (err: any) {
            if (err.message && err.message.includes('already exists')) {
                showError('Summary already exists', 'A collaboration summary has already been generated for this session')
            } else {
                showError('Failed to generate summary', 'Please try again later')
            }
            console.error('Generate summary error:', err)
        } finally {
            setIsGeneratingSummary(false)
        }
    }

    const loadCollaborationSummaries = async () => {
        try {
            console.log('Loading collaboration summaries...')
            const response = await apiService.getCollaborationSummaries()
            setCollaborationSummaries(response.summaries)
            console.log('Loaded summaries:', response.summaries.length)
        } catch (err) {
            console.error('Failed to load collaboration summaries:', err)
        }
    }

    const openCollaborationSummary = (summary: CollaborationSummary) => {
        setSelectedSummary(summary)
        setShowCollaborationSummary(true)
    }

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`
        } else {
            return `${secs}s`
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

                            {/* Collaboration Summaries */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Summaries</h3>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {collaborationSummaries.slice(0, 3).map((summary) => (
                                        <div
                                            key={summary.id}
                                            className="p-2 rounded-lg transition-all duration-300 cursor-pointer text-gray-300 hover:bg-gray-700/30 hover:text-white"
                                            onClick={() => openCollaborationSummary(summary)}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs">📋</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate">{summary.summary_title}</p>
                                                    <p className="text-xs opacity-70">
                                                        {new Date(summary.generated_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {collaborationSummaries.length === 0 && (
                                        <div className="text-xs text-gray-400 text-center py-2">
                                            No summaries yet
                                        </div>
                                    )}
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
                            <div className="bg-gray-900 backdrop-blur-lg rounded-xl p-6 space-y-4 border border-gray-700/50">
                                {/* CareCompanion Profile */}
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">CC</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">CareCompanion</h3>
                                        <p className="text-gray-300 text-sm">
                                            Mood: <span className={`font-medium ${currentMood === 'happy' ? 'text-green-400' :
                                                currentMood === 'sad' ? 'text-blue-400' :
                                                    currentMood === 'curious' ? 'text-yellow-400' :
                                                        currentMood === 'supportive' ? 'text-purple-400' :
                                                            'text-gray-400'
                                                }`}>
                                                {currentMood}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Status/Mode */}
                                <div className="text-gray-300 text-sm">
                                    Balance Mode • Usage nudges enabled
                                </div>

                                {/* Redirect Suggestions */}
                                {shouldRedirect && redirectSuggestions.length > 0 && (
                                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                                        <h4 className="text-yellow-300 font-semibold text-sm mb-2">💡 AI Questions for You</h4>
                                        <p className="text-yellow-200 text-xs mb-3">Click any question to start a conversation:</p>
                                        <div className="space-y-1">
                                            {redirectSuggestions.slice(0, 3).map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleRedirectSuggestion(suggestion)}
                                                    className="block w-full text-left text-yellow-200 text-xs hover:text-yellow-100 hover:bg-yellow-500/10 p-2 rounded transition-colors border border-yellow-500/20 hover:border-yellow-400/40"
                                                >
                                                    🤖 {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Chat Messages */}
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {(() => { console.log('Messages array:', messages); return null; })()}
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
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className="text-xs opacity-70">
                                                            {message.timestamp.toLocaleTimeString()}
                                                        </p>
                                                        {message.mood && message.type === 'ai' && (
                                                            <span className={`text-xs px-2 py-1 rounded-full ${message.mood === 'happy' ? 'bg-green-500/20 text-green-300' :
                                                                message.mood === 'sad' ? 'bg-blue-500/20 text-blue-300' :
                                                                    message.mood === 'curious' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                        message.mood === 'supportive' ? 'bg-purple-500/20 text-purple-300' :
                                                                            'bg-gray-500/20 text-gray-300'
                                                                }`}>
                                                                {message.mood}
                                                            </span>
                                                        )}
                                                        {message.response_type && message.response_type !== 'normal' && (
                                                            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">
                                                                {message.response_type}
                                                            </span>
                                                        )}
                                                    </div>
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
                                        {/* Text-to-Speech Button */}
                                        <button
                                            onClick={isSpeaking ? stopSpeaking : speakText}
                                            disabled={!inputMessage.trim()}
                                            className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isSpeaking
                                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                }`}
                                            title={isSpeaking ? 'Stop speaking' : 'Listen to your message'}
                                        >
                                            {isSpeaking ? (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.816a1 1 0 011-.108zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
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
                                        Session timer: {formatTime(sessionTime)} • Daily total: {formatTime(dailySessionTime)} • Break suggestion: after 25 min
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
                                    <button
                                        onClick={generateCollaborationSummary}
                                        disabled={isGeneratingSummary || !currentSession}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGeneratingSummary ? 'Generating...' : 'Generate Collaboration Summary'}
                                    </button>
                                    <button className="bg-gray-500 hover:bg-black-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                                        Explore Community
                                    </button>
                                    <button className="bg-gray-500 hover:bg-black-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                                        Run Sanitize Tests
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Informational Cards */}
                        <div className="space-y-4">
                            {/* Session Today Stats */}
                            <div className="bg-gray-900 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-gray-700/50">
                                <h3 className="text-white font-semibold">Session Today</h3>
                                <div className="text-2xl font-bold text-white">
                                    {sessions.length} sessions • {formatTime(dailySessionTime)} today
                                </div>
                                <div className="text-sm text-gray-300">
                                    Current session: {formatTime(sessionTime)}
                                </div>
                            </div>

                            {/* Adaptive Emotional Intelligence Card */}
                            <div className="bg-gray-900 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-gray-700/50">
                                <h3 className="text-white font-semibold">Adaptive Emotional Intelligence</h3>
                                <p className="text-gray-300 text-sm">
                                    We detect mood trends and personalize coping strategies.
                                </p>
                                <div className="space-y-2">
                                    <div className="text-gray-300 text-sm">
                                        Mood: <span className={`font-medium ${currentMood === 'happy' ? 'text-green-400' :
                                            currentMood === 'sad' ? 'text-blue-400' :
                                                currentMood === 'curious' ? 'text-yellow-400' :
                                                    currentMood === 'supportive' ? 'text-purple-400' :
                                                        'text-gray-400'
                                            }`}>
                                            {currentMood}
                                        </span>
                                    </div>
                                    <div className="text-gray-400 text-xs">
                                        Last check: {moodHistory.length > 0 ? 'just now' : 'not detected'}
                                    </div>
                                    {moodHistory.length > 0 && (
                                        <div className="text-gray-400 text-xs">
                                            Mood changes: {moodHistory.length - 1}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={openAnalytics}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                                >
                                    View Insights
                                </button>
                            </div>

                            {/* Community Card */}
                            {/* <div className="bg-gray-900 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-gray-700/50">
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
                            </div> */}

                            {/* Session Health Card */}
                            <div className="bg-gray-900 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-gray-700/50">
                                <h3 className="text-white font-semibold">Session Health</h3>
                                <div className="space-y-2">
                                    <div className="text-gray-300 text-sm">Active time today</div>
                                    <div className="text-2xl font-bold text-white">{formatTime(dailySessionTime)}</div>
                                    <div className="text-gray-400 text-xs">Current session: {formatTime(sessionTime)} • Keep balanced — take a break if you exceed 60 minutes.</div>
                                </div>
                            </div>

                            {/* Safety & Privacy Card */}
                            <div className="bg-gray-900 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-gray-700/50">
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

            {/* Analytics Modal */}
            {showAnalytics && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-semibold text-white">📊 Mood Analytics</h3>
                            <button
                                onClick={() => setShowAnalytics(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {analyticsData.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📈</div>
                                <h4 className="text-xl font-semibold text-white mb-2">No Mood Data Available</h4>
                                <p className="text-gray-300">Start chatting to see your mood journey visualized!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Chart */}
                                <div className="bg-black/30 rounded-xl p-6 border border-gray-700/30">
                                    <h4 className="text-lg font-semibold text-white mb-4">User Mood Over Chat</h4>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={analyticsData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis
                                                    dataKey="message"
                                                    stroke="#9CA3AF"
                                                    fontSize={12}
                                                    tickFormatter={(value) => `Msg ${value}`}
                                                />
                                                <YAxis
                                                    stroke="#9CA3AF"
                                                    fontSize={12}
                                                    domain={[0, 4]}
                                                    tickCount={5}
                                                    tickFormatter={(value) => {
                                                        const moodLabels = ['Sad', 'Curious', 'Neutral', 'Supportive', 'Happy']
                                                        return moodLabels[value] || ''
                                                    }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1F2937',
                                                        border: '1px solid #374151',
                                                        borderRadius: '8px',
                                                        color: '#F9FAFB'
                                                    }}
                                                    formatter={(value: any, name: string) => {
                                                        const moodLabels = ['Sad', 'Curious', 'Neutral', 'Supportive', 'Happy']
                                                        return [moodLabels[value] || 'Unknown', 'Mood']
                                                    }}
                                                    labelFormatter={(label) => `Message ${label}`}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="moodValue"
                                                    stroke="#3B82F6"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                                                    activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Mood Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-black/30 rounded-xl p-4 border border-gray-700/30">
                                        <h5 className="text-white font-semibold mb-2">Mood Summary</h5>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-300">Total Messages:</span>
                                                <span className="text-white">{analyticsData.length}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-300">Current Mood:</span>
                                                <span className={`font-medium ${currentMood === 'happy' ? 'text-green-400' :
                                                    currentMood === 'sad' ? 'text-blue-400' :
                                                        currentMood === 'curious' ? 'text-yellow-400' :
                                                            currentMood === 'supportive' ? 'text-purple-400' :
                                                                'text-gray-400'
                                                    }`}>
                                                    {currentMood}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-300">Mood Changes:</span>
                                                <span className="text-white">{moodHistory.length - 1}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/30 rounded-xl p-4 border border-gray-700/30">
                                        <h5 className="text-white font-semibold mb-2">Mood Distribution</h5>
                                        <div className="space-y-1">
                                            {['happy', 'supportive', 'neutral', 'curious', 'sad'].map((mood) => {
                                                const count = analyticsData.filter(d => d.mood === mood).length
                                                const percentage = analyticsData.length > 0 ? (count / analyticsData.length) * 100 : 0
                                                return (
                                                    <div key={mood} className="flex justify-between text-sm">
                                                        <span className="text-gray-300 capitalize">{mood}:</span>
                                                        <span className="text-white">{count} ({percentage.toFixed(1)}%)</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Mood Changes */}
                                {moodHistory.length > 1 && (
                                    <div className="bg-black/30 rounded-xl p-4 border border-gray-700/30">
                                        <h5 className="text-white font-semibold mb-3">Recent Mood Changes</h5>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {moodHistory.slice(-5).map((entry, index) => (
                                                <div key={index} className="flex justify-between text-sm">
                                                    <span className="text-gray-300">
                                                        {new Date(entry.timestamp).toLocaleTimeString()}
                                                    </span>
                                                    <span className={`font-medium ${entry.mood === 'happy' ? 'text-green-400' :
                                                        entry.mood === 'sad' ? 'text-blue-400' :
                                                            entry.mood === 'curious' ? 'text-yellow-400' :
                                                                entry.mood === 'supportive' ? 'text-purple-400' :
                                                                    'text-gray-400'
                                                        }`}>
                                                        {entry.mood}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Collaboration Summary Modal */}
            {showCollaborationSummary && selectedSummary && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-semibold text-white">📋 Collaboration Summary</h3>
                            <button
                                onClick={() => setShowCollaborationSummary(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Summary Header */}
                            <div className="bg-black/30 rounded-xl p-4 border border-gray-700/30">
                                <h4 className="text-xl font-semibold text-white mb-2">{selectedSummary.summary_title}</h4>
                                <div className="text-sm text-gray-300">
                                    Generated: {new Date(selectedSummary.generated_at).toLocaleString()}
                                </div>
                                {selectedSummary.chat_sessions && (
                                    <div className="text-sm text-gray-400 mt-1">
                                        Session: {selectedSummary.chat_sessions.title}
                                    </div>
                                )}
                            </div>

                            {/* Summary Content */}
                            <div className="bg-black/30 rounded-xl p-4 border border-gray-700/30">
                                <h5 className="text-lg font-semibold text-white mb-3">Summary</h5>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedSummary.summary_content}
                                </p>
                            </div>

                            {/* Key Insights */}
                            {selectedSummary.key_insights && selectedSummary.key_insights.length > 0 && (
                                <div className="bg-black/30 rounded-xl p-4 border border-gray-700/30">
                                    <h5 className="text-lg font-semibold text-white mb-3">Key Insights</h5>
                                    <ul className="space-y-2">
                                        {selectedSummary.key_insights.map((insight, index) => (
                                            <li key={index} className="text-gray-300 flex items-start space-x-2">
                                                <span className="text-blue-400 mt-1">•</span>
                                                <span>{insight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Mood Analysis */}
                            {selectedSummary.mood_analysis && Object.keys(selectedSummary.mood_analysis).length > 0 && (
                                <div className="bg-black/30 rounded-xl p-4 border border-gray-700/30">
                                    <h5 className="text-lg font-semibold text-white mb-3">Mood Analysis</h5>
                                    <div className="space-y-2">
                                        {Object.entries(selectedSummary.mood_analysis).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                                <span className="text-gray-300 capitalize">{key.replace('_', ' ')}:</span>
                                                <span className="text-white">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {selectedSummary.recommendations && selectedSummary.recommendations.length > 0 && (
                                <div className="bg-black/30 rounded-xl p-4 border border-gray-700/30">
                                    <h5 className="text-lg font-semibold text-white mb-3">Recommendations</h5>
                                    <ul className="space-y-2">
                                        {selectedSummary.recommendations.map((recommendation, index) => (
                                            <li key={index} className="text-gray-300 flex items-start space-x-2">
                                                <span className="text-green-400 mt-1">•</span>
                                                <span>{recommendation}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
