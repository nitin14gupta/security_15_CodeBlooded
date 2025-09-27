"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// Login page component
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { showError, showSuccess } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log('Login form submitted for:', email); // dug

        try {
            await login(email, password);
            showSuccess('Login successful', 'Welcome back!');
        } catch (err) {
            console.error('Login error:', err); // debg
            showError('Login failed', err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* New Professional Background */}
            <div className="absolute inset-0">
                {/* Main diagonal gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-orange-800/30 to-yellow-600/40"></div>

                {/* Abstract diagonal bands */}
                <div className="absolute top-0 right-0 w-2/3 h-full">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-red-900/40 via-red-700/30 to-orange-600/50 transform rotate-12 origin-top-right"></div>
                    <div className="absolute top-10 right-10 w-full h-full bg-gradient-to-br from-red-800/30 via-orange-600/40 to-yellow-500/50 transform rotate-12 origin-top-right"></div>
                    <div className="absolute top-20 right-20 w-full h-full bg-gradient-to-br from-red-700/20 via-orange-500/30 to-yellow-400/40 transform rotate-12 origin-top-right"></div>
                    <div className="absolute top-32 right-32 w-full h-full bg-gradient-to-br from-red-600/10 via-orange-400/20 to-yellow-300/30 transform rotate-12 origin-top-right"></div>
                </div>

                {/* Subtle overlay for depth */}
                <div className="absolute inset-0 bg-black/40"></div>

                {/* Floating elements */}
                <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-r from-orange-500/15 to-yellow-500/15 rounded-full opacity-25 animate-bounce"></div>
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-r from-red-400/20 to-orange-400/20 rounded-full opacity-30 animate-ping"></div>
            </div>

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-30 p-6 bg-black/20 backdrop-blur-xl border-b border-white/20">
                <nav className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl border border-emerald-400/30">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div className="text-3xl font-bold">
                            <span className="text-white tracking-tight">
                                CareCompanion
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/"
                            className="px-6 py-3 text-gray-300 border border-gray-600/50 rounded-xl hover:bg-gray-800/50 transition-all duration-300 backdrop-blur-sm cursor-pointer font-medium hover:scale-105 hover:shadow-lg hover:text-white"
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span>Back to Home</span>
                            </div>
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight">
                            Your Security, Our Priority
                        </h1>
                        <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                            We take the protection of your data and privacy seriously. This page is dedicated to keeping you informed about the steps we take to ensure a safe and secure experience while using our services.
                        </p>
                    </div>

                    {/* Right Content - Login Form */}
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-gray-300 text-lg">Sign in to your secure account</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-white mb-3">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                        placeholder="Enter your email address"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold text-white mb-3">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                        placeholder="Enter your password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl cursor-pointer hover:scale-[1.02] border border-emerald-500/30 hover:border-emerald-400/50"
                                >
                                    <div className="flex items-center justify-center space-x-3">
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                        )}
                                        <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                                    </div>
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-gray-300 text-sm">
                                    Don't have an account?{' '}
                                    <Link
                                        href="/onboarding"
                                        className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer hover:underline"
                                    >
                                        Create one here
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="absolute bottom-0 left-0 right-0 z-30 p-6 bg-black/30 backdrop-blur-xl border-t border-white/20">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="text-gray-300 mb-4 md:mb-0">
                            © 2024 SecurityApp. All rights reserved.
                        </div>
                        <div className="flex space-x-8 text-gray-300">
                            <button onClick={() => router.push('/privacy')} className="hover:text-white transition-colors font-medium hover:scale-105 cursor-pointer">Privacy</button>
                            <button onClick={() => router.push('/terms')} className="hover:text-white transition-colors font-medium hover:scale-105 cursor-pointer">Terms</button>
                            <button onClick={() => router.push('/support')} className="hover:text-white transition-colors font-medium hover:scale-105 cursor-pointer">Support</button>
                            <button onClick={() => router.push('/docs')} className="hover:text-white transition-colors font-medium hover:scale-105 cursor-pointer">Documentation</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}