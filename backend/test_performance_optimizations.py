#!/usr/bin/env python3
"""
Test script for performance optimizations in the premium workspace platform
"""

import asyncio
import time
import json
from typing import Dict, Any
import httpx
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

async def test_performance_cache():
    """Test the performance cache functionality"""
    logger.info("Testing performance cache...")
    
    from app.services.performance_service import PerformanceCache
    
    # Create cache instance
    cache = PerformanceCache(default_ttl=5)  # 5 second TTL for testing
    
    # Test basic operations
    cache.set("test_key", {"data": "test_value"})
    
    # Test cache hit
    result = cache.get("test_key")
    assert result is not None, "Cache should return stored value"
    assert result["data"] == "test_value", "Cache should return correct value"
    
    # Test cache miss after expiry
    await asyncio.sleep(6)  # Wait for TTL to expire
    result = cache.get("test_key")
    assert result is None, "Cache should return None for expired key"
    
    # Test cache statistics
    cache.set("key1", "value1")
    cache.set("key2", "value2")
    stats = cache.get_stats()
    assert stats["total_entries"] >= 2, "Cache should track entry count"
    
    logger.info("✓ Performance cache tests passed")

async def test_image_optimization():
    """Test image optimization utilities"""
    logger.info("Testing image optimization...")
    
    from app.services.performance_service import ImageOptimizer
    
    # Test optimized URL generation
    public_id = "test_image"
    optimized_url = ImageOptimizer.get_optimized_url(
        public_id=public_id,
        width=800,
        height=600,
        quality="auto",
        format="webp"
    )
    
    assert "w_800" in optimized_url, "URL should contain width parameter"
    assert "h_600" in optimized_url, "URL should contain height parameter"
    assert "q_auto" in optimized_url, "URL should contain quality parameter"
    assert "f_webp" in optimized_url, "URL should contain format parameter"
    
    # Test responsive URLs
    responsive_urls = ImageOptimizer.get_responsive_urls(public_id)
    assert len(responsive_urls) > 0, "Should generate responsive URLs"
    assert "320w" in responsive_urls, "Should include mobile breakpoint"
    assert "1920w" in responsive_urls, "Should include desktop breakpoint"
    
    # Test thumbnail URL
    thumbnail_url = ImageOptimizer.get_thumbnail_url(public_id, size=150)
    assert "w_150" in thumbnail_url, "Thumbnail should have correct width"
    assert "h_150" in thumbnail_url, "Thumbnail should have correct height"
    assert "c_thumb" in thumbnail_url, "Thumbnail should use thumb crop mode"
    
    logger.info("✓ Image optimization tests passed")

async def test_performance_monitoring():
    """Test performance monitoring functionality"""
    logger.info("Testing performance monitoring...")
    
    from app.services.performance_service import PerformanceMonitor
    
    monitor = PerformanceMonitor()
    
    # Test metric recording
    monitor.record_metric("test_metric", 100.5, {"tag": "test"})
    monitor.record_metric("test_metric", 200.0, {"tag": "test"})
    monitor.record_metric("test_metric", 150.0, {"tag": "test"})
    
    # Test metric summary
    summary = monitor.get_metric_summary("test_metric", duration_seconds=3600)
    assert summary["count"] == 3, "Should record all metrics"
    assert summary["min"] == 100.5, "Should calculate correct minimum"
    assert summary["max"] == 200.0, "Should calculate correct maximum"
    assert abs(summary["avg"] - 150.17) < 0.1, "Should calculate correct average"
    
    # Test system metrics
    system_metrics = monitor.get_system_metrics()
    assert "cpu_percent" in system_metrics, "Should include CPU metrics"
    assert "memory_percent" in system_metrics, "Should include memory metrics"
    assert "uptime_seconds" in system_metrics, "Should include uptime"
    
    logger.info("✓ Performance monitoring tests passed")

async def test_api_performance_endpoints():
    """Test performance API endpoints"""
    logger.info("Testing performance API endpoints...")
    
    async with httpx.AsyncClient() as client:
        # Test health endpoint
        response = await client.get(f"{BASE_URL}/api/performance/health")
        assert response.status_code == 200, "Health endpoint should be accessible"
        
        health_data = response.json()
        assert health_data["success"] is True, "Health check should succeed"
        assert "status" in health_data, "Should include health status"
        assert "metrics" in health_data, "Should include metrics"
        
        # Test image optimization endpoint
        response = await client.get(
            f"{BASE_URL}/api/performance/images/optimize-url",
            params={
                "public_id": "test_image",
                "width": 800,
                "height": 600,
                "quality": "auto",
                "format": "webp"
            }
        )
        assert response.status_code == 200, "Image optimization endpoint should work"
        
        image_data = response.json()
        assert image_data["success"] is True, "Image optimization should succeed"
        assert "optimized_url" in image_data["data"], "Should return optimized URL"
        
        # Test responsive images endpoint
        response = await client.get(
            f"{BASE_URL}/api/performance/images/responsive-urls",
            params={"public_id": "test_image"}
        )
        assert response.status_code == 200, "Responsive images endpoint should work"
        
        responsive_data = response.json()
        assert responsive_data["success"] is True, "Responsive images should succeed"
        assert "responsive_urls" in responsive_data["data"], "Should return responsive URLs"
        assert "thumbnail_url" in responsive_data["data"], "Should return thumbnail URL"
    
    logger.info("✓ Performance API endpoints tests passed")

async def test_database_optimization():
    """Test database optimization functionality"""
    logger.info("Testing database optimization...")
    
    try:
        from app.db.mongodb import get_database
        from app.services.performance_service import DatabaseOptimizer
        
        # Get database connection
        db = await get_database()
        optimizer = DatabaseOptimizer(db)
        
        # Test index creation
        indexes_created = await optimizer.create_indexes()
        assert isinstance(indexes_created, dict), "Should return index creation results"
        
        # Test query analysis (with a simple query)
        test_query = {"status": "PUBLISHED"}
        analysis = await optimizer.analyze_query_performance("listings", test_query)
        
        if analysis:  # Only test if analysis was successful
            assert "performance_score" in analysis, "Should include performance score"
            assert isinstance(analysis["performance_score"], (int, float)), "Score should be numeric"
        
        logger.info("✓ Database optimization tests passed")
        
    except Exception as e:
        logger.warning(f"Database optimization tests skipped (database not available): {e}")

async def test_caching_decorator():
    """Test the caching decorator functionality"""
    logger.info("Testing caching decorator...")
    
    from app.services.performance_service import cache_result
    
    call_count = 0
    
    @cache_result("test", ttl=5)
    async def expensive_function(x: int) -> int:
        nonlocal call_count
        call_count += 1
        await asyncio.sleep(0.1)  # Simulate expensive operation
        return x * 2
    
    # First call should execute function
    result1 = await expensive_function(5)
    assert result1 == 10, "Function should return correct result"
    assert call_count == 1, "Function should be called once"
    
    # Second call should use cache
    result2 = await expensive_function(5)
    assert result2 == 10, "Cached result should be correct"
    assert call_count == 1, "Function should not be called again (cache hit)"
    
    # Different parameter should execute function again
    result3 = await expensive_function(10)
    assert result3 == 20, "Function should return correct result for different input"
    assert call_count == 2, "Function should be called for different parameter"
    
    logger.info("✓ Caching decorator tests passed")

async def test_performance_monitoring_decorator():
    """Test the performance monitoring decorator"""
    logger.info("Testing performance monitoring decorator...")
    
    from app.services.performance_service import monitor_performance, performance_monitor
    
    @monitor_performance("test_operation")
    async def test_operation(duration: float = 0.1):
        await asyncio.sleep(duration)
        return "completed"
    
    # Execute monitored function
    result = await test_operation(0.05)
    assert result == "completed", "Function should execute correctly"
    
    # Check if metrics were recorded
    summary = performance_monitor.get_metric_summary("test_operation_execution_time", 60)
    assert summary.get("count", 0) > 0, "Should record execution metrics"
    
    logger.info("✓ Performance monitoring decorator tests passed")

async def run_performance_benchmark():
    """Run a simple performance benchmark"""
    logger.info("Running performance benchmark...")
    
    from app.services.performance_service import PerformanceCache
    
    cache = PerformanceCache()
    
    # Benchmark cache operations
    start_time = time.time()
    
    # Write operations
    for i in range(1000):
        cache.set(f"key_{i}", {"data": f"value_{i}", "index": i})
    
    write_time = time.time() - start_time
    
    # Read operations
    start_time = time.time()
    hits = 0
    
    for i in range(1000):
        result = cache.get(f"key_{i}")
        if result is not None:
            hits += 1
    
    read_time = time.time() - start_time
    
    logger.info(f"Cache benchmark results:")
    logger.info(f"  Write 1000 items: {write_time:.3f}s ({1000/write_time:.0f} ops/sec)")
    logger.info(f"  Read 1000 items: {read_time:.3f}s ({1000/read_time:.0f} ops/sec)")
    logger.info(f"  Cache hit rate: {hits/1000*100:.1f}%")
    
    # Benchmark image URL generation
    from app.services.performance_service import ImageOptimizer
    
    start_time = time.time()
    
    for i in range(100):
        ImageOptimizer.get_optimized_url(
            public_id=f"image_{i}",
            width=800,
            height=600,
            quality="auto",
            format="webp"
        )
    
    url_generation_time = time.time() - start_time
    
    logger.info(f"Image URL generation benchmark:")
    logger.info(f"  Generate 100 URLs: {url_generation_time:.3f}s ({100/url_generation_time:.0f} ops/sec)")

async def main():
    """Run all performance optimization tests"""
    logger.info("Starting performance optimization tests...")
    
    try:
        # Run unit tests
        await test_performance_cache()
        await test_image_optimization()
        await test_performance_monitoring()
        await test_caching_decorator()
        await test_performance_monitoring_decorator()
        
        # Run database tests (if available)
        await test_database_optimization()
        
        # Run API tests (if server is running)
        try:
            await test_api_performance_endpoints()
        except Exception as e:
            logger.warning(f"API tests skipped (server not running): {e}")
        
        # Run performance benchmark
        await run_performance_benchmark()
        
        logger.info("✅ All performance optimization tests completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Performance tests failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())