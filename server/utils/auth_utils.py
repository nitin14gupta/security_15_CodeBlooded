import jwt
import bcrypt
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os

class AuthUtils:
    def __init__(self):
        self.jwt_secret = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
        # 100 days in seconds: 100 * 24 * 60 * 60 = 8,640,000
        self.jwt_expiry = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 8640000))
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def generate_jwt_token(self, user_id: str, email: str) -> str:
        """Generate JWT token for user"""
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': datetime.utcnow() + timedelta(seconds=self.jwt_expiry),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def decode_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode JWT token (alias for verify_jwt_token)"""
        return self.verify_jwt_token(token)
    
    def generate_reset_token(self) -> str:
        """Generate a secure reset token"""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    def generate_numeric_code(self, digits: int = 6) -> str:
        """Generate a numeric OTP code with fixed length"""
        alphabet = string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(max(4, digits)))
    
    def is_valid_email(self, email: str) -> bool:
        """Basic email validation"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

# Global auth utils instance
auth_utils = AuthUtils()