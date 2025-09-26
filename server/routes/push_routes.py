from flask import Blueprint, request, jsonify
from db.config import db_config
import requests
import os

push_bp = Blueprint('push', __name__, url_prefix='/api/push')


@push_bp.route('/register', methods=['POST'])
def register_push_token():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        expo_push_token = data.get('expo_push_token')

        if not expo_push_token:
            return jsonify({'error': 'expo_push_token is required'}), 400

        # Optional: associate with authenticated user if provided
        supabase = db_config.get_client()

        # Upsert token by token string to avoid duplicates
        upsert_payload = {
            'user_id': user_id,
            'expo_push_token': expo_push_token,
        }

        response = supabase.table('push_tokens').upsert(upsert_payload, on_conflict='expo_push_token').execute()

        return jsonify({
            'message': 'Push token registered',
            'data': response.data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@push_bp.route('/send-test', methods=['POST'])
def send_test_push():
    try:
        data = request.get_json() or {}
        expo_push_token = data.get('expo_push_token')
        user_id = data.get('user_id')

        if not expo_push_token and not user_id:
            return jsonify({'error': 'Provide expo_push_token or user_id'}), 400

        supabase = db_config.get_client()

        target_tokens = []
        if expo_push_token:
            target_tokens = [expo_push_token]
        else:
            res = supabase.table('push_tokens').select('expo_push_token').eq('user_id', user_id).execute()
            target_tokens = [row['expo_push_token'] for row in (res.data or [])]

        if not target_tokens:
            return jsonify({'error': 'No tokens found for target'}), 404

        # Send via Expo Push API
        expo_endpoint = 'https://exp.host/--/api/v2/push/send'
        messages = [{
            'to': t,
            'sound': 'default',
            'title': data.get('title') or 'ChartAi',
            'body': data.get('body') or 'Welcome to ChartAi',
            'data': data.get('data') or {'_test': True},
        } for t in target_tokens]

        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
        # Optional access token header if using push security
        access_token = os.getenv('EXPO_PUSH_ACCESS_TOKEN')
        if access_token:
            headers['Authorization'] = f'Bearer {access_token}'

        resp = requests.post(expo_endpoint, json=messages, headers=headers, timeout=10)
        resp.raise_for_status()
        result = resp.json()

        return jsonify({'message': 'Sent', 'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


