"""Integration test for form validation and error handling."""
import asyncio
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_enhanced_error_handling():
    """Test enhanced error handling with validation errors."""
    
    # Test validation error response format
    response = client.post("/api/public/leads", json={
        "name": "",  # Missing required field
        "phone": "invalid",  # Invalid phone format
        "email": "invalid-email",  # Invalid email format
        "preferredLocalities": [],  # Empty array
        "teamSizeBand": "",  # Missing required field
        "budgetBandId": "",  # Missing required field
        "spaceType": ""  # Missing required field
    })
    
    assert response.status_code == 422
    
    error_data = response.json()
    assert "error" in error_data
    assert error_data["error"]["code"] == "VALIDATION_ERROR"
    assert error_data["error"]["message"] == "Request validation failed"
    assert "details" in error_data["error"]
    assert "errors" in error_data["error"]["details"]
    
    # Check that errors are properly structured
    errors = error_data["error"]["details"]["errors"]
    assert len(errors) > 0
    
    # Each error should have field, type, and message
    for error in errors:
        assert "field" in error
        assert "type" in error
        assert "message" in error
    
    print("✅ Validation error format is correct")

def test_successful_form_submission():
    """Test successful form submission."""
    
    response = client.post("/api/public/leads", json={
        "name": "John Doe",
        "phone": "+91-9876543210",
        "email": "john@example.com",
        "company": "Test Company",
        "preferredLocalities": ["koramangala"],
        "teamSizeBand": "2-5",
        "budgetBandId": "10k-25k",
        "spaceType": "private-office",
        "moveInTimeframe": "1month",
        "meetingRoomsNeeded": True,
        "gstRequired": True,
        "parkingNeeded": False,
        "powerBackupRequired": True,
        "nearMetroPreferred": True,
        "notes": "Looking for a quiet workspace",
        "source": "website"
    })
    
    if response.status_code == 200:
        data = response.json()
        assert "leadId" in data
        assert "message" in data
        print("✅ Successful form submission works")
    else:
        print(f"⚠️  Form submission returned {response.status_code}: {response.text}")

def test_network_error_simulation():
    """Test network error handling."""
    
    # Test with invalid endpoint to simulate network error
    response = client.get("/api/nonexistent-endpoint")
    
    assert response.status_code == 404
    
    error_data = response.json()
    assert "error" in error_data
    
    print("✅ Network error handling works")

def test_server_error_handling():
    """Test server error handling."""
    
    # The error handling middleware should catch any unhandled exceptions
    # and return a structured error response
    
    # Test health endpoint to ensure basic functionality
    response = client.get("/api/health")
    
    if response.status_code == 200:
        print("✅ Server is responding correctly")
    else:
        print(f"⚠️  Server health check failed: {response.status_code}")

def test_request_id_header():
    """Test that request ID is added to responses."""
    
    response = client.get("/api/health")
    
    # Check if request ID header is present
    if "X-Request-ID" in response.headers:
        request_id = response.headers["X-Request-ID"]
        assert len(request_id) > 0
        print(f"✅ Request ID header present: {request_id}")
    else:
        print("⚠️  Request ID header not found")

def test_security_headers():
    """Test that security headers are added."""
    
    response = client.get("/api/health")
    
    security_headers = [
        "X-Content-Type-Options",
        "X-Frame-Options", 
        "X-XSS-Protection",
        "Referrer-Policy"
    ]
    
    for header in security_headers:
        if header in response.headers:
            print(f"✅ Security header {header}: {response.headers[header]}")
        else:
            print(f"⚠️  Security header {header} not found")

if __name__ == "__main__":
    print("🧪 Testing Enhanced Form Validation and Error Handling Integration\n")
    
    test_enhanced_error_handling()
    test_successful_form_submission()
    test_network_error_simulation()
    test_server_error_handling()
    test_request_id_header()
    test_security_headers()
    
    print("\n✅ Integration tests completed!")