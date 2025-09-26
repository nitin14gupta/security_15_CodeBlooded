# SecurityApp - Advanced Security Platform

A modern, full-stack security application built with Next.js, Flask, and Supabase.

## Features

- 🎨 **Modern 3D UI** - Beautiful landing page with animated elements
- 🔐 **Authentication System** - Secure login/register with JWT tokens
- 👥 **User Management** - Support for both regular users and admins
- 🛡️ **Security Dashboard** - Comprehensive admin panel
- 📱 **Responsive Design** - Works on all devices
- 🔔 **Toast Notifications** - Real-time user feedback
- 🗄️ **Database Integration** - Supabase PostgreSQL backend

## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Context API** - State management

### Backend
- **Flask** - Python web framework
- **Supabase** - PostgreSQL database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd security_15_CodeBlooded
```

### 2. Frontend Setup
```bash
cd client
npm install
```

### 3. Backend Setup
```bash
cd server
pip install -r requirements.txt
```

### 4. Environment Configuration

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Backend (.env)
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_ACCESS_TOKEN_EXPIRES=86400000

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
```

### 5. Database Setup

1. Create a new Supabase project
2. Run the SQL queries from `server/queries.sql` in your Supabase SQL editor
3. Update your environment variables with Supabase credentials

### 6. Run the Application

#### Start the Backend
```bash
cd server
python main.py
```

#### Start the Frontend
```bash
cd client
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
security_15_CodeBlooded/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── context/       # React contexts
│   │   └── api/           # API configuration
│   └── package.json
├── server/                 # Flask backend
│   ├── routes/            # API routes
│   ├── db/               # Database configuration
│   └── main.py           # Flask app
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

### Admin (Protected)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{id}` - Get user details
- `PUT /api/admin/users/{id}/toggle-status` - Toggle user status
- `GET /api/admin/security-alerts` - Get security alerts
- `PUT /api/admin/security-alerts/{id}/resolve` - Resolve alert
- `GET /api/admin/audit-logs` - Get audit logs

## User Types

### Regular Users
- Access to `/main` dashboard
- Basic security features
- Profile management

### Admin Users
- Access to `/adminMain` dashboard
- User management
- System monitoring
- Security alerts

## Default Admin Account

Email: `admin@securityapp.com`
Password: `admin123`

## Features Overview

### Landing Page
- Modern 3D animated background
- Responsive design
- Call-to-action buttons
- Professional header and footer

### Authentication
- Secure password hashing with bcrypt
- JWT token-based authentication
- Session management
- Input validation

### Dashboards
- **User Dashboard**: Security status, profile management, quick actions
- **Admin Dashboard**: User statistics, system monitoring, security alerts

### Security Features
- Password strength validation
- JWT token expiration
- Session management
- Audit logging
- Admin access control

## Development

### Adding New Features
1. Create new routes in `server/routes/`
2. Update frontend components in `client/src/`
3. Add database migrations to `server/queries.sql`

### Database Migrations
Run SQL queries in your Supabase SQL editor to update the database schema.

## Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy to your platform
3. Set environment variables

### Backend (Railway/Heroku)
1. Install dependencies: `pip install -r requirements.txt`
2. Set environment variables
3. Deploy with your platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@securityapp.com or create an issue in the repository.


I'll explain the guardrails system in simple terms! Let me examine the code to understand what security features you have implemented.


[4 tools called]

# 🛡️ **SecurityApp Guardrails System - Simple Explanation**

Your SecurityApp has a **comprehensive security system** that acts like a **digital bouncer** for your AI chat application. Here's what each part does in simple terms:

## �� **1. PII Guard (Personal Information Protection)**
**What it does:** Protects users' private information like a privacy shield

**Detects and blocks:**
- 📧 **Email addresses** (john@example.com)
- 📞 **Phone numbers** (555-123-4567)
- �� **Social Security Numbers** (123-45-6789)
- 💳 **Credit card numbers** (4532-1234-5678-9012)
- �� **Home addresses** (123 Main St)
- 🌐 **IP addresses** (192.168.1.1)

**What happens when PII is found:**
- ✅ **Scrubs the data** - Replaces sensitive info with `[REDACTED]`
- ⚠️ **Warns the user** - Shows what type of PII was detected
- �� **Can block messages** - If scrubbing is disabled

## �� **2. Input Guard (Content Safety)**
**What it does:** Checks if messages are safe and appropriate

### **Toxicity Detection:**
- 🤖 **AI-powered** - Uses machine learning to detect harmful content
- �� **Categories:** Hate speech, threats, harassment, violence
- 📊 **Confidence scoring** - How sure the AI is that content is toxic

### **Input Validation:**
- 📏 **Length limits** - Messages can't be too short (1 char) or too long (2000 chars)
- 📝 **Word limits** - Between 1-300 words allowed
- 📄 **Line limits** - Maximum 20 lines
- 🔤 **Character rules** - Only allows safe characters

### **Spam Detection:**
- 🔄 **Repeated content** - Blocks messages with too much repetition
- 🔗 **URLs** - Can detect and block links
- �� **Excessive caps** - Blocks "ALL CAPS SPAM"
- 🏷️ **Hashtags/Mentions** - Detects social media patterns

## 🛡️ **3. Comprehensive Guardrails (The Master Controller)**
**What it does:** Combines all security checks into one smart system

**Processing Steps:**
1. ✅ **Input Validation** - Is the message format okay?
2. �� **Toxicity Check** - Is the content harmful?
3. �� **Content Analysis** - Does it contain restricted topics?
4. �� **PII Detection** - Does it have personal information?
5. �� **Risk Assessment** - How dangerous is this message?

**Risk Levels:**
- 🟢 **LOW** - Safe message, no issues
- 🟡 **MEDIUM** - Some concerns, but processable
- 🔴 **HIGH** - Dangerous content, should be blocked

## ⏱️ **4. Rate Limiting (Traffic Control)**
**What it does:** Prevents users from spamming your API

**Limits:**
- 🔐 **Login attempts:** 10 per minute
- 📝 **Registration:** 5 per minute  
- 💬 **Chat messages:** 30 per minute
- 🤖 **AI requests:** 20 per minute
- �� **Admin actions:** 100 per minute

## �� **5. Testing System**
The `test_guardrails.py` file lets you test all these features:

**Test Examples:**
```python
# PII Detection Test
"My email is john@example.com" → PII DETECTED ✅

# Toxicity Test  
"I hate this system" → TOXIC CONTENT DETECTED ✅

# Spam Test
"BUY NOW BUY NOW BUY NOW" → SPAM DETECTED ✅
```

## 🎯 **How It All Works Together**

When a user sends a message:

1. **📥 Message arrives** → System starts security checks
2. **�� PII scan** → Looks for personal information
3. **�� Toxicity check** → AI analyzes for harmful content  
4. **📏 Format validation** → Checks length, characters, etc.
5. **🛡️ Final decision** → Safe to process or block?

**Possible Outcomes:**
- ✅ **Process normally** - Message is safe
- ⚠️ **Process with warnings** - Some issues but allowed
- �� **Block completely** - Too dangerous to process
- 🔄 **Scrub and process** - Remove PII then process

## �� **Benefits for Your App**

- 🛡️ **User Protection** - Keeps personal data safe
- 🤖 **AI Safety** - Prevents harmful AI interactions
- 📊 **Compliance** - Helps with privacy regulations
- 🚫 **Spam Prevention** - Stops abuse and spam
- 📈 **Quality Control** - Ensures good user experience

This system makes your SecurityApp **enterprise-ready** with professional-grade security that protects both users and your platform! 🎉