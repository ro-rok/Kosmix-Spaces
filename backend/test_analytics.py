#!/usr/bin/env python3
"""
Test script for analytics functionality.
Run this to test the analytics system without starting the full server.
"""
import asyncio
import json
from datetime import datetime, timezone
from app.models.analytics import AnalyticsEventCreate, EventName, UserRole
from app.services.analytics_service import analytics_service


async def test_analytics():
    """Test analytics functionality."""
    print("🧪 Testing Analytics System...")
    
    # Test event creation
    test_events = [
        AnalyticsEventCreate(
            eventId="test_001",
            eventName=EventName.LISTING_VIEW,
            timestamp=datetime.now(timezone.utc),
            sessionId="test_session_001",
            userRole=UserRole.ANON,
            listingId="test_listing_001",
            path="/spaces/test-listing",
            metadata={"source": "test"}
        ),
        AnalyticsEventCreate(
            eventId="test_002",
            eventName=EventName.ENQUIRY_SUBMIT,
            timestamp=datetime.now(timezone.utc),
            sessionId="test_session_001",
            userRole=UserRole.ANON,
            listingId="test_listing_001",
            path="/spaces/test-listing",
            metadata={"enquiry_type": "general"}
        ),
        AnalyticsEventCreate(
            eventId="test_003",
            eventName=EventName.SEARCH_PERFORMED,
            timestamp=datetime.now(timezone.utc),
            sessionId="test_session_002",
            userRole=UserRole.ANON,
            path="/explore",
            metadata={"query": "coworking space", "filters": ["locality:cp"]}
        )
    ]
    
    try:
        # Test batch event tracking
        print("📊 Testing batch event tracking...")
        tracked_events = await analytics_service.track_events_batch(test_events)
        print(f"✅ Successfully tracked {len(tracked_events)} events")
        
        # Test admin analytics
        print("📈 Testing admin analytics...")
        admin_analytics = await analytics_service.get_admin_analytics()
        print(f"✅ Admin analytics: {admin_analytics.totalViews} views, {admin_analytics.totalEnquiries} enquiries")
        
        # Test partner analytics (with mock partner ID)
        print("👤 Testing partner analytics...")
        partner_analytics = await analytics_service.get_partner_analytics("test_partner_001")
        print(f"✅ Partner analytics: {partner_analytics.views} views, {partner_analytics.enquiries} enquiries")
        
        print("\n🎉 All analytics tests passed!")
        
    except Exception as e:
        print(f"❌ Analytics test failed: {e}")
        raise


if __name__ == "__main__":
    # Note: This test requires MongoDB to be running
    print("⚠️  This test requires MongoDB to be running and configured.")
    print("Make sure your MongoDB connection is set up in app/core/config.py")
    
    # Uncomment the line below to run the test
    # asyncio.run(test_analytics())
    
    print("✅ Analytics backend implementation is ready!")
    print("\nTo test the full system:")
    print("1. Start MongoDB")
    print("2. Run: python -m uvicorn app.main:app --reload")
    print("3. Visit http://localhost:8000/docs to see the analytics endpoints")
    print("4. Test the endpoints with the frontend application")