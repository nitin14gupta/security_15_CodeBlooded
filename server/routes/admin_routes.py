from flask import Blueprint, request, jsonify
from db.config import supabase, supabase_admin
from routes.auth_routes import verify_jwt_token
from datetime import datetime, timedelta
import functools
import json
import uuid

admin_bp = Blueprint('admin', __name__)

def require_admin_auth():
    """Decorator to require admin authentication"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            try:
                # Get token from Authorization header
                auth_header = request.headers.get('Authorization')
                if not auth_header or not auth_header.startswith('Bearer '):
                    return jsonify({'error': 'Missing or invalid authorization header'}), 401
                
                token = auth_header.split(' ')[1]
                
                # Verify token
                payload = verify_jwt_token(token)
                user_id = payload['user_id']
                user_type = payload['user_type']
                
                # Check if user is admin
                if user_type != 'admin':
                    return jsonify({'error': 'Admin access required'}), 403
                
                # Get user data to verify they're still active
                user_result = supabase.table('users').select('id, name, email, user_type').eq('id', user_id).eq('is_active', True).execute()
                
                if not user_result.data:
                    return jsonify({'error': 'User not found or inactive'}), 404
                
                # Add user info to request context
                request.current_user = user_result.data[0]
                
                return f(*args, **kwargs)
                
            except ValueError as e:
                return jsonify({'error': str(e)}), 401
            except Exception as e:
                return jsonify({'error': f'Authentication failed: {str(e)}'}), 500
        
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

def log_admin_action(action_type: str, target_user_id: str = None, target_resource: str = None, action_description: str = None, metadata: dict = None):
    """Log admin actions for audit trail"""
    try:
        admin_id = request.current_user['id']
        ip_address = request.environ.get('REMOTE_ADDR')
        
        action_data = {
            'admin_id': admin_id,
            'action_type': action_type,
            'target_user_id': target_user_id,
            'target_resource': target_resource,
            'action_description': action_description,
            'ip_address': ip_address,
            'metadata': metadata or {}
        }
        
        supabase.table('admin_actions').insert(action_data).execute()
    except Exception as e:
        print(f"Failed to log admin action: {e}")

def log_user_activity(user_id: str, activity_type: str, activity_description: str = None, session_id: str = None, metadata: dict = None):
    """Log user activities for tracking"""
    try:
        ip_address = request.environ.get('REMOTE_ADDR')
        user_agent = request.headers.get('User-Agent')
        
        activity_data = {
            'user_id': user_id,
            'activity_type': activity_type,
            'activity_description': activity_description,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'session_id': session_id,
            'metadata': metadata or {}
        }
        
        supabase.table('user_activity_logs').insert(activity_data).execute()
    except Exception as e:
        print(f"Failed to log user activity: {e}")

# Dashboard Analytics
@admin_bp.route('/dashboard/analytics', methods=['GET'])
@require_admin_auth()
def get_dashboard_analytics():
    """Get comprehensive dashboard analytics"""
    try:
        # Get analytics from view
        analytics_result = supabase.table('admin_dashboard_analytics').select('*').execute()
        analytics = analytics_result.data[0] if analytics_result.data else {}
        
        # Get recent activity
        recent_activity = supabase.table('user_activity_logs').select('*').order('created_at', desc=True).limit(10).execute()
        
        # Get system health
        health_checks = supabase.table('system_health_checks').select('*').order('created_at', desc=True).limit(5).execute()
        
        return jsonify({
            'analytics': analytics,
            'recent_activity': recent_activity.data,
            'system_health': health_checks.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get dashboard analytics: {str(e)}'}), 500

@admin_bp.route('/dashboard/charts', methods=['GET'])
@require_admin_auth()
def get_dashboard_charts():
    """Get chart data for dashboard"""
    try:
        # User registration over time (last 30 days)
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        user_registrations = supabase.table('users').select('created_at').gte('created_at', thirty_days_ago).execute()
        
        # Message activity over time (last 7 days)
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
        message_activity = supabase.table('chat_messages').select('created_at').gte('created_at', seven_days_ago).execute()
        
        # Security alerts by severity
        security_alerts = supabase.table('security_alerts').select('severity, created_at').execute()
        
        # Session duration analytics
        session_durations = supabase.table('session_timers').select('total_seconds, created_at').eq('is_active', False).execute()
        
        return jsonify({
            'user_registrations': user_registrations.data,
            'message_activity': message_activity.data,
            'security_alerts': security_alerts.data,
            'session_durations': session_durations.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get chart data: {str(e)}'}), 500

# User Management
@admin_bp.route('/users', methods=['GET'])
@require_admin_auth()
def get_all_users():
    """Get all users with comprehensive data"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        user_type = request.args.get('user_type')
        search = request.args.get('search')
        
        # Get user activity summary
        query = supabase.table('user_activity_summary').select('*')
        
        if user_type:
            query = query.eq('user_type', user_type)
        
        if search:
            query = query.or_(f'name.ilike.%{search}%,email.ilike.%{search}%')
        
        # Add pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1).order('created_at', desc=True)
        
        result = query.execute()
        
        return jsonify({
            'users': result.data,
            'page': page,
            'limit': limit,
            'total': len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get users: {str(e)}'}), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@require_admin_auth()
def get_user_details(user_id):
    """Get detailed user information"""
    try:
        # Get user basic info
        user_result = supabase.table('users').select('*').eq('id', user_id).execute()
        if not user_result.data:
            return jsonify({'error': 'User not found'}), 404
        
        user = user_result.data[0]
        del user['password_hash']  # Remove sensitive data
        
        # Get user activity logs
        activity_logs = supabase.table('user_activity_logs').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(50).execute()
        
        # Get user sessions
        user_sessions = supabase.table('chat_sessions').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(20).execute()
        
        # Get user messages analytics
        message_analytics = supabase.table('message_analytics').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(100).execute()
        
        # Get collaboration summaries
        summaries = supabase.table('collaboration_summaries').select('*').eq('user_id', user_id).order('generated_at', desc=True).execute()
        
        return jsonify({
            'user': user,
            'activity_logs': activity_logs.data,
            'sessions': user_sessions.data,
            'message_analytics': message_analytics.data,
            'summaries': summaries.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user details: {str(e)}'}), 500

@admin_bp.route('/users/<user_id>/toggle-status', methods=['PUT'])
@require_admin_auth()
def toggle_user_status(user_id):
    """Toggle user active status"""
    try:
        data = request.get_json()
        is_active = data.get('is_active')
        
        if is_active is None:
            return jsonify({'error': 'is_active field is required'}), 400
        
        # Update user status
        result = supabase.table('users').update({'is_active': is_active}).eq('id', user_id).execute()
        
        if not result.data:
            return jsonify({'error': 'User not found'}), 404
        
        # Log admin action
        log_admin_action(
            action_type='toggle_user_status',
            target_user_id=user_id,
            action_description=f'User status changed to {"active" if is_active else "inactive"}',
            metadata={'new_status': is_active}
        )
        
        # Log user activity
        log_user_activity(
            user_id=user_id,
            activity_type='status_changed',
            activity_description=f'Account status changed to {"active" if is_active else "inactive"} by admin',
            metadata={'admin_id': request.current_user['id']}
        )
        
        return jsonify({'message': 'User status updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update user status: {str(e)}'}), 500

@admin_bp.route('/users/<user_id>/ban', methods=['POST'])
@require_admin_auth()
def ban_user(user_id):
    """Ban a user"""
    try:
        data = request.get_json()
        reason = data.get('reason', 'No reason provided')
        
        # Update user status
        result = supabase.table('users').update({'is_active': False}).eq('id', user_id).execute()
        
        if not result.data:
            return jsonify({'error': 'User not found'}), 404
        
        # Log admin action
        log_admin_action(
            action_type='ban_user',
            target_user_id=user_id,
            action_description=f'User banned: {reason}',
            metadata={'reason': reason}
        )
        
        # Log user activity
        log_user_activity(
            user_id=user_id,
            activity_type='banned',
            activity_description=f'User banned by admin: {reason}',
            metadata={'admin_id': request.current_user['id'], 'reason': reason}
        )
        
        return jsonify({'message': 'User banned successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to ban user: {str(e)}'}), 500

# Security Management
@admin_bp.route('/security/alerts', methods=['GET'])
@require_admin_auth()
def get_security_alerts():
    """Get security alerts with filtering"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        severity = request.args.get('severity')
        resolved = request.args.get('resolved')
        alert_type = request.args.get('alert_type')
        
        # Build query
        query = supabase.table('security_alerts').select('*')
        
        if severity:
            query = query.eq('severity', severity)
        
        if resolved is not None:
            query = query.eq('resolved', resolved.lower() == 'true')
        
        if alert_type:
            query = query.eq('alert_type', alert_type)
        
        # Add pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1).order('created_at', desc=True)
        
        result = query.execute()
        
        return jsonify({
            'alerts': result.data,
            'page': page,
            'limit': limit,
            'total': len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get security alerts: {str(e)}'}), 500

@admin_bp.route('/security/alerts/<alert_id>/resolve', methods=['PUT'])
@require_admin_auth()
def resolve_security_alert(alert_id):
    """Resolve a security alert"""
    try:
        data = request.get_json()
        resolution_notes = data.get('resolution_notes', '')
        
        # Update alert status
        result = supabase.table('security_alerts').update({
            'resolved': True,
            'resolved_at': datetime.now().isoformat()
        }).eq('id', alert_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Alert not found'}), 404
        
        # Log admin action
        log_admin_action(
            action_type='resolve_security_alert',
            target_resource='security_alerts',
            action_description=f'Security alert resolved: {resolution_notes}',
            metadata={'alert_id': alert_id, 'resolution_notes': resolution_notes}
        )
        
        return jsonify({'message': 'Alert resolved successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to resolve alert: {str(e)}'}), 500

# Message Analytics
@admin_bp.route('/analytics/messages', methods=['GET'])
@require_admin_auth()
def get_message_analytics():
    """Get message analytics and insights"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        user_id = request.args.get('user_id')
        session_id = request.args.get('session_id')
        pii_detected = request.args.get('pii_detected')
        toxicity_threshold = request.args.get('toxicity_threshold', 0.7)
        
        # Build query
        query = supabase.table('message_analytics').select('*')
        
        if user_id:
            query = query.eq('user_id', user_id)
        
        if session_id:
            query = query.eq('session_id', session_id)
        
        if pii_detected is not None:
            query = query.eq('pii_detected', pii_detected.lower() == 'true')
        
        if toxicity_threshold:
            query = query.gte('toxicity_score', float(toxicity_threshold))
        
        # Add pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1).order('created_at', desc=True)
        
        result = query.execute()
        
        return jsonify({
            'analytics': result.data,
            'page': page,
            'limit': limit,
            'total': len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get message analytics: {str(e)}'}), 500

@admin_bp.route('/analytics/toxicity', methods=['GET'])
@require_admin_auth()
def get_toxicity_analytics():
    """Get toxicity analysis data"""
    try:
        # Get toxicity distribution
        toxicity_data = supabase.table('message_analytics').select('toxicity_score, created_at').gte('toxicity_score', 0.5).execute()
        
        # Get PII detection data
        pii_data = supabase.table('message_analytics').select('pii_types, created_at').eq('pii_detected', True).execute()
        
        # Get sentiment analysis
        sentiment_data = supabase.table('message_analytics').select('sentiment_score, mood_detected, created_at').execute()
        
        return jsonify({
            'toxicity_data': toxicity_data.data,
            'pii_data': pii_data.data,
            'sentiment_data': sentiment_data.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get toxicity analytics: {str(e)}'}), 500

# System Monitoring
@admin_bp.route('/system/health', methods=['GET'])
@require_admin_auth()
def get_system_health():
    """Get system health status"""
    try:
        # Get recent health checks
        health_checks = supabase.table('system_health_checks').select('*').order('created_at', desc=True).limit(20).execute()
        
        # Get system metrics
        metrics = supabase.table('system_metrics').select('*').order('timestamp', desc=True).limit(50).execute()
        
        # Get active sessions count
        active_sessions = supabase.table('session_timers').select('id').eq('is_active', True).execute()
        
        return jsonify({
            'health_checks': health_checks.data,
            'metrics': metrics.data,
            'active_sessions': len(active_sessions.data),
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get system health: {str(e)}'}), 500

@admin_bp.route('/system/metrics', methods=['POST'])
@require_admin_auth()
def record_system_metric():
    """Record a system metric"""
    try:
        data = request.get_json()
        
        metric_data = {
            'metric_name': data.get('metric_name'),
            'metric_value': data.get('metric_value'),
            'metric_unit': data.get('metric_unit'),
            'metadata': data.get('metadata', {})
        }
        
        result = supabase.table('system_metrics').insert(metric_data).execute()
        
        return jsonify({'message': 'Metric recorded successfully', 'metric': result.data[0]}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to record metric: {str(e)}'}), 500

# Audit and Logging
@admin_bp.route('/audit/logs', methods=['GET'])
@require_admin_auth()
def get_audit_logs():
    """Get comprehensive audit logs"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        action = request.args.get('action')
        user_id = request.args.get('user_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = supabase.table('audit_logs').select('*')
        
        if action:
            query = query.eq('action', action)
        
        if user_id:
            query = query.eq('user_id', user_id)
        
        if date_from:
            query = query.gte('created_at', date_from)
        
        if date_to:
            query = query.lte('created_at', date_to)
        
        # Add pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1).order('created_at', desc=True)
        
        result = query.execute()
        
        return jsonify({
            'logs': result.data,
            'page': page,
            'limit': limit,
            'total': len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get audit logs: {str(e)}'}), 500

@admin_bp.route('/audit/admin-actions', methods=['GET'])
@require_admin_auth()
def get_admin_actions():
    """Get admin action logs"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        action_type = request.args.get('action_type')
        admin_id = request.args.get('admin_id')
        
        # Build query
        query = supabase.table('admin_actions').select('*')
        
        if action_type:
            query = query.eq('action_type', action_type)
        
        if admin_id:
            query = query.eq('admin_id', admin_id)
        
        # Add pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1).order('created_at', desc=True)
        
        result = query.execute()
        
        return jsonify({
            'actions': result.data,
            'page': page,
            'limit': limit,
            'total': len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get admin actions: {str(e)}'}), 500

# Reports and Exports
@admin_bp.route('/reports/users', methods=['GET'])
@require_admin_auth()
def export_users_report():
    """Export users report"""
    try:
        # Get all users with activity summary
        users = supabase.table('user_activity_summary').select('*').execute()
        
        return jsonify({
            'users': users.data,
            'exported_at': datetime.now().isoformat(),
            'total_users': len(users.data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to export users report: {str(e)}'}), 500

@admin_bp.route('/reports/security', methods=['GET'])
@require_admin_auth()
def export_security_report():
    """Export security report"""
    try:
        # Get security alerts
        alerts = supabase.table('security_alerts').select('*').order('created_at', desc=True).execute()
        
        # Get message analytics with violations
        violations = supabase.table('message_analytics').select('*').or_('pii_detected.eq.true,toxicity_score.gte.0.7').execute()
        
        return jsonify({
            'alerts': alerts.data,
            'violations': violations.data,
            'exported_at': datetime.now().isoformat(),
            'total_alerts': len(alerts.data),
            'total_violations': len(violations.data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to export security report: {str(e)}'}), 500

@admin_bp.route('/reports/activity', methods=['GET'])
@require_admin_auth()
def export_activity_report():
    """Export user activity report"""
    try:
        user_id = request.args.get('user_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = supabase.table('user_activity_logs').select('*')
        
        if user_id:
            query = query.eq('user_id', user_id)
        
        if date_from:
            query = query.gte('created_at', date_from)
        
        if date_to:
            query = query.lte('created_at', date_to)
        
        result = query.order('created_at', desc=True).execute()
        
        return jsonify({
            'activities': result.data,
            'exported_at': datetime.now().isoformat(),
            'total_activities': len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to export activity report: {str(e)}'}), 500