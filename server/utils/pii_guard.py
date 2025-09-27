"""
PII Detection and Scrubbing Utility using Presidio
"""
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
import re
from typing import Dict, List, Tuple, Optional

class PIIGuard:
    def __init__(self):
        """Initialize Presidio analyzer and anonymizer engines"""
        try:
            #NLP engine with spaCy
            provider = NlpEngineProvider(conf_file=None)
            nlp_engine = provider.create_engine()
            
            #analyzer and anonymizer
            self.analyzer = AnalyzerEngine(nlp_engine=nlp_engine)
            self.anonymizer = AnonymizerEngine()
            
            self.custom_patterns = {
                'EMAIL': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                'PHONE': r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
                'SSN': r'\b\d{3}-?\d{2}-?\d{4}\b',
                'CREDIT_CARD': r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
                'IP_ADDRESS': r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
            }
            
        except Exception as e:
            print(f"Warning: Failed to initialize PII Guard: {e}")
            self.analyzer = None
            self.anonymizer = None
    
    def detect_pii(self, text: str) -> Dict[str, List[Dict]]:
        """
        Detect PII in text using Presidio and custom patterns
        
        Args:
            text (str): Input text to analyze
            
        Returns:
            Dict containing detected PII entities
        """
        if not self.analyzer:
            return {"error": "PII analyzer not initialized"}
        
        try:
            # Use Presidio analyzer
            results = self.analyzer.analyze(text=text, language='en')
            
            detected_entities = {
                'presidio_results': [],
                'custom_patterns': [],
                'summary': {
                    'total_entities': 0,
                    'entity_types': set()
                }
            }
            
            for result in results:
                entity_info = {
                    'entity_type': result.entity_type,
                    'start': result.start,
                    'end': result.end,
                    'score': result.score,
                    'text': text[result.start:result.end]
                }
                detected_entities['presidio_results'].append(entity_info)
                detected_entities['summary']['entity_types'].add(result.entity_type)
            
            for pattern_name, pattern in self.custom_patterns.items():
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    entity_info = {
                        'entity_type': pattern_name,
                        'start': match.start(),
                        'end': match.end(),
                        'score': 1.0,
                        'text': match.group()
                    }
                    detected_entities['custom_patterns'].append(entity_info)
                    detected_entities['summary']['entity_types'].add(pattern_name)
            
            detected_entities['summary']['total_entities'] = len(detected_entities['presidio_results']) + len(detected_entities['custom_patterns'])
            detected_entities['summary']['entity_types'] = list(detected_entities['summary']['entity_types'])
            
            return detected_entities
            
        except Exception as e:
            return {"error": f"PII detection failed: {str(e)}"}
    
    def scrub_pii(self, text: str, replacement_strategy: str = "replace") -> Tuple[str, Dict]:
        """
        Scrub PII from text using Presidio anonymizer
        
        Args:
            text (str): Input text to scrub
            replacement_strategy (str): Strategy for replacement ("replace", "mask", "hash")
            
        Returns:
            Tuple of (scrubbed_text, anonymization_info)
        """
        if not self.anonymizer:
            return text, {"error": "PII anonymizer not initialized"}
        
        try:
            detection_results = self.detect_pii(text)
            
            if "error" in detection_results:
                return text, detection_results
            
            # Configure anonymization - use proper Presidio operator format
            from presidio_anonymizer.entities import OperatorConfig
            operators = {
                "DEFAULT": OperatorConfig("replace", {"new_value": "[REDACTED]"}),
                "EMAIL": OperatorConfig("replace", {"new_value": "[EMAIL_REDACTED]"}),
                "EMAIL_ADDRESS": OperatorConfig("replace", {"new_value": "[EMAIL_REDACTED]"}),
                "PHONE_NUMBER": OperatorConfig("replace", {"new_value": "[PHONE_REDACTED]"}),
                "PHONE": OperatorConfig("replace", {"new_value": "[PHONE_REDACTED]"}),
                "PERSON": OperatorConfig("replace", {"new_value": "[NAME_REDACTED]"}),
                "LOCATION": OperatorConfig("replace", {"new_value": "[LOCATION_REDACTED]"}),
                "CREDIT_CARD": OperatorConfig("replace", {"new_value": "[CARD_REDACTED]"}),
                "SSN": OperatorConfig("replace", {"new_value": "[SSN_REDACTED]"}),
                "IP_ADDRESS": OperatorConfig("replace", {"new_value": "[IP_REDACTED]"}),
                "US_BANK_NUMBER": OperatorConfig("replace", {"new_value": "[BANK_REDACTED]"}),
                "US_DRIVER_LICENSE": OperatorConfig("replace", {"new_value": "[LICENSE_REDACTED]"}),
                "URL": OperatorConfig("replace", {"new_value": "[URL_REDACTED]"})
            }
            
            presidio_results = []
            for entity in detection_results.get('presidio_results', []):
                from presidio_analyzer import RecognizerResult
                presidio_results.append(RecognizerResult(
                    entity_type=entity['entity_type'],
                    start=entity['start'],
                    end=entity['end'],
                    score=entity['score'],
                    analysis_explanation=None
                ))
            
            anonymized_result = self.anonymizer.anonymize(
                text=text,
                analyzer_results=presidio_results,
                operators=operators
            )
            
            scrubbed_text = anonymized_result.text
            custom_redactions = []
            
            for entity in detection_results.get('custom_patterns', []):
                original_text = entity['text']
                if replacement_strategy == "replace":
                    replacement = f"[{entity['entity_type']}_REDACTED]"
                elif replacement_strategy == "mask":
                    replacement = "*" * len(original_text)
                else:  # hash
                    import hashlib
                    replacement = hashlib.md5(original_text.encode()).hexdigest()[:8]
                
                scrubbed_text = scrubbed_text.replace(original_text, replacement)
                custom_redactions.append({
                    'original': original_text,
                    'replacement': replacement,
                    'type': entity['entity_type']
                })
            
            anonymization_info = {
                'original_length': len(text),
                'scrubbed_length': len(scrubbed_text),
                'entities_detected': detection_results['summary']['total_entities'],
                'entity_types': detection_results['summary']['entity_types'],
                'custom_redactions': custom_redactions,
                'presidio_anonymized': anonymized_result.text
            }
            
            return scrubbed_text, anonymization_info
            
        except Exception as e:
            return text, {"error": f"PII scrubbing failed: {str(e)}"}
    
    def is_pii_detected(self, text: str, threshold: float = 0.5) -> bool:
        """
        Check if PII is detected in text above threshold
        
        Args:
            text (str): Input text to check
            threshold (float): Confidence threshold for PII detection
            
        Returns:
            bool: True if PII detected above threshold
        """
        detection_results = self.detect_pii(text)
        
        if "error" in detection_results:
            return False
        
        for entity in detection_results.get('presidio_results', []):
            if entity['score'] >= threshold:
                return True
        
        if detection_results.get('custom_patterns'):
            return True
        
        return False
    
    def get_pii_summary(self, text: str) -> Dict:
        """
        Get a summary of PII detected in text
        
        Args:
            text (str): Input text to analyze
            
        Returns:
            Dict: Summary of detected PII
        """
        detection_results = self.detect_pii(text)
        
        if "error" in detection_results:
            return detection_results
        
        return {
            'has_pii': detection_results['summary']['total_entities'] > 0,
            'entity_count': detection_results['summary']['total_entities'],
            'entity_types': detection_results['summary']['entity_types'],
            'risk_level': self._assess_risk_level(detection_results['summary']['total_entities'])
        }
    
    def _assess_risk_level(self, entity_count: int) -> str:
        """Assess risk level based on number of PII entities"""
        if entity_count == 0:
            return "LOW"
        elif entity_count <= 2:
            return "MEDIUM"
        else:
            return "HIGH"

pii_guard = PIIGuard()
