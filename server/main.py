from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database configuration
from db.config import supabase, supabase_admin, JWT_SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRES, PORT, FLASK_DEBUG

# Import routes
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = JWT_SECRET_KEY

# Enable CORS for all routes
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"], supports_credentials=True)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

@app.route('/')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'SecurityApp API is running',
        'version': '1.0.0'
    })

@app.route('/api/health')
def api_health():
    try:
        # Test database connection
        result = supabase.table('users').select('count').execute()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': '2024-01-01T00:00:00Z'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print(f"Starting SecurityApp API server...")
    print(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"Debug mode: {FLASK_DEBUG}")
    print(f"Port: {PORT}")
    print(f"Supabase URL: {os.getenv('SUPABASE_URL', 'Not set')}")
    
    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=FLASK_DEBUG
    )
