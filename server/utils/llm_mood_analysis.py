import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
from typing import Dict, List, Optional

# Load environment variables
load_dotenv()

class LLMMoodAnalysisService:
    def __init__(self):
        """Initialize LLM-based mood analysis using Gemini"""
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
        else:
            self.model = None
    
    def analyze_mood(self, user_input: str, conversation_history: List[Dict] = None) -> Dict:
        """
        Analyze mood using Gemini LLM
        
        Args:
            user_input (str): User's message
            conversation_history (List[Dict]): Previous conversation context
            
        Returns:
            Dict: Mood analysis results
        """
        if not self.model:
            return self._fallback_analysis(user_input)
        
        try:
            # Build context for mood analysis
            context = self._build_context(user_input, conversation_history)
            
            # Create prompt for mood analysis
            prompt = f"""
You are an expert at analyzing emotional states and mood from text. Analyze the following user message and conversation context to determine the user's current emotional state.

User Message: "{user_input}"

Conversation Context: {context}

Please analyze the user's emotional state and respond with a JSON object containing:
1. "mood": One of these values: "neutral", "happy", "sad", "curious", "supportive"
2. "confidence": A number between 0.0 and 1.0 indicating confidence in the mood detection
3. "emotional_indicators": List of specific words/phrases that indicate the mood
4. "context_analysis": Brief explanation of why this mood was detected
5. "sensitivity_level": "low", "medium", or "high" based on content sensitivity
6. "support_needed": Boolean indicating if the user might need emotional support

Focus on detecting:
- Sadness, depression, suicidal thoughts, hopelessness
- Happiness, excitement, positive emotions
- Curiosity, questions, learning intent
- Need for support, help-seeking behavior
- Neutral, casual conversation

Be especially sensitive to mental health concerns and crisis situations. If you detect any signs of distress, suicidal ideation, or serious emotional problems, mark sensitivity_level as "high" and support_needed as true.

Respond with ONLY a valid JSON object, no additional text.
"""
            
            # Get response from Gemini
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean response text (remove markdown code blocks if present)
            if response_text.startswith('```json'):
                response_text = response_text[7:]  # Remove ```json
            if response_text.startswith('```'):
                response_text = response_text[3:]   # Remove ```
            if response_text.endswith('```'):
                response_text = response_text[:-3]  # Remove trailing ```
            response_text = response_text.strip()
            
            # Parse JSON response
            try:
                result = json.loads(response_text)
                
                # Validate and clean the response
                result = self._validate_response(result)
                
                # Add timestamp
                from datetime import datetime
                result['timestamp'] = datetime.now().isoformat()
                
                return result
                
            except json.JSONDecodeError:
                # If JSON parsing fails, use fallback
                return self._fallback_analysis(user_input)
                
        except Exception as e:
            print(f"LLM mood analysis error: {e}")
            return self._fallback_analysis(user_input)
    
    def _build_context(self, user_input: str, conversation_history: List[Dict] = None) -> str:
        """Build conversation context for mood analysis"""
        if not conversation_history:
            return "No previous conversation context."
        
        # Get last 5 messages for context
        recent_messages = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
        
        context_parts = []
        for msg in recent_messages:
            role = "User" if msg.get('message_type') == 'user' else "AI"
            content = msg.get('content', '')[:100]
            context_parts.append(f"{role}: {content}")
        
        return "\n".join(context_parts) if context_parts else "No previous conversation context."
    
    def _validate_response(self, result: Dict) -> Dict:
        """Validate and clean the LLM response"""
        # Ensure required fields exist
        valid_moods = ['neutral', 'happy', 'sad', 'curious', 'supportive']
        
        mood = result.get('mood', 'neutral')
        if mood not in valid_moods:
            mood = 'neutral'
        
        confidence = result.get('confidence', 0.5)
        if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
            confidence = 0.5
        
        return {
            'mood': mood,
            'confidence': float(confidence),
            'emotional_indicators': result.get('emotional_indicators', []),
            'context_analysis': result.get('context_analysis', ''),
            'sensitivity_level': result.get('sensitivity_level', 'low'),
            'support_needed': bool(result.get('support_needed', False))
        }
    
    def _fallback_analysis(self, user_input: str) -> Dict:
        """Fallback analysis when LLM is not available - use simple LLM call"""
        try:
            # Try to use Gemini directly for fallback
            import google.generativeai as genai
            import os
            from dotenv import load_dotenv
            
            load_dotenv()
            api_key = os.getenv('GEMINI_API_KEY')
            model_name = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
            
            if api_key:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(model_name)
                
                # Create a simple prompt for mood analysis
                prompt = f"""
Analyze the emotional state of this message: "{user_input}"
Respond with JSON: {{"mood": "neutral|happy|sad|curious|supportive", "confidence": 0.0-1.0, "sensitivity_level": "low|medium|high", "support_needed": true/false}}
"""
                
                response = model.generate_content(prompt)
                response_text = response.text.strip()
                
                # Clean response text (remove markdown code blocks if present)
                if response_text.startswith('```json'):
                    response_text = response_text[7:]
                if response_text.startswith('```'):
                    response_text = response_text[3:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                
                import json
                result = json.loads(response_text)
                
                from datetime import datetime
                return {
                    'mood': result.get('mood', 'neutral'),
                    'confidence': float(result.get('confidence', 0.5)),
                    'emotional_indicators': [],
                    'context_analysis': 'LLM fallback analysis',
                    'sensitivity_level': result.get('sensitivity_level', 'low'),
                    'support_needed': bool(result.get('support_needed', False)),
                    'timestamp': datetime.now().isoformat()
                }
        except:
            pass
        
        # Ultimate fallback - minimal analysis
        from datetime import datetime
        return {
            'mood': 'neutral',
            'confidence': 0.3,
            'emotional_indicators': [],
            'context_analysis': 'Fallback analysis - no LLM available',
            'sensitivity_level': 'low',
            'support_needed': False,
            'timestamp': datetime.now().isoformat()
        }

# Create global instance
llm_mood_analyzer = LLMMoodAnalysisService()
