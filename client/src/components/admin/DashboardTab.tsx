"use client";

import { useEffect, useState } from 'react';
import { apiService } from '@/api/apiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdminAnalytics {
    total_users: number;
    active_users: number;
    admin_users: number;
    new_users_24h: number;
    new_users_7d: number;
    total_sessions: number;
    new_sessions_24h: number;
    total_messages: number;
    new_messages_24h: number;
    unresolved_alerts: number;
    critical_alerts: number;
    pii_detections: number;
    toxic_messages: number;
    active_sessions: number;
    avg_session_duration: number;
    total_summaries: number;
}

interface SystemHealth {
    health_checks: any[];
    metrics: any[];
    active_sessions: number;
    timestamp: string;
}

interface DashboardTabProps {
    onError: (message: string) => void;
}

export default function DashboardTab({ onError }: DashboardTabProps) {
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [chartData, setChartData] = useState<any>(null);
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [analyticsData, chartsData, healthData] = await Promise.all([
                apiService.getAdminDashboardAnalytics(),
                apiService.getAdminDashboardCharts(),
                apiService.getSystemHealth()
            ]);

            setAnalytics(analyticsData.analytics);
            setChartData(chartsData);
            setSystemHealth(healthData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            onError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-white text-xl">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-full">
            {/* Analytics Overview */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">👥</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-gray-300 text-sm">Total Users</p>
                                <p className="text-2xl font-bold text-white">{analytics.total_users}</p>
                                <p className="text-green-400 text-xs">+{analytics.new_users_24h} today</p>
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
                                <p className="text-2xl font-bold text-white">{analytics.active_users}</p>
                                <p className="text-blue-400 text-xs">{analytics.total_sessions} sessions</p>
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
                                <p className="text-2xl font-bold text-white">{analytics.unresolved_alerts}</p>
                                <p className="text-red-400 text-xs">{analytics.critical_alerts} critical</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">📊</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-gray-300 text-sm">Messages</p>
                                <p className="text-2xl font-bold text-white">{analytics.total_messages}</p>
                                <p className="text-purple-400 text-xs">+{analytics.new_messages_24h} today</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts */}
            {chartData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-semibold text-white mb-4">User Registrations (30 days)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData.user_registrations}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-semibold text-white mb-4">Security Alerts by Severity</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Critical', value: analytics?.critical_alerts || 0, color: '#EF4444' },
                                            { name: 'High', value: 5, color: '#F97316' },
                                            { name: 'Medium', value: 8, color: '#EAB308' },
                                            { name: 'Low', value: 12, color: '#22C55E' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Critical', value: analytics?.critical_alerts || 0, color: '#EF4444' },
                                            { name: 'High', value: 5, color: '#F97316' },
                                            { name: 'Medium', value: 8, color: '#EAB308' },
                                            { name: 'Low', value: 12, color: '#22C55E' }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* System Health */}
            {systemHealth && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold text-white mb-4">System Health</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{systemHealth.active_sessions}</div>
                            <div className="text-gray-300 text-sm">Active Sessions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">
                                {systemHealth.health_checks.length > 0 ? 'Healthy' : 'Unknown'}
                            </div>
                            <div className="text-gray-300 text-sm">System Status</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">
                                {new Date(systemHealth.timestamp).toLocaleTimeString()}
                            </div>
                            <div className="text-gray-300 text-sm">Last Updated</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
