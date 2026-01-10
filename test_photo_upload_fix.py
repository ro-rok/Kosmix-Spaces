#!/usr/bin/env python3
"""Test script to verify photo upload validation fix."""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from fastapi import UploadFile
from io import BytesIO
from backend.app.services.cloudinary_service import validate_image_file

def test_validation_fix():
    """Test the validation function with various scenarios."""
    
    print("Testing photo upload validation fix...")
    
    # Test 1: Valid JPEG file
    print("\n1. Testing valid JPEG file:")
    mock_file = type('MockFile', (), {
        'filename': 'test.jpeg',
        'content_type': 'image/jpeg',
        'size': 1024 * 1024  # 1MB
    })()
    
    is_valid, error = validate_image_file(mock_file)
    print(f"   Valid: {is_valid}, Error: {error}")
    assert is_valid == True, f"Expected valid, got error: {error}"
    
    # Test 2: Missing content type
    print("\n2. Testing missing content type:")
    mock_file = type('MockFile', (), {
        'filename': 'test.jpeg',
        'content_type': None,
        'size': 1024 * 1024
    })()
    
    is_valid, error = validate_image_file(mock_file)
    print(f"   Valid: {is_valid}, Error: {error}")
    assert is_valid == False, "Expected invalid for missing content type"
    assert error is not None, "Expected error message"
    
    # Test 3: Missing filename
    print("\n3. Testing missing filename:")
    mock_file = type('MockFile', (), {
        'filename': None,
        'content_type': 'image/jpeg',
        'size': 1024 * 1024
    })()
    
    is_valid, error = validate_image_file(mock_file)
    print(f"   Valid: {is_valid}, Error: {error}")
    assert is_valid == False, "Expected invalid for missing filename"
    assert error is not None, "Expected error message"
    
    # Test 4: Invalid content type
    print("\n4. Testing invalid content type:")
    mock_file = type('MockFile', (), {
        'filename': 'test.txt',
        'content_type': 'text/plain',
        'size': 1024
    })()
    
    is_valid, error = validate_image_file(mock_file)
    print(f"   Valid: {is_valid}, Error: {error}")
    assert is_valid == False, "Expected invalid for text file"
    assert error is not None, "Expected error message"
    
    # Test 5: File too large
    print("\n5. Testing file too large:")
    mock_file = type('MockFile', (), {
        'filename': 'large.jpeg',
        'content_type': 'image/jpeg',
        'size': 20 * 1024 * 1024  # 20MB
    })()
    
    is_valid, error = validate_image_file(mock_file)
    print(f"   Valid: {is_valid}, Error: {error}")
    assert is_valid == False, "Expected invalid for large file"
    assert error is not None, "Expected error message"
    
    # Test 6: None file
    print("\n6. Testing None file:")
    is_valid, error = validate_image_file(None)
    print(f"   Valid: {is_valid}, Error: {error}")
    assert is_valid == False, "Expected invalid for None file"
    assert error is not None, "Expected error message"
    
    print("\n✅ All validation tests passed!")
    print("\nThe validation function now properly handles:")
    print("- Missing files")
    print("- Missing filenames")
    print("- Missing content types")
    print("- Invalid content types")
    print("- File size limits")
    print("- Proper error messages")

if __name__ == "__main__":
    test_validation_fix()