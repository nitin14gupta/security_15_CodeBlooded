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
