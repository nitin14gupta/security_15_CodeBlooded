"""
Input Guardrails Utility for Toxicity Detection and Input Validation
"""
import re
from typing import Dict, List, Tuple, Optional
from detoxify import Detoxify

class InputGuard:
    def __init__(self):
        """Initialize toxicity detection and validation rules"""
        try:
            self.toxicity_model = Detoxify('original')
            self.toxicity_initialized = True
        except Exception as e:
            print(f"Warning: Failed to initialize Detoxify: {e}")
            self.toxicity_model = None
            self.toxicity_initialized = False
        
        self.restricted_topics = [
            'violence', 'hate speech', 'discrimination', 'harassment',
            'illegal activities', 'drug abuse', 'self harm', 'suicide',
            'terrorism', 'weapons', 'explicit content', 'grooming'
        ]
        
        self.restricted_keywords = [
            'kill', 'murder', 'suicide', 'bomb', 'terrorist', 'hate',
            'discriminate', 'harass', 'abuse', 'violence', 'weapon',
            'drug', 'illegal', 'explicit', 'porn', 'groom'
        ]
        
        self.validation_rules = {
            'max_length': 2000,
            'min_length': 1,
            'max_words': 300,
            'min_words': 1,
            'max_lines': 20,
            'allowed_chars': r'^[a-zA-Z0-9\s\.,!?@#$%^&*()_+\-=\[\]{}|;:"<>/~`\n\r]*$'
        }
        
        self.spam_patterns = [
            r'(.)\1{4,}',
            r'https?://\S+',
            r'@\w+',
            r'#\w+',
            r'\b[A-Z]{3,}\b',
        ]
    
    def detect_toxicity(self, text: str, threshold: float = 0.7) -> Dict:
        """
        Detect toxicity in text using Detoxify
        
        Args:
            text (str): Input text to analyze
            threshold (float): Toxicity threshold (0.0 to 1.0)
            
        Returns:
            Dict: Toxicity analysis results
        """
        if not self.toxicity_initialized:
            return {
                'is_toxic': False,
                'confidence': 0.0,
                'categories': {},
                'error': 'Toxicity detection not available'
            }
        
        try:
            results = self.toxicity_model.predict(text)
            
            max_score = max(results.values())
            max_category = max(results, key=results.get)
            
            is_toxic = max_score >= threshold
            
            return {
                'is_toxic': is_toxic,
                'confidence': max_score,
                'max_category': max_category,
                'categories': results,
                'threshold_used': threshold
            }
            
        except Exception as e:
            return {
                'is_toxic': False,
                'confidence': 0.0,
                'categories': {},
                'error': f'Toxicity detection failed: {str(e)}'
            }
    
    def validate_input(self, text: str) -> Dict:
        """
        Validate input text against various rules
        
        Args:
            text (str): Input text to validate
            
        Returns:
            Dict: Validation results
        """
        validation_results = {
            'is_valid': True,
            'violations': [],
            'warnings': [],
            'stats': {}
        }
        
        validation_results['stats'] = {
            'length': len(text),
            'word_count': len(text.split()),
            'line_count': len(text.split('\n')),
            'char_count': len(text.replace(' ', ''))
        }
        
        if len(text) < self.validation_rules['min_length']:
            validation_results['violations'].append({
                'type': 'min_length',
                'message': f'Message too short (minimum {self.validation_rules["min_length"]} characters)',
                'value': len(text),
                'required': self.validation_rules['min_length']
            })
            validation_results['is_valid'] = False
        
        if len(text) > self.validation_rules['max_length']:
            validation_results['violations'].append({
                'type': 'max_length',
                'message': f'Message too long (maximum {self.validation_rules["max_length"]} characters)',
                'value': len(text),
                'required': self.validation_rules['max_length']
            })
            validation_results['is_valid'] = False
        
        word_count = len(text.split())
        if word_count < self.validation_rules['min_words']:
            validation_results['violations'].append({
                'type': 'min_words',
                'message': f'Message has too few words (minimum {self.validation_rules["min_words"]} words)',
                'value': word_count,
                'required': self.validation_rules['min_words']
            })
            validation_results['is_valid'] = False
        
        if word_count > self.validation_rules['max_words']:
            validation_results['violations'].append({
                'type': 'max_words',
                'message': f'Message has too many words (maximum {self.validation_rules["max_words"]} words)',
                'value': word_count,
                'required': self.validation_rules['max_words']
            })
            validation_results['is_valid'] = False
        
        line_count = len(text.split('\n'))
        if line_count > self.validation_rules['max_lines']:
            validation_results['violations'].append({
                'type': 'max_lines',
                'message': f'Message has too many lines (maximum {self.validation_rules["max_lines"]} lines)',
                'value': line_count,
                'required': self.validation_rules['max_lines']
            })
            validation_results['is_valid'] = False
        
        if not re.match(self.validation_rules['allowed_chars'], text):
            validation_results['violations'].append({
                'type': 'invalid_chars',
                'message': 'Message contains invalid characters',
                'value': 'Invalid characters detected'
            })
            validation_results['is_valid'] = False
        
        return validation_results
    
    def check_restricted_content(self, text: str) -> Dict:
        """
        Check for restricted topics and keywords
        
        Args:
            text (str): Input text to check
            
        Returns:
            Dict: Restricted content analysis
        """
        text_lower = text.lower()
        
        found_keywords = []
        for keyword in self.restricted_keywords:
            if keyword.lower() in text_lower:
                found_keywords.append(keyword)
        
        spam_detected = []
        for pattern in self.spam_patterns:
            matches = re.findall(pattern, text)
            if matches:
                spam_detected.append({
                    'pattern': pattern,
                    'matches': matches[:5]
                })
        
        # Check for excessive repetition
        repetition_warning = False
        words = text.split()
        if len(words) > 10:
            word_counts = {}
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1
            
            # Check words that appear too frequently
            for word, count in word_counts.items():
                if count > len(words) * 0.3:
                    repetition_warning = True
                    break
        
        has_restricted_content = len(found_keywords) > 0 or len(spam_detected) > 0
        
        return {
            'has_restricted_content': has_restricted_content,
            'found_keywords': found_keywords,
            'spam_patterns': spam_detected,
            'repetition_warning': repetition_warning,
            'risk_level': self._assess_content_risk(found_keywords, spam_detected)
        }
    
    def _assess_content_risk(self, keywords: List[str], spam_patterns: List[Dict]) -> str:
        """Assess risk level based on restricted content"""
        if len(keywords) >= 3 or len(spam_patterns) >= 2:
            return "HIGH"
        elif len(keywords) >= 1 or len(spam_patterns) >= 1:
            return "MEDIUM"
        else:
            return "LOW"
    
    def comprehensive_check(self, text: str, toxicity_threshold: float = 0.7) -> Dict:
        """
        Perform comprehensive input validation and content analysis
        
        Args:
            text (str): Input text to analyze
            toxicity_threshold (float): Toxicity detection threshold
            
        Returns:
            Dict: Comprehensive analysis results
        """
        toxicity_results = self.detect_toxicity(text, toxicity_threshold)
        validation_results = self.validate_input(text)
        content_results = self.check_restricted_content(text)
        
        is_safe = (
            not toxicity_results.get('is_toxic', False) and
            validation_results['is_valid'] and
            not content_results['has_restricted_content']
        )
        
        recommendations = []
        if toxicity_results.get('is_toxic'):
            recommendations.append("Message contains toxic content. Please revise your message.")
        
        if not validation_results['is_valid']:
            recommendations.append("Message violates input validation rules.")
        
        if content_results['has_restricted_content']:
            recommendations.append("Message contains restricted content or spam patterns.")
        
        return {
            'is_safe': is_safe,
            'toxicity': toxicity_results,
            'validation': validation_results,
            'content_analysis': content_results,
            'recommendations': recommendations,
            'summary': {
                'safe_to_process': is_safe,
                'requires_moderation': not is_safe,
                'risk_level': max(
                    toxicity_results.get('confidence', 0),
                    content_results['risk_level']
                )
            }
        }

input_guard = InputGuard()
