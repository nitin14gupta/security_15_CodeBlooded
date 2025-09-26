import os
from typing import Any, Dict, List
import json
import requests

class AIInsightsService:
    def __init__(self) -> None:
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
        self.enabled = bool(self.api_key)

    def generate_insights(self, patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not self.enabled:
            # Fallback basic structure
            return {
                'summary': 'AI insights unavailable. Set OPENAI_API_KEY to enable.',
                'explanations': [
                    'Connect an AI provider to generate detailed, pattern-aware insights.'
                ],
                'risk_management': [],
                'entry_signals': [],
                'exit_signals': [],
                'confidence_notes': [],
            }

        # Build prompt for Gemini
        prompt = (
            "You are an expert trading assistant. Given detected chart patterns with confidences, "
            "produce a concise professional analysis. Include: \n"
            "1) Overall market context assumptions;\n"
            "2) Pattern explanations and implications;\n"
            "3) Probable entry signals and invalidation levels;\n"
            "4) Exit/target strategies and risk management;\n"
            "5) Confidence considerations based on signal overlap.\n"
            "Return STRICT JSON with keys: summary (string), explanations (array), entry_signals (array), "
            "exit_signals (array), risk_management (array), confidence_notes (array). Do not include any prose outside JSON.\n"
            f"Patterns: {patterns}"
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        headers = {
            'Content-Type': 'application/json',
            'X-goog-api-key': self.api_key,
        }
        payload = {
            "contents": [
                {
                    "parts": [
                        { "text": prompt }
                    ]
                }
            ]
        }

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=20)
            resp.raise_for_status()
            data_json = resp.json()
            # Extract text
            content_text = (
                data_json.get('candidates', [{}])[0]
                .get('content', {})
                .get('parts', [{}])[0]
                .get('text', '{}')
            )
            # Try parse as-is, otherwise extract JSON substring
            try:
                data = json.loads(content_text)
            except Exception:
                # Best-effort JSON extraction
                start = content_text.find('{')
                end = content_text.rfind('}')
                if start != -1 and end != -1 and end > start:
                    snippet = content_text[start:end+1]
                    data = json.loads(snippet)
                else:
                    raise ValueError('No JSON payload in model response')
            # Ensure keys exist
            for key in ['summary','explanations','entry_signals','exit_signals','risk_management','confidence_notes']:
                data.setdefault(key, [] if key != 'summary' else '')
            return data
        except Exception:
            return {
                'summary': 'AI insights unavailable or parsing failed. Check GEMINI_API_KEY/GEMINI_MODEL.',
                'explanations': [],
                'entry_signals': [],
                'exit_signals': [],
                'risk_management': [],
                'confidence_notes': [],
            }


ai_insights_service = AIInsightsService()


