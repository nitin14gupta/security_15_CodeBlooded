"use client";

import { useEffect, useState } from 'react';
import { apiService } from '@/api/apiService';

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    resource: string;
    details: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

interface AdminAction {
    id: string;
    admin_id: string;
    action_type: string;
    target_user_id: string;
    target_resource: string;
    action_description: string;
    ip_address: string;
    metadata: any;
    created_at: string;
}

interface AuditTabProps {
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

export default function AuditTab({ onError, onSuccess }: AuditTabProps) {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'logs' | 'actions'>('logs');
    const [logFilters, setLogFilters] = useState({
        action: '',
        userId: '',
        dateFrom: '',
        dateTo: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0
    });

    useEffect(() => {
        loadAuditLogs(1);
    }, []);

    const loadAuditLogs = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await apiService.getAuditLogs(
                page,
                pagination.limit,
                logFilters.action || undefined,
                logFilters.userId || undefined,
                logFilters.dateFrom || undefined,
                logFilters.dateTo || undefined
            );

            setAuditLogs(response.logs);
            setPagination(prev => ({
                ...prev,
                page,
                total: response.total
            }));
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            onError('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const loadAdminActions = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await apiService.getAdminActions(page, pagination.limit);

            setAdminActions(response.actions);
            setPagination(prev => ({
                ...prev,
                page,
                total: response.total
            }));
        } catch (error) {
            console.error('Failed to load admin actions:', error);
            onError('Failed to load admin actions');
        } finally {
            setLoading(false);
        }
    };

    const exportAuditReport = async () => {
        try {
            const report = await apiService.exportActivityReport();
            downloadCSV(report.activities, 'audit-report');
            onSuccess('Audit report exported successfully');
        } catch (error) {
            console.error('Failed to export audit report:', error);
            onError('Failed to export audit report');
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
            {/* Audit Filters */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Audit & Logging</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${activeTab === 'logs'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-gray-300 hover:text-white'
                                }`}
                        >
                            Audit Logs
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('actions');
                                loadAdminActions(1);
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${activeTab === 'actions'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-gray-300 hover:text-white'
                                }`}
                        >
                            Admin Actions
                        </button>
                    </div>
                </div>

                {activeTab === 'logs' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Action..."
                            value={logFilters.action}
                            onChange={(e) => setLogFilters(prev => ({ ...prev, action: e.target.value }))}
                            className="bg-black/40 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                        <input
                            type="text"
                            placeholder="User ID..."
                            value={logFilters.userId}
                            onChange={(e) => setLogFilters(prev => ({ ...prev, userId: e.target.value }))}
                            className="bg-black/40 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                        <input
                            type="date"
                            value={logFilters.dateFrom}
                            onChange={(e) => setLogFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            className="bg-black/40 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                        <button
                            onClick={() => loadAuditLogs(1)}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Search'}
                        </button>
                    </div>
                )}

                <div className="flex space-x-2">
                    <button
                        onClick={exportAuditReport}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                        Export Report
                    </button>
                </div>
            </div>

            {/* Audit Logs Table */}
            {activeTab === 'logs' && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-white">
                            <thead>
                                <tr className="border-b border-gray-700/50">
                                    <th className="text-left py-3 px-4">User ID</th>
                                    <th className="text-left py-3 px-4">Action</th>
                                    <th className="text-left py-3 px-4">Resource</th>
                                    <th className="text-left py-3 px-4">IP Address</th>
                                    <th className="text-left py-3 px-4">User Agent</th>
                                    <th className="text-left py-3 px-4">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-700/30">
                                        <td className="py-3 px-4 text-sm">{log.user_id.substring(0, 8)}...</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">{log.resource}</td>
                                        <td className="py-3 px-4 text-sm">{log.ip_address}</td>
                                        <td className="py-3 px-4 text-sm max-w-xs truncate">{log.user_agent}</td>
                                        <td className="py-3 px-4 text-sm">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4">
                        <div className="text-gray-400 text-sm">
                            Showing {auditLogs.length} of {pagination.total} logs
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => loadAuditLogs(pagination.page - 1)}
                                disabled={pagination.page <= 1 || loading}
                                className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-white">
                                Page {pagination.page}
                            </span>
                            <button
                                onClick={() => loadAuditLogs(pagination.page + 1)}
                                disabled={auditLogs.length < pagination.limit || loading}
                                className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Actions Table */}
            {activeTab === 'actions' && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-white">
                            <thead>
                                <tr className="border-b border-gray-700/50">
                                    <th className="text-left py-3 px-4">Admin ID</th>
                                    <th className="text-left py-3 px-4">Action Type</th>
                                    <th className="text-left py-3 px-4">Target User</th>
                                    <th className="text-left py-3 px-4">Description</th>
                                    <th className="text-left py-3 px-4">IP Address</th>
                                    <th className="text-left py-3 px-4">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adminActions.map((action) => (
                                    <tr key={action.id} className="border-b border-gray-700/30">
                                        <td className="py-3 px-4 text-sm">{action.admin_id.substring(0, 8)}...</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300">
                                                {action.action_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {action.target_user_id ? action.target_user_id.substring(0, 8) + '...' : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-sm max-w-xs truncate">{action.action_description}</td>
                                        <td className="py-3 px-4 text-sm">{action.ip_address}</td>
                                        <td className="py-3 px-4 text-sm">
                                            {new Date(action.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4">
                        <div className="text-gray-400 text-sm">
                            Showing {adminActions.length} of {pagination.total} actions
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => loadAdminActions(pagination.page - 1)}
                                disabled={pagination.page <= 1 || loading}
                                className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-white">
                                Page {pagination.page}
                            </span>
                            <button
                                onClick={() => loadAdminActions(pagination.page + 1)}
                                disabled={adminActions.length < pagination.limit || loading}
                                className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
