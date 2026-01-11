import requests
import json

# Test the submission endpoint with minimal data
BASE_URL = "http://localhost:8000"

def test_submission():
    """Test the submission endpoint with minimal valid data"""
    
    # Minimal submission data that should work
    submission_data = {
        "displayName": "Test Workspace",
        "overview": "This is a test workspace for debugging submission issues. It has enough characters to pass validation.",
        "locality": "Test Locality",
        "city": "Delhi",
        "amenities": ["High-speed WiFi", "Reception"],
        "accessHours": "9 AM - 9 PM",
        "weekendAccess": False,
        "nearMetro": False,
        "metroNote": None,
        "parking": "NONE",
        "powerBackup": False,
        "heroPhotos": [],
        "offerings": {
            "private-offices": {
                "type": "private-offices",
                "title": "Private Offices",
                "description": "Test private offices",
                "features": [],
                "enabled": True,
                "startingPrice": 10000,
                "unit": "month",
                "budgetBand": "₹",
                "photos": [],
                "capacity": None,
                "availability": None
            },
            "dedicated-desks": {
                "type": "dedicated-desks",
                "title": "Dedicated Desks",
                "description": "",
                "features": [],
                "enabled": False,
                "startingPrice": None,
                "unit": None,
                "budgetBand": None,
                "photos": [],
                "capacity": None,
                "availability": None
            },
            "hot-desks": {
                "type": "hot-desks",
                "title": "Hot Desks",
                "description": "",
                "features": [],
                "enabled": False,
                "startingPrice": None,
                "unit": None,
                "budgetBand": None,
                "photos": [],
                "capacity": None,
                "availability": None
            },
            "meeting-rooms": {
                "type": "meeting-rooms",
                "title": "Meeting Rooms",
                "description": "",
                "features": [],
                "enabled": False,
                "startingPrice": None,
                "unit": None,
                "budgetBand": None,
                "photos": [],
                "capacity": None,
                "availability": None
            },
            "event-spaces": {
                "type": "event-spaces",
                "title": "Event Spaces",
                "description": "",
                "features": [],
                "enabled": False,
                "startingPrice": None,
                "unit": None,
                "budgetBand": None,
                "photos": [],
                "capacity": None,
                "availability": None
            }
        }
    }
    
    print("Testing submission endpoint...")
    print(f"Data: {json.dumps(submission_data, indent=2)}")
    
    # Test without authentication (should fail with 401)
    response = requests.post(
        f"{BASE_URL}/api/partner/listings/submit",
        json=submission_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    
    if response.status_code != 401:  # We expect 401 without auth
        print("Unexpected response - should be 401 Unauthorized")
    else:
        print("Got expected 401 - endpoint is reachable")

if __name__ == "__main__":
    test_submission()