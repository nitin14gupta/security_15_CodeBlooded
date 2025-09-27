"""
Comprehensive Guardrails Service
Combines PII detection, toxicity detection, and input validation
Now includes educational responses instead of blocking
"""
from typing import Dict, Tuple, Optional, List
from .pii_guard import pii_guard
from .input_guard import input_guard
from .llm_mood_analysis import llm_mood_analyzer
from .llm_response_generator import llm_response_generator
from .conversation_context import context_manager

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
    
    def process_message(self, message: str, user_id: Optional[str] = None, session_id: Optional[str] = None, user_preferences: Optional[Dict] = None) -> Dict:
        """
        Process a message through all guardrails with educational responses
        
        Args:
            message (str): User message to process
            user_id (str, optional): User ID for logging
            session_id (str, optional): Chat session ID for context
            user_preferences (Dict, optional): User's onboarding preferences
            
        Returns:
            Dict: Processing results with safety status and educational responses
        """
        results = {
            'original_message': message,
            'processed_message': message,
            'is_safe': True,
            'should_block': False,
            'response_type': 'normal',
            'educational_response': None,
            'mood_analysis': None,
            'context_guidance': None,
            'warnings': [],
            'pii_detected': False,
            'pii_scrubbed': False,
            'toxicity_detected': False,
            'validation_failed': False,
            'risk_level': 'LOW',
            'processing_log': []
        }
        
        try:
            conversation_history = []
            if session_id and user_id:
                context = context_manager.get_context(user_id, session_id, user_preferences)
                conversation_history = context.get_recent_context()
            
            mood_analysis = llm_mood_analyzer.analyze_mood(message, conversation_history)
            results['mood_analysis'] = mood_analysis
            
            if self.config['enable_input_validation']:
                validation_results = self.input_guard.validate_input(message)
                if not validation_results['is_valid']:
                    results['validation_failed'] = True
                    results['should_block'] = True
                    results['warnings'].extend([v['message'] for v in validation_results['violations']])
                    results['processing_log'].append("Input validation failed")
                    return results
            
            toxicity_detected = False
            if self.config['enable_toxicity_detection']:
                toxicity_results = self.input_guard.detect_toxicity(
                    message, 
                    self.config['toxicity_threshold']
                )
                
                if toxicity_results.get('is_toxic', False):
                    results['toxicity_detected'] = True
                    toxicity_detected = True
                    results['warnings'].append(
                        f"Message contains toxic content ({toxicity_results.get('max_category', 'unknown')})"
                    )
                    results['processing_log'].append("Toxicity detected")
            
            content_results = self.input_guard.check_restricted_content(message)
            if content_results['has_restricted_content']:
                results['response_type'] = 'educational'
                results['educational_response'] = self._generate_educational_response(
                    content_results, user_preferences, mood_analysis
                )
                results['processing_log'].append("Educational response generated for restricted content")
                
                results['should_block'] = False
                results['is_safe'] = True  
            
            #PII Detection and Scrubbing
            pii_summary = self.pii_guard.get_pii_summary(message)
            if pii_summary.get('has_pii', False):
                results['pii_detected'] = True
                results['warnings'].append(
                    f"PII detected: {', '.join(pii_summary.get('entity_types', []))}"
                )
                results['processing_log'].append("PII detected")
                
                if self.config['enable_pii_scrubbing']:
                    scrubbed_message, scrub_info = self.pii_guard.scrub_pii(message)
                    results['processed_message'] = scrubbed_message
                    results['pii_scrubbed'] = True
                    results['processing_log'].append("PII scrubbed from message")
                else:
                    results['should_block'] = True
                    results['warnings'].append("Message contains PII and scrubbing is disabled")
                    return results
            
            results['is_safe'] = not results['should_block']
            
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
    
    def _generate_educational_response(self, content_results: Dict, user_preferences: Dict, mood_analysis: Dict) -> Dict:
        """Generate educational response for restricted content"""
        content_type = self._classify_content_type(content_results.get('found_keywords', []))
        
        from .llm_response_generator import llm_response_generator
        
        educational_prompt = f"Generate an educational, supportive response for someone asking about: {content_type}. Be helpful and informative while maintaining appropriate boundaries."
        
        educational_content = llm_response_generator.generate_response(
            educational_prompt,
            mood_analysis,
            user_preferences,
            {}
        )
        
        educational_response = {
            'content': educational_content,
            'educational_value': True,
            'tone': 'supportive',
            'approach': 'gentle_guidance'
        }
        
        if mood_analysis.get('mood') in ['sad', 'supportive']:
            educational_response['tone'] = 'empathetic'
            educational_response['approach'] = 'supportive'
        elif mood_analysis.get('mood') == 'curious':
            educational_response['tone'] = 'educational'
            educational_response['approach'] = 'informative'
        
        return educational_response
    
    def _classify_content_type(self, keywords: List[str]) -> str:
        """Classify content type based on keywords"""
        keyword_mapping = {
            'nudity': ['nude', 'naked', 'nudity', 'explicit'],
            'violence': ['violence', 'kill', 'murder', 'weapon', 'fight'],
            'drugs': ['drug', 'alcohol', 'substance', 'intoxicated'],
            'illegal': ['illegal', 'crime', 'steal', 'fraud'],
            'hate': ['hate', 'discriminate', 'racist', 'sexist']
        }
        
        for content_type, type_keywords in keyword_mapping.items():
            if any(keyword in ' '.join(keywords).lower() for keyword in type_keywords):
                return content_type
        
        return 'general'
    
    def process_message_v2(self, message: str, user_id: str, session_id: str, user_preferences: Dict = None) -> Dict:
        """
        Enhanced message processing with mood analysis and educational responses
        
        Args:
            message (str): User message
            user_id (str): User ID
            session_id (str): Session ID
            user_preferences (Dict): User preferences
            
        Returns:
            Dict: Enhanced processing results
        """
        context = context_manager.get_context(user_id, session_id, user_preferences)
        conversation_history = context.get_recent_context()
        
        guardrails_results = self.process_message(
            message, user_id, session_id, user_preferences
        )
        
        mood_analysis = llm_mood_analyzer.analyze_mood(message, conversation_history)
        current_mood = mood_analysis.get('mood', 'neutral')
        mood_confidence = mood_analysis.get('confidence', 0.0)
        
        context_manager.update_context(
            session_id, 
            {'content': message, 'message_type': 'user'}, 
            current_mood, 
            mood_confidence
        )
        
        response_guidance = self._generate_response_guidance(
            guardrails_results, mood_analysis, context
        )
        
        should_redirect = context.should_redirect()
        redirect_suggestions = context.get_redirect_suggestions() if should_redirect else []
        
        return {
            **guardrails_results,
            'mood_analysis': mood_analysis,
            'response_guidance': response_guidance,
            'should_redirect': should_redirect,
            'redirect_suggestions': redirect_suggestions,
            'context_summary': context_manager.get_context_summary(session_id),
            'original_message': message
        }
    
    def _generate_response_guidance(self, guardrails_results: Dict, mood_analysis: Dict, context) -> Dict:
        """Generate guidance for response generation"""
        mood = mood_analysis.get('mood', 'neutral')
        confidence = mood_analysis.get('confidence', 0.0)
        
        guidance = {
            'mood': mood,
            'tone': 'supportive' if mood == 'sad' else 'friendly',
            'approach': 'empathetic' if mood == 'sad' else 'conversational'
        }
        
        if guardrails_results.get('response_type') == 'educational':
            guidance['educational_content'] = guardrails_results.get('educational_response')
            guidance['approach'] = 'educational'
        
        if context.topics_discussed:
            guidance['context_aware'] = True
            guidance['recent_topics'] = context.topics_discussed[-3:]
        
        return guidance
    
    def _get_mood_based_response_guidance(self, mood: str, context: Dict, user_preferences: Dict) -> Dict:
        """Get mood-based response guidance"""
        guidance = {
            'mood': mood,
            'tone': 'supportive' if mood == 'sad' else 'friendly',
            'approach': 'empathetic' if mood == 'sad' else 'conversational'
        }
        
        if mood == 'sad':
            guidance.update({
                'tone': 'supportive',
                'approach': 'empathetic',
                'focus': 'emotional_support'
            })
        elif mood == 'curious':
            guidance.update({
                'tone': 'educational',
                'approach': 'informative',
                'focus': 'learning'
            })
        elif mood == 'happy':
            guidance.update({
                'tone': 'enthusiastic',
                'approach': 'energetic',
                'focus': 'positive_engagement'
            })
        
        return guidance
    
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
            toxicity_results = self.input_guard.detect_toxicity(message, self.config['toxicity_threshold'])
            report['safety_checks']['toxicity'] = toxicity_results
            
            pii_results = self.pii_guard.detect_pii(message)
            report['safety_checks']['pii'] = pii_results
            
            content_results = self.input_guard.check_restricted_content(message)
            report['safety_checks']['content'] = content_results
            
            validation_results = self.input_guard.validate_input(message)
            report['safety_checks']['validation'] = validation_results
            
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

guardrails_service = GuardrailsService()
