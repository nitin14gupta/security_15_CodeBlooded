import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
from typing import Dict, List, Optional

# Load environment variables
load_dotenv()

class LLMResponseGenerator:
    def __init__(self):
        """Initialize LLM-based response generation using Gemini"""
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
        else:
            self.model = None
    
    def generate_response(self, user_message: str, mood_analysis: Dict, user_preferences: Dict = None, conversation_context: Dict = None) -> str:
        """
        Generate intelligent response using Gemini based on mood and context
        
        Args:
            user_message (str): User's message
            mood_analysis (Dict): Mood analysis results
            user_preferences (Dict): User's onboarding preferences
            conversation_context (Dict): Conversation context
            
        Returns:
            str: Generated response
        """
        if not self.model:
            return self._fallback_response(user_message, mood_analysis, user_preferences)
        
        try:
            # Build context for response generation
            context = self._build_response_context(user_message, mood_analysis, user_preferences, conversation_context)
            
            # Create prompt for response generation
            prompt = f"""
You are a caring, supportive AI companion named CareCompanion. You're designed to help users with empathy, understanding, and appropriate guidance.

User Message: "{user_message}"

Mood Analysis: {json.dumps(mood_analysis, indent=2)}

User Preferences: {json.dumps(user_preferences or {}, indent=2)}

Conversation Context: {json.dumps(conversation_context or {}, indent=2)}

Based on the user's message and emotional state, generate an appropriate response that:

1. **For Sad/Depressed Mood**: Be empathetic, supportive, and encouraging. If you detect serious mental health concerns, provide gentle support and suggest reaching out to trusted people or professionals.

2. **For Happy Mood**: Match their positive energy, be enthusiastic, and encourage them.

3. **For Curious Mood**: Be educational and helpful, provide information while being appropriate.

4. **For Supportive Mood**: Be understanding and offer help.

5. **For Neutral Mood**: Be friendly and engaging.

Guidelines:
- Always use the user's name if provided in preferences
- Be conversational and friendly, like talking to a friend
- For sensitive topics (mental health, suicide, etc.), be extra supportive and suggest professional help
- For inappropriate content, provide educational alternatives instead of blocking
- Keep responses concise but meaningful (2-3 sentences)
- Use appropriate emojis sparingly
- Be genuine and caring

Generate a response that feels natural and supportive:
"""
            
            # Get response from Gemini
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"LLM response generation error: {e}")
            return self._fallback_response(user_message, mood_analysis, user_preferences)
    
    def _build_response_context(self, user_message: str, mood_analysis: Dict, user_preferences: Dict, conversation_context: Dict) -> str:
        """Build context for response generation"""
        context_parts = []
        
        # Add mood information
        mood = mood_analysis.get('mood', 'neutral')
        confidence = mood_analysis.get('confidence', 0.5)
        sensitivity = mood_analysis.get('sensitivity_level', 'low')
        support_needed = mood_analysis.get('support_needed', False)
        
        context_parts.append(f"Detected mood: {mood} (confidence: {confidence})")
        context_parts.append(f"Sensitivity level: {sensitivity}")
        if support_needed:
            context_parts.append("User may need emotional support")
        
        # Add user preferences
        if user_preferences:
            name = user_preferences.get('name', '')
            if name:
                context_parts.append(f"User's name: {name}")
            
            interests = []
            if user_preferences.get('life_genre'):
                interests.append(user_preferences['life_genre'])
            if user_preferences.get('weekly_goal'):
                interests.append(user_preferences['weekly_goal'])
            
            if interests:
                context_parts.append(f"User interests: {', '.join(interests)}")
        
        return "\n".join(context_parts) if context_parts else "No additional context available."
    
    def _fallback_response(self, user_message: str, mood_analysis: Dict, user_preferences: Dict) -> str:
        """Fallback response when LLM is not available - use simple LLM call"""
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
                
                # Create a simple prompt for fallback
                mood = mood_analysis.get('mood', 'neutral')
                user_name = user_preferences.get('name', '') if user_preferences else ''
                
                prompt = f"Generate a brief, supportive response for a user named {user_name} who is in a {mood} mood. Keep it short and empathetic."
                
                response = model.generate_content(prompt)
                return response.text.strip()
        except:
            pass
        
        # Ultimate fallback - minimal response
        return "I'm here to help. How can I assist you today?"

# Create global instance
llm_response_generator = LLMResponseGenerator()
