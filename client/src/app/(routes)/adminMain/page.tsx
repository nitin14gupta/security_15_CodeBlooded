"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// Types for our admin panel
interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    blockedMessages: number;
    toxicContentAttempts: number;
    piiDetections: number;
    systemHealth: string;
    lastUpdated: string;
}

interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    violationType: string;
    timestamp: string;
    details: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'moderator' | 'user';
    status: 'active' | 'banned' | 'suspended';
    violationCount: number;
    lastActivity: string;
    createdAt: string;
}

interface GuardrailConfig {
    toxicityThreshold: number;
    piiThreshold: number;
    rateLimitPerMinute: number;
    autoBanThreshold: number;
    enableRealTimeMonitoring: boolean;
    enableAuditLogging: boolean;
}

// Admin dashboard component
export default function AdminDashboard() {
    const { user, isAuthenticated, loading, logout } = useAuth();
    const { showSuccess, showError } = useToast();
    const router = useRouter();

    // State management
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        activeUsers: 0,
        blockedMessages: 0,
        toxicContentAttempts: 0,
        piiDetections: 0,
        systemHealth: 'Good',
        lastUpdated: new Date().toISOString()
    });

    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [guardrailConfig, setGuardrailConfig] = useState<GuardrailConfig>({
        toxicityThreshold: 0.7,
        piiThreshold: 0.8,
        rateLimitPerMinute: 10,
        autoBanThreshold: 5,
        enableRealTimeMonitoring: true,
        enableAuditLogging: true
    });

    // Filter states
    const [auditFilters, setAuditFilters] = useState({
        user: '',
        dateFrom: '',
        dateTo: '',
        violationType: '',
        severity: ''
    });

    const [userFilters, setUserFilters] = useState({
        search: '',
        role: '',
        status: ''
    });

    // Load mock data on component mount
    useEffect(() => {
        loadMockData();
        const interval = setInterval(updateStats, 30000); // Update stats every 30 seconds
        return () => clearInterval(interval);
    }, []);

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

    // Mock data loading functions
    const loadMockData = () => {
        // Mock stats
        setStats({
            totalUsers: 1247,
            activeUsers: 892,
            blockedMessages: 156,
            toxicContentAttempts: 89,
            piiDetections: 23,
            systemHealth: 'Good',
            lastUpdated: new Date().toISOString()
        });

        // Mock audit logs
        setAuditLogs([
            {
                id: '1',
                userId: 'user123',
                userName: 'John Doe',
                action: 'Message Blocked',
                violationType: 'Toxicity',
                timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                details: 'Message contained toxic language',
                severity: 'high'
            },
            {
                id: '2',
                userId: 'user456',
                userName: 'Jane Smith',
                action: 'PII Detected',
                violationType: 'PII',
                timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                details: 'Credit card number detected in message',
                severity: 'critical'
            },
            {
                id: '3',
                userId: 'user789',
                userName: 'Bob Wilson',
                action: 'Rate Limit Exceeded',
                violationType: 'Rate Limiting',
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                details: 'User exceeded 10 messages per minute',
                severity: 'medium'
            }
        ]);

        // Mock users
        setUsers([
            {
                id: 'user123',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'user',
                status: 'active',
                violationCount: 2,
                lastActivity: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
            },
            {
                id: 'user456',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'moderator',
                status: 'active',
                violationCount: 0,
                lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString()
            },
            {
                id: 'user789',
                name: 'Bob Wilson',
                email: 'bob@example.com',
                role: 'user',
                status: 'banned',
                violationCount: 8,
                lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
            }
        ]);
    };

    const updateStats = () => {
        setStats(prev => ({
            ...prev,
            blockedMessages: prev.blockedMessages + Math.floor(Math.random() * 3),
            toxicContentAttempts: prev.toxicContentAttempts + Math.floor(Math.random() * 2),
            piiDetections: prev.piiDetections + Math.floor(Math.random() * 1),
            lastUpdated: new Date().toISOString()
        }));
    };

    const handleLogout = async () => {
        try {
            await logout();
            showSuccess('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // User management functions
    const banUser = (userId: string) => {
        setUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, status: 'banned' as const } : user
        ));
        showSuccess('User banned successfully');
    };

    const unbanUser = (userId: string) => {
        setUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, status: 'active' as const } : user
        ));
        showSuccess('User unbanned successfully');
    };

    const updateUserRole = (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
        setUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
        ));
        showSuccess('User role updated successfully');
    };

    // Export functions
    const exportAuditLogs = () => {
        const csvContent = [
            ['ID', 'User', 'Action', 'Violation Type', 'Timestamp', 'Severity', 'Details'],
            ...auditLogs.map(log => [
                log.id,
                log.userName,
                log.action,
                log.violationType,
                new Date(log.timestamp).toLocaleString(),
                log.severity,
                log.details
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showSuccess('Audit logs exported successfully');
    };

    const exportUserReport = () => {
        const csvContent = [
            ['ID', 'Name', 'Email', 'Role', 'Status', 'Violations', 'Last Activity', 'Created'],
            ...users.map(user => [
                user.id,
                user.name,
                user.email,
                user.role,
                user.status,
                user.violationCount.toString(),
                new Date(user.lastActivity).toLocaleString(),
                new Date(user.createdAt).toLocaleString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showSuccess('User report exported successfully');
    };

    // Filter functions
    const filteredAuditLogs = auditLogs.filter(log => {
        return (
            (!auditFilters.user || log.userName.toLowerCase().includes(auditFilters.user.toLowerCase())) &&
            (!auditFilters.violationType || log.violationType === auditFilters.violationType) &&
            (!auditFilters.severity || log.severity === auditFilters.severity) &&
            (!auditFilters.dateFrom || new Date(log.timestamp) >= new Date(auditFilters.dateFrom)) &&
            (!auditFilters.dateTo || new Date(log.timestamp) <= new Date(auditFilters.dateTo))
        );
    });

    const filteredUsers = users.filter(user => {
        return (
            (!userFilters.search ||
                user.name.toLowerCase().includes(userFilters.search.toLowerCase()) ||
                user.email.toLowerCase().includes(userFilters.search.toLowerCase())) &&
            (!userFilters.role || user.role === userFilters.role) &&
            (!userFilters.status || user.status === userFilters.status)
        );
    });

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
            <header className=" backdrop-blur-lg">
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
                            {/* TODO: implement these features */}
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
                            {/* TODO: add more system features */}
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
