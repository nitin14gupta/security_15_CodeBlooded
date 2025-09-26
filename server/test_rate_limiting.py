"""
Test script for rate limiting functionality
"""
import requests
import time
import json

def test_rate_limiting():
    """Test the rate limiting functionality"""
    base_url = "http://localhost:5000"
    
    print("Testing rate limiting...")
    print("=" * 50)
    
    # Test 1: Normal requests (should work)
    print("Test 1: Making 5 normal requests...")
    for i in range(5):
        try:
            response = requests.get(f"{base_url}/api/health")
            print(f"Request {i+1}: Status {response.status_code}")
        except Exception as e:
            print(f"Request {i+1}: Error - {e}")
        time.sleep(0.1)
    
    print("\nTest 2: Making rapid requests to trigger rate limiting...")
    # Test 2: Rapid requests to trigger rate limiting
    rate_limited = False
    for i in range(60):  # Try to make 60 requests quickly
        try:
            response = requests.get(f"{base_url}/api/health")
            if response.status_code == 429:
                print(f"Rate limit triggered at request {i+1}")
                rate_limited = True
                break
            elif i % 10 == 0:
                print(f"Request {i+1}: Status {response.status_code}")
        except Exception as e:
            print(f"Request {i+1}: Error - {e}")
        time.sleep(0.05)  # Very short delay
    
    if not rate_limited:
        print("Rate limiting not triggered - this might be expected if rate limiting is disabled")
    
    print("\nTest 3: Testing auth endpoints...")
    # Test 3: Test auth endpoints (should have stricter limits)
    try:
        # Try to register multiple times quickly
        for i in range(10):
            data = {
                "name": f"TestUser{i}",
                "email": f"test{i}@example.com",
                "password": "testpassword123",
                "user_type": "user"
            }
            response = requests.post(f"{base_url}/api/auth/register", json=data)
            if response.status_code == 429:
                print(f"Auth rate limit triggered at request {i+1}")
                break
            elif response.status_code != 201:
                print(f"Request {i+1}: Status {response.status_code}")
    except Exception as e:
        print(f"Auth test error: {e}")
    
    print("\nRate limiting test completed!")

if __name__ == "__main__":
    test_rate_limiting()
