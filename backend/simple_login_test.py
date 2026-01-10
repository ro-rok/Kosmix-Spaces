#!/usr/bin/env python3
"""Simple test to verify partner login works."""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.mongodb import connect_to_mongo, get_database
from app.core.security import verify_password, create_access_token
from bson import ObjectId

async def test_login_logic():
    """Test the login logic directly."""
    try:
        await connect_to_mongo()
        db = get_database()
        
        # Find the test partner
        partner = await db.partners.find_one({"email": "partner@example.com"})
        
        if not partner:
            print("❌ Test partner not found!")
            return
        
        print("✅ Test partner found!")
        print(f"   Email: {partner['email']}")
        print(f"   Status: {partner['status']}")
        
        # Test password verification
        test_password = "password123"
        is_valid = verify_password(test_password, partner["passwordHash"])
        
        if is_valid:
            print("✅ Password verification successful!")
        else:
            print("❌ Password verification failed!")
            return
        
        # Test token creation
        token_data = {
            "sub": partner["email"],
            "role": "PARTNER",
            "partnerId": str(partner["_id"])
        }
        access_token = create_access_token(token_data)
        
        print("✅ Token creation successful!")
        print(f"   Token: {access_token[:50]}...")
        
        print("\n🎉 Login logic test completed successfully!")
        print("\nYou can now try logging in with:")
        print("   Email: partner@example.com")
        print("   Password: password123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_login_logic())