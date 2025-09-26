"""
Mood Analysis Service for AI Chat System
Analyzes user input and conversation context to determine emotional state
"""
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

class MoodAnalysisService:
    def __init__(self):
        """Initialize mood analysis with keyword patterns and sentiment indicators"""
        
        # Mood indicators - keywords and phrases that suggest different emotional states
        self.mood_indicators = {
            'happy': {
                'keywords': [
                    'happy', 'excited', 'great', 'awesome', 'amazing', 'wonderful', 
                    'fantastic', 'love', 'enjoy', 'fun', 'laugh', 'smile', 'cheerful',
                    'positive', 'good', 'best', 'perfect', 'brilliant', 'excellent'
                ],
                'phrases': [
                    'feeling good', 'having fun', 'love it', 'so excited', 
                    'can\'t wait', 'looking forward', 'feeling great'
                ],
                'emojis': ['😊', '😄', '😃', '😁', '🤗', '🥰', '😍', '🤩', '🎉', '✨']
            },
            'sad': {
                'keywords': [
                    'sad', 'depressed', 'down', 'upset', 'hurt', 'disappointed', 
                    'frustrated', 'angry', 'mad', 'hate', 'terrible', 'awful', 
                    'horrible', 'worried', 'anxious', 'stressed', 'tired', 'exhausted'
                ],
                'phrases': [
                    'feeling down', 'not good', 'having trouble', 'struggling',
                    'feeling lost', 'can\'t cope', 'feeling overwhelmed'
                ],
                'emojis': ['😢', '😭', '😔', '😞', '😟', '😰', '😨', '😩', '💔', '😿']
            },
            'curious': {
                'keywords': [
                    'what', 'how', 'why', 'when', 'where', 'who', 'explain', 
                    'tell me', 'show me', 'learn', 'understand', 'know', 'wonder',
                    'curious', 'interested', 'fascinated', 'intrigued'
                ],
                'phrases': [
                    'can you explain', 'how does', 'what is', 'tell me about',
                    'i want to know', 'i\'m curious', 'help me understand'
                ],
                'emojis': ['🤔', '🧐', '👀', '💭', '❓', '❔', '🔍', '📚', '🎓']
            },
            'supportive': {
                'keywords': [
                    'help', 'support', 'advice', 'guidance', 'assist', 'comfort',
                    'encourage', 'motivate', 'inspire', 'care', 'concern', 'worry'
                ],
                'phrases': [
                    'need help', 'can you help', 'looking for advice', 'need support',
                    'going through', 'dealing with', 'struggling with'
                ],
                'emojis': ['🤗', '💪', '❤️', '🙏', '💙', '🤝', '🌟', '✨']
            }
        }
        
        # Conversation context patterns
        self.context_patterns = {
            'educational_topics': [
                'science', 'math', 'history', 'biology', 'chemistry', 'physics',
                'literature', 'art', 'music', 'technology', 'programming'
            ],
            'personal_topics': [
                'family', 'friends', 'relationship', 'work', 'school', 'health',
                'goals', 'dreams', 'future', 'past', 'memories'
            ],
            'problem_solving': [
                'problem', 'issue', 'challenge', 'difficulty', 'trouble', 'stuck',
                'confused', 'don\'t understand', 'need help'
            ]
        }
        
        # Mood transition patterns (how moods change over time)
        self.mood_transitions = {
            'neutral_to_happy': ['excited', 'great news', 'good news', 'success'],
            'neutral_to_sad': ['bad news', 'disappointed', 'upset', 'worried'],
            'sad_to_supportive': ['help', 'support', 'advice', 'guidance'],
            'curious_to_happy': ['learned', 'understood', 'figured out', 'discovered']
        }
    
    def analyze_mood(self, user_input: str, conversation_history: List[Dict] = None) -> Dict:
        """
        Analyze the mood of user input based on content and conversation context
        
        Args:
            user_input (str): Current user message
            conversation_history (List[Dict]): Previous conversation messages
            
        Returns:
            Dict: Mood analysis results
        """
        if not user_input or not user_input.strip():
            return {
                'mood': 'neutral',
                'confidence': 0.0,
                'indicators': [],
                'context': 'empty_input'
            }
        
        # Clean and prepare input
        text = user_input.lower().strip()
        
        # Calculate mood scores
        mood_scores = {}
        indicators_found = {}
        
        for mood, indicators in self.mood_indicators.items():
            score = 0
            found_indicators = []
            
            # Check keywords
            for keyword in indicators['keywords']:
                if keyword in text:
                    score += 1
                    found_indicators.append(f"keyword: {keyword}")
            
            # Check phrases
            for phrase in indicators['phrases']:
                if phrase in text:
                    score += 2  # Phrases are weighted higher
                    found_indicators.append(f"phrase: {phrase}")
            
            # Check emojis
            for emoji in indicators['emojis']:
                if emoji in text:
                    score += 1.5  # Emojis are good mood indicators
                    found_indicators.append(f"emoji: {emoji}")
            
            mood_scores[mood] = score
            indicators_found[mood] = found_indicators
        
        # Determine primary mood
        if not any(mood_scores.values()):
            primary_mood = 'neutral'
            confidence = 0.0
        else:
            primary_mood = max(mood_scores, key=mood_scores.get)
            max_score = mood_scores[primary_mood]
            total_score = sum(mood_scores.values())
            confidence = min(max_score / max(total_score, 1), 1.0)
        
        # Analyze conversation context if available
        context_analysis = self._analyze_conversation_context(text, conversation_history)
        
        # Check for mood transitions
        mood_transition = self._detect_mood_transition(conversation_history, primary_mood)
        
        return {
            'mood': primary_mood,
            'confidence': confidence,
            'scores': mood_scores,
            'indicators': indicators_found.get(primary_mood, []),
            'context': context_analysis,
            'mood_transition': mood_transition,
            'timestamp': datetime.now().isoformat()
        }
    
    def _analyze_conversation_context(self, current_input: str, history: List[Dict] = None) -> Dict:
        """Analyze conversation context to better understand mood"""
        if not history:
            return {'context_type': 'new_conversation', 'topic': 'unknown'}
        
        # Get recent messages (last 5)
        recent_messages = history[-5:] if len(history) > 5 else history
        
        # Analyze topics discussed
        topics = []
        for msg in recent_messages:
            content = msg.get('content', '').lower()
            for category, topic_list in self.context_patterns.items():
                for topic in topic_list:
                    if topic in content:
                        topics.append(topic)
        
        # Determine context type
        if any('help' in msg.get('content', '').lower() for msg in recent_messages):
            context_type = 'seeking_help'
        elif any('?' in msg.get('content', '') for msg in recent_messages):
            context_type = 'questioning'
        elif len(recent_messages) > 3:
            context_type = 'extended_conversation'
        else:
            context_type = 'brief_exchange'
        
        return {
            'context_type': context_type,
            'topics_discussed': list(set(topics)),
            'message_count': len(recent_messages),
            'recent_activity': 'active' if len(recent_messages) > 2 else 'minimal'
        }
    
    def _detect_mood_transition(self, history: List[Dict] = None, current_mood: str = 'neutral') -> Dict:
        """Detect if there's a mood transition happening"""
        if not history or len(history) < 2:
            return {'transition': False, 'direction': 'none'}
        
        # Get previous mood from last AI response
        last_ai_message = None
        for msg in reversed(history):
            if msg.get('message_type') == 'ai' and 'mood' in msg:
                last_ai_message = msg
                break
        
        if not last_ai_message:
            return {'transition': False, 'direction': 'none'}
        
        previous_mood = last_ai_message.get('mood', 'neutral')
        
        if previous_mood == current_mood:
            return {'transition': False, 'direction': 'stable'}
        
        # Define positive and negative transitions
        positive_transitions = ['neutral->happy', 'sad->happy', 'curious->happy']
        negative_transitions = ['happy->sad', 'neutral->sad', 'happy->neutral']
        
        transition_key = f"{previous_mood}->{current_mood}"
        
        if transition_key in positive_transitions:
            return {'transition': True, 'direction': 'positive', 'from': previous_mood, 'to': current_mood}
        elif transition_key in negative_transitions:
            return {'transition': True, 'direction': 'negative', 'from': previous_mood, 'to': current_mood}
        else:
            return {'transition': True, 'direction': 'neutral', 'from': previous_mood, 'to': current_mood}
    
    def get_mood_based_response_guidance(self, mood: str, context: Dict, user_preferences: Dict = None) -> Dict:
        """
        Get guidance for generating mood-appropriate responses
        
        Args:
            mood (str): Detected mood
            context (Dict): Conversation context
            user_preferences (Dict): User's onboarding preferences
            
        Returns:
            Dict: Response guidance
        """
        guidance = {
            'tone': 'neutral',
            'approach': 'direct',
            'suggestions': [],
            'redirect_topics': [],
            'support_level': 'normal'
        }
        
        if mood == 'happy':
            guidance.update({
                'tone': 'enthusiastic',
                'approach': 'encouraging',
                'suggestions': ['celebrate with user', 'build on positive energy', 'suggest related activities'],
                'support_level': 'high'
            })
        
        elif mood == 'sad':
            guidance.update({
                'tone': 'empathetic',
                'approach': 'supportive',
                'suggestions': ['offer comfort', 'suggest positive activities', 'redirect to user interests'],
                'support_level': 'high',
                'redirect_topics': user_preferences.get('interests', []) if user_preferences else []
            })
        
        elif mood == 'curious':
            guidance.update({
                'tone': 'educational',
                'approach': 'informative',
                'suggestions': ['provide detailed explanations', 'suggest learning resources', 'encourage exploration'],
                'support_level': 'educational'
            })
        
        elif mood == 'supportive':
            guidance.update({
                'tone': 'caring',
                'approach': 'helpful',
                'suggestions': ['offer practical advice', 'provide resources', 'check in on user wellbeing'],
                'support_level': 'maximum'
            })
        
        return guidance
    
    def should_redirect_conversation(self, mood: str, mood_transition: Dict, context: Dict) -> bool:
        """
        Determine if conversation should be redirected based on mood analysis
        
        Args:
            mood (str): Current mood
            mood_transition (Dict): Mood transition information
            context (Dict): Conversation context
            
        Returns:
            bool: Whether to redirect conversation
        """
        # Redirect if mood is consistently negative
        if mood == 'sad' and mood_transition.get('direction') == 'negative':
            return True
        
        # Redirect if user seems stuck in negative patterns
        if context.get('context_type') == 'seeking_help' and mood in ['sad', 'supportive']:
            return True
        
        return False

# Initialize the service
mood_analyzer = MoodAnalysisService()
