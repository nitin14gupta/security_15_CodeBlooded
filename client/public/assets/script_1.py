# Create sample code implementations for key components of the AI Guardrail System

# 1. Flask App Main Entry Point
flask_app_code = '''"""
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
'''

# 2. Toxicity Detection Service
toxicity_detector_code = '''"""
Toxicity Detection using multiple APIs and libraries
"""
import requests
import os
from detoxify import Detoxify
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class ToxicityResult:
    is_toxic: bool
    toxicity_score: float
    categories: Dict[str, float]
    method_used: str
    confidence: float

class ToxicityDetector:
    def __init__(self):
        self.perspective_api_key = os.getenv('PERSPECTIVE_API_KEY')
        self.detoxify_model = Detoxify('unbiased')
        self.toxicity_threshold = 0.7
        
    def detect_toxicity(self, text: str) -> ToxicityResult:
        """
        Detect toxicity using multiple methods with fallback
        """
        try:
            # Primary: Google Perspective API
            if self.perspective_api_key:
                result = self._perspective_api_check(text)
                if result:
                    return result
            
            # Fallback: Detoxify library
            return self._detoxify_check(text)
            
        except Exception as e:
            logging.error(f"Toxicity detection error: {e}")
            # Conservative approach - block if error
            return ToxicityResult(
                is_toxic=True,
                toxicity_score=1.0,
                categories={"error": 1.0},
                method_used="error_fallback",
                confidence=0.0
            )
    
    def _perspective_api_check(self, text: str) -> Optional[ToxicityResult]:
        """Check toxicity using Google Perspective API"""
        try:
            url = f'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key={self.perspective_api_key}'
            
            data = {
                'comment': {'text': text},
                'requestedAttributes': {
                    'TOXICITY': {},
                    'SEVERE_TOXICITY': {},
                    'IDENTITY_ATTACK': {},
                    'INSULT': {},
                    'PROFANITY': {},
                    'THREAT': {}
                }
            }
            
            response = requests.post(url, json=data, timeout=5)
            response.raise_for_status()
            
            result = response.json()
            scores = result['attributeScores']
            
            toxicity_score = scores['TOXICITY']['summaryScore']['value']
            is_toxic = toxicity_score > self.toxicity_threshold
            
            categories = {
                'toxicity': scores['TOXICITY']['summaryScore']['value'],
                'severe_toxicity': scores.get('SEVERE_TOXICITY', {}).get('summaryScore', {}).get('value', 0),
                'identity_attack': scores.get('IDENTITY_ATTACK', {}).get('summaryScore', {}).get('value', 0),
                'insult': scores.get('INSULT', {}).get('summaryScore', {}).get('value', 0),
                'profanity': scores.get('PROFANITY', {}).get('summaryScore', {}).get('value', 0),
                'threat': scores.get('THREAT', {}).get('summaryScore', {}).get('value', 0)
            }
            
            return ToxicityResult(
                is_toxic=is_toxic,
                toxicity_score=toxicity_score,
                categories=categories,
                method_used="perspective_api",
                confidence=0.9
            )
            
        except Exception as e:
            logging.warning(f"Perspective API failed: {e}")
            return None
    
    def _detoxify_check(self, text: str) -> ToxicityResult:
        """Check toxicity using Detoxify library"""
        result = self.detoxify_model.predict(text)
        
        toxicity_score = result.get('toxicity', 0)
        is_toxic = toxicity_score > self.toxicity_threshold
        
        return ToxicityResult(
            is_toxic=is_toxic,
            toxicity_score=toxicity_score,
            categories=result,
            method_used="detoxify",
            confidence=0.8
        )

# Usage example
if __name__ == "__main__":
    detector = ToxicityDetector()
    
    test_texts = [
        "Hello, how are you today?",
        "You are such an idiot!",
        "I disagree with your opinion, but respect your right to have it."
    ]
    
    for text in test_texts:
        result = detector.detect_toxicity(text)
        print(f"Text: {text}")
        print(f"Toxic: {result.is_toxic}, Score: {result.toxicity_score:.3f}, Method: {result.method_used}")
        print("-" * 50)
'''

# 3. PII Detection and Scrubbing
pii_detector_code = '''"""
PII Detection and Scrubbing using multiple approaches
"""
import re
import hashlib
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging

@dataclass
class PIIResult:
    has_pii: bool
    pii_types: List[str]
    cleaned_text: str
    redacted_items: Dict[str, List[str]]

class PIIDetector:
    def __init__(self):
        # Regex patterns for common PII
        self.patterns = {
            'email': re.compile(r'\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'),
            'phone': re.compile(r'(?:\\+?1[-\\s]?)?\\(?\\d{3}\\)?[-\\s]?\\d{3}[-\\s]?\\d{4}'),
            'ssn': re.compile(r'\\b\\d{3}-\\d{2}-\\d{4}\\b'),
            'credit_card': re.compile(r'\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b'),
            'ip_address': re.compile(r'\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b'),
            'name': re.compile(r'\\b[A-Z][a-z]+ [A-Z][a-z]+\\b'),  # Simple name pattern
            'address': re.compile(r'\\d+\\s+[A-Za-z\\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)', re.IGNORECASE)
        }
        
        # Replacement strategies
        self.replacements = {
            'email': '[EMAIL]',
            'phone': '[PHONE]',
            'ssn': '[SSN]',
            'credit_card': '[CREDIT_CARD]',
            'ip_address': '[IP_ADDRESS]',
            'name': '[NAME]',
            'address': '[ADDRESS]'
        }
    
    def detect_and_scrub_pii(self, text: str) -> PIIResult:
        """
        Detect and remove/replace PII in text
        """
        has_pii = False
        pii_types = []
        redacted_items = {}
        cleaned_text = text
        
        for pii_type, pattern in self.patterns.items():
            matches = pattern.findall(text)
            if matches:
                has_pii = True
                pii_types.append(pii_type)
                redacted_items[pii_type] = matches
                
                # Replace with placeholder
                cleaned_text = pattern.sub(self.replacements[pii_type], cleaned_text)
                
                # Log PII detection (without logging the actual PII)
                logging.warning(f"PII detected: {pii_type}, count: {len(matches)}")
        
        return PIIResult(
            has_pii=has_pii,
            pii_types=pii_types,
            cleaned_text=cleaned_text,
            redacted_items=redacted_items
        )
    
    def hash_pii(self, pii_value: str) -> str:
        """Hash PII for logging purposes"""
        return hashlib.sha256(pii_value.encode()).hexdigest()[:8]
    
    def advanced_pii_detection(self, text: str) -> PIIResult:
        """
        Advanced PII detection using more sophisticated patterns
        Could be extended to use Microsoft Presidio or other libraries
        """
        # This would integrate with Microsoft Presidio or AWS Comprehend
        # For now, using the basic regex approach
        return self.detect_and_scrub_pii(text)

# Usage example
if __name__ == "__main__":
    detector = PIIDetector()
    
    test_texts = [
        "My email is john.doe@example.com and phone is 555-123-4567",
        "Hello, this is a normal message without PII",
        "My SSN is 123-45-6789 and I live at 123 Main Street"
    ]
    
    for text in test_texts:
        result = detector.detect_and_scrub_pii(text)
        print(f"Original: {text}")
        print(f"Cleaned: {result.cleaned_text}")
        print(f"PII Found: {result.pii_types}")
        print("-" * 50)
'''

# 4. Chat Route Implementation
chat_routes_code = '''"""
Chat API Routes with Guardrail Integration
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from guardrails.input_filter import InputFilter
from guardrails.output_validator import OutputValidator
from services.ai_service import AIService
from services.logging_service import log_interaction
from models.conversation import Conversation
import time

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """
    Process user message through all guardrails before sending to AI
    """
    start_time = time.time()
    user_id = get_jwt_identity()
    
    try:
        # Get user input
        data = request.get_json()
        user_message = data.get('message', '').strip()
        conversation_id = data.get('conversation_id')
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Initialize services
        input_filter = InputFilter()
        output_validator = OutputValidator()
        ai_service = AIService()
        
        # STEP 1: Input Guardrails
        input_result = input_filter.validate_input(user_message, user_id)
        
        if not input_result.is_valid:
            # Log violation
            log_interaction(
                user_id=user_id,
                input_message=user_message,
                output_message=None,
                violation_type='input_violation',
                violation_details=input_result.violations,
                processing_time=time.time() - start_time
            )
            
            return jsonify({
                'error': 'Message violates content policy',
                'details': input_result.violations,
                'suggestions': input_result.suggestions
            }), 400
        
        # Use cleaned input (PII scrubbed)
        cleaned_message = input_result.cleaned_message
        
        # STEP 2: Send to AI Model
        ai_response = ai_service.generate_response(
            message=cleaned_message,
            user_id=user_id,
            conversation_id=conversation_id
        )
        
        if not ai_response:
            return jsonify({'error': 'AI service unavailable'}), 503
        
        # STEP 3: Output Guardrails
        output_result = output_validator.validate_response(
            ai_response, cleaned_message, user_id
        )
        
        if not output_result.is_valid:
            # Log violation and try regeneration
            log_interaction(
                user_id=user_id,
                input_message=user_message,
                output_message=ai_response,
                violation_type='output_violation',
                violation_details=output_result.violations,
                processing_time=time.time() - start_time
            )
            
            # Try regenerating response
            ai_response = ai_service.generate_safe_response(cleaned_message)
        
        # Use validated response
        final_response = output_result.safe_response or ai_response
        
        # STEP 4: Save conversation and log interaction
        conversation = Conversation.create_or_update(
            user_id=user_id,
            conversation_id=conversation_id,
            user_message=user_message,
            ai_response=final_response
        )
        
        log_interaction(
            user_id=user_id,
            input_message=user_message,
            output_message=final_response,
            violation_type=None,
            processing_time=time.time() - start_time,
            conversation_id=conversation.id
        )
        
        return jsonify({
            'response': final_response,
            'conversation_id': conversation.id,
            'processing_time': round(time.time() - start_time, 3),
            'guardrails_passed': True
        })
        
    except Exception as e:
        current_app.logger.error(f"Chat error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@chat_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get user's conversation history"""
    user_id = get_jwt_identity()
    
    try:
        conversations = Conversation.get_user_conversations(user_id)
        return jsonify({
            'conversations': [conv.to_dict() for conv in conversations]
        })
    except Exception as e:
        return jsonify({'error': 'Failed to fetch conversations'}), 500

@chat_bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    """Delete a conversation"""
    user_id = get_jwt_identity()
    
    try:
        result = Conversation.delete_user_conversation(user_id, conversation_id)
        if result:
            return jsonify({'message': 'Conversation deleted'})
        else:
            return jsonify({'error': 'Conversation not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to delete conversation'}), 500
'''

# Save all code samples to files
code_samples = {
    'flask_app.py': flask_app_code,
    'toxicity_detector.py': toxicity_detector_code,
    'pii_detector.py': pii_detector_code,
    'chat_routes.py': chat_routes_code
}

# Write code samples to files
for filename, code in code_samples.items():
    with open(f'sample_{filename}', 'w') as f:
        f.write(code.strip())

print("Sample Code Files Created:")
print("=" * 40)
for filename in code_samples.keys():
    print(f"✓ sample_{filename}")

# Create a requirements.txt file
requirements_txt = '''# AI Guardrail System Requirements

# Flask and Web Framework
Flask==3.0.0
Flask-CORS==4.0.0
Flask-JWT-Extended==4.6.0
Flask-SQLAlchemy==3.1.1

# AI and ML Libraries
openai==1.3.5
anthropic==0.8.1
detoxify==0.5.2
transformers==4.35.2
torch==2.1.1

# Content Moderation and PII Detection
google-api-python-client==2.108.0
presidio-analyzer==2.2.33
presidio-anonymizer==2.2.33

# Database and Storage
SQLAlchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1

# Security and Authentication
bcrypt==4.1.2
PyJWT==2.8.0
cryptography==41.0.8

# Monitoring and Logging
structlog==23.2.0
prometheus-client==0.19.0

# Utilities
python-dotenv==1.0.0
requests==2.31.0
validators==0.22.0
python-dateutil==2.8.2

# Development and Testing
pytest==7.4.3
pytest-flask==1.3.0
black==23.11.0
flake8==6.1.0
'''

with open('sample_requirements.txt', 'w') as f:
    f.write(requirements_txt.strip())

print("✓ sample_requirements.txt")
print("\nTotal files created: 5")
print("\nThese files provide a complete starting framework for implementing")
print("the AI Guardrail System with Flask backend!")