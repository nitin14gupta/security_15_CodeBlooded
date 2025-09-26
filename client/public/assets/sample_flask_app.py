"""
AI Guardrail System - Main Flask Application
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from config import Config
from routes import auth_bp, chat_bp, admin_bp
from services.logging_service import setup_logging

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app, origins=['http://localhost:3000'])  # Next.js frontend
    jwt = JWTManager(app)

    # Setup logging
    setup_logging(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "version": "1.0.0"})

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)