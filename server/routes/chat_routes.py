from flask import Blueprint, request, jsonify
from db.config import supabase
from routes.auth_routes import verify_jwt_token
from utils.guardrails import guardrails_service
from utils.mood_analysis import mood_analyzer
from utils.educational_responses import educational_service
from utils.conversation_context import context_manager
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

@chat_bp.route('/sessions/<session_id>/process-message', methods=['POST'])
def process_user_message(session_id):
    """Process user message with enhanced mood analysis and educational responses"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Verify session belongs to user
        session_result = supabase.table('chat_sessions').select('id').eq('id', session_id).eq('user_id', user['id']).eq('is_active', True).execute()
        
        if not session_result.data:
            return jsonify({'error': 'Chat session not found'}), 404
        
        # Get user preferences for personalization
        user_preferences = {
            'name': user.get('name'),
            'morning_preference': user.get('morning_preference'),
            'life_genre': user.get('life_genre'),
            'weekly_goal': user.get('weekly_goal'),
            'favorite_app': user.get('favorite_app')
        }
        
        # Process message through enhanced guardrails
        processing_results = guardrails_service.process_message_v2(
            user_message, user['id'], session_id, user_preferences
        )
        
        # Store user message with mood analysis
        user_message_data = {
            'session_id': session_id,
            'user_id': user['id'],
            'message_type': 'user',
            'content': user_message,
            'mood': processing_results.get('mood_analysis', {}).get('mood', 'neutral'),
            'response_type': 'normal',
            'context_data': {
                'mood_analysis': processing_results.get('mood_analysis'),
                'processing_log': processing_results.get('processing_log', [])
            }
        }
        
        # Insert user message
        user_msg_result = supabase.table('chat_messages').insert(user_message_data).execute()
        
        if not user_msg_result.data:
            return jsonify({'error': 'Failed to store user message'}), 500
        
        # Generate AI response based on processing results
        ai_response = _generate_ai_response(processing_results, user_preferences, session_id)
        
        # Store AI response
        ai_message_data = {
            'session_id': session_id,
            'user_id': user['id'],
            'message_type': 'ai',
            'content': ai_response['content'],
            'mood': ai_response.get('mood', 'neutral'),
            'response_type': ai_response.get('response_type', 'normal'),
            'context_data': {
                'response_guidance': processing_results.get('response_guidance'),
                'should_redirect': processing_results.get('should_redirect', False),
                'redirect_suggestions': processing_results.get('redirect_suggestions', [])
            }
        }
        
        ai_msg_result = supabase.table('chat_messages').insert(ai_message_data).execute()
        
        if not ai_msg_result.data:
            return jsonify({'error': 'Failed to store AI response'}), 500
        
        # Update session timestamp
        supabase.table('chat_sessions').update({'updated_at': datetime.now().isoformat()}).eq('id', session_id).execute()
        
        return jsonify({
            'user_message': user_msg_result.data[0],
            'ai_response': ai_msg_result.data[0],
            'processing_results': {
                'mood_analysis': processing_results.get('mood_analysis'),
                'response_guidance': processing_results.get('response_guidance'),
                'should_redirect': processing_results.get('should_redirect'),
                'redirect_suggestions': processing_results.get('redirect_suggestions'),
                'context_summary': processing_results.get('context_summary')
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to process message: {str(e)}'}), 500

def _generate_ai_response(processing_results: dict, user_preferences: dict, session_id: str) -> dict:
    """Generate AI response based on processing results"""
    response_guidance = processing_results.get('response_guidance', {})
    mood_analysis = processing_results.get('mood_analysis', {})
    current_mood = mood_analysis.get('mood', 'neutral')
    
    # Check if educational response is needed
    if processing_results.get('response_type') == 'educational':
        educational_response = processing_results.get('educational_response', {})
        content = educational_response.get('content', 'I understand you\'re curious about this topic. Let me help you explore it in a positive way.')
        response_type = 'educational'
    else:
        # Generate normal response based on mood
        content = _generate_mood_based_response(current_mood, user_preferences, response_guidance)
        response_type = 'normal'
    
    # Add buddy personality
    content = educational_service.generate_buddy_response(
        content, current_mood, response_guidance, user_preferences
    )
    
    return {
        'content': content,
        'mood': current_mood,
        'response_type': response_type
    }

def _generate_mood_based_response(mood: str, user_preferences: dict, guidance: dict) -> str:
    """Generate response based on detected mood"""
    mood_responses = {
        'happy': "I love your positive energy! What else would you like to explore or talk about?",
        'sad': "I'm here for you. Sometimes it helps to talk about what's on your mind. What's been going on?",
        'curious': "That's a great question! I'm excited to help you learn more about this topic.",
        'supportive': "I'm here to help and support you. What would you like to discuss?",
        'neutral': "I'm here to chat! What's on your mind today?"
    }
    
    base_response = mood_responses.get(mood, mood_responses['neutral'])
    
    # Add personalization based on user preferences
    if user_preferences.get('name'):
        base_response = f"Hey {user_preferences['name']}, {base_response.lower()}"
    
    return base_response

@chat_bp.route('/sessions/<session_id>/context', methods=['GET'])
def get_conversation_context(session_id):
    """Get conversation context and mood analysis for a session"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        # Verify session belongs to user
        session_result = supabase.table('chat_sessions').select('id').eq('id', session_id).eq('user_id', user['id']).eq('is_active', True).execute()
        
        if not session_result.data:
            return jsonify({'error': 'Chat session not found'}), 404
        
        # Get context summary from context manager
        context_summary = context_manager.get_context_summary(session_id)
        
        # Get recent messages with mood data
        messages_result = supabase.table('chat_messages').select('*').eq('session_id', session_id).order('created_at', desc=False).limit(10).execute()
        
        # Analyze mood trends from stored messages
        mood_history = []
        for msg in messages_result.data:
            if msg.get('mood'):
                mood_history.append({
                    'mood': msg['mood'],
                    'message_type': msg['message_type'],
                    'timestamp': msg['created_at']
                })
        
        return jsonify({
            'context_summary': context_summary,
            'mood_history': mood_history,
            'recent_messages': messages_result.data[-5:] if messages_result.data else [],
            'session_id': session_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get conversation context: {str(e)}'}), 500

@chat_bp.route('/sessions/<session_id>/mood-analysis', methods=['GET'])
def get_mood_analysis(session_id):
    """Get detailed mood analysis for a session"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        # Verify session belongs to user
        session_result = supabase.table('chat_sessions').select('id').eq('id', session_id).eq('user_id', user['id']).eq('is_active', True).execute()
        
        if not session_result.data:
            return jsonify({'error': 'Chat session not found'}), 404
        
        # Get messages with mood data
        messages_result = supabase.table('chat_messages').select('mood, response_type, context_data, created_at').eq('session_id', session_id).order('created_at', desc=False).execute()
        
        # Analyze mood trends
        mood_analysis = _analyze_session_mood(messages_result.data)
        
        return jsonify({
            'session_id': session_id,
            'mood_analysis': mood_analysis,
            'message_count': len(messages_result.data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get mood analysis: {str(e)}'}), 500

def _analyze_session_mood(messages: list) -> dict:
    """Analyze mood trends from session messages"""
    if not messages:
        return {'trend': 'no_data', 'primary_mood': 'neutral', 'mood_changes': 0}
    
    moods = [msg.get('mood', 'neutral') for msg in messages if msg.get('mood')]
    
    if not moods:
        return {'trend': 'no_mood_data', 'primary_mood': 'neutral', 'mood_changes': 0}
    
    # Count mood occurrences
    mood_counts = {}
    for mood in moods:
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
    
    # Find primary mood
    primary_mood = max(mood_counts, key=mood_counts.get)
    
    # Count mood changes
    mood_changes = 0
    for i in range(1, len(moods)):
        if moods[i] != moods[i-1]:
            mood_changes += 1
    
    # Determine trend
    if mood_counts.get('sad', 0) > len(moods) * 0.6:
        trend = 'declining'
    elif mood_counts.get('happy', 0) > len(moods) * 0.6:
        trend = 'improving'
    else:
        trend = 'stable'
    
    return {
        'trend': trend,
        'primary_mood': primary_mood,
        'mood_changes': mood_changes,
        'mood_distribution': mood_counts,
        'total_messages': len(moods),
        'recommendations': _get_mood_recommendations(trend, primary_mood)
    }

def _get_mood_recommendations(trend: str, primary_mood: str) -> list:
    """Get recommendations based on mood analysis"""
    recommendations = []
    
    if trend == 'declining':
        recommendations.append("Consider redirecting conversation to positive topics")
        recommendations.append("Offer supportive responses and encouragement")
    elif trend == 'improving':
        recommendations.append("Continue building on positive energy")
        recommendations.append("Encourage continued engagement")
    else:
        recommendations.append("Maintain balanced conversation approach")
    
    if primary_mood == 'sad':
        recommendations.append("Focus on supportive and empathetic responses")
    elif primary_mood == 'curious':
        recommendations.append("Provide educational and informative content")
    elif primary_mood == 'happy':
        recommendations.append("Build on positive energy and enthusiasm")
    
    return recommendations
