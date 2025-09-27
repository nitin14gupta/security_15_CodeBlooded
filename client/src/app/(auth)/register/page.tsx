"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useOnboarding } from '@/context/onboardingContext';

// Registration page component
export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { showError, showSuccess } = useToast();
    const { onboardingData, isOnboardingComplete } = useOnboarding();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Registration form submitted for:', email); // debug

        if (password !== confirmPassword) {
            console.log('Password mismatch detected'); // debug
            showError('Password mismatch', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            console.log('Password too short'); // for seeing
            showError('Password too short', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Include onboarding data if available
            const onboardingPayload = isOnboardingComplete() ? onboardingData : undefined;
            await register(name, email, password, isAdmin, onboardingPayload);
            showSuccess('Registration successful', 'Welcome to SecurityApp!');
        } catch (err) {
            console.error('Registration error:', err); // debg
            showError('Registration failed', err instanceof Error ? err.message : 'An error occurred');
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
            <main className="absolute inset-0 z-20 flex items-center justify-center p-4">
                <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-6 lg:space-y-8">
                        <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                            Create Your Account
                        </h1>
                        <p className="text-lg lg:text-xl text-gray-300 leading-relaxed">
                            Sign up to unlock powerful features tailored for you. It only takes a minute to get started. Build your profile and explore personalized experiences.                        </p>
                    </div>

                    {/* Right Content - Registration Form */}
                    <div className="w-full max-w-lg mx-auto lg:mx-0">
                        <div className="text-center mb-20">
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                        placeholder="Enter your email address"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                            placeholder="Enter your password"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                            placeholder="Confirm your password"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold rounded-lg hover:from-emerald-500 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl cursor-pointer hover:scale-[1.02] border border-emerald-500/30 hover:border-emerald-400/50"
                                >
                                    <div className="flex items-center justify-center space-x-2">
                                        {loading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                        )}
                                        <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                                    </div>
                                </button>
                            </form>

                            <div className="mt-6 text-center space-y-4">
                                <div>
                                    {isOnboardingComplete() ? (
                                        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                                            <div className="flex items-center justify-center space-x-2 text-emerald-400">
                                                <span className="text-sm">✅</span>
                                                <span className="font-semibold text-sm">Onboarding Complete!</span>
                                            </div>
                                            <p className="text-emerald-300 text-xs mt-1">
                                                Your answers will personalize your experience
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => router.push('/onboarding')}
                                                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 shadow-xl cursor-pointer hover:scale-[1.02] border border-purple-500/30 hover:border-purple-400/50"
                                            >
                                                <div className="flex items-center justify-center space-x-2">
                                                    <span className="text-sm">✨</span>
                                                    <span className="text-sm">Start with Fun Questions</span>
                                                </div>
                                            </button>
                                            <p className="text-gray-400 text-xs mt-1">
                                                Answer a few fun questions to personalize your experience
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="border-t border-gray-600 pt-3">
                                    <p className="text-gray-300 text-xs">
                                        Already have an account?{' '}
                                        <Link
                                            href="/login"
                                            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer hover:underline"
                                        >
                                            Sign in here
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}