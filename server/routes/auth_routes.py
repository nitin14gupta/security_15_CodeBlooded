from flask import Blueprint, request, jsonify
from db.config import db_config
from utils.auth_utils import auth_utils
from utils.email_service import email_service
import bcrypt
from datetime import datetime, timedelta


auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''
        onboarding_data = data.get('onboarding_data')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        # Check if user exists
        existing = db_config.supabase.table('users').select('id').eq('email', email).limit(1).execute()
        if existing.data:
            return jsonify({'error': 'User already exists'}), 409

        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        payload = {
            'email': email,
            'password_hash': password_hash,
            'is_verified': False,
            'onboarding_data': onboarding_data,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
        }

        created = db_config.supabase.table('users').insert(payload).execute()
        if not created.data:
            return jsonify({'error': 'Failed to create user'}), 500

        user = created.data[0]
        token = auth_utils.generate_jwt_token(user_id=str(user['id']), email=email)

        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user': {
                'id': str(user['id']),
                'email': user['email'],
                'is_verified': bool(user.get('is_verified', False)),
                'onboarding_data': user.get('onboarding_data')
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        found = db_config.supabase.table('users').select('*').eq('email', email).limit(1).execute()
        if not found.data:
            return jsonify({'error': 'Invalid credentials'}), 401

        user = found.data[0]
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401

        token = auth_utils.generate_jwt_token(user_id=str(user['id']), email=email)
        
        # Send login notification email
        login_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        device_info = request.headers.get('User-Agent', 'Unknown device')
        email_service.send_login_notification_email(email, login_time, device_info)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': str(user['id']),
                'email': user['email'],
                'is_verified': bool(user.get('is_verified', False)),
                'onboarding_data': user.get('onboarding_data')
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    try:
        data = request.get_json() or {}
        token = data.get('token')
        if not token:
            return jsonify({'error': 'Token is required'}), 400

        payload = auth_utils.verify_jwt_token(token)
        if not payload:
            return jsonify({'success': False, 'valid': False}), 200

        user_id = payload.get('user_id')
        user_res = db_config.supabase.table('users').select('*').eq('id', user_id).limit(1).execute()
        if not user_res.data:
            return jsonify({'success': False, 'valid': False}), 200

        user = user_res.data[0]
        return jsonify({
            'success': True,
            'valid': True,
            'user': {
                'id': str(user['id']),
                'email': user['email'],
                'is_verified': bool(user.get('is_verified', False)),
                'onboarding_data': user.get('onboarding_data')
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        # Check if user exists
        user_result = db_config.supabase.table('users').select('id, email').eq('email', email).limit(1).execute()
        if not user_result.data:
            # Don't reveal if email exists or not for security
            return jsonify({'success': True, 'message': 'If the email exists, a reset code has been sent'}), 200

        user = user_result.data[0]
        
        # Generate 6-digit code
        reset_code = auth_utils.generate_numeric_code(6)
        
        # Store reset code in database with expiration
        reset_data = {
            'user_id': user['id'],
            'token': reset_code,
            'expires_at': (datetime.utcnow() + timedelta(minutes=10)).isoformat(),
            'used': False,
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Delete any existing reset tokens for this user
        db_config.supabase.table('password_reset_tokens').delete().eq('user_id', user['id']).execute()
        
        # Insert new reset token
        db_config.supabase.table('password_reset_tokens').insert(reset_data).execute()
        
        # Send email with reset code
        email_sent = email_service.send_password_reset_code(email, reset_code)
        
        if email_sent:
            return jsonify({'success': True, 'message': 'Reset code sent to your email'}), 200
        else:
            return jsonify({'error': 'Failed to send reset code'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        code = data.get('code', '').strip()
        new_password = data.get('new_password', '')

        if not email or not code or not new_password:
            return jsonify({'error': 'Email, code, and new password are required'}), 400

        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400

        # Find user
        user_result = db_config.supabase.table('users').select('id, email').eq('email', email).limit(1).execute()
        if not user_result.data:
            return jsonify({'error': 'Invalid email or code'}), 400

        user = user_result.data[0]
        
        # Find valid reset token
        token_result = db_config.supabase.table('password_reset_tokens').select('*').eq('user_id', user['id']).eq('token', code).eq('used', False).limit(1).execute()
        
        if not token_result.data:
            return jsonify({'error': 'Invalid or expired code'}), 400

        reset_token = token_result.data[0]
        
        # Check if token is expired
        expires_at = datetime.fromisoformat(reset_token['expires_at'].replace('Z', '+00:00'))
        if datetime.utcnow() > expires_at:
            return jsonify({'error': 'Code has expired'}), 400

        # Hash new password
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update user password
        db_config.supabase.table('users').update({
            'password_hash': password_hash,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', user['id']).execute()
        
        # Mark token as used
        db_config.supabase.table('password_reset_tokens').update({
            'used': True,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', reset_token['id']).execute()
        
        # Send password changed notification email
        email_service.send_password_changed_email(email)
        
        return jsonify({'success': True, 'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
