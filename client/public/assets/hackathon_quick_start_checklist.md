# AI Guardrails Hackathon - Quick Start Checklist

## Pre-Hackathon Setup (Do This First!)

### API Keys and Accounts (30 minutes)
- [ ] Create Google Cloud account and get Perspective API key
- [ ] Sign up for OpenAI and get API key  
- [ ] (Optional) Get Anthropic Claude API key
- [ ] Test all API keys work with simple curl requests

### Development Environment (20 minutes)
- [ ] Install Python 3.9+ and Node.js 18+
- [ ] Install Flask: `pip install flask flask-cors flask-jwt-extended`
- [ ] Install content moderation: `pip install detoxify google-api-python-client`
- [ ] Install AI libraries: `pip install openai anthropic`
- [ ] Create Next.js app: `npx create-next-app@latest frontend`
- [ ] Install frontend deps: `cd frontend && npm install axios`

### Project Structure (15 minutes)
- [ ] Create main project folder: `ai_guardrail_hackathon`
- [ ] Create backend folder with Flask app
- [ ] Create frontend folder with Next.js
- [ ] Copy provided code samples to respective folders
- [ ] Set up environment variables (.env files)
- [ ] Test basic Flask app runs on :5000
- [ ] Test basic Next.js app runs on :3000

## Day 1 Goals (Foundation Day)

### Morning Sprint (4 hours)
- [ ] 🔐 Implement JWT authentication (Flask + Next.js)
- [ ] 💬 Create basic chat interface (send/receive messages)  
- [ ] 🤖 Integrate OpenAI API for basic AI responses
- [ ] 🗄️ Set up SQLite database with user table
- [ ] ✅ Test: User can register, login, and chat with AI

### Afternoon Sprint (4 hours) 
- [ ] 🛡️ Add toxicity detection (Perspective API)
- [ ] 🔍 Implement basic PII detection (regex patterns)
- [ ] ⚠️ Create input validation and error handling
- [ ] 📊 Add basic logging for all interactions
- [ ] ✅ Test: System blocks toxic inputs and scrubs PII

## Day 2 Goals (Core Guardrails)

### Morning Sprint (5 hours)
- [ ] 🔄 Add output validation for AI responses
- [ ] 🚦 Implement rate limiting (per user)
- [ ] 👥 Add role-based access (Admin vs User)
- [ ] 📋 Create admin dashboard (basic version)
- [ ] ✅ Test: All guardrails working end-to-end

### Afternoon Sprint (4 hours)
- [ ] 📈 Add violation monitoring and alerts
- [ ] 🔍 Create audit log viewer in admin panel
- [ ] 🎛️ Add guardrail configuration (thresholds)
- [ ] 🧪 Comprehensive testing with edge cases
- [ ] ✅ Test: Admin can monitor and configure system

## Day 3 Goals (Polish & Demo Prep)

### Morning Sprint (4 hours)
- [ ] 🎨 Improve UI/UX (styling, responsiveness)
- [ ] 📊 Add system statistics and metrics
- [ ] 🚨 Implement real-time violation notifications
- [ ] 📝 Create user management features
- [ ] ✅ Test: System looks professional and polished

### Afternoon Sprint (4 hours)  
- [ ] 🏃‍♀️ Performance optimization and bug fixes
- [ ] 📖 Write documentation (API docs, README)
- [ ] 🎬 Prepare demo script and test runs
- [ ] 📹 Record demo video (optional)
- [ ] ✅ Final testing: Everything works smoothly

## Critical Success Factors

### Must-Have Features (MVP)
1. ✅ User authentication and authorization
2. ✅ AI chat functionality with OpenAI
3. ✅ Input toxicity detection and blocking
4. ✅ PII detection and scrubbing
5. ✅ Basic audit logging
6. ✅ Admin monitoring dashboard

### Demo Scenarios (Prepare These)
1. 🤝 Normal conversation - show baseline functionality
2. 🚫 Toxic input - demonstrate input filtering
3. 🔒 PII input - show data protection
4. 👨‍💻 Admin view - display monitoring capabilities
5. 📊 Audit logs - transparency and accountability

### Emergency Fallbacks
- If Perspective API fails → Use Detoxify library
- If OpenAI fails → Use simple rule-based responses  
- If database fails → Use in-memory storage
- If frontend breaks → Focus on API demonstration
- If complex features fail → Simplify but keep core working

## Time Management Strategy

- **60% Core Functionality**: Authentication, chat, basic guardrails
- **25% Polish**: UI/UX, admin dashboard, monitoring
- **15% Buffer**: Testing, bug fixes, demo preparation

## Pre-Demo Checklist (30 minutes before)

- [ ] All services running (Flask on :5000, Next.js on :3000)
- [ ] Test user registration and login
- [ ] Test normal chat conversation
- [ ] Test toxic input blocking  
- [ ] Test PII detection
- [ ] Test admin dashboard access
- [ ] Prepare demo data (test accounts, sample conversations)
- [ ] Clean up UI and remove debug outputs
- [ ] Ensure all API keys are working
- [ ] Have backup plans ready

## Emergency Contact & Resources

### Documentation
- Flask: https://flask.palletsprojects.com/
- Next.js: https://nextjs.org/docs
- Perspective API: https://developers.perspectiveapi.com/s/
- OpenAI API: https://platform.openai.com/docs

### Debugging
- Check browser console for frontend errors
- Check Flask terminal for backend errors  
- Verify API keys are set correctly
- Test API endpoints with curl/Postman
- Check CORS settings if requests fail

Remember: Focus on getting core functionality working first, then add polish. A simple working system beats a complex broken one! 🚀