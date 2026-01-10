#!/usr/bin/env python3
"""Test script to verify temp photo upload endpoint."""

import requests
import json

def test_temp_photo_endpoint():
    """Test the temporary photo upload endpoint."""
    
    print("Testing temporary photo upload endpoint...")
    
    # Test endpoint URL
    url = "http://localhost:8000/api/partner/temp-photos"
    
    # Test without authentication (should get 401)
    print("\n1. Testing without authentication:")
    try:
        response = requests.post(url)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test with invalid file (should get 422)
    print("\n2. Testing with invalid file:")
    try:
        files = {'file': ('test.txt', 'not an image', 'text/plain')}
        headers = {'Authorization': 'Bearer test-token'}
        response = requests.post(url, files=files, headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test endpoint availability
    print("\n3. Testing endpoint availability:")
    try:
        response = requests.options(url)
        print(f"   OPTIONS Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_temp_photo_endpoint()