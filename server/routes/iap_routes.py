from flask import Blueprint, request, jsonify
from db.config import db_config
import os
import requests
from datetime import datetime, timedelta

iap_bp = Blueprint('iap', __name__, url_prefix='/api/iap')


def verify_with_apple(receipt_data: str, is_sandbox: bool):
    url = 'https://sandbox.itunes.apple.com/verifyReceipt' if is_sandbox else 'https://buy.itunes.apple.com/verifyReceipt'
    secret = os.getenv('ITUNES_SHARED_SECRET') or os.getenv('IOS_ITUNES_SHARED_SECRET')
    payload = {
        'receipt-data': receipt_data,
        'password': secret,
        'exclude-old-transactions': True,
    }
    resp = requests.post(url, json=payload, timeout=15)
    resp.raise_for_status()
    return resp.json()


@iap_bp.route('/verify-ios', methods=['POST'])
def verify_ios():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        receipt = data.get('receipt_data')
        product_id = data.get('product_id')
        is_sandbox = bool(data.get('sandbox', True))

        if not receipt or not user_id:
            return jsonify({'error': 'receipt_data and user_id are required'}), 400

        result = verify_with_apple(receipt, is_sandbox)

        status = result.get('status')
        if status == 21007 and not is_sandbox:
            # Receipt is from sandbox, retry there
            result = verify_with_apple(receipt, True)
            status = result.get('status')

        if status != 0:
            return jsonify({'success': False, 'apple_status': status, 'result': result}), 400

        # Mark user premium with a conservative expiry based on productId
        plan = 'weekly' if product_id and 'week' in product_id.lower() else 'yearly'
        expires_at = datetime.utcnow() + (timedelta(days=7) if plan == 'weekly' else timedelta(days=365))

        supabase = db_config.get_client()
        upd = supabase.table('users').update({
            'is_premium': True,
            'subscription_plan': plan,
            'subscription_expires_at': expires_at.isoformat() + 'Z'
        }).eq('id', user_id).execute()

        return jsonify({'success': True, 'plan': plan, 'expires_at': expires_at.isoformat() + 'Z', 'apple': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


