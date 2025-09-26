"""
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