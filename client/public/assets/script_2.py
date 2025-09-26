# Create Next.js frontend code samples

# 1. Main Chat Interface Component
chat_interface_js = '''
// ChatInterface.js - Main chat component for AI Companion
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { user, token } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/chat/message',
        {
          message: inputMessage,
          conversation_id: conversationId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        processingTime: response.data.processing_time
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }

    } catch (err) {
      console.error('Chat error:', err);
      
      let errorMessage = 'Sorry, something went wrong.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        
        // Handle specific guardrail violations
        if (err.response.data.details) {
          errorMessage += ' Details: ' + err.response.data.details.join(', ');
        }
        
        if (err.response.data.suggestions) {
          errorMessage += ' Suggestions: ' + err.response.data.suggestions.join(', ');
        }
      }
      
      const errorMsg = {
        id: Date.now() + 1,
        text: errorMessage,
        sender: 'system',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMsg]);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>AI Companion</h2>
        <div className="chat-controls">
          <span className="user-info">Welcome, {user?.username}</span>
          <button onClick={clearChat} className="clear-btn">Clear Chat</button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-content">
              <span className="message-text">{message.text}</span>
              <span className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
                {message.processingTime && (
                  <span className="processing-time">
                    ({message.processingTime}s)
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message ai loading">
            <div className="message-content">
              <span className="typing-indicator">AI is thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="input-form">
        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            maxLength={1000}
            className="message-input"
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()}
            className="send-btn"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        <div className="input-info">
          <span className="char-count">{inputMessage.length}/1000</span>
          {error && <span className="error-text">⚠️ {error}</span>}
        </div>
      </form>

      <style jsx>{`
        .chat-interface {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8f9fa;
          border-bottom: 1px solid #ddd;
        }

        .chat-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info {
          font-size: 0.9rem;
          color: #666;
        }

        .clear-btn {
          padding: 0.5rem 1rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message {
          display: flex;
          max-width: 70%;
        }

        .message.user {
          align-self: flex-end;
        }

        .message.ai {
          align-self: flex-start;
        }

        .message.system {
          align-self: center;
          max-width: 90%;
        }

        .message-content {
          padding: 0.75rem;
          border-radius: 8px;
          position: relative;
        }

        .message.user .message-content {
          background: #007bff;
          color: white;
        }

        .message.ai .message-content {
          background: #e9ecef;
          color: #333;
        }

        .message.system .message-content {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .message.error .message-content {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .message-text {
          display: block;
          margin-bottom: 0.25rem;
        }

        .message-time {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .processing-time {
          font-style: italic;
          margin-left: 0.5rem;
        }

        .typing-indicator {
          font-style: italic;
          opacity: 0.8;
        }

        .input-form {
          padding: 1rem;
          border-top: 1px solid #ddd;
          background: white;
        }

        .input-container {
          display: flex;
          gap: 0.5rem;
        }

        .message-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .message-input:focus {
          outline: none;
          border-color: #007bff;
        }

        .send-btn {
          padding: 0.75rem 1.5rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .send-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .input-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
          font-size: 0.8rem;
        }

        .char-count {
          color: #666;
        }

        .error-text {
          color: #dc3545;
        }

        .loading .message-content {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
'''

# 2. Authentication Hook
auth_hook_js = '''
// hooks/useAuth.js - Authentication hook for Next.js
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user_data');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
      
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password
      });

      // Auto-login after successful registration
      const loginResult = await login(email, password);
      return loginResult;
      
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    // Remove from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
'''

# 3. Admin Dashboard Component
admin_dashboard_js = '''
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
'''

# 4. Package.json for Next.js
package_json = '''{
  "name": "ai-guardrail-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "axios": "^1.6.0",
    "styled-jsx": "^5.1.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.0.0",
    "typescript": "^5.0.0"
  }
}
'''

# Save Next.js code samples
nextjs_code_samples = {
    'ChatInterface.js': chat_interface_js,
    'useAuth.js': auth_hook_js,
    'AdminDashboard.js': admin_dashboard_js,
    'package.json': package_json
}

# Write Next.js code samples to files
for filename, code in nextjs_code_samples.items():
    with open(f'nextjs_{filename}', 'w') as f:
        f.write(code.strip())

print("Next.js Frontend Code Files Created:")
print("=" * 40)
for filename in nextjs_code_samples.keys():
    print(f"✓ nextjs_{filename}")

# Create a deployment guide
deployment_guide = '''# AI Guardrail System - Deployment Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (for production)
- Redis (for caching)

## Backend Deployment (Flask)

### 1. Environment Setup
```bash
cd backend/
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
```

### 2. Environment Variables
Create `.env` file:
```
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://user:password@localhost/ai_guardrail_db

# API Keys
PERSPECTIVE_API_KEY=your-perspective-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Security
BCRYPT_LOG_ROUNDS=12
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Guardrail Settings
TOXICITY_THRESHOLD=0.7
PII_DETECTION_MODE=strict
RATE_LIMIT_PER_MINUTE=10
```

### 3. Database Setup
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### 4. Run Backend
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Frontend Deployment (Next.js)

### 1. Environment Setup
```bash
cd frontend/
npm install
```

### 2. Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=AI Guardrail System
```

### 3. Build and Run
```bash
npm run build
npm start
```

## Production Deployment

### Using Docker

#### Backend Dockerfile
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ai_guardrail
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000/api
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=ai_guardrail
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
docker-compose up -d
```

## Security Checklist

✅ Set strong SECRET_KEY and JWT_SECRET_KEY
✅ Enable HTTPS in production
✅ Set proper CORS origins
✅ Use environment variables for all secrets
✅ Enable rate limiting
✅ Set up proper logging
✅ Configure database backups
✅ Set up monitoring and alerts
✅ Regular security updates

## Monitoring

### Health Check Endpoints
- Backend: `GET /api/health`
- Frontend: `GET /`

### Key Metrics to Monitor
- Response times
- Error rates
- Guardrail violation rates
- API rate limits
- Database performance
- Memory and CPU usage

## Scaling Considerations

1. **Horizontal Scaling**: Use load balancers for multiple backend instances
2. **Database**: Use read replicas for better performance
3. **Caching**: Implement Redis for session and response caching
4. **CDN**: Use CDN for frontend static assets
5. **API Rate Limiting**: Implement per-user and global rate limits
'''

with open('deployment_guide.md', 'w') as f:
    f.write(deployment_guide.strip())

print("✓ deployment_guide.md")
print(f"\nTotal Next.js files created: 5")
print("\nYou now have complete frontend code samples to integrate")
print("with your Flask backend for the AI Guardrail System!")