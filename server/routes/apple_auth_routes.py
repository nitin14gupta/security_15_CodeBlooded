from flask import Blueprint, request, jsonify
from db.config import db_config
from utils.auth_utils import auth_utils
import bcrypt
import uuid
import jwt
import requests
from datetime import datetime


auth_apple_bp = Blueprint('auth_apple', __name__, url_prefix='/api/auth')


def _get_apple_public_keys():
    """Get Apple's public keys for JWT verification"""
    try:
        response = requests.get('https://appleid.apple.com/auth/keys', timeout=10)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Error fetching Apple public keys: {e}")
        return None


def _verify_apple_id_token(identity_token: str, raw_nonce: str):
    """Verify Apple ID token and extract user info"""
    try:
        # Get Apple's public keys
        keys_response = _get_apple_public_keys()
        if not keys_response:
            return None, "Failed to fetch Apple public keys"

        # Decode token header to get key ID
        unverified_header = jwt.get_unverified_header(identity_token)
        kid = unverified_header.get('kid')
        
        if not kid:
            return None, "No key ID in token header"

        # Find the matching public key
        public_key = None
        for key in keys_response.get('keys', []):
            if key.get('kid') == kid:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break

        if not public_key:
            return None, "No matching public key found"

        # Verify and decode the token
        payload = jwt.decode(
            identity_token,
            public_key,
            algorithms=['RS256'],
            audience='com.chartai.app',  # Your app's bundle ID
            issuer='https://appleid.apple.com'
        )

        # Verify nonce
        if payload.get('nonce') != raw_nonce:
            return None, "Nonce mismatch"

        return payload, None

    except jwt.ExpiredSignatureError:
        return None, "Token has expired"
    except jwt.InvalidTokenError as e:
        return None, f"Invalid token: {str(e)}"
    except Exception as e:
        return None, f"Token verification error: {str(e)}"


@auth_apple_bp.route('/apple', methods=['POST'])
def login_with_apple():
    try:
        data = request.get_json() or {}
        identity_token = data.get('identityToken')
        raw_nonce = data.get('rawNonce')
        given_name = data.get('givenName')
        family_name = data.get('familyName')
        email = data.get('email')

        if not identity_token or not raw_nonce:
            return jsonify({'error': 'identityToken and rawNonce are required'}), 400

        # Verify Apple ID token
        payload, error = _verify_apple_id_token(identity_token, raw_nonce)
        if error or not payload:
            return jsonify({'error': error or 'Invalid Apple token'}), 401

        # Extract user info from token
        apple_user_id = payload.get('sub')
        token_email = payload.get('email')
        
        # Use email from token if not provided in request
        if not email and token_email:
            email = token_email

        if not email:
            return jsonify({'error': 'No email found in Apple token'}), 400

        # Find or create user in Supabase
        existing = db_config.supabase.table('users').select('*').eq('email', email).limit(1).execute()
        if existing.data:
            user = existing.data[0]
        else:
            # Create user with a random password hash (OAuth only)
            random_password = uuid.uuid4().hex
            password_hash = bcrypt.hashpw(random_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Build name from Apple data
            full_name = None
            if given_name or family_name:
                name_parts = []
                if given_name:
                    name_parts.append(given_name)
                if family_name:
                    name_parts.append(family_name)
                full_name = ' '.join(name_parts)

            insert_payload = {
                'email': email,
                'password_hash': password_hash,
                'is_verified': True,  # Apple emails are verified
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
            'message': 'Apple sign-in successful',
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
