from flask import Blueprint, request, jsonify, current_app
from flask_limiter.util import get_remote_address
import bcrypt
import jwt
import hashlib
from datetime import datetime, timedelta
from db.config import supabase, supabase_admin, JWT_SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRES
import uuid

auth_bp = Blueprint('auth', __name__)

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_jwt_token(user_id: str, user_type: str) -> str:
    """Generate a JWT token for the user"""
    payload = {
        'user_id': user_id,
        'user_type': user_type,
        'exp': datetime.utcnow() + timedelta(milliseconds=JWT_ACCESS_TOKEN_EXPIRES),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

def verify_jwt_token(token: str) -> dict:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")

def hash_token(token: str) -> str:
    """Hash a token for storage"""
    return hashlib.sha256(token.encode()).hexdigest()

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password', 'user_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        name = data['name'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        user_type = data['user_type']
        
        # Extract onboarding data (optional)
        onboarding_data = data.get('onboarding', {})
        morning_preference = onboarding_data.get('morningPreference', '')
        day_color = onboarding_data.get('dayColor', '')
        mood_emoji = onboarding_data.get('moodEmoji', '')
        life_genre = onboarding_data.get('lifeGenre', '')
        weekly_goal = onboarding_data.get('weeklyGoal', '')
        favorite_app = onboarding_data.get('favoriteApp', '')
        onboarding_completed = bool(onboarding_data and any([
            morning_preference, day_color, mood_emoji, life_genre, weekly_goal, favorite_app
        ]))
        
        # Validate user_type
        if user_type not in ['user', 'admin']:
            return jsonify({'error': 'Invalid user type'}), 400
        
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Check if user already exists
        existing_user = supabase.table('users').select('id').eq('email', email).execute()
        if existing_user.data:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Hash password
        password_hash = hash_password(password)
        
        # Create user
        user_data = {
            'name': name,
            'email': email,
            'password_hash': password_hash,
            'user_type': user_type,
            'is_active': True,
            'morning_preference': morning_preference,
            'day_color': day_color,
            'mood_emoji': mood_emoji,
            'life_genre': life_genre,
            'weekly_goal': weekly_goal,
            'favorite_app': favorite_app,
            'onboarding_completed': onboarding_completed
        }
        
        result = supabase.table('users').insert(user_data).execute()
        
        if not result.data:
            return jsonify({'error': 'Failed to create user'}), 500
        
        user = result.data[0]
        
        # Generate JWT token
        token = generate_jwt_token(str(user['id']), user['user_type'])
        
        # Store session
        token_hash = hash_token(token)
        expires_at = datetime.utcnow() + timedelta(milliseconds=JWT_ACCESS_TOKEN_EXPIRES)
        
        session_data = {
            'user_id': user['id'],
            'token_hash': token_hash,
            'expires_at': expires_at.isoformat(),
            'is_active': True
        }
        
        supabase.table('user_sessions').insert(session_data).execute()
        
        # Log the registration
        audit_data = {
            'user_id': user['id'],
            'action': 'user_registered',
            'resource': 'users',
            'details': {'user_type': user_type},
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent')
        }
        supabase.table('audit_logs').insert(audit_data).execute()
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'user_type': user['user_type'],
                'created_at': user['created_at']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Find user by email
        result = supabase.table('users').select('*').eq('email', email).eq('is_active', True).execute()
        
        if not result.data:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        user = result.data[0]
        
        # Verify password
        if not verify_password(password, user['password_hash']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate JWT token
        token = generate_jwt_token(str(user['id']), user['user_type'])
        
        # Store session
        token_hash = hash_token(token)
        expires_at = datetime.utcnow() + timedelta(milliseconds=JWT_ACCESS_TOKEN_EXPIRES)
        
        session_data = {
            'user_id': user['id'],
            'token_hash': token_hash,
            'expires_at': expires_at.isoformat(),
            'is_active': True
        }
        
        supabase.table('user_sessions').insert(session_data).execute()
        
        # Log the login
        audit_data = {
            'user_id': user['id'],
            'action': 'user_login',
            'resource': 'auth',
            'details': {'user_type': user['user_type']},
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent')
        }
        supabase.table('audit_logs').insert(audit_data).execute()
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'user_type': user['user_type'],
                'created_at': user['created_at']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/verify', methods=['GET'])
def verify_token():
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        payload = verify_jwt_token(token)
        user_id = payload['user_id']
        
        # Check if session exists and is active
        token_hash = hash_token(token)
        session_result = supabase.table('user_sessions').select('*').eq('token_hash', token_hash).eq('is_active', True).execute()
        
        if not session_result.data:
            return jsonify({'error': 'Invalid or expired session'}), 401
        
        # Get user data
        user_result = supabase.table('users').select('id, name, email, user_type, created_at').eq('id', user_id).eq('is_active', True).execute()
        
        if not user_result.data:
            return jsonify({'error': 'User not found'}), 404
        
        user = user_result.data[0]
        
        return jsonify({
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'user_type': user['user_type'],
            'created_at': user['created_at']
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': f'Token verification failed: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token to get user_id
        payload = verify_jwt_token(token)
        user_id = payload['user_id']
        
        # Deactivate session
        token_hash = hash_token(token)
        supabase.table('user_sessions').update({'is_active': False}).eq('token_hash', token_hash).execute()
        
        # Log the logout
        audit_data = {
            'user_id': user_id,
            'action': 'user_logout',
            'resource': 'auth',
            'details': {},
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent')
        }
        supabase.table('audit_logs').insert(audit_data).execute()
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': f'Logout failed: {str(e)}'}), 500
