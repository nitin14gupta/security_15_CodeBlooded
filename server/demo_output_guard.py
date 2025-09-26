"""
Quick demo of the output guardrails system
"""
from utils.guardrails import guardrails_service

def demo_output_guardrails():
    print('🛡️ SecurityApp Output Guardrails Demo')
    print('=' * 50)
    
    # Test case 1: Safe response
    print('\n✅ Test 1: Safe AI Response')
    result = guardrails_service.validate_ai_output(
        'Hello! I can help you with programming questions. What would you like to know?',
        'Can you help me with coding?'
    )
    print(f'Safe: {result["is_safe"]}')
    print(f'Risk Level: {result["risk_level"]}')
    print(f'Fallback Used: {result["fallback_used"]}')
    
    # Test case 2: Toxic response
    print('\n❌ Test 2: Toxic AI Response')
    result = guardrails_service.validate_ai_output(
        'You are such an idiot! I hate helping people like you!',
        'Can you help me?'
    )
    print(f'Safe: {result["is_safe"]}')
    print(f'Risk Level: {result["risk_level"]}')
    print(f'Fallback Used: {result["fallback_used"]}')
    print(f'Processed Response: {result["processed_response"][:50]}...')
    
    # Test case 3: PII in response
    print('\n⚠️ Test 3: PII in AI Response')
    result = guardrails_service.validate_ai_output(
        'My email is support@example.com and phone is 555-123-4567',
        'What is your contact info?'
    )
    print(f'Safe: {result["is_safe"]}')
    print(f'Risk Level: {result["risk_level"]}')
    print(f'PII Detected: {result["pii_detected"]}')
    print(f'PII Scrubbed: {result["pii_scrubbed"]}')
    
    print('\n🎉 Output Guardrails System: READY!')

if __name__ == "__main__":
    demo_output_guardrails()
