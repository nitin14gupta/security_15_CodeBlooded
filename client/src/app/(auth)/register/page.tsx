"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { error, success } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            error('Password mismatch', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            error('Password too short', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register(name, email, password, isAdmin);
            success('Registration successful', 'Welcome to SecurityApp!');
        } catch (err) {
            error('Registration failed', err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-30 animate-bounce"></div>
                <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full opacity-25 animate-pulse"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="text-4xl font-bold text-white">
                        <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                            SecurityApp
                        </span>
                    </Link>
                    <h2 className="text-2xl font-semibold text-white mt-4">Create Account</h2>
                    <p className="text-gray-300 mt-2">Join our security platform</p>
                </div>

                {/* Register Form */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your password"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                                placeholder="Confirm your password"
                            />
                        </div>

                        {/* Admin Toggle */}
                        <div className="flex items-center space-x-3">
                            <input
                                id="isAdmin"
                                type="checkbox"
                                checked={isAdmin}
                                onChange={(e) => setIsAdmin(e.target.checked)}
                                className="w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500 focus:ring-2"
                            />
                            <label htmlFor="isAdmin" className="text-sm font-medium text-white">
                                Register as Admin
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-300">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link
                        href="/"
                        className="text-gray-300 hover:text-white transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}