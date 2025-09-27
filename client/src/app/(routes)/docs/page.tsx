'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function DocsPage() {
    const router = useRouter()
    const { isAuthenticated } = useAuth()
    const [activeSection, setActiveSection] = useState('getting-started')

    const sections = [
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: '🚀',
            content: (
                <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                        <h3 className="text-xl font-semibold text-white mb-4">Welcome to CareCompanion</h3>
                        <p className="text-gray-300 mb-4">
                            CareCompanion is your AI-powered mental health companion that provides emotional support,
                            mood tracking, and privacy-protected conversations.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <span className="text-green-400 mt-1">✅</span>
                                <div>
                                    <h4 className="text-white font-semibold">Create Your Account</h4>
                                    <p className="text-gray-300 text-sm">Sign up with your email and set up your profile</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <span className="text-green-400 mt-1">✅</span>
                                <div>
                                    <h4 className="text-white font-semibold">Start Your First Chat</h4>
                                    <p className="text-gray-300 text-sm">Begin a conversation with your AI companion</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <span className="text-green-400 mt-1">✅</span>
                                <div>
                                    <h4 className="text-white font-semibold">Explore Features</h4>
                                    <p className="text-gray-300 text-sm">Discover mood tracking, analytics, and more</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'privacy-protection',
            title: 'Privacy Protection',
            icon: '🛡️',
            content: (
                <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                        <h3 className="text-xl font-semibold text-white mb-4">Automatic PII Scrubbing</h3>
                        <p className="text-gray-300 mb-4">
                            CareCompanion automatically detects and protects your personal information:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-red-400">📧</span>
                                    <span className="text-gray-300">Email addresses</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-red-400">📞</span>
                                    <span className="text-gray-300">Phone numbers</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-red-400">🆔</span>
                                    <span className="text-gray-300">Social Security Numbers</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-red-400">💳</span>
                                    <span className="text-gray-300">Credit card numbers</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-red-400">🏠</span>
                                    <span className="text-gray-300">Home addresses</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-red-400">🌐</span>
                                    <span className="text-gray-300">IP addresses</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <p className="text-green-300 text-sm">
                                <strong>Your sensitive data is never stored.</strong> Only scrubbed versions are saved for conversation continuity.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'ai-features',
            title: 'AI Features',
            icon: '🤖',
            content: (
                <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                        <h3 className="text-xl font-semibold text-white mb-4">Mood Analysis</h3>
                        <p className="text-gray-300 mb-4">
                            Our AI analyzes your emotional state and provides personalized responses:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-yellow-400">😊</span>
                                    <span className="text-gray-300">Happy - Enthusiastic responses</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-blue-400">😢</span>
                                    <span className="text-gray-300">Sad - Supportive responses</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-purple-400">🤗</span>
                                    <span className="text-gray-300">Supportive - Empathetic responses</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-yellow-400">🤔</span>
                                    <span className="text-gray-300">Curious - Educational responses</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-400">😐</span>
                                    <span className="text-gray-300">Neutral - Balanced responses</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                        <h3 className="text-xl font-semibold text-white mb-4">Wellbeing Nudges</h3>
                        <p className="text-gray-300 mb-4">
                            CareCompanion gently reminds you to take breaks and maintain healthy usage patterns:
                        </p>
                        <ul className="text-gray-300 space-y-2 ml-4">
                            <li>• Break reminders after extended sessions</li>
                            <li>• Reality check prompts for healthy boundaries</li>
                            <li>• Suggestions for real-world activities</li>
                            <li>• Session time tracking and analytics</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'troubleshooting',
            title: 'Troubleshooting',
            icon: '🔧',
            content: (
                <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                        <h3 className="text-xl font-semibold text-white mb-4">Common Issues</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-white font-semibold mb-2">Messages not appearing in chat</h4>
                                <p className="text-gray-300 text-sm mb-2">If your messages don't show up immediately:</p>
                                <ul className="text-gray-300 text-sm space-y-1 ml-4">
                                    <li>• Check your internet connection</li>
                                    <li>• Refresh the page and try again</li>
                                    <li>• Clear your browser cache</li>
                                    <li>• Contact support if the issue persists</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-white font-semibold mb-2">PII scrubbing not working</h4>
                                <p className="text-gray-300 text-sm mb-2">If personal information isn't being protected:</p>
                                <ul className="text-gray-300 text-sm space-y-1 ml-4">
                                    <li>• Ensure you're using the latest version</li>
                                    <li>• Check that the privacy protection is enabled</li>
                                    <li>• Report specific cases to support</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-white font-semibold mb-2">Session timer issues</h4>
                                <p className="text-gray-300 text-sm mb-2">If timers aren't working correctly:</p>
                                <ul className="text-gray-300 text-sm space-y-1 ml-4">
                                    <li>• Check if you're logged in properly</li>
                                    <li>• Verify your session is active</li>
                                    <li>• Try logging out and back in</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'api-reference',
            title: 'API Reference',
            icon: '📚',
            content: (
                <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                        <h3 className="text-xl font-semibold text-white mb-4">Authentication</h3>
                        <div className="bg-black/50 rounded-lg p-4 border border-gray-700/30">
                            <code className="text-green-400 text-sm">
                                POST /api/auth/login<br />
                                Content-Type: application/json<br /><br />
                                {`{`}<br />
                                &nbsp;&nbsp;"email": "user@example.com",<br />
                                &nbsp;&nbsp;"password": "your_password"<br />
                                {`}`}
                            </code>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                        <h3 className="text-xl font-semibold text-white mb-4">Chat Messages</h3>
                        <div className="bg-black/50 rounded-lg p-4 border border-gray-700/30">
                            <code className="text-green-400 text-sm">
                                POST /api/chat/process-message<br />
                                Authorization: Bearer {`{token}`}<br /><br />
                                {`{`}<br />
                                &nbsp;&nbsp;"session_id": "session_123",<br />
                                &nbsp;&nbsp;"message": "Hello, how are you?"<br />
                                {`}`}
                            </code>
                        </div>
                    </div>
                </div>
            )
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
            {/* Header */}
            <header className="bg-black/40 backdrop-blur-lg border-b border-gray-700/50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/')}
                                className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border border-slate-700/50 hover:scale-105 transition-all duration-300"
                            >
                                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-white">CareCompanion</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => router.push('/main')}
                                    className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 border border-slate-700/50"
                                >
                                    Dashboard
                                </button>
                            ) : (
                                <button
                                    onClick={() => router.push('/login')}
                                    className="px-6 py-3 text-white border border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300"
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 sticky top-6">
                            <h2 className="text-xl font-bold text-white mb-6">Documentation</h2>
                            <nav className="space-y-2">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full text-left p-3 rounded-lg transition-all duration-300 flex items-center space-x-3 ${activeSection === section.id
                                                ? 'bg-gray-700/50 text-white border border-gray-600/50'
                                                : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
                                            }`}
                                    >
                                        <span className="text-lg">{section.icon}</span>
                                        <span className="font-medium">{section.title}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50">
                            <div className="flex items-center space-x-3 mb-6">
                                <span className="text-2xl">
                                    {sections.find(s => s.id === activeSection)?.icon}
                                </span>
                                <h1 className="text-3xl font-bold text-white">
                                    {sections.find(s => s.id === activeSection)?.title}
                                </h1>
                            </div>

                            {sections.find(s => s.id === activeSection)?.content}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
