"""
Output Guardrails Service
Validates AI-generated responses for safety, appropriateness, and quality
"""
import re
import logging
import time
import random
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from detoxify import Detoxify

@dataclass
class OutputValidationResult:
    is_safe: bool
    violations: List[str]
    cleaned_response: str
    confidence_score: float
    processing_time: float
    fallback_used: bool = False
    risk_level: str = "LOW"

class OutputValidator:
    def __init__(self):
        """Initialize the output validation service"""
        # Initialize toxicity detector for AI responses
        try:
            self.detoxify_model = Detoxify('unbiased')
        except Exception as e:
            logging.warning(f"Failed to load Detoxify model: {e}")
            self.detoxify_model = None
        
        # Configuration
        self.toxicity_threshold = 0.7
        self.pii_threshold = 0.5
        self.min_response_length = 5
        self.max_response_length = 2000
        self.max_repetition_ratio = 0.3

        # PII patterns for output validation
        self.pii_patterns = {
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'(?:\+?1[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}'),
            'ssn': re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
            'credit_card': re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b'),
            'ip_address': re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'),
            'address': re.compile(r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b', re.IGNORECASE)
        }

        # Prohibited content patterns
        self.prohibited_patterns = [
            r'\b(?:kill|murder|suicide|harm|violence)\b',
            r'\b(?:hack|crack|pirate|illegal|steal)\b',
            r'\b(?:drug|cocaine|heroin|meth|weed|marijuana)\b',
            r'\b(?:bomb|weapon|gun|knife|explosive)\b',
            r'\b(?:terrorist|terrorism|attack|threat)\b'
        ]

        # Fallback responses for blocked content
        self.fallback_responses = [
            "I understand you're looking for information, but I can't provide that type of content. How else can I help you?",
            "I'm not able to generate that kind of response. Let's discuss something else instead.",
            "I'd prefer not to go in that direction. Is there another way I can assist you?",
            "That's not something I can help with. What else would you like to talk about?",
            "I'm designed to be helpful and safe. Can we explore a different topic?",
            "I can't provide that information, but I'm happy to help with other questions you might have.",
            "Let's focus on something more constructive. How can I assist you today?"
        ]

    def validate_ai_response(self, ai_response: str, original_user_input: str = "") -> OutputValidationResult:
        """
        Comprehensive validation of AI-generated responses
        
        Args:
            ai_response (str): The AI-generated response to validate
            original_user_input (str): The original user input for context
            
        Returns:
            OutputValidationResult: Validation results with safety status
        """
        start_time = time.time()
        violations = []
        cleaned_response = ai_response
        is_safe = True
        fallback_used = False
        risk_level = "LOW"

        try:
            # 1. Toxicity Check on AI Response
            toxicity_result = self._check_response_toxicity(ai_response)
            if not toxicity_result['is_safe']:
                violations.extend(toxicity_result['violations'])
                is_safe = False
                risk_level = "HIGH"

            # 2. PII Detection in AI Response
            pii_result = self._check_response_pii(ai_response)
            if not pii_result['is_safe']:
                violations.extend(pii_result['violations'])
                cleaned_response = pii_result['cleaned_text']
                if pii_result['should_block']:
                    is_safe = False
                    risk_level = "HIGH"

            # 3. Prohibited Content Check
            prohibited_result = self._check_prohibited_content(ai_response)
            if not prohibited_result['is_safe']:
                violations.extend(prohibited_result['violations'])
                is_safe = False
                risk_level = "HIGH"

            # 4. Content Alignment Check (basic)
            alignment_result = self._check_content_alignment(ai_response, original_user_input)
            if not alignment_result['is_safe']:
                violations.extend(alignment_result['violations'])
                if risk_level == "LOW":
                    risk_level = "MEDIUM"

            # 5. Response Length and Quality Check
            quality_result = self._check_response_quality(ai_response)
            if not quality_result['is_safe']:
                violations.extend(quality_result['violations'])
                if risk_level == "LOW":
                    risk_level = "MEDIUM"
            
            # Update risk level based on violations
            if len(violations) > 0:
                if any('toxic' in v or 'prohibited' in v or 'pii' in v for v in violations):
                    risk_level = "HIGH"
                elif len(violations) >= 2:
                    risk_level = "MEDIUM"
                else:
                    risk_level = "MEDIUM"

            # Only use fallback for serious violations
            serious_violations = [v for v in violations if any(serious in v for serious in ['toxic', 'prohibited', 'pii_in_output_credit_card', 'pii_in_output_ssn'])]
            
            if not is_safe or len(serious_violations) > 0:
                cleaned_response = self._get_fallback_response()
                fallback_used = True
                is_safe = False

            processing_time = time.time() - start_time
            confidence_score = self._calculate_confidence_score(violations)

            # Log the validation result
            self._log_output_validation(ai_response, is_safe, violations, processing_time)

            return OutputValidationResult(
                is_safe=is_safe,
                violations=violations,
                cleaned_response=cleaned_response,
                confidence_score=confidence_score,
                processing_time=processing_time,
                fallback_used=fallback_used,
                risk_level=risk_level
            )

        except Exception as e:
            logging.error(f"Output validation error: {e}")
            # Conservative approach - use fallback on error
            return OutputValidationResult(
                is_safe=False,
                violations=["output_validation_error"],
                cleaned_response=self._get_fallback_response(),
                confidence_score=0.0,
                processing_time=time.time() - start_time,
                fallback_used=True,
                risk_level="HIGH"
            )

    def _check_response_toxicity(self, text: str) -> Dict:
        """Check if AI response contains toxic content"""
        try:
            if self.detoxify_model is None:
                # Fallback to basic keyword detection if Detoxify is not available
                toxic_keywords = ['hate', 'stupid', 'idiot', 'kill', 'die', 'damn', 'hell']
                violations = []
                for keyword in toxic_keywords:
                    if keyword.lower() in text.lower():
                        violations.append(f"toxic_output_keyword_{keyword}")
                
                return {
                    'is_safe': len(violations) == 0,
                    'violations': violations,
                    'scores': {}
                }

            result = self.detoxify_model.predict(text)
            toxicity_score = result.get('toxicity', 0)

            violations = []
            if toxicity_score > self.toxicity_threshold:
                violations.append(f"toxic_output (score: {toxicity_score:.3f})")

            # Check other toxicity categories
            for category, score in result.items():
                if category != 'toxicity' and score > 0.8:
                    violations.append(f"{category}_output (score: {score:.3f})")

            return {
                'is_safe': len(violations) == 0,
                'violations': violations,
                'scores': result
            }

        except Exception as e:
            logging.error(f"Toxicity check error: {e}")
            return {'is_safe': False, 'violations': ['toxicity_check_error'], 'scores': {}}

    def _check_response_pii(self, text: str) -> Dict:
        """Check if AI response accidentally contains PII"""
        violations = []
        cleaned_text = text
        should_block = False

        for pii_type, pattern in self.pii_patterns.items():
            matches = pattern.findall(text)
            if matches:
                violations.append(f"pii_in_output_{pii_type}")
                # Replace PII in AI response
                cleaned_text = pattern.sub(f'[{pii_type.upper()}_REDACTED]', cleaned_text)

                # Some PII types should block the entire response
                if pii_type in ['ssn', 'credit_card']:
                    should_block = True

        return {
            'is_safe': len(violations) == 0,
            'violations': violations,
            'cleaned_text': cleaned_text,
            'should_block': should_block
        }

    def _check_prohibited_content(self, text: str) -> Dict:
        """Check for explicitly prohibited content in AI responses"""
        violations = []

        for pattern in self.prohibited_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                violations.append(f"prohibited_content_{pattern[:20]}")

        return {
            'is_safe': len(violations) == 0,
            'violations': violations
        }

    def _check_content_alignment(self, ai_response: str, user_input: str) -> Dict:
        """Basic check if AI response aligns with user input"""
        violations = []

        # Check if response is completely off-topic (basic heuristic)
        if len(user_input) > 10 and len(ai_response) > 0:
            # Simple word overlap check
            user_words = set(user_input.lower().split())
            response_words = set(ai_response.lower().split())

            # Remove common words
            common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'}
            user_words -= common_words
            response_words -= common_words

            if len(user_words) > 3 and len(response_words) > 3:
                overlap = len(user_words.intersection(response_words))
                if overlap == 0:
                    violations.append("potential_misalignment")

        return {
            'is_safe': len(violations) == 0,
            'violations': violations
        }

    def _check_response_quality(self, text: str) -> Dict:
        """Check basic quality metrics of AI response"""
        violations = []

        # Check if response is too short or empty
        if len(text.strip()) < self.min_response_length:
            violations.append("response_too_short")

        # Check if response is too long (might be hallucinating)
        if len(text) > self.max_response_length:
            violations.append("response_too_long")

        # Check for repetitive content
        words = text.split()
        if len(words) > 10:
            word_freq = {}
            for word in words:
                word_freq[word] = word_freq.get(word, 0) + 1

            # If any word appears more than max_repetition_ratio of the time, it's repetitive
            max_freq = max(word_freq.values())
            if max_freq > len(words) * self.max_repetition_ratio:
                violations.append("repetitive_response")

        # Check for excessive punctuation
        if text.count('!') > len(text) * 0.1:  # More than 10% exclamation marks
            violations.append("excessive_punctuation")

        return {
            'is_safe': len(violations) == 0,
            'violations': violations
        }

    def _get_fallback_response(self) -> str:
        """Get a safe fallback response"""
        return random.choice(self.fallback_responses)

    def _calculate_confidence_score(self, violations: List[str]) -> float:
        """Calculate confidence score based on violations"""
        if not violations:
            return 1.0

        # Reduce confidence based on number and severity of violations
        severity_scores = {
            'toxic': 0.3,
            'pii': 0.2,
            'prohibited': 0.4,
            'misalignment': 0.1,
            'quality': 0.05
        }

        total_reduction = 0
        for violation in violations:
            for severity_type, reduction in severity_scores.items():
                if severity_type in violation:
                    total_reduction += reduction
                    break

        return max(0.0, 1.0 - total_reduction)

    def _log_output_validation(self, response: str, is_safe: bool, violations: List[str], processing_time: float):
        """Log output validation results"""
        logging.info(f"Output validation: safe={is_safe}, violations={violations}, time={processing_time:.3f}s")
        if violations:
            # Don't log the actual content for privacy, just the violation types
            logging.warning(f"Output violations detected: {', '.join(violations)}")

    def get_validation_summary(self, ai_response: str, original_user_input: str = "") -> Dict:
        """
        Get a summary of validation results without blocking
        
        Args:
            ai_response (str): AI response to analyze
            original_user_input (str): Original user input for context
            
        Returns:
            Dict: Validation summary
        """
        result = self.validate_ai_response(ai_response, original_user_input)
        
        return {
            'is_safe': result.is_safe,
            'risk_level': result.risk_level,
            'violations': result.violations,
            'confidence_score': result.confidence_score,
            'processing_time': result.processing_time,
            'has_pii': any('pii' in v for v in result.violations),
            'is_toxic': any('toxic' in v for v in result.violations),
            'has_prohibited_content': any('prohibited' in v for v in result.violations),
            'quality_issues': any('quality' in v or 'repetitive' in v for v in result.violations)
        }

# Global instance
output_validator = OutputValidator()
