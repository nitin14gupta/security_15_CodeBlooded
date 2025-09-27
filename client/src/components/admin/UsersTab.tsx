"use client";

import { useEffect, useState } from 'react';
import { apiService } from '@/api/apiService';

interface User {
    id: string;
    name: string;
    email: string;
    user_type: string;
    is_active: boolean;
    created_at: string;
    total_sessions: number;
    total_messages: number;
    total_activities: number;
    last_activity: string;
    pii_violations: number;
    toxicity_violations: number;
}

interface UsersTabProps {
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

export default function UsersTab({ onError, onSuccess }: UsersTabProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [userFilters, setUserFilters] = useState({
        search: '',
        userType: '',
        status: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    });

    useEffect(() => {
        loadUsers(1);
    }, []);

    const loadUsers = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await apiService.getAdminUsers(
                page,
                pagination.limit,
                userFilters.userType || undefined,
                userFilters.search || undefined
            );

            setUsers(response.users);
            setPagination(prev => ({
                ...prev,
                page,
                total: response.total
            }));
        } catch (error) {
            console.error('Failed to load users:', error);
            onError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId: string, isActive: boolean) => {
        try {
            await apiService.toggleUserStatus(userId, isActive);
            onSuccess(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
            loadUsers(pagination.page);
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            onError('Failed to update user status');
        }
    };

    const banUser = async (userId: string, reason: string) => {
        try {
            await apiService.banUser(userId, reason);
            onSuccess('User banned successfully');
            loadUsers(pagination.page);
        } catch (error) {
            console.error('Failed to ban user:', error);
            onError('Failed to ban user');
        }
    };

    const exportUsersReport = async () => {
        try {
            const report = await apiService.exportUsersReport();
            downloadCSV(report.users, 'users-report');
            onSuccess('Users report exported successfully');
        } catch (error) {
            console.error('Failed to export users report:', error);
            onError('Failed to export users report');
        }
    };

    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers,
            ...data.map(row => headers.map(header => row[header] || ''))
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 max-w-full">
            {/* User Filters */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">User Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={userFilters.search}
                        onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="bg-black/40 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                    <select
                        value={userFilters.userType}
                        onChange={(e) => setUserFilters(prev => ({ ...prev, userType: e.target.value }))}
                        className="bg-black/40 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        <option value="">All Types</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>
                    <button
                        onClick={() => loadUsers(1)}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Search'}
                    </button>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={exportUsersReport}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                        Export Report
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-white">
                        <thead>
                            <tr className="border-b border-gray-700/50">
                                <th className="text-left py-3 px-4">User</th>
                                <th className="text-left py-3 px-4">Type</th>
                                <th className="text-left py-3 px-4">Status</th>
                                <th className="text-left py-3 px-4">Sessions</th>
                                <th className="text-left py-3 px-4">Messages</th>
                                <th className="text-left py-3 px-4">Violations</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-700/30">
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-gray-400 text-sm">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.user_type === 'admin'
                                            ? 'bg-red-500/20 text-red-300'
                                            : 'bg-blue-500/20 text-blue-300'
                                            }`}>
                                            {user.user_type}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.is_active
                                            ? 'bg-green-500/20 text-green-300'
                                            : 'bg-red-500/20 text-red-300'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{user.total_sessions}</td>
                                    <td className="py-3 px-4">{user.total_messages}</td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm">
                                            <div>PII: {user.pii_violations}</div>
                                            <div>Toxicity: {user.toxicity_violations}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => toggleUserStatus(user.id, !user.is_active)}
                                                className={`px-3 py-1 rounded text-xs transition-colors duration-200 ${user.is_active
                                                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                                    : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                                    }`}
                                            >
                                                {user.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            {user.user_type !== 'admin' && (
                                                <button
                                                    onClick={() => banUser(user.id, 'Admin action')}
                                                    className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30 transition-colors duration-200"
                                                >
                                                    Ban
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <div className="text-gray-400 text-sm">
                        Showing {users.length} of {pagination.total} users
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => loadUsers(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                            className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 text-white">
                            Page {pagination.page}
                        </span>
                        <button
                            onClick={() => loadUsers(pagination.page + 1)}
                            disabled={users.length < pagination.limit || loading}
                            className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
