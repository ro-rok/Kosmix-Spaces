"""Enhanced validation service with detailed error messages."""
from typing import Dict, List, Any, Optional, Union
from pydantic import BaseModel, ValidationError
from app.core.errors import ValidationError as AppValidationError


class ValidationResult:
    """Result of validation with detailed error information."""
    
    def __init__(self, is_valid: bool, errors: Optional[Dict[str, List[str]]] = None):
        self.is_valid = is_valid
        self.errors = errors or {}
        
    def add_error(self, field: str, message: str):
        """Add an error for a specific field."""
        if field not in self.errors:
            self.errors[field] = []
        self.errors[field].append(message)
        self.is_valid = False
        
    def has_errors(self) -> bool:
        """Check if there are any validation errors."""
        return not self.is_valid or bool(self.errors)
        
    def get_field_errors(self, field: str) -> List[str]:
        """Get errors for a specific field."""
        return self.errors.get(field, [])
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "error_count": sum(len(errors) for errors in self.errors.values())
        }


class ValidationService:
    """Service for enhanced validation with detailed error messages."""
    
    @staticmethod
    def validate_model(model_class: type[BaseModel], data: Dict[str, Any]) -> ValidationResult:
        """Validate data against a Pydantic model with enhanced error handling."""
        try:
            model_class(**data)
            return ValidationResult(is_valid=True)
        except ValidationError as e:
            result = ValidationResult(is_valid=False)
            
            for error in e.errors():
                field_path = ".".join(str(loc) for loc in error["loc"])
                message = ValidationService._format_error_message(error)
                result.add_error(field_path, message)
                
            return result
    
    @staticmethod
    def _format_error_message(error: Dict[str, Any]) -> str:
        """Format Pydantic error into user-friendly message."""
        error_type = error.get("type", "")
        msg = error.get("msg", "")
        ctx = error.get("ctx", {})
        
        # Custom messages for common validation errors
        if error_type == "missing":
            return "This field is required"
        elif error_type == "string_too_short":
            min_length = ctx.get("limit_value", 1)
            return f"Must be at least {min_length} character{'s' if min_length != 1 else ''}"
        elif error_type == "string_too_long":
            max_length = ctx.get("limit_value", 255)
            return f"Must be no more than {max_length} character{'s' if max_length != 1 else ''}"
        elif error_type == "value_error.email":
            return "Please enter a valid email address"
        elif error_type == "value_error.url":
            return "Please enter a valid URL"
        elif error_type == "type_error.integer":
            return "Must be a valid number"
        elif error_type == "type_error.float":
            return "Must be a valid decimal number"
        elif error_type == "type_error.bool":
            return "Must be true or false"
        elif error_type == "value_error.list.min_items":
            min_items = ctx.get("limit_value", 1)
            return f"Must have at least {min_items} item{'s' if min_items != 1 else ''}"
        elif error_type == "value_error.list.max_items":
            max_items = ctx.get("limit_value", 100)
            return f"Must have no more than {max_items} item{'s' if max_items != 1 else ''}"
        elif error_type == "value_error.number.not_gt":
            limit = ctx.get("limit_value", 0)
            return f"Must be greater than {limit}"
        elif error_type == "value_error.number.not_ge":
            limit = ctx.get("limit_value", 0)
            return f"Must be greater than or equal to {limit}"
        elif error_type == "value_error.number.not_lt":
            limit = ctx.get("limit_value", 100)
            return f"Must be less than {limit}"
        elif error_type == "value_error.number.not_le":
            limit = ctx.get("limit_value", 100)
            return f"Must be less than or equal to {limit}"
        elif "regex" in error_type:
            return "Format is invalid"
        else:
            # Return the original message for unknown error types
            return msg
    
    @staticmethod
    def validate_phone_number(phone: str) -> ValidationResult:
        """Validate Indian phone number format."""
        result = ValidationResult(is_valid=True)
        
        if not phone:
            result.add_error("phone", "Phone number is required")
            return result
            
        # Remove spaces and special characters for validation
        clean_phone = phone.replace(" ", "").replace("-", "").replace("+", "")
        
        # Check for Indian mobile number format
        if clean_phone.startswith("91"):
            clean_phone = clean_phone[2:]
            
        if not clean_phone.isdigit():
            result.add_error("phone", "Phone number can only contain digits")
        elif len(clean_phone) != 10:
            result.add_error("phone", "Phone number must be 10 digits")
        elif not clean_phone[0] in "6789":
            result.add_error("phone", "Mobile number must start with 6, 7, 8, or 9")
            
        return result
    
    @staticmethod
    def validate_email(email: str) -> ValidationResult:
        """Validate email address format."""
        import re
        
        result = ValidationResult(is_valid=True)
        
        if not email:
            result.add_error("email", "Email address is required")
            return result
            
        # Basic email regex
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(email_pattern, email):
            result.add_error("email", "Please enter a valid email address")
        elif len(email) > 254:
            result.add_error("email", "Email address is too long")
            
        return result
    
    @staticmethod
    def validate_password_strength(password: str) -> ValidationResult:
        """Validate password strength."""
        import re
        
        result = ValidationResult(is_valid=True)
        
        if not password:
            result.add_error("password", "Password is required")
            return result
            
        if len(password) < 8:
            result.add_error("password", "Password must be at least 8 characters long")
            
        if len(password) > 128:
            result.add_error("password", "Password is too long (maximum 128 characters)")
            
        if not re.search(r'[A-Z]', password):
            result.add_error("password", "Password must contain at least one uppercase letter")
            
        if not re.search(r'[a-z]', password):
            result.add_error("password", "Password must contain at least one lowercase letter")
            
        if not re.search(r'\d', password):
            result.add_error("password", "Password must contain at least one number")
            
        if not re.search(r'[^A-Za-z0-9]', password):
            result.add_error("password", "Password must contain at least one special character")
            
        return result
    
    @staticmethod
    def validate_listing_data(data: Dict[str, Any]) -> ValidationResult:
        """Validate listing data with business rules."""
        result = ValidationResult(is_valid=True)
        
        # Validate display name
        display_name = data.get("displayName", "").strip()
        if not display_name:
            result.add_error("displayName", "Display name is required")
        elif len(display_name) < 2:
            result.add_error("displayName", "Display name must be at least 2 characters")
        elif len(display_name) > 100:
            result.add_error("displayName", "Display name must be less than 100 characters")
            
        # Validate locality
        locality = data.get("locality", "").strip()
        if not locality:
            result.add_error("locality", "Locality is required")
            
        # Validate city
        city = data.get("city", "").strip()
        if not city:
            result.add_error("city", "City is required")
            
        # Validate overview
        overview = data.get("overview", "").strip()
        if not overview:
            result.add_error("overview", "Overview is required")
        elif len(overview) < 10:
            result.add_error("overview", "Overview must be at least 10 characters")
        elif len(overview) > 1000:
            result.add_error("overview", "Overview must be less than 1000 characters")
            
        # Validate offerings
        offerings = data.get("offerings", {})
        if not offerings:
            result.add_error("offerings", "At least one offering must be configured")
        else:
            enabled_offerings = [k for k, v in offerings.items() if v.get("enabled", False)]
            if not enabled_offerings:
                result.add_error("offerings", "At least one offering must be enabled")
                
            # Validate each offering
            for offering_type, offering_data in offerings.items():
                if offering_data.get("enabled", False):
                    ValidationService._validate_offering(offering_type, offering_data, result)
                    
        return result
    
    @staticmethod
    def _validate_offering(offering_type: str, offering_data: Dict[str, Any], result: ValidationResult):
        """Validate individual offering data."""
        prefix = f"offerings.{offering_type}"
        
        # Validate title
        title = offering_data.get("title", "").strip()
        if not title:
            result.add_error(f"{prefix}.title", "Title is required for enabled offerings")
        elif len(title) > 100:
            result.add_error(f"{prefix}.title", "Title must be less than 100 characters")
            
        # Validate description
        description = offering_data.get("description", "").strip()
        if description and len(description) > 500:
            result.add_error(f"{prefix}.description", "Description must be less than 500 characters")
            
        # Validate pricing
        starting_price = offering_data.get("startingPrice")
        budget_band = offering_data.get("budgetBand")
        
        if starting_price is not None:
            if not isinstance(starting_price, (int, float)) or starting_price <= 0:
                result.add_error(f"{prefix}.startingPrice", "Starting price must be a positive number")
                
            unit = offering_data.get("unit")
            if not unit or unit not in ["month", "hr", "NA"]:
                result.add_error(f"{prefix}.unit", "Unit is required when starting price is provided")
                
        # Validate photos (business rule: at least 1 photo for enabled offerings)
        photos = offering_data.get("photos", [])
        if not photos or len(photos) == 0:
            result.add_error(f"{prefix}.photos", "At least 1 photo is required for enabled offerings")
    
    @staticmethod
    def raise_validation_error(result: ValidationResult, message: str = "Validation failed"):
        """Raise AppValidationError from ValidationResult."""
        if result.has_errors():
            raise AppValidationError(
                message=message,
                details={
                    "field_errors": result.errors,
                    "error_count": sum(len(errors) for errors in result.errors.values())
                }
            )