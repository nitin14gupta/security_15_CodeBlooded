from flask import Blueprint, request, jsonify
from db.config import supabase, supabase_admin
from routes.auth_routes import verify_jwt_token
from datetime import datetime, timedelta

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

@admin_bp.route('/stats', methods=['GET'])
@require_admin_auth()
def get_admin_stats():
    """Get admin dashboard statistics"""
    try:
        # Get user statistics
        user_stats_result = supabase.table('user_stats').select('*').execute()
        user_stats = user_stats_result.data[0] if user_stats_result.data else {}
        
        # Get security alerts summary
        alerts_result = supabase.table('security_alerts_summary').select('*').execute()
        alerts_summary = alerts_result.data[0] if alerts_result.data else {}
        
        # Get recent users (last 7 days)
        recent_users_result = supabase.table('users').select('id, name, email, user_type, created_at').gte('created_at', (datetime.now() - timedelta(days=7)).isoformat()).order('created_at', desc=True).limit(10).execute()
        
        # Get recent audit logs
        recent_logs_result = supabase.table('audit_logs').select('*').order('created_at', desc=True).limit(10).execute()
        
        return jsonify({
            'user_stats': user_stats,
            'alerts_summary': alerts_summary,
            'recent_users': recent_users_result.data,
            'recent_activity': recent_logs_result.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get admin stats: {str(e)}'}), 500

@admin_bp.route('/users', methods=['GET'])
@require_admin_auth()
def get_all_users():
    """Get all users with pagination"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        user_type = request.args.get('user_type')
        
        # Build query
        query = supabase.table('users').select('id, name, email, user_type, created_at, is_active')
        
        if user_type:
            query = query.eq('user_type', user_type)
        
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
def get_user(user_id):
    """Get specific user details"""
    try:
        result = supabase.table('users').select('*').eq('id', user_id).execute()
        
        if not result.data:
            return jsonify({'error': 'User not found'}), 404
        
        user = result.data[0]
        
        # Remove sensitive data
        del user['password_hash']
        
        return jsonify({'user': user}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user: {str(e)}'}), 500

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
        
        # Log the action
        audit_data = {
            'user_id': request.current_user['id'],
            'action': 'toggle_user_status',
            'resource': 'users',
            'details': {'target_user_id': user_id, 'new_status': is_active},
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent')
        }
        supabase.table('audit_logs').insert(audit_data).execute()
        
        return jsonify({'message': 'User status updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update user status: {str(e)}'}), 500

@admin_bp.route('/security-alerts', methods=['GET'])
@require_admin_auth()
def get_security_alerts():
    """Get security alerts"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        severity = request.args.get('severity')
        resolved = request.args.get('resolved')
        
        # Build query
        query = supabase.table('security_alerts').select('*')
        
        if severity:
            query = query.eq('severity', severity)
        
        if resolved is not None:
            query = query.eq('resolved', resolved.lower() == 'true')
        
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

@admin_bp.route('/security-alerts/<alert_id>/resolve', methods=['PUT'])
@require_admin_auth()
def resolve_security_alert(alert_id):
    """Resolve a security alert"""
    try:
        # Update alert status
        result = supabase.table('security_alerts').update({
            'resolved': True,
            'resolved_at': datetime.now().isoformat()
        }).eq('id', alert_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Alert not found'}), 404
        
        # Log the action
        audit_data = {
            'user_id': request.current_user['id'],
            'action': 'resolve_security_alert',
            'resource': 'security_alerts',
            'details': {'alert_id': alert_id},
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent')
        }
        supabase.table('audit_logs').insert(audit_data).execute()
        
        return jsonify({'message': 'Alert resolved successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to resolve alert: {str(e)}'}), 500

@admin_bp.route('/audit-logs', methods=['GET'])
@require_admin_auth()
def get_audit_logs():
    """Get audit logs"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        action = request.args.get('action')
        user_id = request.args.get('user_id')
        
        # Build query
        query = supabase.table('audit_logs').select('*')
        
        if action:
            query = query.eq('action', action)
        
        if user_id:
            query = query.eq('user_id', user_id)
        
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
