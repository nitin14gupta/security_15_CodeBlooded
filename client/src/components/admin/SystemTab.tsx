"use client";

import { useEffect, useState } from 'react';
import { apiService } from '@/api/apiService';

interface SystemHealth {
    health_checks: any[];
    metrics: any[];
    active_sessions: number;
    timestamp: string;
}

interface SystemTabProps {
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

export default function SystemTab({ onError, onSuccess }: SystemTabProps) {
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSystemHealth();
        const interval = setInterval(loadSystemHealth, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadSystemHealth = async () => {
        try {
            setLoading(true);
            const healthData = await apiService.getSystemHealth();
            setSystemHealth(healthData);
        } catch (error) {
            console.error('Failed to load system health:', error);
            onError('Failed to load system health');
        } finally {
            setLoading(false);
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

    const exportActivityReport = async () => {
        try {
            const report = await apiService.exportActivityReport();
            downloadCSV(report.activities, 'activity-report');
            onSuccess('Activity report exported successfully');
        } catch (error) {
            console.error('Failed to export activity report:', error);
            onError('Failed to export activity report');
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

    const recordSystemMetric = async (metricName: string, metricValue: number) => {
        try {
            await apiService.recordSystemMetric(metricName, metricValue, 'count', { timestamp: new Date().toISOString() });
            onSuccess(`Metric ${metricName} recorded successfully`);
        } catch (error) {
            console.error('Failed to record metric:', error);
            onError('Failed to record metric');
        }
    };

    return (
        <div className="space-y-6 max-w-full">
            {/* System Health Overview */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">System Health</h3>
                    <button
                        onClick={loadSystemHealth}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {systemHealth && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-400">{systemHealth.active_sessions}</div>
                            <div className="text-gray-300">Active Sessions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400">
                                {systemHealth.health_checks.length > 0 ? 'Healthy' : 'Unknown'}
                            </div>
                            <div className="text-gray-300">System Status</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-400">
                                {systemHealth.metrics.length}
                            </div>
                            <div className="text-gray-300">Metrics Recorded</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Health Checks */}
            {systemHealth && systemHealth.health_checks.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold text-white mb-4">Recent Health Checks</h3>
                    <div className="space-y-2">
                        {systemHealth.health_checks.slice(0, 5).map((check, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${check.check_status === 'healthy' ? 'bg-green-500' :
                                        check.check_status === 'warning' ? 'bg-yellow-500' :
                                            check.check_status === 'critical' ? 'bg-red-500' :
                                                'bg-gray-500'
                                        }`}></div>
                                    <div>
                                        <div className="text-white font-medium">{check.check_name}</div>
                                        <div className="text-gray-400 text-sm">{check.check_message}</div>
                                    </div>
                                </div>
                                <div className="text-gray-400 text-sm">
                                    {new Date(check.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* System Metrics */}
            {systemHealth && systemHealth.metrics.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold text-white mb-4">System Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {systemHealth.metrics.slice(0, 6).map((metric, index) => (
                            <div key={index} className="bg-white/5 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-white font-medium">{metric.metric_name}</div>
                                        <div className="text-gray-400 text-sm">{metric.metric_unit}</div>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-400">
                                        {metric.metric_value}
                                    </div>
                                </div>
                                <div className="text-gray-400 text-xs mt-2">
                                    {new Date(metric.timestamp).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Export Reports */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">Export Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={exportUsersReport}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                        <span>👥</span>
                        <span>Export Users Report</span>
                    </button>
                    <button
                        onClick={exportSecurityReport}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                        <span>🔒</span>
                        <span>Export Security Report</span>
                    </button>
                    <button
                        onClick={exportActivityReport}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                        <span>📊</span>
                        <span>Export Activity Report</span>
                    </button>
                </div>
            </div>

            {/* System Actions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">System Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => recordSystemMetric('manual_check', 1)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                        <span>🔍</span>
                        <span>Record Manual Check</span>
                    </button>
                    <button
                        onClick={() => recordSystemMetric('admin_action', 1)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                        <span>⚙️</span>
                        <span>Record Admin Action</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
