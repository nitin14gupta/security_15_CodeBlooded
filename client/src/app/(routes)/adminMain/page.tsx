"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import DashboardTab from '@/components/admin/DashboardTab';
import UsersTab from '@/components/admin/UsersTab';
import SecurityTab from '@/components/admin/SecurityTab';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import AuditTab from '@/components/admin/AuditTab';
import SystemTab from '@/components/admin/SystemTab';

// Admin dashboard component
export default function AdminDashboard() {
    const { user, isAuthenticated, loading, logout } = useAuth();
    const { showSuccess, showError } = useToast();
    const router = useRouter();

    // State management
    const [activeTab, setActiveTab] = useState('dashboard');

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
            showSuccess('Logged out successfully');
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
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex">
            {/* Sidebar */}
            <div className="w-64 bg-black/20 backdrop-blur-lg border-r border-white/10 flex-shrink-0 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                        <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium">
                            ADMIN
                        </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-300">
                        Welcome, {user?.name}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'users', label: 'Users', icon: '👥' },
                        { id: 'security', label: 'Security', icon: '🔒' },
                        { id: 'analytics', label: 'Analytics', icon: '📈' },
                        { id: 'audit', label: 'Audit Logs', icon: '📋' },
                        { id: 'system', label: 'System', icon: '⚙️' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-white/20 text-white'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Content */}
                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-full">
                        {/* Dashboard Tab */}
                        {activeTab === 'dashboard' && (
                            <DashboardTab onError={showError} />
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <UsersTab onError={showError} onSuccess={showSuccess} />
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <SecurityTab onError={showError} onSuccess={showSuccess} />
                        )}

                        {/* Analytics Tab */}
                        {activeTab === 'analytics' && (
                            <AnalyticsTab onError={showError} onSuccess={showSuccess} />
                        )}

                        {/* Audit Logs Tab */}
                        {activeTab === 'audit' && (
                            <AuditTab onError={showError} onSuccess={showSuccess} />
                        )}

                        {/* System Tab */}
                        {activeTab === 'system' && (
                            <SystemTab onError={showError} onSuccess={showSuccess} />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}