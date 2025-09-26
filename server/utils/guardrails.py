"""
Comprehensive Guardrails Service
Combines PII detection, toxicity detection, and input validation
"""
from typing import Dict, Tuple, Optional
from .pii_guard import pii_guard
from .input_guard import input_guard

class GuardrailsService:
    def __init__(self):
        """Initialize the comprehensive guardrails service"""
        self.pii_guard = pii_guard
        self.input_guard = input_guard
        
        # Configuration
        self.config = {
            'toxicity_threshold': 0.7,
            'pii_threshold': 0.5,
            'enable_pii_scrubbing': True,
            'enable_toxicity_detection': True,
            'enable_input_validation': True,
            'block_on_high_risk': True
        }
    
    def process_message(self, message: str, user_id: Optional[str] = None) -> Dict:
        """
        Process a message through all guardrails
        
        Args:
            message (str): User message to process
            user_id (str, optional): User ID for logging
            
        Returns:
            Dict: Processing results with safety status and processed message
        """
        results = {
            'original_message': message,
            'processed_message': message,
            'is_safe': True,
            'should_block': False,
            'warnings': [],
            'pii_detected': False,
            'pii_scrubbed': False,
            'toxicity_detected': False,
            'validation_failed': False,
            'risk_level': 'LOW',
            'processing_log': []
        }
        
        try:
            # Step 1: Input Validation
            if self.config['enable_input_validation']:
                validation_results = self.input_guard.validate_input(message)
                if not validation_results['is_valid']:
                    results['validation_failed'] = True
                    results['should_block'] = True
                    results['warnings'].extend([v['message'] for v in validation_results['violations']])
                    results['processing_log'].append("Input validation failed")
                    return results
            
            # Step 2: Toxicity Detection
            if self.config['enable_toxicity_detection']:
                toxicity_results = self.input_guard.detect_toxicity(
                    message, 
                    self.config['toxicity_threshold']
                )
                
                if toxicity_results.get('is_toxic', False):
                    results['toxicity_detected'] = True
                    results['should_block'] = True
                    results['warnings'].append(
                        f"Message contains toxic content ({toxicity_results.get('max_category', 'unknown')})"
                    )
                    results['processing_log'].append("Toxicity detected")
                    return results
            
            # Step 3: Restricted Content Check
            content_results = self.input_guard.check_restricted_content(message)
            if content_results['has_restricted_content']:
                results['should_block'] = True
                results['warnings'].append("Message contains restricted content or spam patterns")
                results['processing_log'].append("Restricted content detected")
                return results
            
            # Step 4: PII Detection and Scrubbing
            pii_summary = self.pii_guard.get_pii_summary(message)
            if pii_summary.get('has_pii', False):
                results['pii_detected'] = True
                results['warnings'].append(
                    f"PII detected: {', '.join(pii_summary.get('entity_types', []))}"
                )
                results['processing_log'].append("PII detected")
                
                # Scrub PII if enabled
                if self.config['enable_pii_scrubbing']:
                    scrubbed_message, scrub_info = self.pii_guard.scrub_pii(message)
                    results['processed_message'] = scrubbed_message
                    results['pii_scrubbed'] = True
                    results['processing_log'].append("PII scrubbed from message")
                else:
                    # Block message if PII scrubbing is disabled
                    results['should_block'] = True
                    results['warnings'].append("Message contains PII and scrubbing is disabled")
                    return results
            
            # Step 5: Final Safety Assessment
            results['is_safe'] = not results['should_block']
            
            # Determine risk level
            risk_factors = []
            if results['pii_detected']:
                risk_factors.append('PII')
            if results['toxicity_detected']:
                risk_factors.append('TOXICITY')
            if results['validation_failed']:
                risk_factors.append('VALIDATION')
            
            if len(risk_factors) >= 2:
                results['risk_level'] = 'HIGH'
            elif len(risk_factors) == 1:
                results['risk_level'] = 'MEDIUM'
            else:
                results['risk_level'] = 'LOW'
            
            results['processing_log'].append(f"Processing complete - Risk level: {results['risk_level']}")
            
        except Exception as e:
            results['should_block'] = True
            results['warnings'].append(f"Guardrails processing failed: {str(e)}")
            results['processing_log'].append(f"Error: {str(e)}")
        
        return results
    
    def get_safety_report(self, message: str) -> Dict:
        """
        Get a detailed safety report for a message without processing it
        
        Args:
            message (str): Message to analyze
            
        Returns:
            Dict: Detailed safety report
        """
        report = {
            'message_length': len(message),
            'word_count': len(message.split()),
            'analysis_timestamp': None,
            'safety_checks': {}
        }
        
        try:
            # Toxicity analysis
            toxicity_results = self.input_guard.detect_toxicity(message, self.config['toxicity_threshold'])
            report['safety_checks']['toxicity'] = toxicity_results
            
            # PII analysis
            pii_results = self.pii_guard.detect_pii(message)
            report['safety_checks']['pii'] = pii_results
            
            # Content analysis
            content_results = self.input_guard.check_restricted_content(message)
            report['safety_checks']['content'] = content_results
            
            # Input validation
            validation_results = self.input_guard.validate_input(message)
            report['safety_checks']['validation'] = validation_results
            
            # Overall assessment
            is_safe = (
                not toxicity_results.get('is_toxic', False) and
                validation_results['is_valid'] and
                not content_results['has_restricted_content']
            )
            
            report['overall_safety'] = {
                'is_safe': is_safe,
                'recommendations': []
            }
            
            if toxicity_results.get('is_toxic'):
                report['overall_safety']['recommendations'].append("Message contains toxic content")
            
            if not validation_results['is_valid']:
                report['overall_safety']['recommendations'].append("Message violates input rules")
            
            if content_results['has_restricted_content']:
                report['overall_safety']['recommendations'].append("Message contains restricted content")
            
            if pii_results.get('summary', {}).get('has_pii'):
                report['overall_safety']['recommendations'].append("Message contains PII")
            
        except Exception as e:
            report['error'] = f"Safety analysis failed: {str(e)}"
        
        return report
    
    def update_config(self, new_config: Dict):
        """Update guardrails configuration"""
        self.config.update(new_config)
    
    def get_config(self) -> Dict:
        """Get current guardrails configuration"""
        return self.config.copy()

# Global instance
guardrails_service = GuardrailsService()
