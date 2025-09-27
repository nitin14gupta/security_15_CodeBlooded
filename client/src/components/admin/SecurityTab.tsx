"use client";

import { useEffect, useState } from 'react';
import { apiService } from '@/api/apiService';

interface SecurityAlert {
    id: string;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    user_id: string;
    resolved: boolean;
    created_at: string;
    resolved_at: string;
}

interface SecurityTabProps {
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

export default function SecurityTab({ onError, onSuccess }: SecurityTabProps) {
    const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
    const [loading, setLoading] = useState(false);
    const [alertFilters, setAlertFilters] = useState({
        severity: '',
        resolved: '',
        alertType: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    });

    useEffect(() => {
        loadSecurityAlerts(1);
    }, []);

    const loadSecurityAlerts = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await apiService.getSecurityAlerts(
                page,
                pagination.limit,
                alertFilters.severity || undefined,
                alertFilters.resolved ? alertFilters.resolved === 'true' : undefined,
                alertFilters.alertType || undefined
            );

            setSecurityAlerts(response.alerts);
            setPagination(prev => ({
                ...prev,
                page,
                total: response.total
            }));
        } catch (error) {
            console.error('Failed to load security alerts:', error);
            onError('Failed to load security alerts');
        } finally {
            setLoading(false);
        }
    };

    const resolveSecurityAlert = async (alertId: string, resolutionNotes: string) => {
        try {
            await apiService.resolveSecurityAlert(alertId, resolutionNotes);
            onSuccess('Security alert resolved successfully');
            loadSecurityAlerts(pagination.page);
        } catch (error) {
            console.error('Failed to resolve security alert:', error);
            onError('Failed to resolve security alert');
        }
    };

    const exportSecurityReport = async () => {
        try {
            const report = await apiService.exportSecurityReport();
            downloadCSV(report.alerts, 'security-report');
            onSuccess('Security report exported successfully');
        } catch (error) {
            console.error('Failed to export security report:', error);
            onError('Failed to export security report');
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
            {/* Security Filters */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">Security Alerts</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <select
                        value={alertFilters.severity}
                        onChange={(e) => setAlertFilters(prev => ({ ...prev, severity: e.target.value }))}
                        className="bg-black/40 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select
                        value={alertFilters.resolved}
                        onChange={(e) => setAlertFilters(prev => ({ ...prev, resolved: e.target.value }))}
                        className="bg-black/40 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        <option value="">All Status</option>
                        <option value="false">Unresolved</option>
                        <option value="true">Resolved</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Alert Type..."
                        value={alertFilters.alertType}
                        onChange={(e) => setAlertFilters(prev => ({ ...prev, alertType: e.target.value }))}
                        className="bg-black/40 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                    <button
                        onClick={() => loadSecurityAlerts(1)}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Search'}
                    </button>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={exportSecurityReport}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                        Export Security Report
                    </button>
                </div>
            </div>

            {/* Security Alerts Table */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-white">
                        <thead>
                            <tr className="border-b border-gray-700/50">
                                <th className="text-left py-3 px-4">Alert</th>
                                <th className="text-left py-3 px-4">Severity</th>
                                <th className="text-left py-3 px-4">Type</th>
                                <th className="text-left py-3 px-4">Status</th>
                                <th className="text-left py-3 px-4">Date</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {securityAlerts.map((alert) => (
                                <tr key={alert.id} className="border-b border-gray-700/30">
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium">{alert.title}</div>
                                            <div className="text-gray-400 text-sm">{alert.description}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${alert.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                                            alert.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                                alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                    'bg-green-500/20 text-green-300'
                                            }`}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{alert.alert_type}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${alert.resolved
                                            ? 'bg-green-500/20 text-green-300'
                                            : 'bg-red-500/20 text-red-300'
                                            }`}>
                                            {alert.resolved ? 'Resolved' : 'Unresolved'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        {new Date(alert.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4">
                                        {!alert.resolved && (
                                            <button
                                                onClick={() => resolveSecurityAlert(alert.id, 'Resolved by admin')}
                                                className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-xs hover:bg-green-500/30 transition-colors duration-200"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <div className="text-gray-400 text-sm">
                        Showing {securityAlerts.length} of {pagination.total} alerts
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => loadSecurityAlerts(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                            className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 text-white">
                            Page {pagination.page}
                        </span>
                        <button
                            onClick={() => loadSecurityAlerts(pagination.page + 1)}
                            disabled={securityAlerts.length < pagination.limit || loading}
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
