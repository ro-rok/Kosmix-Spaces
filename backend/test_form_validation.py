"""Test the enhanced form validation and error handling system."""
import pytest
from app.services.validation_service import ValidationService, ValidationResult
from app.core.errors import ValidationError as AppValidationError


class TestValidationResult:
    """Test ValidationResult class."""
    
    def test_initialization(self):
        """Test ValidationResult initialization."""
        result = ValidationResult(is_valid=True)
        assert result.is_valid is True
        assert result.errors == {}
        
        result = ValidationResult(is_valid=False, errors={"field": ["error"]})
        assert result.is_valid is False
        assert result.errors == {"field": ["error"]}
    
    def test_add_error(self):
        """Test adding errors to ValidationResult."""
        result = ValidationResult(is_valid=True)
        result.add_error("email", "Invalid email format")
        
        assert result.is_valid is False
        assert result.errors["email"] == ["Invalid email format"]
        
        # Add another error to same field
        result.add_error("email", "Email already exists")
        assert len(result.errors["email"]) == 2
    
    def test_has_errors(self):
        """Test has_errors method."""
        result = ValidationResult(is_valid=True)
        assert result.has_errors() is False
        
        result.add_error("field", "error")
        assert result.has_errors() is True
    
    def test_get_field_errors(self):
        """Test getting errors for specific field."""
        result = ValidationResult(is_valid=True)
        result.add_error("email", "Invalid email")
        result.add_error("email", "Email required")
        
        errors = result.get_field_errors("email")
        assert len(errors) == 2
        assert "Invalid email" in errors
        assert "Email required" in errors
        
        # Non-existent field
        assert result.get_field_errors("nonexistent") == []
    
    def test_to_dict(self):
        """Test converting ValidationResult to dictionary."""
        result = ValidationResult(is_valid=False)
        result.add_error("email", "Invalid email")
        result.add_error("name", "Name required")
        
        dict_result = result.to_dict()
        assert dict_result["is_valid"] is False
        assert dict_result["errors"] == {"email": ["Invalid email"], "name": ["Name required"]}
        assert dict_result["error_count"] == 2


class TestValidationService:
    """Test ValidationService class."""
    
    def test_format_error_message(self):
        """Test error message formatting."""
        # Test missing field
        error = {"type": "missing", "msg": "field required"}
        message = ValidationService._format_error_message(error)
        assert message == "This field is required"
        
        # Test string too short
        error = {"type": "string_too_short", "ctx": {"limit_value": 5}}
        message = ValidationService._format_error_message(error)
        assert message == "Must be at least 5 characters"
        
        # Test string too long
        error = {"type": "string_too_long", "ctx": {"limit_value": 100}}
        message = ValidationService._format_error_message(error)
        assert message == "Must be no more than 100 characters"
        
        # Test email validation
        error = {"type": "value_error.email", "msg": "invalid email"}
        message = ValidationService._format_error_message(error)
        assert message == "Please enter a valid email address"
        
        # Test unknown error type
        error = {"type": "unknown_error", "msg": "Something went wrong"}
        message = ValidationService._format_error_message(error)
        assert message == "Something went wrong"
    
    def test_validate_phone_number(self):
        """Test phone number validation."""
        # Valid phone numbers
        result = ValidationService.validate_phone_number("9876543210")
        assert result.is_valid is True
        
        result = ValidationService.validate_phone_number("+91-9876543210")
        assert result.is_valid is True
        
        result = ValidationService.validate_phone_number("919876543210")
        assert result.is_valid is True
        
        # Invalid phone numbers
        result = ValidationService.validate_phone_number("")
        assert result.is_valid is False
        assert "required" in result.get_field_errors("phone")[0].lower()
        
        result = ValidationService.validate_phone_number("123456789")  # Too short
        assert result.is_valid is False
        assert "10 digits" in result.get_field_errors("phone")[0]
        
        result = ValidationService.validate_phone_number("1234567890")  # Doesn't start with 6-9
        assert result.is_valid is False
        assert "start with 6, 7, 8, or 9" in result.get_field_errors("phone")[0]
        
        result = ValidationService.validate_phone_number("98765abcde")  # Contains letters
        assert result.is_valid is False
        assert "digits" in result.get_field_errors("phone")[0].lower()
    
    def test_validate_email(self):
        """Test email validation."""
        # Valid emails
        result = ValidationService.validate_email("test@example.com")
        assert result.is_valid is True
        
        result = ValidationService.validate_email("user.name+tag@domain.co.uk")
        assert result.is_valid is True
        
        # Invalid emails
        result = ValidationService.validate_email("")
        assert result.is_valid is False
        assert "required" in result.get_field_errors("email")[0].lower()
        
        result = ValidationService.validate_email("invalid-email")
        assert result.is_valid is False
        assert "valid email" in result.get_field_errors("email")[0].lower()
        
        result = ValidationService.validate_email("test@")
        assert result.is_valid is False
        
        # Too long email
        long_email = "a" * 250 + "@example.com"
        result = ValidationService.validate_email(long_email)
        assert result.is_valid is False
        assert "too long" in result.get_field_errors("email")[0].lower()
    
    def test_validate_password_strength(self):
        """Test password strength validation."""
        # Valid password
        result = ValidationService.validate_password_strength("Password123!")
        assert result.is_valid is True
        
        # Invalid passwords
        result = ValidationService.validate_password_strength("")
        assert result.is_valid is False
        assert "required" in result.get_field_errors("password")[0].lower()
        
        result = ValidationService.validate_password_strength("short")
        assert result.is_valid is False
        assert "8 characters" in result.get_field_errors("password")[0]
        
        result = ValidationService.validate_password_strength("password123!")  # No uppercase
        assert result.is_valid is False
        assert "uppercase" in result.get_field_errors("password")[0].lower()
        
        result = ValidationService.validate_password_strength("PASSWORD123!")  # No lowercase
        assert result.is_valid is False
        assert "lowercase" in result.get_field_errors("password")[0].lower()
        
        result = ValidationService.validate_password_strength("Password!")  # No number
        assert result.is_valid is False
        assert "number" in result.get_field_errors("password")[0].lower()
        
        result = ValidationService.validate_password_strength("Password123")  # No special char
        assert result.is_valid is False
        assert "special character" in result.get_field_errors("password")[0].lower()
    
    def test_validate_listing_data(self):
        """Test listing data validation."""
        # Valid listing data
        valid_data = {
            "displayName": "Test Workspace",
            "locality": "Koramangala",
            "city": "Bangalore",
            "overview": "A great workspace for teams",
            "offerings": {
                "private-offices": {
                    "enabled": True,
                    "title": "Private Offices",
                    "description": "Fully furnished private offices",
                    "photos": ["photo1.jpg"]
                }
            }
        }
        
        result = ValidationService.validate_listing_data(valid_data)
        assert result.is_valid is True
        
        # Invalid listing data - missing required fields
        invalid_data = {
            "displayName": "",
            "locality": "",
            "city": "",
            "overview": "",
            "offerings": {}
        }
        
        result = ValidationService.validate_listing_data(invalid_data)
        assert result.is_valid is False
        assert len(result.errors) > 0
        assert "displayName" in result.errors
        assert "locality" in result.errors
        assert "city" in result.errors
        assert "overview" in result.errors
        assert "offerings" in result.errors
        
        # Invalid offering data
        invalid_offering_data = {
            "displayName": "Test Workspace",
            "locality": "Koramangala", 
            "city": "Bangalore",
            "overview": "A great workspace for teams",
            "offerings": {
                "private-offices": {
                    "enabled": True,
                    "title": "",  # Missing title
                    "photos": []  # No photos
                }
            }
        }
        
        result = ValidationService.validate_listing_data(invalid_offering_data)
        assert result.is_valid is False
        assert "offerings.private-offices.title" in result.errors
        assert "offerings.private-offices.photos" in result.errors
    
    def test_raise_validation_error(self):
        """Test raising ValidationError from ValidationResult."""
        result = ValidationResult(is_valid=False)
        result.add_error("email", "Invalid email")
        result.add_error("name", "Name required")
        
        with pytest.raises(AppValidationError) as exc_info:
            ValidationService.raise_validation_error(result, "Custom message")
        
        error = exc_info.value
        assert error.message == "Custom message"
        assert error.details["field_errors"] == result.errors
        assert error.details["error_count"] == 2
        
        # Test with valid result (should not raise)
        valid_result = ValidationResult(is_valid=True)
        ValidationService.raise_validation_error(valid_result)  # Should not raise


if __name__ == "__main__":
    pytest.main([__file__, "-v"])