from flask import Blueprint, request, jsonify
from db.config import db_config
from utils.auth_utils import auth_utils
import os
import requests
import bcrypt
import uuid
from datetime import datetime


auth_google_bp = Blueprint('auth_google', __name__, url_prefix='/api/auth')

def _validate_google_id_token(id_token: str):
    try:
        resp = requests.get('https://oauth2.googleapis.com/tokeninfo', params={'id_token': id_token}, timeout=8)
        if resp.status_code != 200:
            return None, 'Invalid Google token'
        data = resp.json()

        aud = data.get('aud')
        if not aud:
            return None, 'Invalid Google token (no aud)'

        allowed_auds = set(filter(None, [
            os.getenv('GOOGLE_CLIENT_ID_ANDROID'),
            os.getenv('GOOGLE_CLIENT_ID_IOS'),
            os.getenv('GOOGLE_CLIENT_ID_WEB'),
        ]))

        if allowed_auds and aud not in allowed_auds:
            return None, 'Google token audience mismatch'

        return data, None
    except Exception as e:
        return None, str(e)


@auth_google_bp.route('/google', methods=['POST'])
def login_with_google():
    try:
        body = request.get_json() or {}
        id_token = body.get('id_token')
        if not id_token:
            return jsonify({'error': 'id_token is required'}), 400

        token_info, err = _validate_google_id_token(id_token)
        if err or not token_info:
            return jsonify({'error': err or 'Invalid Google token'}), 401

        email = token_info.get('email')
        email_verified = str(token_info.get('email_verified', 'false')).lower() == 'true'
        sub = token_info.get('sub')  # Google user ID

        if not email:
            return jsonify({'error': 'Google token missing email'}), 400

        # Find or create user in Supabase
        existing = db_config.supabase.table('users').select('*').eq('email', email).limit(1).execute()
        if existing.data:
            user = existing.data[0]
        else:
            # Create user with a random password hash (OAuth only)
            random_password = uuid.uuid4().hex
            password_hash = bcrypt.hashpw(random_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            insert_payload = {
                'email': email,
                'password_hash': password_hash,
                'is_verified': email_verified,
                'onboarding_data': None,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat(),
            }
            created = db_config.supabase.table('users').insert(insert_payload).execute()
            if not created.data:
                return jsonify({'error': 'Failed to create user'}), 500
            user = created.data[0]

        # Issue our JWT
        token = auth_utils.generate_jwt_token(user_id=str(user['id']), email=email)

        return jsonify({
            'message': 'Google sign-in successful',
            'token': token,
            'user': {
                'id': str(user['id']),
                'email': user['email'],
                'is_verified': bool(user.get('is_verified', True)),
                'onboarding_data': user.get('onboarding_data'),
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


