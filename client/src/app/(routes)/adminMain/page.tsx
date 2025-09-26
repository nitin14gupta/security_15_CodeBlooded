"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function AdminDashboard() {
    const { user, isAuthenticated, loading, logout } = useAuth();
    const { success } = useToast();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        securityAlerts: 0,
        systemHealth: 'Good'
    });

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (user?.user_type !== 'admin') {
            router.push('/main');
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

    if (!isAuthenticated || user?.user_type !== 'admin') {
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
                                    SecurityApp Admin
                                </span>
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-white">
                                Welcome, <span className="font-semibold">{user?.name}</span>
                                <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">ADMIN</span>
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
                    <h2 className="text-4xl font-bold text-white mb-4">Admin Dashboard</h2>
                    <p className="text-gray-300 text-lg">Manage your security platform</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">👥</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-gray-300 text-sm">Total Users</p>
                                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">✅</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-gray-300 text-sm">Active Users</p>
                                <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">⚠️</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-gray-300 text-sm">Security Alerts</p>
                                <p className="text-2xl font-bold text-white">{stats.securityAlerts}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">🔧</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-gray-300 text-sm">System Health</p>
                                <p className="text-2xl font-bold text-white">{stats.systemHealth}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* User Management */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                        <h3 className="text-2xl font-semibold text-white mb-6">User Management</h3>
                        <div className="space-y-4">
                            <button className="w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105">
                                View All Users
                            </button>
                            <button className="w-full p-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg text-white font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105">
                                Add New User
                            </button>
                            <button className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105">
                                User Analytics
                            </button>
                        </div>
                    </div>

                    {/* System Management */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                        <h3 className="text-2xl font-semibold text-white mb-6">System Management</h3>
                        <div className="space-y-4">
                            <button className="w-full p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105">
                                System Settings
                            </button>
                            <button className="w-full p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg text-white font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105">
                                Security Logs
                            </button>
                            <button className="w-full p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105">
                                Backup & Restore
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-semibold text-white mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-white font-medium">New user registered</p>
                                    <p className="text-gray-300 text-sm">2 minutes ago</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">ℹ</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-white font-medium">System backup completed</p>
                                    <p className="text-gray-300 text-sm">1 hour ago</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">⚠</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-white font-medium">Security alert detected</p>
                                    <p className="text-gray-300 text-sm">3 hours ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
