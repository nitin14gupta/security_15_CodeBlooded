from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import asyncio
from db.config import db_config
from routes.auth_routes import auth_bp
from routes.google_auth_routes import auth_google_bp
from routes.apple_auth_routes import auth_apple_bp
from routes.push_routes import push_bp
from routes.iap_routes import iap_bp
from routes.analysis_routes import analysis_bp
from utils.push_service import push_service
import random
from db.config import db_config

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app, origins=['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006', 'http://192.168.0.105:19006', 'exp://192.168.*.*:8081'])
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(auth_google_bp)
    app.register_blueprint(auth_apple_bp)
    app.register_blueprint(push_bp)
    app.register_blueprint(iap_bp)
    app.register_blueprint(analysis_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Chart Ai API is running',
            'version': '1.0.0'
        })
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Welcome to Chart Ai API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'health': '/api/health'
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

def setup_database():
    """Initialize database tables"""
    try:
        db_config.create_tables()
    except Exception as e:
        print(f"Database setup warning: {e}")

if __name__ == '__main__':
    # Setup database
    setup_database()
    
    # Create and run app
    app = create_app()

    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"🚀 Starting Chart Ai API server on port {port}")
    print(f"📊 Database: Supabase")
    print(f"🔐 Auth: JWT + bcrypt")
    print(f"📧 Email: SMTP")
    
    app.run(host='0.0.0.0', port=port, debug=debug)