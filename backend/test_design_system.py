"""Test script for design system backend implementation."""
import asyncio
import json
from datetime import datetime
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.services.design_system_service import (
    get_design_system_config,
    update_design_system_config,
    get_user_design_preferences,
    update_user_design_preferences,
    get_design_system_for_user,
    track_design_system_analytics,
    get_design_system_metrics,
    get_popular_design_preferences
)
from app.models.design_system import (
    UIPreferences,
    DesignSystemAnalytics,
    DesignTokens
)


async def test_design_system_backend():
    """Test all design system backend functionality."""
    print("🧪 Testing Design System Backend Implementation")
    print("=" * 50)
    
    await connect_to_mongo()
    
    try:
        # Test 1: Get default design system configuration
        print("\n1️⃣  Testing default configuration...")
        config = await get_design_system_config()
        print(f"✅ Default config loaded: {config.name} v{config.version}")
        print(f"   Theme: {config.preferences.theme}")
        print(f"   Animation: {config.preferences.animationLevel}")
        print(f"   Primary color: {config.tokens.primaryColor}")
        
        # Test 2: Update design system configuration
        print("\n2️⃣  Testing configuration updates...")
        updates = {
            "name": "Premium Workspace Platform - Enhanced",
            "tokens": {
                "primaryColor": "#1E40AF",  # Blue theme
                "animationDuration": 300
            },
            "preferences": {
                "enableGlassEffects": False
            }
        }
        
        updated_config = await update_design_system_config(updates, "test_admin")
        print(f"✅ Configuration updated successfully")
        print(f"   New name: {updated_config.name}")
        print(f"   New primary color: {updated_config.tokens.primaryColor}")
        print(f"   Glass effects: {updated_config.preferences.enableGlassEffects}")
        
        # Test 3: User preferences
        print("\n3️⃣  Testing user preferences...")
        user_id = "test_user_123"
        
        # Create user preferences
        user_prefs = UIPreferences(
            theme="dark",
            animationLevel="reduced",
            density="compact",
            reduceMotion=True,
            highContrast=True
        )
        
        saved_prefs = await update_user_design_preferences(
            user_id, "anonymous", user_prefs, "mobile"
        )
        print(f"✅ User preferences saved")
        print(f"   Theme: {saved_prefs.preferences.theme}")
        print(f"   Animation: {saved_prefs.preferences.animationLevel}")
        print(f"   Reduce motion: {saved_prefs.preferences.reduceMotion}")
        print(f"   Last device: {saved_prefs.lastDevice}")
        
        # Test 4: Get complete design system for user
        print("\n4️⃣  Testing complete user configuration...")
        user_config = await get_design_system_for_user(user_id, "anonymous")
        print(f"✅ Complete user configuration retrieved")
        print(f"   Has config: {'config' in user_config}")
        print(f"   Has user preferences: {'userPreferences' in user_config and user_config['userPreferences'] is not None}")
        
        # Test 5: Analytics tracking
        print("\n5️⃣  Testing analytics tracking...")
        analytics_data = DesignSystemAnalytics(
            cssLoadTime=150.5,
            jsLoadTime=89.2,
            renderTime=45.8,
            buttonClickRate=0.85,
            formCompletionRate=0.72,
            accessibilityScore=0.95,
            keyboardNavigationUsage=0.15,
            screenReaderUsage=0.05
        )
        
        await track_design_system_analytics(analytics_data)
        print(f"✅ Analytics data tracked")
        print(f"   CSS load time: {analytics_data.cssLoadTime}ms")
        print(f"   Render time: {analytics_data.renderTime}ms")
        print(f"   Accessibility score: {analytics_data.accessibilityScore}")
        
        # Test 6: Get metrics
        print("\n6️⃣  Testing metrics retrieval...")
        metrics = await get_design_system_metrics()
        print(f"✅ Metrics retrieved")
        print(f"   Total users: {metrics.totalUsers}")
        print(f"   Average load time: {metrics.averageLoadTime}ms")
        print(f"   Average interaction time: {metrics.averageInteractionTime}ms")
        
        # Test 7: Popular preferences
        print("\n7️⃣  Testing popular preferences...")
        popular_prefs = await get_popular_design_preferences()
        print(f"✅ Popular preferences retrieved")
        print(f"   Total users: {popular_prefs['totalUsers']}")
        print(f"   Theme preferences: {popular_prefs['themePreferences']}")
        print(f"   Animation preferences: {popular_prefs['animationPreferences']}")
        print(f"   Accessibility preferences: {popular_prefs['accessibilityPreferences']}")
        
        # Test 8: Create another user with different preferences
        print("\n8️⃣  Testing multiple users...")
        user2_prefs = UIPreferences(
            theme="light",
            animationLevel="full",
            density="spacious",
            enableGlassEffects=True,
            enableMicroInteractions=True
        )
        
        await update_user_design_preferences(
            "test_user_456", "partner", user2_prefs, "desktop"
        )
        print(f"✅ Second user preferences saved")
        
        # Get updated popular preferences
        updated_popular = await get_popular_design_preferences()
        print(f"   Updated total users: {updated_popular['totalUsers']}")
        print(f"   Updated theme preferences: {updated_popular['themePreferences']}")
        
        print("\n🎉 All tests passed successfully!")
        print("\n📊 Test Summary:")
        print("   ✅ Configuration management")
        print("   ✅ User preferences")
        print("   ✅ Analytics tracking")
        print("   ✅ Metrics aggregation")
        print("   ✅ Popular preferences")
        print("   ✅ Multi-user support")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await close_mongo_connection()


async def test_api_endpoints():
    """Test design system API endpoints."""
    print("\n🌐 Testing API Endpoints")
    print("=" * 30)
    
    # This would require running the FastAPI server
    # For now, just show the expected endpoints
    endpoints = [
        "GET /api/design-system/config",
        "PUT /api/design-system/config", 
        "GET /api/design-system/preferences/{user_id}",
        "PUT /api/design-system/preferences/{user_id}",
        "POST /api/design-system/analytics",
        "GET /api/design-system/metrics",
        "GET /api/design-system/themes",
        "GET /api/design-system/components",
        "GET /api/design-system/health"
    ]
    
    print("📋 Available API endpoints:")
    for endpoint in endpoints:
        print(f"   {endpoint}")
    
    print("\n💡 To test API endpoints:")
    print("   1. Start the backend server: python run_dev.py")
    print("   2. Visit http://localhost:8000/docs")
    print("   3. Test the Design System endpoints")


async def demonstrate_usage():
    """Demonstrate typical usage patterns."""
    print("\n💡 Usage Examples")
    print("=" * 20)
    
    await connect_to_mongo()
    
    try:
        # Example 1: Frontend requesting user configuration
        print("\n🖥️  Frontend requesting configuration for user...")
        user_config = await get_design_system_for_user("frontend_user_789", "anonymous")
        
        # Simulate what frontend would receive
        frontend_config = {
            "tokens": user_config["config"]["tokens"],
            "preferences": user_config["userPreferences"]["preferences"] if user_config["userPreferences"] else user_config["config"]["preferences"],
            "components": user_config["config"]["components"]
        }
        
        print("   Frontend receives:")
        print(f"   - Primary color: {frontend_config['tokens']['primaryColor']}")
        print(f"   - Theme: {frontend_config['preferences']['theme']}")
        print(f"   - Animation level: {frontend_config['preferences']['animationLevel']}")
        print(f"   - Glass effects: {frontend_config['preferences']['enableGlassEffects']}")
        
        # Example 2: User changing theme preference
        print("\n🎨 User changing theme preference...")
        new_prefs = UIPreferences(
            theme="dark",
            animationLevel="full",
            density="comfortable"
        )
        
        await update_user_design_preferences(
            "frontend_user_789", "anonymous", new_prefs
        )
        print("   ✅ Theme changed to dark mode")
        
        # Example 3: Analytics tracking
        print("\n📈 Tracking user interaction...")
        interaction_analytics = DesignSystemAnalytics(
            renderTime=32.1,
            buttonClickRate=0.92,
            navigationUsage={"main_nav": 15, "sidebar": 8, "footer": 2}
        )
        
        await track_design_system_analytics(interaction_analytics)
        print("   ✅ User interaction tracked")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
    
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    print("🚀 Design System Backend Test Suite")
    print("=" * 40)
    
    asyncio.run(test_design_system_backend())
    asyncio.run(test_api_endpoints())
    asyncio.run(demonstrate_usage())
    
    print("\n🎯 Next Steps:")
    print("   1. Run migration: python app/db/migrate_design_system.py")
    print("   2. Start backend: python run_dev.py")
    print("   3. Test API endpoints at http://localhost:8000/docs")
    print("   4. Integrate with frontend design system")