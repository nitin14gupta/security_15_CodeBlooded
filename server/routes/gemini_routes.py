from flask import Blueprint, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.guardrails import guardrails_service

# Load environment variables
load_dotenv()

gemini_bp = Blueprint('gemini', __name__)

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
else:
    model = None

@gemini_bp.route('/chat', methods=['POST'])
def chat_with_gemini():
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        user_message = data['message']
        user_id = data.get('user_id')  # Optional user ID for logging
        
        if not model:
            return jsonify({'error': 'Gemini API not configured'}), 500
        
        # Apply guardrails to user message
        guardrails_result = guardrails_service.process_message(user_message, user_id)
        
        # Check if message should be blocked
        if guardrails_result['should_block']:
            return jsonify({
                'error': 'Message blocked by guardrails',
                'warnings': guardrails_result['warnings'],
                'risk_level': guardrails_result['risk_level'],
                'blocked_reasons': guardrails_result['processing_log']
            }), 400
        
        # Use processed message (PII scrubbed if applicable)
        processed_message = guardrails_result['processed_message']
        
        # Generate response using Gemini with processed message
        response = model.generate_content(processed_message)
        
        # Prepare response with guardrails info
        response_data = {
            'response': response.text,
            'model': GEMINI_MODEL,
            'guardrails_applied': {
                'pii_detected': guardrails_result['pii_detected'],
                'pii_scrubbed': guardrails_result['pii_scrubbed'],
                'risk_level': guardrails_result['risk_level'],
                'warnings': guardrails_result['warnings'] if guardrails_result['warnings'] else None
            }
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Chat failed: {str(e)}'}), 500

@gemini_bp.route('/analyze-safety', methods=['POST'])
def analyze_message_safety():
    """Analyze message safety without processing it"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        message = data['message']
        
        # Get comprehensive safety report
        safety_report = guardrails_service.get_safety_report(message)
        
        return jsonify(safety_report), 200
        
    except Exception as e:
        return jsonify({'error': f'Safety analysis failed: {str(e)}'}), 500

@gemini_bp.route('/health', methods=['GET'])
def gemini_health():
    return jsonify({
        'status': 'healthy',
        'model': GEMINI_MODEL,
        'configured': model is not None,
        'guardrails_enabled': True,
        'guardrails_config': guardrails_service.get_config()
    })
