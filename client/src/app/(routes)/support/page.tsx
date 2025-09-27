'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function SupportPage() {
    const router = useRouter()
    const { isAuthenticated, user } = useAuth()
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
        priority: 'medium'
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 2000))

        setIsSubmitting(false)
        setIsSubmitted(true)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

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
                        {/* <div className="flex items-center space-x-4">
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
                        </div> */}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Support Information */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
                            <h2 className="text-2xl font-bold text-white mb-4">📞 Get Help</h2>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                        <span className="text-blue-400">📧</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">Email Support</h3>
                                        <p className="text-gray-300 text-sm">support@carecompanion.com</p>
                                        <p className="text-gray-400 text-xs">Response within 24 hours</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <span className="text-green-400">💬</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">Live Chat</h3>
                                        <p className="text-gray-300 text-sm">Available 9 AM - 6 PM EST</p>
                                        <p className="text-gray-400 text-xs">Monday to Friday</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                                        <span className="text-purple-400">📚</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">Documentation</h3>
                                        <p className="text-gray-300 text-sm">Comprehensive guides</p>
                                        <p className="text-gray-400 text-xs">Self-service help</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
                            <h2 className="text-2xl font-bold text-white mb-4">🚀 Quick Links</h2>
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/docs')}
                                    className="w-full text-left p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors text-white"
                                >
                                    📖 User Guide
                                </button>
                                <button
                                    onClick={() => router.push('/docs')}
                                    className="w-full text-left p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors text-white"
                                >
                                    🔧 Troubleshooting
                                </button>
                                <button
                                    onClick={() => router.push('/docs')}
                                    className="w-full text-left p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors text-white"
                                >
                                    🛡️ Privacy Settings
                                </button>
                                <button
                                    onClick={() => router.push('/docs')}
                                    className="w-full text-left p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors text-white"
                                >
                                    🤖 AI Features
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50">
                            <h1 className="text-3xl font-bold text-white mb-2">Contact Support</h1>
                            <p className="text-gray-300 mb-8">We're here to help! Send us a message and we'll get back to you as soon as possible.</p>

                            {isSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-green-400 text-2xl">✅</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                                    <p className="text-gray-300 mb-6">Thank you for contacting us. We'll get back to you within 24 hours.</p>
                                    <button
                                        onClick={() => setIsSubmitted(false)}
                                        className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 border border-slate-700/50"
                                    >
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-white font-semibold mb-2">Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Your name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-white font-semibold mb-2">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-white font-semibold mb-2">Subject</label>
                                        <input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="What can we help you with?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-white font-semibold mb-2">Priority</label>
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleInputChange}
                                            className="w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="low">Low - General question</option>
                                            <option value="medium">Medium - Need assistance</option>
                                            <option value="high">High - Urgent issue</option>
                                            <option value="critical">Critical - System down</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-white font-semibold mb-2">Message</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            required
                                            rows={6}
                                            className="w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            placeholder="Please describe your issue or question in detail..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Sending Message...</span>
                                            </div>
                                        ) : (
                                            'Send Message'
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
