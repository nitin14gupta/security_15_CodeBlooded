# Rate Limiting Implementation

This document describes the rate limiting implementation for the SecurityApp API.

## Overview

Rate limiting has been implemented using Flask-Limiter to protect the API from abuse and ensure fair usage. The default rate limit is set to **50 requests per minute** per IP address.

## Configuration

Rate limiting can be configured through environment variables in your `.env` file:

```env
# Rate Limiting Configuration
RATE_LIMIT_ENABLED=True
RATE_LIMIT_DEFAULT=50 per minute
RATE_LIMIT_STORAGE_URL=memory://
```

### Configuration Options

- `RATE_LIMIT_ENABLED`: Enable/disable rate limiting (True/False)
- `RATE_LIMIT_DEFAULT`: Default rate limit for all endpoints
- `RATE_LIMIT_STORAGE_URL`: Storage backend for rate limiting data

## Rate Limits by Endpoint Type

### Global Rate Limits
- **Default**: 50 requests per minute per IP
- **Health Check**: 50 requests per minute per IP

### Authentication Endpoints
- **Register**: 5 requests per minute per IP
- **Login**: 10 requests per minute per IP
- **Logout**: 20 requests per minute per IP
- **Refresh Token**: 30 requests per minute per IP

### API Endpoints
- **Admin**: 100 requests per minute per IP
- **Chat**: 30 requests per minute per IP
- **Gemini**: 20 requests per minute per IP

## Error Handling

When rate limits are exceeded, the API returns a `429 Too Many Requests` status code with the following response:

```json
{
    "error": "Rate limit exceeded",
    "message": "Too many requests. Please try again later.",
    "retry_after": 60
}
```

## Storage Backends

The rate limiting system supports different storage backends:

- `memory://` - In-memory storage (default, not persistent across restarts)
- `redis://localhost:6379` - Redis storage (recommended for production)
- `memcached://localhost:11211` - Memcached storage

## Testing Rate Limiting

A test script is provided to verify rate limiting functionality:

```bash
python test_rate_limiting.py
```

This script will:
1. Make normal requests to verify the API is working
2. Make rapid requests to trigger rate limiting
3. Test authentication endpoints with stricter limits

## Production Considerations

For production deployment:

1. **Use Redis Storage**: Configure `RATE_LIMIT_STORAGE_URL=redis://your-redis-server:6379`
2. **Monitor Rate Limits**: Set up monitoring for 429 responses
3. **Adjust Limits**: Fine-tune rate limits based on your application's needs
4. **Whitelist IPs**: Consider whitelisting trusted IPs if needed

## Implementation Details

The rate limiting is implemented using:

- **Flask-Limiter**: Main rate limiting library
- **IP-based limiting**: Uses client IP address for rate limiting
- **Per-endpoint limits**: Different limits for different endpoint types
- **Graceful degradation**: Returns proper error messages when limits are exceeded

## Files Modified

- `main.py` - Main Flask app with rate limiter configuration
- `db/config.py` - Rate limiting configuration variables
- `utils/rate_limiting.py` - Rate limiting utilities
- `requirements.txt` - Added Flask-Limiter dependency
- `env.example` - Added rate limiting configuration examples
- `test_rate_limiting.py` - Test script for rate limiting
