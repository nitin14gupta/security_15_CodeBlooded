-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (user_type IN ('user', 'admin')),
    -- Onboarding fields
    morning_preference VARCHAR(50), -- tea, coffee, good_vibes
    day_color VARCHAR(50),
    mood_emoji VARCHAR(10),
    life_genre VARCHAR(20), -- comedy, drama, adventure
    weekly_goal TEXT,
    favorite_app VARCHAR(100),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create user_sessions table for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create audit_logs table for tracking user activities
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create security_alerts table for admin dashboard
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create index for security alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at);

-- Create chat_sessions table for managing chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for chat sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_active ON chat_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);

-- Create chat_messages table for storing chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'ai')),
    content TEXT NOT NULL,
    mood VARCHAR(20) DEFAULT 'neutral' CHECK (mood IN ('neutral', 'happy', 'sad', 'curious', 'supportive')),
    response_type VARCHAR(30) DEFAULT 'normal' CHECK (response_type IN ('normal', 'educational', 'redirect', 'supportive')),
    context_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for chat messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_mood ON chat_messages(mood);
CREATE INDEX IF NOT EXISTS idx_chat_messages_response_type ON chat_messages(response_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Create collaboration_summaries table for storing AI-generated session summaries
CREATE TABLE IF NOT EXISTS collaboration_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    summary_title VARCHAR(255) NOT NULL,
    summary_content TEXT NOT NULL,
    key_insights JSONB,
    mood_analysis JSONB,
    recommendations JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for collaboration summaries
CREATE INDEX IF NOT EXISTS idx_collaboration_summaries_session_id ON collaboration_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_summaries_user_id ON collaboration_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_summaries_generated_at ON collaboration_summaries(generated_at);

-- Create session_timers table for tracking session duration
CREATE TABLE IF NOT EXISTS session_timers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    total_seconds INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for session timers
CREATE INDEX IF NOT EXISTS idx_session_timers_session_id ON session_timers(session_id);
CREATE INDEX IF NOT EXISTS idx_session_timers_user_id ON session_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_session_timers_is_active ON session_timers(is_active);

-- Insert a default admin user (password: admin123)
INSERT INTO users (email, name, password_hash, user_type) 
VALUES (
    'admin@securityapp.com', 
    'Admin User', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8QzO', -- bcrypt hash for 'admin123'
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for chat_sessions updated_at
CREATE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
    COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN user_type = 'user' THEN 1 END) as regular_users,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as new_users_24h,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7d
FROM users;

-- Create a view for security alerts summary
CREATE OR REPLACE VIEW security_alerts_summary AS
SELECT 
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN resolved = FALSE THEN 1 END) as unresolved_alerts,
    COUNT(CASE WHEN severity = 'critical' AND resolved = FALSE THEN 1 END) as critical_alerts,
    COUNT(CASE WHEN severity = 'high' AND resolved = FALSE THEN 1 END) as high_alerts,
    COUNT(CASE WHEN severity = 'medium' AND resolved = FALSE THEN 1 END) as medium_alerts,
    COUNT(CASE WHEN severity = 'low' AND resolved = FALSE THEN 1 END) as low_alerts
FROM security_alerts;

-- Create system_metrics table for performance monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Create index for system metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);

-- Create user_activity_logs table for detailed user tracking
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user activity logs
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- Create message_analytics table for chat message analysis
CREATE TABLE IF NOT EXISTS message_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    toxicity_score DECIMAL(3,2),
    pii_detected BOOLEAN DEFAULT FALSE,
    pii_types TEXT[],
    sentiment_score DECIMAL(3,2),
    mood_detected VARCHAR(20),
    processing_time_ms INTEGER,
    guardrail_actions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for message analytics
CREATE INDEX IF NOT EXISTS idx_message_analytics_user_id ON message_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_message_analytics_session_id ON message_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_message_analytics_created_at ON message_analytics(created_at);

-- Create admin_actions table for tracking admin activities
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_resource VARCHAR(100),
    action_description TEXT,
    ip_address INET,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for admin actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

-- Create system_health_checks table for monitoring
CREATE TABLE IF NOT EXISTS system_health_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    check_name VARCHAR(100) NOT NULL,
    check_status VARCHAR(20) NOT NULL CHECK (check_status IN ('healthy', 'warning', 'critical', 'down')),
    check_message TEXT,
    response_time_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for system health checks
CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON system_health_checks(check_status);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_created_at ON system_health_checks(created_at);

-- Create comprehensive analytics view
CREATE OR REPLACE VIEW admin_dashboard_analytics AS
SELECT 
    -- User statistics
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as active_users,
    (SELECT COUNT(*) FROM users WHERE user_type = 'admin') as admin_users,
    (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours') as new_users_24h,
    (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_7d,
    
    -- Chat statistics
    (SELECT COUNT(*) FROM chat_sessions) as total_sessions,
    (SELECT COUNT(*) FROM chat_sessions WHERE created_at >= NOW() - INTERVAL '24 hours') as new_sessions_24h,
    (SELECT COUNT(*) FROM chat_messages) as total_messages,
    (SELECT COUNT(*) FROM chat_messages WHERE created_at >= NOW() - INTERVAL '24 hours') as new_messages_24h,
    
    -- Security statistics
    (SELECT COUNT(*) FROM security_alerts WHERE resolved = FALSE) as unresolved_alerts,
    (SELECT COUNT(*) FROM security_alerts WHERE severity = 'critical' AND resolved = FALSE) as critical_alerts,
    (SELECT COUNT(*) FROM message_analytics WHERE pii_detected = TRUE) as pii_detections,
    (SELECT COUNT(*) FROM message_analytics WHERE toxicity_score > 0.7) as toxic_messages,
    
    -- System statistics
    (SELECT COUNT(*) FROM session_timers WHERE is_active = TRUE) as active_sessions,
    (SELECT AVG(total_seconds) FROM session_timers WHERE is_active = FALSE) as avg_session_duration,
    (SELECT COUNT(*) FROM collaboration_summaries) as total_summaries;

-- Create user activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.user_type,
    u.is_active,
    u.created_at,
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(DISTINCT cm.id) as total_messages,
    COUNT(DISTINCT ual.id) as total_activities,
    MAX(ual.created_at) as last_activity,
    COUNT(DISTINCT CASE WHEN ma.pii_detected = TRUE THEN ma.id END) as pii_violations,
    COUNT(DISTINCT CASE WHEN ma.toxicity_score > 0.7 THEN ma.id END) as toxicity_violations
FROM users u
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
LEFT JOIN chat_messages cm ON u.id = cm.user_id
LEFT JOIN user_activity_logs ual ON u.id = ual.user_id
LEFT JOIN message_analytics ma ON u.id = ma.user_id
GROUP BY u.id, u.name, u.email, u.user_type, u.is_active, u.created_at;
