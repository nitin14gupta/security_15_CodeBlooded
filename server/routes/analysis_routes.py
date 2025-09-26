from flask import Blueprint, request, jsonify
from PIL import Image
import base64
import io

from utils.yolo_service import get_chart_analyzer
from utils.ai_insights import ai_insights_service
from utils.auth_utils import auth_utils
from db.config import db_config


analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/analysis')


def image_to_base64(img_pil: Image.Image) -> str:
    buffered = io.BytesIO()
    img_pil.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()
    return base64.b64encode(img_bytes).decode('utf-8')


@analysis_bp.route('/analyze-chart', methods=['POST'])
def analyze_chart():
    try:
        if 'chart' not in request.files:
            return jsonify({'error': 'No chart file uploaded (field name: chart)'}), 400

        file = request.files['chart']
        image = Image.open(file.stream).convert('RGB')

        analyzer = get_chart_analyzer()
        patterns, annotated = analyzer.analyze_pil(image)

        # AI-generated insights
        insights = ai_insights_service.generate_insights(patterns)

        img_b64 = image_to_base64(annotated)

        result_payload = {
            'patterns_detected': patterns,
            'summary': f"{len(patterns)} pattern(s) detected.",
            'annotated_image': f"data:image/png;base64,{img_b64}",
            'insights': insights,
        }

        # If authenticated, persist to analysis_history
        user_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = auth_utils.verify_jwt_token(token)
            if payload:
                user_id = payload.get('user_id')

        if user_id:
            try:
                db_config.supabase.table('analysis_history').insert({
                    'user_id': user_id,
                    'summary': result_payload['summary'],
                    'patterns_detected': result_payload['patterns_detected'],
                    'insights': result_payload.get('insights'),
                    'annotated_image': result_payload['annotated_image'],
                }).execute()
            except Exception:
                # Non-fatal: continue even if saving fails
                pass

        return jsonify(result_payload)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/history', methods=['GET'])
def get_history():
    try:
        # Require auth
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        token = auth_header.split(' ')[1]
        payload = auth_utils.verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Unauthorized'}), 401
        user_id = payload.get('user_id')

        # Pagination
        try:
            limit = int(request.args.get('limit', '20'))
        except Exception:
            limit = 20
        try:
            offset = int(request.args.get('offset', '0'))
        except Exception:
            offset = 0

        # Fetch limit+1 to determine has_more
        page_size = max(1, min(100, limit))
        query = (
            db_config.supabase
            .table('analysis_history')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', desc=True)
            .range(offset, offset + page_size)
        )
        res = query.execute()
        items = res.data or []

        # If more than requested, trim and set has_more
        has_more = False
        if len(items) > page_size:
            items = items[:page_size]
            has_more = True
        else:
            # Check if there might be more by probing next item if exactly page_size
            has_more = len(items) == page_size

        return jsonify({
            'items': items,
            'has_more': has_more,
            'offset': offset,
            'limit': page_size,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


