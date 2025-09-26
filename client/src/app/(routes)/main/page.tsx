"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function MainDashboard() {
    const { user, isAuthenticated, loading, logout } = useAuth();
    const { success } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (user?.user_type === 'admin') {
            router.push('/adminMain');
        }
    }, [user, router]);

    const handleLogout = async () => {
        try {
            await logout();
            success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-white">
                                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                    SecurityApp
                                </span>
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-white">
                                Welcome, <span className="font-semibold">{user?.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-white mb-4">User Dashboard</h2>
                    <p className="text-gray-300 text-lg">Welcome to your security dashboard</p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Security Status Card */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">🛡️</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white ml-4">Security Status</h3>
                        </div>
                        <p className="text-gray-300">Your account is secure and protected</p>
                        <div className="mt-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300">
                                Active
                            </span>
                        </div>
                    </div>

                    {/* Profile Card */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">👤</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white ml-4">Profile</h3>
                        </div>
                        <p className="text-gray-300">Manage your account settings</p>
                        <div className="mt-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300">
                                {user?.user_type}
                            </span>
                        </div>
                    </div>

                    {/* Activity Card */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">📊</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white ml-4">Activity</h3>
                        </div>
                        <p className="text-gray-300">View your recent activity</p>
                        <div className="mt-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300">
                                Recent
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-semibold text-white mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button className="p-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105">
                            Security Scan
                        </button>
                        <button className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105">
                            Update Profile
                        </button>
                        <button className="p-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg text-white font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105">
                            View Reports
                        </button>
                        <button className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105">
                            Settings
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
