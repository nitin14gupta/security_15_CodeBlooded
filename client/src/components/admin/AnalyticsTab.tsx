"use client";

import { useEffect, useState } from 'react';
import { apiService } from '@/api/apiService';

interface MessageAnalytics {
    id: string;
    user_id: string;
    session_id: string;
    toxicity_score: number;
    pii_detected: boolean;
    pii_types: string[];
    sentiment_score: number;
    mood_detected: string;
    processing_time_ms: number;
    created_at: string;
}

interface AnalyticsTabProps {
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

export default function AnalyticsTab({ onError, onSuccess }: AnalyticsTabProps) {
    const [messageAnalytics, setMessageAnalytics] = useState<MessageAnalytics[]>([]);
    const [toxicityData, setToxicityData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0
    });

    useEffect(() => {
        loadMessageAnalytics(1);
        loadToxicityAnalytics();
    }, []);

    const loadMessageAnalytics = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await apiService.getMessageAnalytics(page, pagination.limit);

            setMessageAnalytics(response.analytics);
            setPagination(prev => ({
                ...prev,
                page,
                total: response.total
            }));
        } catch (error) {
            console.error('Failed to load message analytics:', error);
            onError('Failed to load message analytics');
        } finally {
            setLoading(false);
        }
    };

    const loadToxicityAnalytics = async () => {
        try {
            const response = await apiService.getToxicityAnalytics();
            setToxicityData(response);
        } catch (error) {
            console.error('Failed to load toxicity analytics:', error);
            onError('Failed to load toxicity analytics');
        }
    };

    const exportAnalyticsReport = async () => {
        try {
            const report = await apiService.exportActivityReport();
            downloadCSV(report.activities, 'analytics-report');
            onSuccess('Analytics report exported successfully');
        } catch (error) {
            console.error('Failed to export analytics report:', error);
            onError('Failed to export analytics report');
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
            {/* Analytics Overview */}
            {toxicityData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Toxicity Analysis</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-300">High Toxicity:</span>
                                <span className="text-red-400 font-bold">
                                    {toxicityData.toxicity_data?.filter((d: any) => d.toxicity_score > 0.7).length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Medium Toxicity:</span>
                                <span className="text-yellow-400 font-bold">
                                    {toxicityData.toxicity_data?.filter((d: any) => d.toxicity_score > 0.4 && d.toxicity_score <= 0.7).length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Low Toxicity:</span>
                                <span className="text-green-400 font-bold">
                                    {toxicityData.toxicity_data?.filter((d: any) => d.toxicity_score <= 0.4).length || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">PII Detection</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-300">PII Detected:</span>
                                <span className="text-red-400 font-bold">
                                    {toxicityData.pii_data?.length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Clean Messages:</span>
                                <span className="text-green-400 font-bold">
                                    {messageAnalytics.filter(m => !m.pii_detected).length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Sentiment Analysis</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-300">Positive:</span>
                                <span className="text-green-400 font-bold">
                                    {toxicityData.sentiment_data?.filter((d: any) => d.sentiment_score > 0.5).length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Negative:</span>
                                <span className="text-red-400 font-bold">
                                    {toxicityData.sentiment_data?.filter((d: any) => d.sentiment_score < 0.5).length || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Analytics Table */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Message Analytics</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => loadMessageAnalytics(1)}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                        <button
                            onClick={exportAnalyticsReport}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            Export Report
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-white">
                        <thead>
                            <tr className="border-b border-gray-700/50">
                                <th className="text-left py-3 px-4">User ID</th>
                                <th className="text-left py-3 px-4">Session ID</th>
                                <th className="text-left py-3 px-4">Toxicity</th>
                                <th className="text-left py-3 px-4">PII Detected</th>
                                <th className="text-left py-3 px-4">Sentiment</th>
                                <th className="text-left py-3 px-4">Mood</th>
                                <th className="text-left py-3 px-4">Processing Time</th>
                                <th className="text-left py-3 px-4">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messageAnalytics.map((analytics) => (
                                <tr key={analytics.id} className="border-b border-gray-700/30">
                                    <td className="py-3 px-4 text-sm">{analytics.user_id.substring(0, 8)}...</td>
                                    <td className="py-3 px-4 text-sm">{analytics.session_id.substring(0, 8)}...</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${analytics.toxicity_score > 0.7 ? 'bg-red-500/20 text-red-300' :
                                            analytics.toxicity_score > 0.4 ? 'bg-yellow-500/20 text-yellow-300' :
                                                'bg-green-500/20 text-green-300'
                                            }`}>
                                            {(analytics.toxicity_score * 100).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${analytics.pii_detected
                                            ? 'bg-red-500/20 text-red-300'
                                            : 'bg-green-500/20 text-green-300'
                                            }`}>
                                            {analytics.pii_detected ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${analytics.sentiment_score > 0.5 ? 'bg-green-500/20 text-green-300' :
                                            analytics.sentiment_score < 0.5 ? 'bg-red-500/20 text-red-300' :
                                                'bg-yellow-500/20 text-yellow-300'
                                            }`}>
                                            {(analytics.sentiment_score * 100).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">
                                            {analytics.mood_detected}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">{analytics.processing_time_ms}ms</td>
                                    <td className="py-3 px-4 text-sm">
                                        {new Date(analytics.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <div className="text-gray-400 text-sm">
                        Showing {messageAnalytics.length} of {pagination.total} analytics
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => loadMessageAnalytics(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                            className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 text-white">
                            Page {pagination.page}
                        </span>
                        <button
                            onClick={() => loadMessageAnalytics(pagination.page + 1)}
                            disabled={messageAnalytics.length < pagination.limit || loading}
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
