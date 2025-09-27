'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function TermsPage() {
    const router = useRouter()
    const { isAuthenticated } = useAuth()

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
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50">
                    <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

                    <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 text-lg mb-6">
                            Welcome to CareCompanion. These Terms of Service govern your use of our AI-powered mental health companion platform.
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">🤖 AI Companion Service</h2>
                            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                <p className="text-gray-300 mb-4">
                                    CareCompanion provides an AI-powered mental health companion that offers:
                                </p>
                                <ul className="text-gray-300 space-y-2 ml-4">
                                    <li>• Emotional support and conversation</li>
                                    <li>• Mood analysis and tracking</li>
                                    <li>• Privacy-protected chat sessions</li>
                                    <li>• Wellbeing nudges and break reminders</li>
                                    <li>• Educational content and guidance</li>
                                </ul>
                                <p className="text-gray-300 mt-4">
                                    <strong className="text-white">Important:</strong> CareCompanion is not a replacement for professional mental health care. Always consult qualified healthcare professionals for medical advice.
                                </p>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">📋 User Responsibilities</h2>
                            <div className="space-y-4">
                                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                    <h3 className="text-xl font-semibold text-white mb-3">✅ Acceptable Use</h3>
                                    <ul className="text-gray-300 space-y-2">
                                        <li>• Use the service for legitimate mental health support</li>
                                        <li>• Provide accurate information when creating your account</li>
                                        <li>• Respect the AI companion and other users</li>
                                        <li>• Report any technical issues or concerns</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                    <h3 className="text-xl font-semibold text-white mb-3">❌ Prohibited Activities</h3>
                                    <ul className="text-gray-300 space-y-2">
                                        <li>• Attempting to hack or compromise the system</li>
                                        <li>• Sharing inappropriate or harmful content</li>
                                        <li>• Using the service for illegal activities</li>
                                        <li>• Impersonating others or providing false information</li>
                                        <li>• Attempting to reverse engineer our AI models</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">🛡️ Privacy & Data Protection</h2>
                            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                <p className="text-gray-300 mb-4">
                                    <strong className="text-white">Automatic PII Protection:</strong> We automatically detect and scrub personal identifiable information from your conversations to protect your privacy.
                                </p>
                                <ul className="text-gray-300 space-y-2 ml-4">
                                    <li>• Your sensitive data is never stored in our database</li>
                                    <li>• Only scrubbed versions are saved for conversation continuity</li>
                                    <li>• We comply with GDPR, CCPA, and other privacy regulations</li>
                                    <li>• You can export or delete your data at any time</li>
                                </ul>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">⚖️ Limitation of Liability</h2>
                            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                <p className="text-gray-300 mb-4">
                                    <strong className="text-white">Important Disclaimer:</strong>
                                </p>
                                <ul className="text-gray-300 space-y-2 ml-4">
                                    <li>• CareCompanion is not a licensed healthcare provider</li>
                                    <li>• Our AI companion provides general support, not medical advice</li>
                                    <li>• We are not liable for decisions made based on AI responses</li>
                                    <li>• Users are responsible for seeking professional help when needed</li>
                                    <li>• We do not guarantee the accuracy of AI responses</li>
                                </ul>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">🔄 Service Availability</h2>
                            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                <ul className="text-gray-300 space-y-2">
                                    <li>• We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
                                    <li>• Scheduled maintenance will be announced in advance</li>
                                    <li>• We may temporarily suspend service for security or technical reasons</li>
                                    <li>• Users will be notified of any significant service changes</li>
                                </ul>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">📞 Support & Contact</h2>
                            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                <p className="text-gray-300 mb-4">
                                    For questions about these Terms of Service or our platform:
                                </p>
                                <div className="space-y-2 text-gray-300">
                                    <p><strong className="text-white">General Support:</strong> support@carecompanion.com</p>
                                    <p><strong className="text-white">Technical Issues:</strong> tech@carecompanion.com</p>
                                    <p><strong className="text-white">Legal Questions:</strong> legal@carecompanion.com</p>
                                </div>
                            </div>
                        </section>

                        <div className="text-gray-400 text-sm mt-8 pt-6 border-t border-gray-700/30">
                            <p>Last updated: {new Date().toLocaleDateString()}</p>
                            <p>By using CareCompanion, you agree to these Terms of Service.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
