# ChartAi API Endpoints Documentation

## Base URL
```
http://192.168.0.104:5000
```

## Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Health Check

### GET /api/health
Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "message": "Chart Ai API is running",
  "version": "1.0.0"
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "onboarding_answers": {
    "experience_level": "beginner",
    "investment_goals": ["long_term"],
    "risk_tolerance": "conservative",
    "trading_type": "swing"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "is_premium": false,
    "subscription_expires_at": null
  },
  "token": "jwt_token_here"
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "is_premium": false,
    "subscription_expires_at": null
  },
  "token": "jwt_token_here"
}
```

### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "new_password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## Google Authentication

### POST /api/auth/google
Login/Register with Google.

**Request Body:**
```json
{
  "id_token": "google_id_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Google authentication successful",
  "user": {
    "id": "user_id",
    "email": "user@gmail.com",
    "is_premium": false,
    "subscription_expires_at": null
  },
  "token": "jwt_token_here"
}
```

---

## Apple Authentication

### POST /api/auth/apple
Login/Register with Apple.

**Request Body:**
```json
{
  "identity_token": "apple_identity_token",
  "nonce": "nonce_string",
  "given_name": "John",
  "family_name": "Doe",
  "email": "user@privaterelay.appleid.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Apple authentication successful",
  "user": {
    "id": "user_id",
    "email": "user@privaterelay.appleid.com",
    "is_premium": false,
    "subscription_expires_at": null
  },
  "token": "jwt_token_here"
}
```

---

## Push Notifications

### POST /api/push/register
Register push notification token.

**Request Body:**
```json
{
  "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "user_id": "user_id_optional"
}
```

**Response:**
```json
{
  "message": "Push token registered",
  "data": {
    "id": "token_id",
    "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "user_id": "user_id"
  }
}
```

### POST /api/push/send-test
Send test push notification.

**Request Body:**
```json
{
  "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "user_id": "user_id",
  "title": "Test Notification",
  "body": "This is a test message",
  "data": {
    "custom_key": "custom_value"
  }
}
```

**Response:**
```json
{
  "message": "Sent",
  "result": {
    "data": [
      {
        "status": "ok",
        "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    ]
  }
}
```

---

## In-App Purchases (IAP)

### POST /api/iap/verify-receipt
Verify purchase receipt.

**Request Body:**
```json
{
  "receipt_data": "base64_encoded_receipt",
  "platform": "ios" // or "android"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Receipt verified successfully",
  "subscription": {
    "is_active": true,
    "expires_at": "2024-12-31T23:59:59Z",
    "product_id": "com.chartai.premium.yearly"
  }
}
```

### POST /api/iap/update-subscription
Update user subscription status.

**Request Body:**
```json
{
  "user_id": "user_id",
  "product_id": "com.chartai.premium.yearly",
  "purchase_date": "2024-01-01T00:00:00Z",
  "expires_date": "2024-12-31T23:59:59Z",
  "is_trial": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "user": {
    "id": "user_id",
    "is_premium": true,
    "subscription_expires_at": "2024-12-31T23:59:59Z"
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)"
}
```

### Common Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

### Example Error Response

```json
{
  "error": "Invalid email format",
  "code": "VALIDATION_ERROR",
  "details": "Email must be a valid email address"
}
```

---

## Rate Limiting

- All endpoints have a rate limit of 100 requests per minute per IP
- Authentication endpoints have a rate limit of 10 requests per minute per IP
- Push notification endpoints have a rate limit of 50 requests per minute per IP

---

## CORS

The API supports CORS for the following origins:
- `http://localhost:3000`
- `http://localhost:8081`
- `http://localhost:19006`
- `http://192.168.0.105:19006`
- `exp://192.168.*.*:8081`

---

## Database

The API uses Supabase as the database backend with the following main tables:

- `users` - User accounts and profiles
- `push_tokens` - Push notification tokens
- `subscriptions` - User subscription data
- `onboarding_answers` - User onboarding responses

---

## Environment Variables

Required environment variables:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT
JWT_SECRET=your_jwt_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Push Notifications
EXPO_PUSH_ACCESS_TOKEN=your_expo_access_token

# Server
PORT=5000
FLASK_DEBUG=True
```

---

## Testing

You can test the API using tools like:
- Postman
- curl
- Insomnia
- Thunder Client (VS Code extension)

### Example curl commands:

```bash
# Health check
curl -X GET http://192.168.0.104:5000/api/health

# Register user
curl -X POST http://192.168.0.104:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","onboarding_answers":{}}'

# Login
curl -X POST http://192.168.0.104:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## Support

For API support or questions, please contact:
- Email: support@chartai.app
- Documentation: This file
- Version: 1.0.0
