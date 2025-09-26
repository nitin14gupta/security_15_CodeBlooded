"""
Test script to verify frontend integration with guardrails
This simulates the API calls that the frontend would make
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.guardrails import guardrails_service
import json

def test_api_responses():
    """Test the API responses that the frontend would receive"""
    print("=== Testing API Integration ===")
    
    # Test cases that should be blocked
    blocked_messages = [
        "I hate this system and want to destroy it",  # Toxic
        "My email is test@example.com",  # PII
        "SPAM MESSAGE WITH EXCESSIVE CAPS",  # Spam
        "A" * 3000,  # Too long
    ]
    
    # Test cases that should pass
    safe_messages = [
        "Hello, how can I help you?",
        "I need assistance with my account",
        "What are the security best practices?",
        "Can you explain how authentication works?",
    ]
    
    print("\n--- Testing Blocked Messages ---")
    for i, message in enumerate(blocked_messages, 1):
        print(f"\nTest {i}: {message[:50]}...")
        
        result = guardrails_service.process_message(message, f"user_{i}")
        
        # Simulate API response
        if result['should_block']:
            api_response = {
                "error": "Message blocked by guardrails",
                "warnings": result['warnings'],
                "risk_level": result['risk_level'],
                "blocked_reasons": result['processing_log']
            }
            print(f"✅ BLOCKED: {api_response['warnings']}")
        else:
            print(f"❌ UNEXPECTEDLY PASSED: {message}")
    
    print("\n--- Testing Safe Messages ---")
    for i, message in enumerate(safe_messages, 1):
        print(f"\nTest {i}: {message}")
        
        result = guardrails_service.process_message(message, f"user_{i}")
        
        # Simulate API response
        if not result['should_block']:
            api_response = {
                "response": f"AI response to: {result['processed_message']}",
                "model": "gemini-2.0-flash",
                "guardrails_applied": {
                    "pii_detected": result['pii_detected'],
                    "pii_scrubbed": result['pii_scrubbed'],
                    "risk_level": result['risk_level'],
                    "warnings": result['warnings'] if result['warnings'] else None
                }
            }
            print(f"✅ PASSED: {api_response['guardrails_applied']}")
        else:
            print(f"❌ UNEXPECTEDLY BLOCKED: {result['warnings']}")

def test_pii_scrubbing_detailed():
    """Test PII scrubbing in more detail"""
    print("\n=== Testing PII Scrubbing in Detail ===")
    
    test_messages = [
        "My email is john@example.com",
        "Call me at 555-123-4567",
        "My SSN is 123-45-6789",
        "Credit card: 4532-1234-5678-9012",
        "I live at 123 Main St, Anytown, USA",
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\nTest {i}: {message}")
        
        result = guardrails_service.process_message(message, f"user_{i}")
        
        print(f"Original: {result['original_message']}")
        print(f"Processed: {result['processed_message']}")
        print(f"PII Detected: {result['pii_detected']}")
        print(f"PII Scrubbed: {result['pii_scrubbed']}")
        print(f"Should Block: {result['should_block']}")
        
        if result['warnings']:
            print(f"Warnings: {result['warnings']}")

def main():
    """Run all integration tests"""
    print("Starting Frontend Integration Test Suite")
    print("=" * 60)
    
    try:
        test_api_responses()
        test_pii_scrubbing_detailed()
        
        print("\n" + "=" * 60)
        print("Integration tests completed!")
        
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
