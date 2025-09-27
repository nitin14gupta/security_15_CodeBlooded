'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function PrivacyPage() {
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

                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50">
                    <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

                    <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 text-lg mb-6">
                            At CareCompanion, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">🛡️ Data Protection & PII Scrubbing</h2>
                            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                <p className="text-gray-300 mb-4">
                                    <strong className="text-white">Automatic PII Protection:</strong> We automatically detect and scrub personal identifiable information (PII) from your messages, including:
                                </p>
                                <ul className="text-gray-300 space-y-2 ml-4">
                                    <li>• Email addresses (john@example.com → [EMAIL_REDACTED])</li>
                                    <li>• Phone numbers (+91 7977876609 → [PHONE_REDACTED])</li>
                                    <li>• Social Security Numbers (123-45-6789 → [SSN_REDACTED])</li>
                                    <li>• Credit card numbers (4532-1234-5678-9012 → [CARD_REDACTED])</li>
                                    <li>• Home addresses (123 Main St → [LOCATION_REDACTED])</li>
                                    <li>• IP addresses (192.168.1.1 → [IP_REDACTED])</li>
                                </ul>
                                <p className="text-gray-300 mt-4">
                                    <strong className="text-white">Your sensitive data is never stored in our database.</strong> Only scrubbed versions are saved for conversation continuity.
                                </p>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">📊 Information We Collect</h2>
                            <div className="space-y-4">
                                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                    <h3 className="text-xl font-semibold text-white mb-3">Account Information</h3>
                                    <ul className="text-gray-300 space-y-2">
                                        <li>• Name and email address (for account creation)</li>
                                        <li>• User preferences and settings</li>
                                        <li>• Session data and usage patterns</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                    <h3 className="text-xl font-semibold text-white mb-3">Conversation Data</h3>
                                    <ul className="text-gray-300 space-y-2">
                                        <li>• Chat messages (with PII automatically scrubbed)</li>
                                        <li>• Mood analysis and emotional intelligence data</li>
                                        <li>• Conversation context for better responses</li>
                                        <li>• Session timers and usage analytics</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">🔒 How We Protect Your Data</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                    <h3 className="text-xl font-semibold text-white mb-3">🛡️ Enterprise-Grade Security</h3>
                                    <ul className="text-gray-300 space-y-2">
                                        <li>• End-to-end encryption</li>
                                        <li>• Secure database storage</li>
                                        <li>• Regular security audits</li>
                                        <li>• GDPR and CCPA compliance</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                    <h3 className="text-xl font-semibold text-white mb-3">🔐 Privacy Controls</h3>
                                    <ul className="text-gray-300 space-y-2">
                                        <li>• Automatic PII scrubbing</li>
                                        <li>• Data retention policies</li>
                                        <li>• User data export options</li>
                                        <li>• Account deletion capabilities</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">📱 Your Rights</h2>
                            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                <ul className="text-gray-300 space-y-3">
                                    <li><strong className="text-white">Right to Access:</strong> View all your data at any time</li>
                                    <li><strong className="text-white">Right to Rectification:</strong> Correct any inaccurate information</li>
                                    <li><strong className="text-white">Right to Erasure:</strong> Delete your account and all associated data</li>
                                    <li><strong className="text-white">Right to Portability:</strong> Export your data in a readable format</li>
                                    <li><strong className="text-white">Right to Object:</strong> Opt-out of certain data processing</li>
                                </ul>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-white mb-4">📞 Contact Us</h2>
                            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                                <p className="text-gray-300 mb-4">
                                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                                </p>
                                <div className="space-y-2 text-gray-300">
                                    <p><strong className="text-white">Email:</strong> privacy@carecompanion.com</p>
                                    <p><strong className="text-white">Support:</strong> support@carecompanion.com</p>
                                    <p><strong className="text-white">Data Protection Officer:</strong> dpo@carecompanion.com</p>
                                </div>
                            </div>
                        </section>

                        <div className="text-gray-400 text-sm mt-8 pt-6 border-t border-gray-700/30">
                            <p>Last updated: {new Date().toLocaleDateString()}</p>
                            <p>This Privacy Policy is effective immediately and applies to all users of CareCompanion.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
