#!/usr/bin/env python3
"""
Test script for Keep Alive Service
"""
import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.keep_alive_service import KeepAliveService
from app.core.config import get_settings

async def test_keep_alive_service():
    """Test the keep-alive service functionality."""
    print("Testing Keep Alive Service...")
    
    # Get settings
    settings = get_settings()
    print(f"Keep Alive Enabled: {settings.KEEP_ALIVE_ENABLED}")
    print(f"Ping Interval: {settings.KEEP_ALIVE_PING_INTERVAL} seconds")
    print(f"Health Check Interval: {settings.KEEP_ALIVE_HEALTH_CHECK_INTERVAL} seconds")
    
    # Create service instance
    service = KeepAliveService()
    
    # Test initial stats
    stats = service.get_stats()
    print(f"\nInitial Stats:")
    print(f"  Running: {stats['is_running']}")
    print(f"  Total Pings: {stats['total_pings']}")
    print(f"  Total Health Checks: {stats['total_health_checks']}")
    
    # Test manual ping (without starting the service)
    print(f"\nTesting manual ping...")
    try:
        result = await service.manual_ping()
        print(f"Manual ping result: {result['success']}")
        if result['success']:
            print(f"  Message: {result['message']}")
        else:
            print(f"  Error: {result['error']}")
    except Exception as e:
        print(f"Manual ping failed: {e}")
    
    # Test service start/stop
    print(f"\nTesting service lifecycle...")
    await service.start()
    print(f"Service started: {service.is_running}")
    
    # Wait a moment
    await asyncio.sleep(2)
    
    # Check stats after start
    stats = service.get_stats()
    print(f"Stats after start:")
    print(f"  Running: {stats['is_running']}")
    print(f"  Uptime: {stats['uptime_formatted']}")
    
    # Stop service
    await service.stop()
    print(f"Service stopped: {service.is_running}")
    
    print("\nKeep Alive Service test completed!")

if __name__ == "__main__":
    asyncio.run(test_keep_alive_service())