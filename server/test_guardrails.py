"""
Test script for guardrails implementation
Run this to test PII detection, toxicity detection, and input validation
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.guardrails import guardrails_service
from utils.pii_guard import pii_guard
from utils.input_guard import input_guard

def test_pii_detection():
    """Test PII detection functionality"""
    print("=== Testing PII Detection ===")
    
    test_messages = [
        "My email is tahiya@yahoo.com and my phone is 555-123-4567",
        "Please contact me at jane.nitin@gmail.com or call 9876543210",
        "My SSN is 123-45-6789 and I live at Shanti Road, Andheri, Mumbai",
        "This is a normal message without any personal information",
        "Credit card: 4532-1234-5678-9012"
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\nTest {i}: {message[:50]}...")
        
        # Test PII detection
        pii_summary = pii_guard.get_pii_summary(message)
        print(f"PII Detected: {pii_summary.get('has_pii', False)}")
        print(f"Entity Types: {pii_summary.get('entity_types', [])}")
        print(f"Risk Level: {pii_summary.get('risk_level', 'UNKNOWN')}")
        
        # Test PII scrubbing
        if pii_summary.get('has_pii', False):
            scrubbed, scrub_info = pii_guard.scrub_pii(message)
            print(f"Scrubbed: {scrubbed}")
            print(f"Scrub Info: {scrub_info.get('entities_detected', 0)} entities")

def test_toxicity_detection():
    """Test toxicity detection functionality"""
    print("\n=== Testing Toxicity Detection ===")
    
    test_messages = [
        "Hello, how are you today?",
        "This is a helpful message about security",
        "I hate this stupid system and want to destroy it",
        "Please help me with my computer problem",
        "You are an idiot and I hope you fail"
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\nTest {i}: {message}")
        
        toxicity_results = input_guard.detect_toxicity(message, threshold=0.7)
        print(f"Toxic: {toxicity_results.get('is_toxic', False)}")
        print(f"Confidence: {toxicity_results.get('confidence', 0):.3f}")
        print(f"Max Category: {toxicity_results.get('max_category', 'N/A')}")

def test_input_validation():
    """Test input validation functionality"""
    print("\n=== Testing Input Validation ===")
    
    test_messages = [
        "Short",
        "A" * 3000,  
        "This is a normal message", 
        "This message has too many lines\n" * 25,
        "Normal message with some content here",
        "SPAM MESSAGE WITH EXCESSIVE CAPS AND REPETITIVE CONTENT CONTENT CONTENT",
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\nTest {i}: {message[:50]}...")
        
        validation_results = input_guard.validate_input(message)
        print(f"Valid: {validation_results['is_valid']}")
        if validation_results['violations']:
            print(f"Violations: {[v['message'] for v in validation_results['violations']]}")
        
        content_results = input_guard.check_restricted_content(message)
        print(f"Restricted Content: {content_results['has_restricted_content']}")
        if content_results['found_keywords']:
            print(f"Keywords: {content_results['found_keywords']}")

def test_comprehensive_guardrails():
    """Test comprehensive guardrails processing"""
    print("\n=== Testing Comprehensive Guardrails ===")
    
    test_messages = [
        "Hello, I need help with my account", 
        "My email is aaliyaan@outlook.com and I need assistance", 
        "This system is terrible and I hate it",
        "I want to harm someone",
        "Normal message without issues",
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\nTest {i}: {message}")
        result = guardrails_service.process_message(message, f"user_{i}")
        
        print(f"Safe: {result['is_safe']}")
        print(f"Blocked: {result['should_block']}")
        print(f"Risk Level: {result['risk_level']}")
        print(f"PII Detected: {result['pii_detected']}")
        print(f"PII Scrubbed: {result['pii_scrubbed']}")
        print(f"Toxicity Detected: {result['toxicity_detected']}")
        print(f"Validation Failed: {result['validation_failed']}")
        
        if result['warnings']:
            print(f"Warnings: {result['warnings']}")
        
        if result['processed_message'] != result['original_message']:
            print(f"Processed: {result['processed_message']}")

def main():
    """Run all tests"""
    print("Starting Guardrails Test Suite")
    print("=" * 50)
    
    try:
        test_pii_detection()
        test_toxicity_detection()
        test_input_validation()
        test_comprehensive_guardrails()
        
        print("\n" + "=" * 50)
        print("All tests completed successfully!")
        
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
