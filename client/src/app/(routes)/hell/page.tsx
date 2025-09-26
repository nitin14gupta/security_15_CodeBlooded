"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute top-40 left-40 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10 w-full">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">
                                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                                        SecurityApp Admin
                                    </span>
                                </h1>
                                <p className="text-gray-400 text-sm">Advanced Security Management</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="text-white text-right">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">A</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Welcome, aaliyaan</p>
                                        <div className="flex items-center space-x-2">
                                            <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-xs font-bold shadow-lg">
                                                ADMIN
                                            </span>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        </div>
                        </div>
                        </div>
                    </div>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-3 text-white border border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Logout</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
                <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                        Admin Dashboard
                    </h2>
                    <p className="text-gray-300 text-xl">Manage your security platform with advanced analytics</p>
                    <div className="mt-4 flex justify-center">
                        <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <div className="text-right">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-300 text-sm font-medium mb-2">Total Users</p>
                            <p className="text-4xl font-bold text-white mb-2">{stats.totalUsers.toLocaleString()}</p>
                            <div className="flex items-center text-green-400 text-sm">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                                <span>+12% this month</span>
                            </div>
                        </div>
                    </div>

                    <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-right">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-300 text-sm font-medium mb-2">Active Users</p>
                            <p className="text-4xl font-bold text-white mb-2">{stats.activeUsers.toLocaleString()}</p>
                            <div className="flex items-center text-green-400 text-sm">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                                <span>+8% this week</span>
                            </div>
                        </div>
                    </div>

                    <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="text-right">
                                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-300 text-sm font-medium mb-2">Security Alerts</p>
                            <p className="text-4xl font-bold text-white mb-2">hello</p>
                            <div className="flex items-center text-red-400 text-sm">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                                <span>+3 new alerts</span>
                            </div>
                        </div>
                        </div>

                    <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="text-right">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-300 text-sm font-medium mb-2">System Health</p>
                            <p className="text-4xl font-bold text-white mb-2">{stats.systemHealth}</p>
                            <div className="flex items-center text-green-400 text-sm">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>All systems operational</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                    <button className="group bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <span className="font-semibold text-sm">Users</span>
                        </div>
                    </button>

                    <button className="group bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <span className="font-semibold text-sm">Analytics</span>
                        </div>
                    </button>

                    <button className="group bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <span className="font-semibold text-sm">Logs</span>
                        </div>
                    </button>

                    <button className="group bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="font-semibold text-sm">Settings</span>
                        </div>
                    </button>

                    <button className="group bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl p-6 text-white hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <span className="font-semibold text-sm">Backup</span>
                        </div>
                    </button>

                    <button className="group bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="font-semibold text-sm">Activity</span>
                        </div>
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* User Management Panel */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">User Management</h3>
                                        <p className="text-gray-300">Manage users and permissions</p>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors duration-200 text-sm font-medium">
                                        Export
                                    </button>
                                    <button className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors duration-200 text-sm font-medium">
                                        Add User
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-white">Active Users</h4>
                                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-2">{stats.activeUsers}</div>
                                    <div className="flex items-center text-green-400 text-sm">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                        </svg>
                                        <span>+12% this month</span>
                                    </div>
                                </div>
                                
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-white">Total Users</h4>
                                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-2">{stats.totalUsers}</div>
                                    <div className="flex items-center text-blue-400 text-sm">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                        </svg>
                                        <span>+8% this week</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Panel */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                                <p className="text-gray-300 text-sm">Live system updates</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold text-sm">New user registered</p>
                                    <p className="text-gray-300 text-xs">2 minutes ago</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold text-sm">System backup completed</p>
                                    <p className="text-gray-300 text-xs">1 hour ago</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold text-sm">Security alert detected</p>
                                    <p className="text-gray-300 text-xs">3 hours ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
