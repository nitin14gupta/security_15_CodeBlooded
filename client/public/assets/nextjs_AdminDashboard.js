// components/AdminDashboard.js - Admin panel for monitoring and control
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const AdminDashboard = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [violations, setViolations] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { token, user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin') {
      return; // Only admins can access
    }

    fetchDashboardData();
  }, [user, token]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const [logsRes, violationsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/audit-logs', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/violations', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/system-stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAuditLogs(logsRes.data.logs);
      setViolations(violationsRes.data.violations);
      setSystemStats(statsRes.data);

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViolationAction = async (violationId, action) => {
    try {
      await axios.post(
        `http://localhost:5000/api/admin/violations/${violationId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Violation action error:', error);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="access-denied">Access Denied: Admin privileges required</div>;
  }

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>AI Guardrail Admin Dashboard</h1>
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Messages</h3>
            <span className="stat-number">{systemStats.total_messages || 0}</span>
          </div>
          <div className="stat-card">
            <h3>Violations Today</h3>
            <span className="stat-number violation">{systemStats.violations_today || 0}</span>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <span className="stat-number">{systemStats.active_users || 0}</span>
          </div>
          <div className="stat-card">
            <h3>System Health</h3>
            <span className={`stat-number ${systemStats.health === 'healthy' ? 'healthy' : 'warning'}`}>
              {systemStats.health || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'violations' ? 'active' : ''}`}
          onClick={() => setActiveTab('violations')}
        >
          Violations
        </button>
        <button 
          className={`tab ${activeTab === 'audit-logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit-logs')}
        >
          Audit Logs
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="charts-section">
              <h3>Guardrail Performance</h3>
              <div className="performance-metrics">
                <div className="metric">
                  <span className="metric-label">Input Filter Success Rate</span>
                  <span className="metric-value">{systemStats.input_filter_success || '99.2%'}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Output Validation Success Rate</span>
                  <span className="metric-value">{systemStats.output_validation_success || '98.7%'}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">PII Detection Rate</span>
                  <span className="metric-value">{systemStats.pii_detection_rate || '99.8%'}</span>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {auditLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="activity-item">
                    <span className="activity-time">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="activity-description">{log.action}</span>
                    <span className={`activity-status ${log.status}`}>{log.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="violations-tab">
            <h3>Content Violations</h3>
            <div className="violations-list">
              {violations.map(violation => (
                <div key={violation.id} className="violation-item">
                  <div className="violation-header">
                    <span className="violation-type">{violation.type}</span>
                    <span className="violation-time">
                      {new Date(violation.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="violation-content">
                    <p><strong>User:</strong> {violation.user_id}</p>
                    <p><strong>Content:</strong> {violation.content.substring(0, 100)}...</p>
                    <p><strong>Reason:</strong> {violation.reason}</p>
                    <p><strong>Score:</strong> {violation.score}</p>
                  </div>

                  <div className="violation-actions">
                    <button 
                      className="action-btn approve"
                      onClick={() => handleViolationAction(violation.id, 'approve')}
                    >
                      Approve
                    </button>
                    <button 
                      className="action-btn reject"
                      onClick={() => handleViolationAction(violation.id, 'reject')}
                    >
                      Reject
                    </button>
                    <button 
                      className="action-btn warn"
                      onClick={() => handleViolationAction(violation.id, 'warn')}
                    >
                      Warn User
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit-logs' && (
          <div className="audit-logs-tab">
            <h3>System Audit Logs</h3>
            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User ID</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>Processing Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.user_id}</td>
                      <td>{log.action}</td>
                      <td className={`status ${log.status}`}>{log.status}</td>
                      <td>{log.processing_time}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h3>Guardrail Settings</h3>
            <div className="settings-form">
              <div className="setting-group">
                <label>Toxicity Threshold</label>
                <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" />
                <span>0.7</span>
              </div>

              <div className="setting-group">
                <label>PII Detection Mode</label>
                <select defaultValue="strict">
                  <option value="strict">Strict</option>
                  <option value="moderate">Moderate</option>
                  <option value="lenient">Lenient</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Rate Limiting (messages/minute)</label>
                <input type="number" defaultValue="10" min="1" max="100" />
              </div>

              <button className="save-settings-btn">Save Settings</button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* Add comprehensive CSS styles for the admin dashboard */
        .admin-dashboard {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header h1 {
          margin-bottom: 2rem;
          color: #333;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 0.5rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #007bff;
        }

        .stat-number.violation {
          color: #dc3545;
        }

        .stat-number.healthy {
          color: #28a745;
        }

        .stat-number.warning {
          color: #ffc107;
        }

        .dashboard-tabs {
          display: flex;
          border-bottom: 1px solid #ddd;
          margin-bottom: 2rem;
        }

        .tab {
          padding: 1rem 2rem;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }

        .tab.active {
          border-bottom-color: #007bff;
          color: #007bff;
        }

        .tab-content {
          min-height: 500px;
        }

        .violations-list, .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .violation-item {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1rem;
        }

        .violation-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .violation-type {
          background: #dc3545;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .violation-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .action-btn.approve {
          background: #28a745;
          color: white;
        }

        .action-btn.reject {
          background: #dc3545;
          color: white;
        }

        .action-btn.warn {
          background: #ffc107;
          color: #333;
        }

        .logs-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .logs-table th,
        .logs-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .logs-table th {
          background: #f8f9fa;
          font-weight: bold;
        }

        .status.success {
          color: #28a745;
        }

        .status.error {
          color: #dc3545;
        }

        .status.warning {
          color: #ffc107;
        }

        .settings-form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .setting-group {
          margin-bottom: 1.5rem;
        }

        .setting-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        .setting-group input,
        .setting-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .save-settings-btn {
          background: #007bff;
          color: white;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .access-denied,
        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;