from flask import Blueprint, request, jsonify
from db.config import supabase
from routes.auth_routes import verify_jwt_token
from datetime import datetime
import uuid

chat_bp = Blueprint('chat', __name__)

def require_auth():
    """Helper to require authentication"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None, jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        payload = verify_jwt_token(token)
        user_id = payload['user_id']
        
        # Get user data to verify they're still active
        user_result = supabase.table('users').select('id, name, email, user_type').eq('id', user_id).eq('is_active', True).execute()
        
        if not user_result.data:
            return None, jsonify({'error': 'User not found or inactive'}), 404
        
        return user_result.data[0], None, None
        
    except ValueError as e:
        return None, jsonify({'error': str(e)}), 401
    except Exception as e:
        return None, jsonify({'error': f'Authentication failed: {str(e)}'}), 500

@chat_bp.route('/sessions', methods=['GET'])
def get_chat_sessions():
    """Get all chat sessions for the authenticated user"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        # Get user's chat sessions
        result = supabase.table('chat_sessions').select('*').eq('user_id', user['id']).eq('is_active', True).order('updated_at', desc=True).execute()
        
        return jsonify({
            'sessions': result.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get chat sessions: {str(e)}'}), 500

@chat_bp.route('/sessions', methods=['POST'])
def create_chat_session():
    """Create a new chat session"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        data = request.get_json()
        title = data.get('title', 'New Chat Session')
        
        # Create new session
        session_data = {
            'user_id': user['id'],
            'title': title,
            'is_active': True
        }
        
        result = supabase.table('chat_sessions').insert(session_data).execute()
        
        if not result.data:
            return jsonify({'error': 'Failed to create chat session'}), 500
        
        return jsonify({
            'session': result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create chat session: {str(e)}'}), 500

@chat_bp.route('/sessions/<session_id>', methods=['GET'])
def get_chat_session(session_id):
    """Get a specific chat session with its messages"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        # Get session
        session_result = supabase.table('chat_sessions').select('*').eq('id', session_id).eq('user_id', user['id']).execute()
        
        if not session_result.data:
            return jsonify({'error': 'Chat session not found'}), 404
        
        session = session_result.data[0]
        
        # Get messages for this session
        messages_result = supabase.table('chat_messages').select('*').eq('session_id', session_id).order('created_at', desc=False).execute()
        
        return jsonify({
            'session': session,
            'messages': messages_result.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get chat session: {str(e)}'}), 500

@chat_bp.route('/sessions/<session_id>', methods=['PUT'])
def update_chat_session(session_id):
    """Update a chat session (e.g., change title)"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        data = request.get_json()
        
        # Update session
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        result = supabase.table('chat_sessions').update(update_data).eq('id', session_id).eq('user_id', user['id']).execute()
        
        if not result.data:
            return jsonify({'error': 'Chat session not found'}), 404
        
        return jsonify({
            'session': result.data[0]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update chat session: {str(e)}'}), 500

@chat_bp.route('/sessions/<session_id>', methods=['DELETE'])
def delete_chat_session(session_id):
    """Delete a chat session"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        # Soft delete by setting is_active to False
        result = supabase.table('chat_sessions').update({'is_active': False}).eq('id', session_id).eq('user_id', user['id']).execute()
        
        if not result.data:
            return jsonify({'error': 'Chat session not found'}), 404
        
        return jsonify({'message': 'Chat session deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete chat session: {str(e)}'}), 500

@chat_bp.route('/sessions/<session_id>/messages', methods=['POST'])
def add_message_to_session(session_id):
    """Add a message to a chat session"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        data = request.get_json()
        message_type = data.get('message_type')
        content = data.get('content')
        
        if not all([message_type, content]):
            return jsonify({'error': 'message_type and content are required'}), 400
        
        if message_type not in ['user', 'ai']:
            return jsonify({'error': 'message_type must be either "user" or "ai"'}), 400
        
        # Verify session belongs to user
        session_result = supabase.table('chat_sessions').select('id').eq('id', session_id).eq('user_id', user['id']).eq('is_active', True).execute()
        
        if not session_result.data:
            return jsonify({'error': 'Chat session not found'}), 404
        
        # Add message
        message_data = {
            'session_id': session_id,
            'user_id': user['id'],
            'message_type': message_type,
            'content': content
        }
        
        result = supabase.table('chat_messages').insert(message_data).execute()
        
        if not result.data:
            return jsonify({'error': 'Failed to add message'}), 500
        
        # Update session's updated_at timestamp
        supabase.table('chat_sessions').update({'updated_at': datetime.now().isoformat()}).eq('id', session_id).execute()
        
        return jsonify({
            'message': result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to add message: {str(e)}'}), 500
