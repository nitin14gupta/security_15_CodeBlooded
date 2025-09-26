"""
Educational Response Service
Generates educational responses for restricted content instead of blocking
"""
from typing import Dict, List, Optional, Tuple
import random

class EducationalResponseService:
    def __init__(self):
        """Initialize educational response templates and content"""
        
        # Educational response templates for different types of restricted content
        self.educational_templates = {
            'nudity': {
                'response': "I understand you're curious about nudity. It's a natural part of human biology and is discussed in contexts like art, medicine, and education. While it's important to understand these topics, I encourage focusing our conversations on positive and constructive subjects. What else would you like to explore?",
                'redirect_topics': ['art history', 'biology', 'health education', 'creative expression']
            },
            'violence': {
                'response': "I understand you're curious about this topic. While I can provide educational context, I believe our conversations are more meaningful when focused on positive subjects that help you grow. Based on your interests, would you like to discuss something more constructive?",
                'redirect_topics': ['conflict resolution', 'peace studies', 'history', 'problem solving']
            },
            'drugs': {
                'response': "I can help you understand the science behind substances and their effects on the body and mind. This is important knowledge for making informed decisions. However, I'd love to focus on positive topics that help you grow. What interests you most?",
                'redirect_topics': ['health science', 'biology', 'chemistry', 'wellness']
            },
            'illegal_activities': {
                'response': "I understand you might be curious about these topics. While I can provide educational context about laws and their purposes, I believe our conversations are more valuable when focused on positive, constructive subjects. What would you like to learn about instead?",
                'redirect_topics': ['law and society', 'ethics', 'civics', 'social studies']
            },
            'explicit_content': {
                'response': "I understand you're curious about this topic. These subjects are part of human experience and are discussed in educational contexts like health, psychology, and biology. I'd love to help you learn in a positive way. What other topics interest you?",
                'redirect_topics': ['health education', 'psychology', 'biology', 'relationships']
            },
            'hate_speech': {
                'response': "I understand you might be exploring different perspectives. It's important to learn about diversity, inclusion, and how to communicate respectfully. I'd love to help you understand these topics in a positive, educational way. What would you like to know about?",
                'redirect_topics': ['diversity and inclusion', 'communication', 'social studies', 'ethics']
            }
        }
        
        # Buddy-like response templates for different moods
        self.buddy_responses = {
            'happy': {
                'greetings': [
                    "Hey there! I'm so glad you're feeling good! 😊",
                    "Awesome! I love your positive energy! ✨",
                    "That's fantastic! Your enthusiasm is contagious! 🎉"
                ],
                'encouragements': [
                    "That's amazing! Keep that positive energy flowing!",
                    "I love how excited you are about this!",
                    "Your enthusiasm is wonderful to see!"
                ]
            },
            'sad': {
                'greetings': [
                    "Hey, I notice you might be feeling a bit down today. I'm here for you. 💙",
                    "I can sense you're going through something. Let's talk about it. 🤗",
                    "You know what? Sometimes we all have tough days. I'm here to listen. ❤️"
                ],
                'encouragements': [
                    "Remember, you're stronger than you think.",
                    "It's okay to not be okay sometimes. I'm here for you.",
                    "Let's focus on something that brings you joy."
                ]
            },
            'curious': {
                'greetings': [
                    "I love your curiosity! That's how we learn and grow! 🧠",
                    "Great question! I'm excited to help you explore this! 🔍",
                    "Your thirst for knowledge is wonderful! Let's dive in! 📚"
                ],
                'encouragements': [
                    "That's a fantastic question! Let's explore this together.",
                    "I love how curious you are! Learning is a journey.",
                    "Your questions show you're really thinking deeply about this."
                ]
            },
            'supportive': {
                'greetings': [
                    "I'm here to help and support you in any way I can. 💪",
                    "You're not alone in this. I'm here to listen and help. 🤝",
                    "I care about you and want to help you through this. ❤️"
                ],
                'encouragements': [
                    "You've got this! I believe in you.",
                    "Take it one step at a time. I'm here to help.",
                    "Remember, asking for help is a sign of strength."
                ]
            },
            'neutral': {
                'greetings': [
                    "Hey there! I'm here to chat! 😊",
                    "Hello! What's on your mind today? 🤔",
                    "Hi! I'm ready to help with whatever you need! ✨"
                ],
                'encouragements': [
                    "I'm here to help you with anything you need.",
                    "Feel free to ask me anything!",
                    "I'm ready to chat about whatever interests you."
                ]
            }
        }
        
        # Context-aware response templates
        self.context_responses = {
            'educational_opportunity': "I get why you're curious about this! {educational_content} What do you think about exploring {suggested_topic} instead?",
            'mood_concerned': "I notice you might be feeling a bit down today. Remember when you mentioned you enjoy {user_preference}? Want to talk about that instead?",
            'context_aware': "That reminds me of what we discussed earlier about {previous_topic}. It's cool how these things connect, right?",
            'redirect_needed': "I think we'd both enjoy talking about {redirect_topic} more. What do you think?",
            'personal_connection': "Hey {user_name}, I remember you mentioned {user_preference}. How's that going?"
        }
    
    def generate_educational_response(self, content_type: str, user_preferences: Dict = None, context: Dict = None) -> Dict:
        """
        Generate an educational response for restricted content
        
        Args:
            content_type (str): Type of restricted content
            user_preferences (Dict): User's onboarding preferences
            context (Dict): Conversation context
            
        Returns:
            Dict: Educational response with guidance
        """
        # Get base educational template
        template = self.educational_templates.get(content_type, self.educational_templates['violence'])
        
        # Personalize response based on user preferences
        personalized_response = self._personalize_response(template['response'], user_preferences, context)
        
        # Suggest redirect topics
        redirect_suggestions = self._get_redirect_suggestions(template['redirect_topics'], user_preferences)
        
        return {
            'response_type': 'educational',
            'content': personalized_response,
            'redirect_suggestions': redirect_suggestions,
            'educational_value': True,
            'tone': 'supportive',
            'approach': 'gentle_guidance'
        }
    
    def generate_buddy_response(self, base_response: str, mood: str, context: Dict, user_preferences: Dict = None) -> str:
        """
        Generate a buddy-like response with personality
        
        Args:
            base_response (str): Base AI response
            mood (str): Current mood
            context (Dict): Conversation context
            user_preferences (Dict): User preferences
            
        Returns:
            str: Personalized buddy response
        """
        # Get mood-appropriate templates
        mood_templates = self.buddy_responses.get(mood, self.buddy_responses['neutral'])
        
        # Add greeting if it's the start of a new topic
        if context.get('is_new_topic', False):
            greeting = random.choice(mood_templates.get('greetings', ['Hey there!']))
            base_response = f"{greeting} {base_response}"
        
        # Add encouragement based on mood
        if mood in ['sad', 'supportive']:
            encouragement = random.choice(mood_templates.get('encouragements', ['You\'re doing great!']))
            base_response = f"{base_response} {encouragement}"
        
        # Add personal touches
        if user_preferences:
            base_response = self._add_personal_touches(base_response, user_preferences, context)
        
        return base_response
    
    def generate_context_aware_response(self, response_type: str, context: Dict, user_preferences: Dict = None) -> str:
        """
        Generate context-aware response using conversation history
        
        Args:
            response_type (str): Type of response needed
            context (Dict): Conversation context
            user_preferences (Dict): User preferences
            
        Returns:
            str: Context-aware response
        """
        template = self.context_responses.get(response_type, self.context_responses['educational_opportunity'])
        
        # Fill in template variables
        response = template
        
        if '{user_name}' in template and user_preferences:
            response = response.replace('{user_name}', user_preferences.get('name', 'friend'))
        
        if '{user_preference}' in template and user_preferences:
            preference = user_preferences.get('morning_preference', 'your interests')
            response = response.replace('{user_preference}', preference)
        
        if '{previous_topic}' in template and context.get('topics_discussed'):
            topic = context['topics_discussed'][-1] if context['topics_discussed'] else 'our previous conversation'
            response = response.replace('{previous_topic}', topic)
        
        if '{redirect_topic}' in template:
            suggestions = self._get_redirect_suggestions([], user_preferences)
            topic = suggestions[0] if suggestions else 'something positive'
            response = response.replace('{redirect_topic}', topic)
        
        return response
    
    def _personalize_response(self, response: str, user_preferences: Dict = None, context: Dict = None) -> str:
        """Personalize response based on user preferences and context"""
        if not user_preferences:
            return response
        
        # Add user's name if available
        if user_preferences.get('name'):
            response = f"Hey {user_preferences['name']}, {response.lower()}"
        
        # Reference user's interests
        if user_preferences.get('life_genre'):
            response += f" I remember you mentioned you enjoy {user_preferences['life_genre']}. That's a great way to explore new ideas!"
        
        return response
    
    def _get_redirect_suggestions(self, base_topics: List[str], user_preferences: Dict = None) -> List[str]:
        """Get personalized redirect suggestions"""
        suggestions = base_topics.copy()
        
        if user_preferences:
            # Add user-specific suggestions
            if user_preferences.get('morning_preference'):
                suggestions.append(f"your {user_preferences['morning_preference']} routine")
            
            if user_preferences.get('life_genre'):
                suggestions.append(f"{user_preferences['life_genre']} stories")
            
            if user_preferences.get('weekly_goal'):
                suggestions.append("your goals and aspirations")
            
            if user_preferences.get('favorite_app'):
                suggestions.append(f"technology and {user_preferences['favorite_app']}")
        
        # Add general positive topics
        suggestions.extend([
            "creative projects",
            "learning new skills",
            "positive experiences",
            "future plans"
        ])
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def _add_personal_touches(self, response: str, user_preferences: Dict, context: Dict) -> str:
        """Add personal touches to response"""
        # Reference previous conversations
        if context.get('topics_discussed'):
            recent_topic = context['topics_discussed'][-1]
            response += f" That reminds me of when we talked about {recent_topic} - it's cool how these things connect!"
        
        # Reference user's goals
        if user_preferences.get('weekly_goal'):
            response += f" How's your progress on your goal: {user_preferences['weekly_goal']}?"
        
        return response
    
    def should_provide_educational_content(self, content_type: str, user_age_context: str = 'adult') -> bool:
        """
        Determine if educational content should be provided
        
        Args:
            content_type (str): Type of restricted content
            user_age_context (str): User's age context
            
        Returns:
            bool: Whether to provide educational content
        """
        # Always provide educational content for adults
        if user_age_context == 'adult':
            return True
        
        # For younger users, be more selective
        educational_appropriate = ['science', 'health', 'history', 'art']
        return content_type in educational_appropriate
    
    def get_educational_content(self, content_type: str) -> Dict:
        """
        Get educational content for specific topics
        
        Args:
            content_type (str): Type of content
            
        Returns:
            Dict: Educational content
        """
        educational_content = {
            'nudity': {
                'title': 'Understanding Human Biology and Art',
                'content': 'Nudity in art and science is about understanding human anatomy, biology, and artistic expression. It\'s studied in medical schools, art history, and biology classes.',
                'context': 'educational',
                'topics': ['art history', 'human biology', 'medical education', 'cultural studies']
            },
            'violence': {
                'title': 'Understanding Conflict and Resolution',
                'content': 'Violence is studied in psychology, sociology, and conflict resolution. Understanding its causes helps us build better, more peaceful societies.',
                'context': 'educational',
                'topics': ['psychology', 'sociology', 'conflict resolution', 'peace studies']
            },
            'drugs': {
                'title': 'Understanding Substances and Health',
                'content': 'Substances and their effects are studied in chemistry, pharmacology, and health sciences. This knowledge helps us understand human biology and make informed decisions.',
                'context': 'educational',
                'topics': ['chemistry', 'pharmacology', 'health sciences', 'biology']
            }
        }
        
        return educational_content.get(content_type, {
            'title': 'Educational Context',
            'content': 'This topic can be explored in educational contexts to help us understand the world better.',
            'context': 'general',
            'topics': ['general education', 'learning', 'understanding']
        })

# Initialize the service
educational_service = EducationalResponseService()
