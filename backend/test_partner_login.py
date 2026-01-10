#!/usr/bin/env python3
"""Test partner login functionality."""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.mongodb import connect_to_mongo, get_database
from app.core.security import hash_password
from bson import ObjectId
from datetime import datetime

async def test_partner_login():
    """Test partner login by ensuring test partner exists."""
    try:
        await connect_to_mongo()
        db = get_database()
        
        # Check if test partner exists
        partner = await db.partners.find_one({"email": "partner@example.com"})
        
        if not partner:
            print("❌ Test partner not found. Creating...")
            
            # Create test partner
            partner_doc = {
                "_id": ObjectId(),
                "workspaceBrandName": "Sample Workspace Co",
                "contactName": "John Doe",
                "phone": "+91-9876543210",
                "email": "partner@example.com",
                "passwordHash": hash_password("password123"),
                "status": "ACTIVE",
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            await db.partners.insert_one(partner_doc)
            print("✅ Test partner created successfully!")
            print("   Email: partner@example.com")
            print("   Password: password123")
        else:
            print("✅ Test partner found!")
            print(f"   Email: {partner['email']}")
            print(f"   Status: {partner['status']}")
            print(f"   Brand: {partner['workspaceBrandName']}")
            
            # Ensure partner is ACTIVE
            if partner['status'] != 'ACTIVE':
                await db.partners.update_one(
                    {"_id": partner["_id"]},
                    {"$set": {"status": "ACTIVE", "updatedAt": datetime.utcnow()}}
                )
                print("✅ Partner status updated to ACTIVE")
        
        # Test login API call
        import requests
        
        login_data = {
            "email": "partner@example.com",
            "password": "password123"
        }
        
        try:
            response = requests.post("http://localhost:8000/api/partner/auth/login", json=login_data)
            if response.status_code == 200:
                print("✅ Partner login API test successful!")
                token_data = response.json()
                print(f"   Token received: {token_data['accessToken'][:50]}...")
            else:
                print(f"❌ Partner login API test failed: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"❌ Could not test login API: {e}")
            print("   Make sure the backend server is running on localhost:8000")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_partner_login())