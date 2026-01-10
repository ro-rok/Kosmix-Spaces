"""Simple integration test for validation service."""
from app.services.validation_service import ValidationService
from app.core.errors import ValidationError as AppValidationError

def test_validation_service_integration():
    """Test the validation service with realistic data."""
    
    print("🧪 Testing Validation Service Integration\n")
    
    # Test 1: Valid enquiry data
    print("Test 1: Valid enquiry data")
    valid_enquiry = {
        "name": "John Doe",
        "phone": "9876543210",
        "email": "john@example.com"
    }
    
    # Test phone validation
    phone_result = ValidationService.validate_phone_number(valid_enquiry["phone"])
    assert phone_result.is_valid, f"Phone validation failed: {phone_result.errors}"
    print("✅ Valid phone number accepted")
    
    # Test email validation
    email_result = ValidationService.validate_email(valid_enquiry["email"])
    assert email_result.is_valid, f"Email validation failed: {email_result.errors}"
    print("✅ Valid email accepted")
    
    # Test 2: Invalid enquiry data
    print("\nTest 2: Invalid enquiry data")
    invalid_enquiry = {
        "name": "",
        "phone": "123456",  # Too short
        "email": "invalid-email"
    }
    
    # Test invalid phone
    phone_result = ValidationService.validate_phone_number(invalid_enquiry["phone"])
    assert not phone_result.is_valid, "Invalid phone should be rejected"
    print(f"✅ Invalid phone rejected: {phone_result.get_field_errors('phone')[0]}")
    
    # Test invalid email
    email_result = ValidationService.validate_email(invalid_enquiry["email"])
    assert not email_result.is_valid, "Invalid email should be rejected"
    print(f"✅ Invalid email rejected: {email_result.get_field_errors('email')[0]}")
    
    # Test 3: Password strength validation
    print("\nTest 3: Password strength validation")
    
    weak_passwords = [
        "password",  # No uppercase, numbers, special chars
        "Password",  # No numbers, special chars
        "Pass1!",    # Too short
        "PASSWORD123!"  # No lowercase
    ]
    
    for password in weak_passwords:
        result = ValidationService.validate_password_strength(password)
        assert not result.is_valid, f"Weak password '{password}' should be rejected"
        print(f"✅ Weak password '{password}' rejected: {result.get_field_errors('password')[0]}")
    
    # Test strong password
    strong_password = "StrongPass123!"
    result = ValidationService.validate_password_strength(strong_password)
    assert result.is_valid, f"Strong password should be accepted: {result.errors}"
    print("✅ Strong password accepted")
    
    # Test 4: Listing data validation
    print("\nTest 4: Listing data validation")
    
    valid_listing = {
        "displayName": "Premium Workspace",
        "locality": "Koramangala",
        "city": "Bangalore",
        "overview": "A premium workspace with all modern amenities for growing teams.",
        "offerings": {
            "private-offices": {
                "enabled": True,
                "title": "Private Offices",
                "description": "Fully furnished private offices with modern amenities",
                "photos": ["office1.jpg", "office2.jpg"]
            },
            "hot-desks": {
                "enabled": True,
                "title": "Hot Desks",
                "description": "Flexible hot desk spaces",
                "photos": ["hotdesk1.jpg"]
            }
        }
    }
    
    result = ValidationService.validate_listing_data(valid_listing)
    assert result.is_valid, f"Valid listing should be accepted: {result.errors}"
    print("✅ Valid listing data accepted")
    
    # Test invalid listing
    invalid_listing = {
        "displayName": "",  # Missing
        "locality": "Koramangala",
        "city": "Bangalore", 
        "overview": "Short",  # Too short
        "offerings": {
            "private-offices": {
                "enabled": True,
                "title": "",  # Missing title
                "photos": []  # No photos
            }
        }
    }
    
    result = ValidationService.validate_listing_data(invalid_listing)
    assert not result.is_valid, "Invalid listing should be rejected"
    print(f"✅ Invalid listing rejected with {len(result.errors)} errors:")
    for field, errors in result.errors.items():
        print(f"   - {field}: {errors[0]}")
    
    # Test 5: Error raising
    print("\nTest 5: Error raising")
    
    try:
        ValidationService.raise_validation_error(result, "Listing validation failed")
        assert False, "Should have raised ValidationError"
    except AppValidationError as e:
        assert e.message == "Listing validation failed"
        assert "field_errors" in e.details
        print("✅ ValidationError raised correctly")
    
    print("\n✅ All validation service integration tests passed!")

def test_error_message_formatting():
    """Test error message formatting for different error types."""
    
    print("\n🧪 Testing Error Message Formatting\n")
    
    test_cases = [
        {
            "error": {"type": "missing", "msg": "field required"},
            "expected": "This field is required"
        },
        {
            "error": {"type": "string_too_short", "ctx": {"limit_value": 8}},
            "expected": "Must be at least 8 characters"
        },
        {
            "error": {"type": "string_too_long", "ctx": {"limit_value": 50}},
            "expected": "Must be no more than 50 characters"
        },
        {
            "error": {"type": "value_error.email", "msg": "invalid email"},
            "expected": "Please enter a valid email address"
        },
        {
            "error": {"type": "type_error.integer", "msg": "not an integer"},
            "expected": "Must be a valid number"
        },
        {
            "error": {"type": "unknown_type", "msg": "Custom error message"},
            "expected": "Custom error message"
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        formatted = ValidationService._format_error_message(case["error"])
        assert formatted == case["expected"], f"Case {i} failed: got '{formatted}', expected '{case['expected']}'"
        print(f"✅ Case {i}: {case['error']['type']} -> '{formatted}'")
    
    print("\n✅ All error message formatting tests passed!")

if __name__ == "__main__":
    test_validation_service_integration()
    test_error_message_formatting()
    print("\n🎉 All integration tests completed successfully!")