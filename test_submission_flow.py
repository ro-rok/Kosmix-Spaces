import requests
import json

# Test the complete listing submission flow
BASE_URL = "http://localhost:8000"

def test_photo_upload():
    """Test photo upload endpoint"""
    print("Testing photo upload...")
    
    # Create a simple test image file
    with open("test_image.jpg", "wb") as f:
        # Create a minimal JPEG header for testing
        f.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9')
    
    # Test without authentication (should fail)
    with open("test_image.jpg", "rb") as f:
        files = {"file": ("test.jpg", f, "image/jpeg")}
        data = {"offering_type": "hero"}
        
        response = requests.post(f"{BASE_URL}/api/partner/upload-photo", files=files, data=data)
        print(f"Upload without auth: {response.status_code}")
        if response.status_code != 200:
            print(f"Expected failure: {response.json()}")

def test_public_listings():
    """Test public listings endpoint"""
    print("\nTesting public listings...")
    
    response = requests.get(f"{BASE_URL}/api/public/listings")
    print(f"Public listings status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Total listings: {data['total']}")
        print(f"Items returned: {len(data['items'])}")
        
        if data['items']:
            listing = data['items'][0]
            print(f"First listing: {listing['displayName']}")
            print(f"Status: {listing['verificationStatus']}")
            print(f"Published: {listing['isPublished']}")
            print(f"Enabled offerings: {listing['workspaceTypes']}")
    else:
        print(f"Error: {response.json()}")

def test_listing_detail():
    """Test listing detail endpoint"""
    print("\nTesting listing detail...")
    
    # First get the slug from public listings
    response = requests.get(f"{BASE_URL}/api/public/listings")
    if response.status_code == 200:
        data = response.json()
        if data['items']:
            slug = data['items'][0]['slug']
            print(f"Testing slug: {slug}")
            
            # Test the detail endpoint
            detail_response = requests.get(f"{BASE_URL}/api/public/listings{slug}")
            print(f"Detail status: {detail_response.status_code}")
            
            if detail_response.status_code == 200:
                detail_data = detail_response.json()
                print(f"Detail listing: {detail_data['displayName']}")
                print(f"View count: {detail_data['viewCount']}")
            else:
                print(f"Detail error: {detail_response.json()}")

if __name__ == "__main__":
    test_photo_upload()
    test_public_listings()
    test_listing_detail()
    
    # Clean up test file
    import os
    if os.path.exists("test_image.jpg"):
        os.remove("test_image.jpg")