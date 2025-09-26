# AI Guardrail System - Deployment Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (for production)
- Redis (for caching)

## Backend Deployment (Flask)

### 1. Environment Setup
```bash
cd backend/
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Variables
Create `.env` file:
```
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://user:password@localhost/ai_guardrail_db

# API Keys
PERSPECTIVE_API_KEY=your-perspective-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Security
BCRYPT_LOG_ROUNDS=12
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Guardrail Settings
TOXICITY_THRESHOLD=0.7
PII_DETECTION_MODE=strict
RATE_LIMIT_PER_MINUTE=10
```

### 3. Database Setup
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### 4. Run Backend
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Frontend Deployment (Next.js)

### 1. Environment Setup
```bash
cd frontend/
npm install
```

### 2. Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=AI Guardrail System
```

### 3. Build and Run
```bash
npm run build
npm start
```

## Production Deployment

### Using Docker

#### Backend Dockerfile
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ai_guardrail
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000/api
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=ai_guardrail
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
docker-compose up -d
```

## Security Checklist

✅ Set strong SECRET_KEY and JWT_SECRET_KEY
✅ Enable HTTPS in production
✅ Set proper CORS origins
✅ Use environment variables for all secrets
✅ Enable rate limiting
✅ Set up proper logging
✅ Configure database backups
✅ Set up monitoring and alerts
✅ Regular security updates

## Monitoring

### Health Check Endpoints
- Backend: `GET /api/health`
- Frontend: `GET /`

### Key Metrics to Monitor
- Response times
- Error rates
- Guardrail violation rates
- API rate limits
- Database performance
- Memory and CPU usage

## Scaling Considerations

1. **Horizontal Scaling**: Use load balancers for multiple backend instances
2. **Database**: Use read replicas for better performance
3. **Caching**: Implement Redis for session and response caching
4. **CDN**: Use CDN for frontend static assets
5. **API Rate Limiting**: Implement per-user and global rate limits