from flask import Blueprint, request, jsonify
from db.config import supabase
from routes.auth_routes import verify_jwt_token
from utils.guardrails import guardrails_service
from utils.llm_mood_analysis import llm_mood_analyzer
from utils.llm_response_generator import llm_response_generator
from utils.conversation_context import context_manager
from datetime import datetime
import uuid
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini for collaboration summaries
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.0-flash')
else:
    gemini_model = None

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
            'user_id': user['id'],
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
                'context_summary': processing_results.get('context_summary'),
                'warnings': processing_results.get('warnings', [])
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to process message: {str(e)}'}), 500

def _generate_ai_response(processing_results: dict, user_preferences: dict, session_id: str) -> dict:
    """Generate AI response using LLM-based services"""
    mood_analysis = processing_results.get('mood_analysis', {})
    current_mood = mood_analysis.get('mood', 'neutral')
    
    # Get the original user message from processing results
    user_message = processing_results.get('original_message', '')
    
    # Get conversation context
    user_id = user_preferences.get('user_id') or processing_results.get('user_id')
    context = context_manager.get_context(user_id, session_id, user_preferences)
    
    # Convert context to serializable format
    try:
        serializable_context = context.to_dict()
    except Exception as e:
        print(f"Context serialization error: {e}")
        # Fallback to empty context
        serializable_context = {
            'conversation_history': [],
            'current_mood': 'neutral',
            'mood_history': [],
            'topics_discussed': [],
            'educational_topics_covered': [],
            'user_preferences': {}
        }
    
    # Generate response using LLM
    content = llm_response_generator.generate_response(
        user_message, 
        mood_analysis, 
        user_preferences, 
        serializable_context
    )
    
    # Determine response type based on processing results
    response_type = processing_results.get('response_type', 'normal')
    
    return {
        'content': content,
        'mood': current_mood,
        'response_type': response_type
    }


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

@chat_bp.route('/generate-collaboration-summary', methods=['POST'])
def generate_collaboration_summary():
    """Generate AI collaboration summary for a chat session"""
    try:
        print("Starting collaboration summary generation...")
        
        user, error_response, status_code = require_auth()
        if error_response:
            print(f"Authentication failed: {error_response}")
            return error_response, status_code
        
        data = request.get_json()
        if not data or 'session_id' not in data:
            print("Missing session_id in request")
            return jsonify({'error': 'Session ID is required'}), 400
        
        session_id = data['session_id']
        print(f"Processing session: {session_id}")
        
        # Verify session belongs to user
        session_result = supabase.table('chat_sessions').select('*').eq('id', session_id).eq('user_id', user['id']).eq('is_active', True).execute()
        
        if not session_result.data:
            print(f"Session not found or access denied: {session_id}")
            return jsonify({'error': 'Session not found or access denied'}), 404
        
        session = session_result.data[0]
        print(f"Found session: {session['title']}")
        
        # Get all messages for the session
        messages_result = supabase.table('chat_messages').select('*').eq('session_id', session_id).order('created_at').execute()
        
        if not messages_result.data:
            print("No messages found in session")
            return jsonify({'error': 'No messages found in this session'}), 400
        
        messages = messages_result.data
        print(f"Found {len(messages)} messages")
        
        # Check if summary already exists
        existing_summary = supabase.table('collaboration_summaries').select('*').eq('session_id', session_id).execute()
        
        if existing_summary.data:
            print("Summary already exists for this session")
            return jsonify({
                'message': 'Summary already exists for this session',
                'summary': existing_summary.data[0]
            }), 200
        
        # Check Gemini availability
        if not gemini_model:
            print("Gemini model not available - using fallback")
            # Create a simple fallback summary
            summary_data = {
                'title': f"Session Summary - {session['title']}",
                'summary': f"This is a summary of your conversation session '{session['title']}'. The session contained {len(messages)} messages and covered various topics. This summary was generated without AI assistance due to service unavailability.",
                'key_insights': [
                    f"Session contained {len(messages)} messages",
                    "Conversation covered multiple topics",
                    "User engaged actively in the session"
                ],
                'mood_analysis': {"patterns": "Analysis not available due to AI service unavailability"},
                'recommendations': [
                    "Continue engaging in supportive conversations",
                    "Consider scheduling regular check-ins",
                    "Monitor mood patterns over time"
                ]
            }
        else:
            print("Gemini model available, generating AI summary...")
            
            # Prepare conversation data for Gemini
            conversation_text = ""
            mood_data = []
            
            for msg in messages:
                role = "User" if msg['message_type'] == 'user' else "AI Assistant"
                conversation_text += f"{role}: {msg['content']}\n"
                
                if msg['mood']:
                    mood_data.append({
                        'message': msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content'],
                        'mood': msg['mood'],
                        'timestamp': msg['created_at']
                    })
            
            # Create prompt for Gemini
            prompt = f"""
            Analyze this therapy/counseling conversation and create a comprehensive collaboration summary:

            CONVERSATION:
            {conversation_text}

            MOOD DATA:
            {mood_data}

            Please provide:
            1. A concise title for this session
            2. A detailed summary of the conversation
            3. Key insights about the user's emotional state and needs
            4. Mood analysis and patterns
            5. Recommendations for continued support

            Format your response as JSON with these fields:
            - title: string
            - summary: string
            - key_insights: array of strings
            - mood_analysis: object with mood patterns and trends
            - recommendations: array of strings
            """
            
            try:
                # Generate summary using Gemini
                print("Calling Gemini API...")
                response = gemini_model.generate_content(prompt)
                print(f"Gemini response received: {len(response.text)} characters")
                
                try:
                    # Parse JSON response
                    import json
                    summary_data = json.loads(response.text)
                    print("Successfully parsed JSON response from Gemini")
                except json.JSONDecodeError as e:
                    print(f"JSON parsing failed: {e}")
                    # Fallback if JSON parsing fails
                    summary_data = {
                        'title': f"Session Summary - {session['title']}",
                        'summary': response.text,
                        'key_insights': ["AI-generated insights from conversation"],
                        'mood_analysis': {"patterns": "Analyzed from conversation"},
                        'recommendations': ["Continue supportive dialogue"]
                    }
            except Exception as gemini_error:
                print(f"Gemini API error: {gemini_error}")
                # Fallback when Gemini fails
                summary_data = {
                    'title': f"Session Summary - {session['title']}",
                    'summary': f"This is a summary of your conversation session '{session['title']}'. The session contained {len(messages)} messages. AI analysis was temporarily unavailable, but the conversation has been recorded for future reference.",
                    'key_insights': [
                        f"Session contained {len(messages)} messages",
                        "Conversation was recorded successfully",
                        "AI analysis temporarily unavailable"
                    ],
                    'mood_analysis': {"patterns": "Analysis temporarily unavailable"},
                    'recommendations': [
                        "Continue engaging in supportive conversations",
                        "Session data has been preserved",
                        "AI analysis will be available in future sessions"
                    ]
                }
        
        # Save summary to database
        print("Saving summary to database...")
        summary_record = {
            'session_id': session_id,
            'user_id': user['id'],
            'summary_title': summary_data.get('title', f"Session Summary - {session['title']}"),
            'summary_content': summary_data.get('summary', 'Summary content not available'),
            'key_insights': summary_data.get('key_insights', []),
            'mood_analysis': summary_data.get('mood_analysis', {}),
            'recommendations': summary_data.get('recommendations', [])
        }
        
        result = supabase.table('collaboration_summaries').insert(summary_record).execute()
        
        if result.data:
            print("Summary saved successfully")
            return jsonify({
                'message': 'Collaboration summary generated successfully',
                'summary': result.data[0]
            }), 200
        else:
            print("Failed to save summary to database")
            return jsonify({'error': 'Failed to save summary'}), 500
            
    except Exception as e:
        print(f"Unexpected error in collaboration summary generation: {str(e)}")
        return jsonify({'error': f'Failed to generate summary: {str(e)}'}), 500

@chat_bp.route('/collaboration-summaries', methods=['GET'])
def get_collaboration_summaries():
    """Get all collaboration summaries for the authenticated user"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        # Get user's collaboration summaries with session info
        result = supabase.table('collaboration_summaries').select('''
            *,
            chat_sessions (
                id,
                title,
                created_at
            )
        ''').eq('user_id', user['id']).order('generated_at', desc=True).execute()
        
        return jsonify({
            'summaries': result.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get summaries: {str(e)}'}), 500

@chat_bp.route('/collaboration-summary/<summary_id>', methods=['GET'])
def get_collaboration_summary(summary_id):
    """Get a specific collaboration summary"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        # Get specific summary
        result = supabase.table('collaboration_summaries').select('''
            *,
            chat_sessions (
                id,
                title,
                created_at
            )
        ''').eq('id', summary_id).eq('user_id', user['id']).execute()
        
        if not result.data:
            return jsonify({'error': 'Summary not found'}), 404
        
        return jsonify({
            'summary': result.data[0]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get summary: {str(e)}'}), 500

@chat_bp.route('/session-timer/start', methods=['POST'])
def start_session_timer():
    """Start timer for a session"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        data = request.get_json()
        if not data or 'session_id' not in data:
            return jsonify({'error': 'Session ID is required'}), 400
        
        session_id = data['session_id']
        
        # Verify session belongs to user
        session_result = supabase.table('chat_sessions').select('*').eq('id', session_id).eq('user_id', user['id']).eq('is_active', True).execute()
        
        if not session_result.data:
            return jsonify({'error': 'Session not found or access denied'}), 404
        
        # Check if timer already exists and is active
        existing_timer = supabase.table('session_timers').select('*').eq('session_id', session_id).eq('is_active', True).execute()
        
        if existing_timer.data:
            return jsonify({
                'message': 'Timer already running for this session',
                'timer': existing_timer.data[0]
            }), 200
        
        # Create new timer
        timer_data = {
            'session_id': session_id,
            'user_id': user['id'],
            'start_time': datetime.now().isoformat(),
            'is_active': True
        }
        
        result = supabase.table('session_timers').insert(timer_data).execute()
        
        if result.data:
            return jsonify({
                'message': 'Timer started successfully',
                'timer': result.data[0]
            }), 200
        else:
            return jsonify({'error': 'Failed to start timer'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Failed to start timer: {str(e)}'}), 500

@chat_bp.route('/session-timer/stop', methods=['POST'])
def stop_session_timer():
    """Stop timer for a session"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        data = request.get_json()
        if not data or 'session_id' not in data:
            return jsonify({'error': 'Session ID is required'}), 400
        
        session_id = data['session_id']
        
        # Get active timer for this session
        timer_result = supabase.table('session_timers').select('*').eq('session_id', session_id).eq('user_id', user['id']).eq('is_active', True).execute()
        
        if not timer_result.data:
            return jsonify({'error': 'No active timer found for this session'}), 404
        
        timer = timer_result.data[0]
        
        # Calculate total seconds
        start_time = datetime.fromisoformat(timer['start_time'].replace('Z', '+00:00'))
        end_time = datetime.now()
        total_seconds = int((end_time - start_time).total_seconds())
        
        # Update timer
        update_data = {
            'end_time': end_time.isoformat(),
            'total_seconds': total_seconds,
            'is_active': False
        }
        
        result = supabase.table('session_timers').update(update_data).eq('id', timer['id']).execute()
        
        if result.data:
            return jsonify({
                'message': 'Timer stopped successfully',
                'timer': result.data[0]
            }), 200
        else:
            return jsonify({'error': 'Failed to stop timer'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Failed to stop timer: {str(e)}'}), 500

@chat_bp.route('/session-timer/<session_id>', methods=['GET'])
def get_session_timer(session_id):
    """Get timer data for a session"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        # Get timer for this session
        result = supabase.table('session_timers').select('*').eq('session_id', session_id).eq('user_id', user['id']).order('created_at', desc=True).execute()
        
        if not result.data:
            return jsonify({'timer': None}), 200
        
        timer = result.data[0]
        
        # If timer is active, calculate current elapsed time
        if timer['is_active']:
            start_time = datetime.fromisoformat(timer['start_time'].replace('Z', '+00:00'))
            current_time = datetime.now()
            elapsed_seconds = int((current_time - start_time).total_seconds())
            timer['current_elapsed_seconds'] = elapsed_seconds
        
        return jsonify({'timer': timer}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get timer: {str(e)}'}), 500

@chat_bp.route('/session-timer/daily-total', methods=['GET'])
def get_daily_timer_total():
    """Get total session time for today"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        # Get today's date
        today = datetime.now().date()
        
        # Get all timers for today
        result = supabase.table('session_timers').select('total_seconds, is_active, start_time').eq('user_id', user['id']).gte('created_at', today.isoformat()).execute()
        
        total_seconds = 0
        
        for timer in result.data:
            if timer['is_active']:
                # Calculate current elapsed time for active timers
                start_time = datetime.fromisoformat(timer['start_time'].replace('Z', '+00:00'))
                current_time = datetime.now()
                elapsed_seconds = int((current_time - start_time).total_seconds())
                total_seconds += elapsed_seconds
            else:
                # Use stored total_seconds for completed timers
                total_seconds += timer['total_seconds']
        
        return jsonify({
            'daily_total_seconds': total_seconds,
            'daily_total_minutes': total_seconds // 60,
            'daily_total_hours': total_seconds // 3600
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get daily total: {str(e)}'}), 500

@chat_bp.route('/ai-service/health', methods=['GET'])
def check_ai_service_health():
    """Check if AI services (Gemini) are available"""
    try:
        user, error_response, status_code = require_auth()
        if error_response:
            return error_response, status_code
        
        health_status = {
            'gemini_available': gemini_model is not None,
            'gemini_api_key_configured': GEMINI_API_KEY is not None,
            'timestamp': datetime.now().isoformat()
        }
        
        if gemini_model:
            try:
                # Test Gemini with a simple request
                test_response = gemini_model.generate_content("Hello, this is a test. Please respond with 'OK'.")
                health_status['gemini_test_successful'] = True
                health_status['gemini_response_length'] = len(test_response.text)
            except Exception as e:
                health_status['gemini_test_successful'] = False
                health_status['gemini_error'] = str(e)
        
        return jsonify(health_status), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to check AI service health: {str(e)}'}), 500
