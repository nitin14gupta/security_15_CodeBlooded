from flask import Blueprint, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv

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
        
        if not model:
            return jsonify({'error': 'Gemini API not configured'}), 500
        
        # Generate response using Gemini
        response = model.generate_content(user_message)
        
        return jsonify({
            'response': response.text,
            'model': GEMINI_MODEL
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Chat failed: {str(e)}'}), 500

@gemini_bp.route('/health', methods=['GET'])
def gemini_health():
    return jsonify({
        'status': 'healthy',
        'model': GEMINI_MODEL,
        'configured': model is not None
    })
