"""
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