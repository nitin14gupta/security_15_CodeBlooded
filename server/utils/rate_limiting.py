"""
Rate limiting utilities for the SecurityApp API
"""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps
from db.config import RATE_LIMIT_ENABLED, RATE_LIMIT_DEFAULT, RATE_LIMIT_STORAGE_URL

def create_rate_limiter(app):
    """Create and configure the rate limiter"""
    return Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=[RATE_LIMIT_DEFAULT] if RATE_LIMIT_ENABLED else [],
        storage_uri=RATE_LIMIT_STORAGE_URL,
        enabled=RATE_LIMIT_ENABLED
    )

def rate_limit(limit_string):
    """Decorator for applying rate limits to specific routes"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # This will be handled by Flask-Limiter's global configuration
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Rate limit configurations for different endpoint types
AUTH_RATE_LIMITS = {
    'register': '5 per minute',
    'login': '10 per minute',
    'logout': '20 per minute',
    'refresh': '30 per minute'
}

API_RATE_LIMITS = {
    'default': '50 per minute',
    'admin': '100 per minute',
    'chat': '30 per minute',
    'gemini': '20 per minute'
}

def get_rate_limit_for_endpoint(endpoint_name):
    """Get the appropriate rate limit for an endpoint"""
    return API_RATE_LIMITS.get(endpoint_name, API_RATE_LIMITS['default'])
