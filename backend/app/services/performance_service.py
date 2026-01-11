"""
Performance optimization service for the premium workspace platform backend
"""

import asyncio
import time
from typing import Dict, List, Optional, Any
from functools import wraps
from datetime import datetime, timedelta
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import get_settings
from app.db.indexes import safe_create_index

logger = logging.getLogger(__name__)

# Get settings instance
settings = get_settings()

class PerformanceCache:
    """In-memory cache with TTL support for performance optimization"""
    
    def __init__(self, default_ttl: int = 300):  # 5 minutes default
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in cache with TTL"""
        expires_at = time.time() + (ttl or self.default_ttl)
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': time.time()
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache if not expired"""
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        if time.time() > entry['expires_at']:
            del self._cache[key]
            return None
        
        return entry['value']
    
    def delete(self, key: str) -> bool:
        """Delete a key from cache"""
        return self._cache.pop(key, None) is not None
    
    def clear(self) -> None:
        """Clear all cache entries"""
        self._cache.clear()
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count removed"""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if current_time > entry['expires_at']
        ]
        
        for key in expired_keys:
            del self._cache[key]
        
        return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        current_time = time.time()
        total_entries = len(self._cache)
        expired_entries = sum(
            1 for entry in self._cache.values()
            if current_time > entry['expires_at']
        )
        
        return {
            'total_entries': total_entries,
            'active_entries': total_entries - expired_entries,
            'expired_entries': expired_entries,
            'memory_usage_mb': self._estimate_memory_usage()
        }
    
    def _estimate_memory_usage(self) -> float:
        """Rough estimate of memory usage in MB"""
        import sys
        total_size = sys.getsizeof(self._cache)
        for key, entry in self._cache.items():
            total_size += sys.getsizeof(key)
            total_size += sys.getsizeof(entry)
            total_size += sys.getsizeof(entry['value'])
        
        return total_size / (1024 * 1024)  # Convert to MB

# Global cache instance
performance_cache = PerformanceCache(default_ttl=300)

def cache_result(key_prefix: str, ttl: int = 300):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Try to get from cache first
            cached_result = performance_cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            performance_cache.set(cache_key, result, ttl)
            logger.debug(f"Cache miss for {cache_key}, result cached")
            
            return result
        return wrapper
    return decorator

class DatabaseOptimizer:
    """Database query optimization utilities"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def create_indexes(self) -> Dict[str, List[str]]:
        """Create performance indexes for collections"""
        indexes_created = {}
        
        try:
            # Listings collection indexes (avoid slug since it's already created as unique)
            listings_collection = self.db.listings
            listings_indexes = [
                # Search and filtering indexes
                [("locality", 1), ("status", 1)],
                [("budgetBandId", 1), ("status", 1)],
                [("workspaceTypes", 1), ("status", 1)],
                [("verificationStatus", 1), ("status", 1)],
                [("partnerId", 1), ("status", 1)],
                [("createdAt", -1)],  # Recent listings
                [("updatedAt", -1)],  # Recently updated
                
                # Compound indexes for common queries
                [("locality", 1), ("budgetBandId", 1), ("status", 1)],
                [("locality", 1), ("workspaceTypes", 1), ("status", 1)],
                [("status", 1), ("verificationStatus", 1), ("createdAt", -1)],
            ]
            
            created = []
            for index_spec in listings_indexes:
                try:
                    await safe_create_index(listings_collection, index_spec)
                    created.append(str(index_spec))
                except Exception as e:
                    logger.warning(f"Failed to create index {index_spec}: {e}")
            
            indexes_created['listings'] = created
            
            # Partners collection indexes (avoid email since it's already created as unique)
            partners_collection = self.db.partners
            partners_indexes = [
                [("status", 1)],
                [("createdAt", -1)],
            ]
            
            created = []
            for index_spec in partners_indexes:
                try:
                    await safe_create_index(partners_collection, index_spec)
                    created.append(str(index_spec))
                except Exception as e:
                    logger.warning(f"Failed to create index {index_spec}: {e}")
            
            indexes_created['partners'] = created
            
            # Leads collection indexes
            leads_collection = self.db.leads
            leads_indexes = [
                [("status", 1)],
                [("createdAt", -1)],
                [("preferredLocalities", 1)],
                [("listingSlug", 1)],
                [("phone", 1)],  # For duplicate detection
            ]
            
            created = []
            for index_spec in leads_indexes:
                try:
                    await safe_create_index(leads_collection, index_spec)
                    created.append(str(index_spec))
                except Exception as e:
                    logger.warning(f"Failed to create index {index_spec}: {e}")
            
            indexes_created['leads'] = created
            
            # Analytics events collection indexes
            analytics_collection = self.db.analytics_events
            analytics_indexes = [
                [("eventName", 1)],
                [("timestamp", -1)],
                [("listingId", 1), ("timestamp", -1)],
                [("partnerId", 1), ("timestamp", -1)],
                [("userRole", 1), ("timestamp", -1)],
                
                # Compound indexes for analytics queries
                [("eventName", 1), ("timestamp", -1)],
                [("listingId", 1), ("eventName", 1), ("timestamp", -1)],
            ]
            
            created = []
            for index_spec in analytics_indexes:
                try:
                    await safe_create_index(analytics_collection, index_spec)
                    created.append(str(index_spec))
                except Exception as e:
                    logger.warning(f"Failed to create index {index_spec}: {e}")
            
            indexes_created['analytics_events'] = created
            
            logger.info(f"Database indexes created: {indexes_created}")
            return indexes_created
            
        except Exception as e:
            logger.error(f"Failed to create database indexes: {e}")
            return {}
    
    async def analyze_query_performance(self, collection_name: str, query: Dict) -> Dict[str, Any]:
        """Analyze query performance using explain"""
        try:
            collection = self.db[collection_name]
            explain_result = await collection.find(query).explain()
            
            return {
                'execution_stats': explain_result.get('executionStats', {}),
                'query_planner': explain_result.get('queryPlanner', {}),
                'performance_score': self._calculate_performance_score(explain_result)
            }
        except Exception as e:
            logger.error(f"Failed to analyze query performance: {e}")
            return {}
    
    def _calculate_performance_score(self, explain_result: Dict) -> float:
        """Calculate a performance score from 0-100 based on explain results"""
        try:
            execution_stats = explain_result.get('executionStats', {})
            
            # Factors that affect performance
            total_docs_examined = execution_stats.get('totalDocsExamined', 0)
            total_docs_returned = execution_stats.get('totalDocsReturned', 0)
            execution_time_ms = execution_stats.get('executionTimeMillis', 0)
            
            # Calculate efficiency ratio
            if total_docs_examined == 0:
                efficiency_ratio = 1.0
            else:
                efficiency_ratio = total_docs_returned / total_docs_examined
            
            # Calculate time score (lower is better)
            time_score = max(0, 100 - (execution_time_ms / 10))  # Penalize slow queries
            
            # Calculate efficiency score
            efficiency_score = efficiency_ratio * 100
            
            # Combined score
            performance_score = (time_score * 0.4) + (efficiency_score * 0.6)
            
            return min(100, max(0, performance_score))
            
        except Exception:
            return 0.0

class ImageOptimizer:
    """Image optimization utilities for Cloudinary integration"""
    
    @staticmethod
    def get_optimized_url(
        public_id: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        quality: str = "auto",
        format: str = "auto",
        crop: str = "fill"
    ) -> str:
        """Generate optimized Cloudinary URL with responsive parameters"""
        base_url = f"https://res.cloudinary.com/{settings.CLOUDINARY_CLOUD_NAME}/image/upload"
        
        transformations = []
        
        # Quality optimization
        transformations.append(f"q_{quality}")
        
        # Format optimization
        transformations.append(f"f_{format}")
        
        # Dimension optimization
        if width and height:
            transformations.append(f"w_{width},h_{height},c_{crop}")
        elif width:
            transformations.append(f"w_{width}")
        elif height:
            transformations.append(f"h_{height}")
        
        # Progressive JPEG for better perceived performance
        transformations.append("fl_progressive")
        
        # Lazy loading optimization
        transformations.append("fl_lazy")
        
        transformation_string = ",".join(transformations)
        return f"{base_url}/{transformation_string}/{public_id}"
    
    @staticmethod
    def get_responsive_urls(
        public_id: str,
        breakpoints: List[int] = [320, 640, 768, 1024, 1280, 1920]
    ) -> Dict[str, str]:
        """Generate responsive image URLs for different breakpoints"""
        urls = {}
        
        for width in breakpoints:
            urls[f"{width}w"] = ImageOptimizer.get_optimized_url(
                public_id=public_id,
                width=width,
                quality="auto",
                format="auto"
            )
        
        return urls
    
    @staticmethod
    def get_thumbnail_url(public_id: str, size: int = 300) -> str:
        """Generate thumbnail URL with consistent sizing"""
        return ImageOptimizer.get_optimized_url(
            public_id=public_id,
            width=size,
            height=size,
            crop="thumb",
            quality="auto",
            format="auto"
        )

class PerformanceMonitor:
    """Performance monitoring and metrics collection"""
    
    def __init__(self):
        self.metrics = {}
        self.start_time = time.time()
    
    def record_metric(self, name: str, value: float, tags: Optional[Dict[str, str]] = None):
        """Record a performance metric"""
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
        """Get summary statistics for a metric over the specified duration"""
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
            'avg': sum(recent_values) / len(recent_values),
            'p95': self._percentile(recent_values, 95),
            'p99': self._percentile(recent_values, 99)
        }
    
    def _percentile(self, values: List[float], percentile: float) -> float:
        """Calculate percentile value"""
        if not values:
            return 0.0
        
        sorted_values = sorted(values)
        index = int((percentile / 100) * len(sorted_values))
        return sorted_values[min(index, len(sorted_values) - 1)]
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get system-level performance metrics"""
        import psutil
        
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage_percent': psutil.disk_usage('/').percent,
            'uptime_seconds': time.time() - self.start_time,
            'cache_stats': performance_cache.get_stats()
        }

# Global performance monitor instance
performance_monitor = PerformanceMonitor()

def monitor_performance(metric_name: str):
    """Decorator to monitor function execution time"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                execution_time = (time.time() - start_time) * 1000  # Convert to ms
                
                performance_monitor.record_metric(
                    f"{metric_name}_execution_time",
                    execution_time,
                    {'function': func.__name__, 'status': 'success'}
                )
                
                return result
                
            except Exception as e:
                execution_time = (time.time() - start_time) * 1000
                
                performance_monitor.record_metric(
                    f"{metric_name}_execution_time",
                    execution_time,
                    {'function': func.__name__, 'status': 'error'}
                )
                
                raise e
        
        return wrapper
    return decorator

# Background task to cleanup expired cache entries
async def cleanup_cache_task():
    """Background task to periodically clean up expired cache entries"""
    while True:
        try:
            removed_count = performance_cache.cleanup_expired()
            if removed_count > 0:
                logger.info(f"Cleaned up {removed_count} expired cache entries")
            
            # Sleep for 5 minutes
            await asyncio.sleep(300)
            
        except Exception as e:
            logger.error(f"Error in cache cleanup task: {e}")
            await asyncio.sleep(60)  # Retry after 1 minute on error