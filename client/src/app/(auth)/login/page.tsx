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
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-30 animate-bounce"></div>
                <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full opacity-25 animate-pulse"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="text-4xl font-bold text-white">
                        <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                            SecurityApp
                        </span>
                    </Link>
                    <h2 className="text-2xl font-semibold text-white mt-4">Welcome Back</h2>
                    <p className="text-gray-300 mt-2">Sign in to your account</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-300">
                            Don't have an account?{' '}
                            <Link
                                href="/register"
                                className="text-teal-400 hover:text-teal-300 font-medium transition-colors cursor-pointer"
                            >
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="text-center mt-6 cursor-pointer">
                    <Link
                        href="/"
                        className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
