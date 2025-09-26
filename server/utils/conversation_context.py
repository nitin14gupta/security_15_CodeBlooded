"""
Conversation Context Service
Manages conversation history, user preferences, and context-aware responses
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json

class ConversationContext:
    def __init__(self, user_id: str, session_id: str, user_preferences: Dict = None):
        """
        Initialize conversation context
        
        Args:
            user_id (str): User ID
            session_id (str): Chat session ID
            user_preferences (Dict): User's onboarding preferences
        """
        self.user_id = user_id
        self.session_id = session_id
        self.user_preferences = user_preferences or {}
        self.conversation_history = []
        self.current_mood = 'neutral'
        self.mood_history = []
        self.topics_discussed = []
        self.educational_topics_covered = []
        self.last_activity = datetime.now()
        
    def add_message(self, message: Dict):
        """Add a message to conversation history"""
        self.conversation_history.append({
            **message,
            'timestamp': datetime.now().isoformat()
        })
        self.last_activity = datetime.now()
        
        # Keep only last 15 messages for context
        if len(self.conversation_history) > 15:
            self.conversation_history = self.conversation_history[-15:]
    
    def update_mood(self, mood: str, confidence: float):
        """Update current mood and mood history"""
        self.current_mood = mood
        self.mood_history.append({
            'mood': mood,
            'confidence': confidence,
            'timestamp': datetime.now().isoformat()
        })
        
        # Keep only last 10 mood entries
        if len(self.mood_history) > 10:
            self.mood_history = self.mood_history[-10:]
    
    def add_topic(self, topic: str, topic_type: str = 'general'):
        """Add a topic to discussed topics"""
        if topic not in self.topics_discussed:
            self.topics_discussed.append({
                'topic': topic,
                'type': topic_type,
                'first_mentioned': datetime.now().isoformat()
            })
    
    def add_educational_topic(self, topic: str, content: str):
        """Add an educational topic that was covered"""
        self.educational_topics_covered.append({
            'topic': topic,
            'content': content,
            'timestamp': datetime.now().isoformat()
        })
    
    def get_recent_context(self, limit: int = 5) -> List[Dict]:
        """Get recent conversation context"""
        return self.conversation_history[-limit:] if self.conversation_history else []
    
    def get_mood_trend(self) -> Dict:
        """Analyze mood trends over time"""
        if len(self.mood_history) < 2:
            return {'trend': 'stable', 'direction': 'none'}
        
        recent_moods = [entry['mood'] for entry in self.mood_history[-5:]]
        
        # Count mood occurrences
        mood_counts = {}
        for mood in recent_moods:
            mood_counts[mood] = mood_counts.get(mood, 0) + 1
        
        # Determine trend
        if mood_counts.get('sad', 0) > len(recent_moods) * 0.6:
            return {'trend': 'declining', 'direction': 'negative', 'primary_mood': 'sad'}
        elif mood_counts.get('happy', 0) > len(recent_moods) * 0.6:
            return {'trend': 'improving', 'direction': 'positive', 'primary_mood': 'happy'}
        else:
            return {'trend': 'stable', 'direction': 'neutral', 'primary_mood': 'neutral'}
    
    def should_redirect(self) -> bool:
        """Determine if conversation should be redirected"""
        mood_trend = self.get_mood_trend()
        
        # Redirect if mood is consistently negative
        if mood_trend['direction'] == 'negative':
            return True
        
        # Redirect if too many educational topics without positive interaction
        if len(self.educational_topics_covered) > 3 and mood_trend['primary_mood'] != 'happy':
            return True
        
        return False
    
    def get_redirect_suggestions(self) -> List[str]:
        """Get suggestions for redirecting conversation based on user preferences"""
        suggestions = []
        
        # Use user's onboarding preferences
        if self.user_preferences.get('morning_preference'):
            suggestions.append(f"Tell me about your {self.user_preferences['morning_preference']} routine")
        
        if self.user_preferences.get('life_genre'):
            suggestions.append(f"Let's talk about {self.user_preferences['life_genre']} - what's your favorite story?")
        
        if self.user_preferences.get('weekly_goal'):
            suggestions.append(f"How's your progress on your goal: {self.user_preferences['weekly_goal']}?")
        
        if self.user_preferences.get('favorite_app'):
            suggestions.append(f"What do you like most about {self.user_preferences['favorite_app']}?")
        
        # Add general positive topics
        suggestions.extend([
            "What's something that made you smile today?",
            "Tell me about a recent achievement you're proud of",
            "What's your favorite way to relax?",
            "Share something interesting you learned recently"
        ])
        
        return suggestions[:3]  # Return top 3 suggestions
    
    def to_dict(self) -> Dict:
        """Convert context to dictionary for storage"""
        return {
            'user_id': self.user_id,
            'session_id': self.session_id,
            'user_preferences': self.user_preferences,
            'conversation_history': self.conversation_history,
            'current_mood': self.current_mood,
            'mood_history': self.mood_history,
            'topics_discussed': self.topics_discussed,
            'educational_topics_covered': self.educational_topics_covered,
            'last_activity': self.last_activity.isoformat()
        }
    
    def to_dict(self) -> Dict:
        """Convert context to serializable dictionary"""
        return {
            'user_id': self.user_id,
            'session_id': self.session_id,
            'user_preferences': self.user_preferences,
            'conversation_history': self.conversation_history,
            'current_mood': self.current_mood,
            'mood_history': self.mood_history,
            'topics_discussed': self.topics_discussed,
            'educational_topics_covered': self.educational_topics_covered,
            'last_activity': self.last_activity.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict):
        """Create context from dictionary"""
        context = cls(
            user_id=data['user_id'],
            session_id=data['session_id'],
            user_preferences=data.get('user_preferences', {})
        )
        context.conversation_history = data.get('conversation_history', [])
        context.current_mood = data.get('current_mood', 'neutral')
        context.mood_history = data.get('mood_history', [])
        context.topics_discussed = data.get('topics_discussed', [])
        context.educational_topics_covered = data.get('educational_topics_covered', [])
        context.last_activity = datetime.fromisoformat(data.get('last_activity', datetime.now().isoformat()))
        return context


class ConversationContextManager:
    def __init__(self):
        """Initialize context manager"""
        self.active_contexts = {}  # session_id -> ConversationContext
    
    def get_context(self, user_id: str, session_id: str, user_preferences: Dict = None) -> ConversationContext:
        """Get or create conversation context for a session"""
        if session_id not in self.active_contexts:
            self.active_contexts[session_id] = ConversationContext(
                user_id=user_id,
                session_id=session_id,
                user_preferences=user_preferences
            )
        return self.active_contexts[session_id]
    
    def update_context(self, session_id: str, message: Dict, mood: str = None, confidence: float = None):
        """Update context with new message and mood"""
        if session_id in self.active_contexts:
            context = self.active_contexts[session_id]
            context.add_message(message)
            
            if mood:
                context.update_mood(mood, confidence or 0.0)
    
    def cleanup_old_contexts(self, max_age_hours: int = 24):
        """Clean up old conversation contexts"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        to_remove = []
        for session_id, context in self.active_contexts.items():
            if context.last_activity < cutoff_time:
                to_remove.append(session_id)
        
        for session_id in to_remove:
            del self.active_contexts[session_id]
    
    def get_context_summary(self, session_id: str) -> Dict:
        """Get a summary of conversation context"""
        if session_id not in self.active_contexts:
            return {'error': 'Context not found'}
        
        context = self.active_contexts[session_id]
        return {
            'session_id': session_id,
            'user_id': context.user_id,
            'current_mood': context.current_mood,
            'mood_trend': context.get_mood_trend(),
            'topics_count': len(context.topics_discussed),
            'educational_topics_count': len(context.educational_topics_covered),
            'message_count': len(context.conversation_history),
            'should_redirect': context.should_redirect(),
            'redirect_suggestions': context.get_redirect_suggestions() if context.should_redirect() else [],
            'last_activity': context.last_activity.isoformat()
        }

# Global context manager instance
context_manager = ConversationContextManager()
