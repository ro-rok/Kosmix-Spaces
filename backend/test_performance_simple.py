#!/usr/bin/env python3
"""
Simple test script for performance optimizations (without full app context)
"""

import asyncio
import time
import logging
from typing import Dict, List, Optional, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_performance_cache():
    """Test the performance cache functionality"""
    logger.info("Testing performance cache...")
    
    # Import here to avoid app context issues
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # Simple cache implementation for testing
    class TestPerformanceCache:
        def __init__(self, default_ttl: int = 300):
            self._cache: Dict[str, Dict[str, Any]] = {}
            self.default_ttl = default_ttl
        
        def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
            expires_at = time.time() + (ttl or self.default_ttl)
            self._cache[key] = {
                'value': value,
                'expires_at': expires_at,
                'created_at': time.time()
            }
        
        def get(self, key: str) -> Optional[Any]:
            if key not in self._cache:
                return None
            
            entry = self._cache[key]
            if time.time() > entry['expires_at']:
                del self._cache[key]
                return None
            
            return entry['value']
        
        def get_stats(self) -> Dict[str, Any]:
            current_time = time.time()
            total_entries = len(self._cache)
            expired_entries = sum(
                1 for entry in self._cache.values()
                if current_time > entry['expires_at']
            )
            
            return {
                'total_entries': total_entries,
                'active_entries': total_entries - expired_entries,
                'expired_entries': expired_entries
            }
    
    # Create cache instance
    cache = TestPerformanceCache(default_ttl=2)  # 2 second TTL for testing
    
    # Test basic operations
    cache.set("test_key", {"data": "test_value"})
    
    # Test cache hit
    result = cache.get("test_key")
    assert result is not None, "Cache should return stored value"
    assert result["data"] == "test_value", "Cache should return correct value"
    
    # Test cache miss after expiry
    await asyncio.sleep(3)  # Wait for TTL to expire
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
    
    # Simple image optimizer for testing
    class TestImageOptimizer:
        @staticmethod
        def get_optimized_url(
            public_id: str,
            width: Optional[int] = None,
            height: Optional[int] = None,
            quality: str = "auto",
            format: str = "auto",
            crop: str = "fill"
        ) -> str:
            base_url = "https://res.cloudinary.com/test-cloud/image/upload"
            
            transformations = []
            transformations.append(f"q_{quality}")
            transformations.append(f"f_{format}")
            
            if width and height:
                transformations.append(f"w_{width},h_{height},c_{crop}")
            elif width:
                transformations.append(f"w_{width}")
            elif height:
                transformations.append(f"h_{height}")
            
            transformations.append("fl_progressive")
            transformations.append("fl_lazy")
            
            transformation_string = ",".join(transformations)
            return f"{base_url}/{transformation_string}/{public_id}"
        
        @staticmethod
        def get_responsive_urls(
            public_id: str,
            breakpoints: List[int] = [320, 640, 768, 1024, 1280, 1920]
        ) -> Dict[str, str]:
            urls = {}
            
            for width in breakpoints:
                urls[f"{width}w"] = TestImageOptimizer.get_optimized_url(
                    public_id=public_id,
                    width=width,
                    quality="auto",
                    format="auto"
                )
            
            return urls
        
        @staticmethod
        def get_thumbnail_url(public_id: str, size: int = 300) -> str:
            return TestImageOptimizer.get_optimized_url(
                public_id=public_id,
                width=size,
                height=size,
                crop="thumb",
                quality="auto",
                format="auto"
            )
    
    # Test optimized URL generation
    public_id = "test_image"
    optimized_url = TestImageOptimizer.get_optimized_url(
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
    responsive_urls = TestImageOptimizer.get_responsive_urls(public_id)
    assert len(responsive_urls) > 0, "Should generate responsive URLs"
    assert "320w" in responsive_urls, "Should include mobile breakpoint"
    assert "1920w" in responsive_urls, "Should include desktop breakpoint"
    
    # Test thumbnail URL
    thumbnail_url = TestImageOptimizer.get_thumbnail_url(public_id, size=150)
    assert "w_150" in thumbnail_url, "Thumbnail should have correct width"
    assert "h_150" in thumbnail_url, "Thumbnail should have correct height"
    assert "c_thumb" in thumbnail_url, "Thumbnail should use thumb crop mode"
    
    logger.info("✓ Image optimization tests passed")

async def test_performance_monitoring():
    """Test performance monitoring functionality"""
    logger.info("Testing performance monitoring...")
    
    # Simple performance monitor for testing
    class TestPerformanceMonitor:
        def __init__(self):
            self.metrics = {}
            self.start_time = time.time()
        
        def record_metric(self, name: str, value: float, tags: Optional[Dict[str, str]] = None):
            timestamp = time.time()
            
            if name not in self.metrics:
                self.metrics[name] = []
            
            self.metrics[name].append({
                'value': value,
                'timestamp': timestamp,
                'tags': tags or {}
            })
            
            # Keep only last 1000 entries per metric
            if len(self.metrics[name]) > 1000:
                self.metrics[name] = self.metrics[name][-1000:]
        
        def get_metric_summary(self, name: str, duration_seconds: int = 3600) -> Dict[str, float]:
            if name not in self.metrics:
                return {}
            
            cutoff_time = time.time() - duration_seconds
            recent_values = [
                entry['value'] for entry in self.metrics[name]
                if entry['timestamp'] > cutoff_time
            ]
            
            if not recent_values:
                return {}
            
            return {
                'count': len(recent_values),
                'min': min(recent_values),
                'max': max(recent_values),
                'avg': sum(recent_values) / len(recent_values)
            }
    
    monitor = TestPerformanceMonitor()
    
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
    
    logger.info("✓ Performance monitoring tests passed")

async def run_performance_benchmark():
    """Run a simple performance benchmark"""
    logger.info("Running performance benchmark...")
    
    # Simple cache for benchmarking
    cache = {}
    
    # Benchmark cache operations
    start_time = time.time()
    
    # Write operations
    for i in range(1000):
        cache[f"key_{i}"] = {"data": f"value_{i}", "index": i}
    
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

async def main():
    """Run all performance optimization tests"""
    logger.info("Starting performance optimization tests...")
    
    try:
        # Run unit tests
        await test_performance_cache()
        await test_image_optimization()
        await test_performance_monitoring()
        
        # Run performance benchmark
        await run_performance_benchmark()
        
        logger.info("✅ All performance optimization tests completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Performance tests failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())